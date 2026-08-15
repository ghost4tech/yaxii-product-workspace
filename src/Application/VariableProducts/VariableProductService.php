<?php
/**
 * Idempotent variable-product application service.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationRequest;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\OperationFailure;
use Yaxii\ProductWorkspace\Application\Products\OperationResult;

/**
 * Orchestrates one browser request across a parent and all concrete variations.
 */
final class VariableProductService {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST serialization owns structured API messages.
	private const OPERATION_TYPE = 'variable_product_create';
	private CapabilityPolicy $capabilities;
	private OperationStore $operations;
	private VariableProductGateway $products;
	private VariableProductRequestFactory $requests;

	public function __construct( CapabilityPolicy $capabilities, OperationStore $operations, VariableProductGateway $products, VariableProductRequestFactory $requests ) {
		$this->capabilities = $capabilities;
		$this->operations   = $operations;
		$this->products     = $products;
		$this->requests     = $requests;
	}

	public function create( VariableProductCommand $command, string $idempotency_key, int $site_id, int $user_id ): OperationResult {
		$this->assert_command_allowed( $command );
		$errors = $this->products->validate( $command );
		$this->assert_media_allowed( $command );
		$json = wp_json_encode( $command->to_array() );
		if ( false === $json ) {
			throw new ApiException( 'ypw_invalid_payload', __( 'The variable product could not be normalized.', 'yaxii-product-workspace' ), 400 );
		}
		$reservation = $this->operations->reserve(
			new OperationRequest(
				array(
					'site_id'         => $site_id,
					'user_id'         => $user_id,
					'operation_type'  => self::OPERATION_TYPE,
					'idempotency_key' => $idempotency_key,
					'payload_hash'    => hash( 'sha256', $json ),
					'payload_json'    => $json,
					'product_name'    => $command->product()->name(),
					'product_sku'     => $command->product()->sku(),
				)
			)
		);
		if ( $reservation->is_conflict() ) {
			throw new ApiException( 'ypw_idempotency_conflict', __( 'This idempotency key was used with a different variable product.', 'yaxii-product-workspace' ), 409 );
		}
		$record = $reservation->record();
		if ( ! $reservation->was_created() ) {
			return $this->replay_or_reconcile( $record );
		}
		if ( array() !== $errors ) {
			return $this->persist_validation_failure( $record->operation_id(), $errors );
		}
		return $this->write( $command, $record->operation_id(), false );
	}

	public function reconcile( OperationRecord $record ): OperationResult {
		return $this->replay_or_reconcile( $record );
	}

	public function retry( OperationRecord $record, int $site_id, int $user_id ): OperationResult {
		$request = $record->request();
		if ( self::OPERATION_TYPE !== $record->operation_type() || ! $record->can_retry() || null === $request ) {
			throw new ApiException( 'ypw_retry_not_allowed', __( 'This variable operation is not safe to retry.', 'yaxii-product-workspace' ), 409 );
		}
		$command = $this->requests->from_array( $request );
		$this->assert_command_allowed( $command );
		$errors = $this->products->validate( $command, (int) ( $record->product_id() ?? 0 ) );
		if ( array() !== $errors ) {
			return $this->persist_validation_failure( $record->operation_id(), $errors );
		}
		$this->assert_media_allowed( $command );
		if ( ! $this->operations->claim_retry( $record->operation_id(), $site_id, $user_id ) ) {
			throw new ApiException( 'ypw_retry_conflict', __( 'This variable operation is already being reconciled.', 'yaxii-product-workspace' ), 409 );
		}
		return $this->write( $command, $record->operation_id(), true );
	}

	private function replay_or_reconcile( OperationRecord $record ): OperationResult {
		if ( null !== $record->result() ) {
			return OperationResult::from_array( $record->result() );
		}
		$request = $record->request();
		if ( null === $request ) {
			return OperationResult::processing( $record->operation_id() );
		}
		$command = $this->requests->from_array( $request );
		return null === $this->products->find_by_operation( $record->operation_id() )
			? OperationResult::processing( $record->operation_id() )
			: $this->write( $command, $record->operation_id(), true );
	}

	private function write( VariableProductCommand $command, string $operation_id, bool $reconcile ): OperationResult {
		try {
			$write  = $reconcile ? $this->products->reconcile( $command, $operation_id ) : $this->products->create( $command, $operation_id );
			$result = $write->is_partial()
				? OperationResult::partial( $operation_id, $write->product(), $write->combination_results(), $reconcile )
				: OperationResult::succeeded( $operation_id, $write->product(), $reconcile, $write->combination_results() );
			return $this->persist_or_mark_uncertain( $result );
		} catch ( Throwable $exception ) {
			unset( $exception );
			$product = $this->products->find_by_operation( $operation_id );
			if ( null !== $product ) {
				return $this->persist_or_mark_uncertain( OperationResult::partial( $operation_id, $product, array(), true ) );
			}
			return $this->persist_or_mark_uncertain(
				OperationResult::failed( $operation_id, new OperationFailure( 'ypw_product_write_failed', __( 'WooCommerce could not save the variable product.', 'yaxii-product-workspace' ), array(), 500 ) )
			);
		}
	}

	/** @param array<string, array<string>> $errors Field errors. */
	private function persist_validation_failure( string $operation_id, array $errors ): OperationResult {
		$code = isset( $errors['sku'] ) ? 'ypw_duplicate_sku' : 'ypw_validation_failed';
		return $this->persist_or_mark_uncertain(
			OperationResult::failed( $operation_id, new OperationFailure( $code, __( 'WooCommerce rejected variable-product references.', 'yaxii-product-workspace' ), $errors, 422 ) )
		);
	}

	private function persist_or_mark_uncertain( OperationResult $result ): OperationResult {
		try {
			$product = $result->product();
			$this->operations->complete( $result->operation_id(), $result->state(), is_array( $product ) ? (int) ( $product['id'] ?? 0 ) : null, $result->to_array() );
			return $result;
		} catch ( Throwable $exception ) {
			unset( $exception );
			return OperationResult::processing( $result->operation_id(), true, false );
		}
	}

	private function assert_command_allowed( VariableProductCommand $command ): void {
		if ( ! $this->products->is_available() ) {
			throw new ApiException( 'ypw_woocommerce_unavailable', __( 'WooCommerce variable products are unavailable.', 'yaxii-product-workspace' ), 503 );
		}
		if ( ! $this->capabilities->can_create_products() ) {
			throw new ApiException( 'ypw_forbidden', __( 'You cannot create variable products.', 'yaxii-product-workspace' ), 403 );
		}
		if ( 'publish' === $command->product()->status() && ! $this->capabilities->can_publish_products() ) {
			throw new ApiException( 'ypw_publish_forbidden', __( 'You can create drafts but cannot publish products.', 'yaxii-product-workspace' ), 403 );
		}
		if ( ! $this->capabilities->can_assign_product_terms() ) {
			throw new ApiException( 'ypw_term_assignment_forbidden', __( 'You cannot assign product attributes or terms.', 'yaxii-product-workspace' ), 403 );
		}
	}

	private function assert_media_allowed( VariableProductCommand $command ): void {
		$image_ids = $command->product()->image_ids();
		foreach ( $command->plan()->combinations() as $combination ) {
			$image_ids[] = (int) $combination->fields()['image_id'];
		}
		foreach ( array_unique( array_filter( $image_ids ) ) as $image_id ) {
			if ( ! $this->capabilities->can_use_media( (int) $image_id ) ) {
				throw new ApiException( 'ypw_media_forbidden', __( 'You cannot use one or more selected variation images.', 'yaxii-product-workspace' ), 403 );
			}
		}
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
