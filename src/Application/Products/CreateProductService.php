<?php
/**
 * Idempotent simple-product creation service.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationRequest;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;

/**
 * Orchestrates validation, idempotency, Woo persistence, and reconciliation.
 */
final class CreateProductService {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST serialization handles structured API messages.
	private const OPERATION_TYPE = 'simple_product_create';

	private CapabilityPolicy $capabilities;
	private OperationStore $operations;
	private ProductGateway $products;
	private CreateProductRequestFactory $request_factory;

	public function __construct(
		CapabilityPolicy $capabilities,
		OperationStore $operations,
		ProductGateway $products,
		CreateProductRequestFactory $request_factory
	) {
		$this->capabilities    = $capabilities;
		$this->operations      = $operations;
		$this->products        = $products;
		$this->request_factory = $request_factory;
	}

	/**
	 * @throws ApiException When access, availability, or idempotency checks fail.
	 */
	public function create(
		CreateProductCommand $command,
		string $idempotency_key,
		int $site_id,
		int $user_id
	): OperationResult {
		$this->assert_command_allowed( $command );
		$field_errors = $this->products->validate( $command );
		if ( array() === $field_errors ) {
			$this->assert_media_allowed( $command );
		}
		$payload_json = wp_json_encode( $command->to_array() );
		if ( false === $payload_json ) {
			throw new ApiException(
				'ypw_invalid_payload',
				__( 'The product request could not be normalized.', 'yaxii-product-workspace' ),
				400
			);
		}

		$reservation = $this->operations->reserve(
			new OperationRequest(
				array(
					'site_id'         => $site_id,
					'user_id'         => $user_id,
					'operation_type'  => self::OPERATION_TYPE,
					'idempotency_key' => $idempotency_key,
					'payload_hash'    => hash( 'sha256', $payload_json ),
					'payload_json'    => $payload_json,
					'product_name'    => $command->name(),
					'product_sku'     => $command->sku(),
				)
			)
		);

		if ( $reservation->is_conflict() ) {
			throw new ApiException(
				'ypw_idempotency_conflict',
				__( 'This idempotency key was already used with a different product payload.', 'yaxii-product-workspace' ),
				409
			);
		}

		$record = $reservation->record();
		if ( ! $reservation->was_created() ) {
			return $this->replay_or_reconcile( $record );
		}

		if ( array() !== $field_errors ) {
			return $this->persist_validation_failure( $record->operation_id(), $field_errors );
		}

		return $this->write_product( $command, $record->operation_id() );
	}

	/**
	 * Reconciles a durable operation against its canonical stored result or WooCommerce marker.
	 */
	public function reconcile( OperationRecord $record ): OperationResult {
		return $this->replay_or_reconcile( $record );
	}

	/**
	 * Safely retries only a stored write failure with the original validated identity.
	 */
	public function retry( OperationRecord $record, int $site_id, int $user_id ): OperationResult {
		$request = $record->request();
		if ( self::OPERATION_TYPE !== $record->operation_type() || ! $record->can_retry() || null === $request ) {
			throw new ApiException( 'ypw_retry_not_allowed', __( 'This operation is not marked safe for manual retry.', 'yaxii-product-workspace' ), 409 );
		}
		$existing = $this->products->find_by_operation( $record->operation_id() );
		if ( null !== $existing ) {
			return $this->persist_or_mark_uncertain( OperationResult::succeeded( $record->operation_id(), $existing, true ) );
		}

		$command = $this->request_factory->from_complete_array( $request );
		$this->assert_command_allowed( $command );
		$field_errors = $this->products->validate( $command );
		if ( array() !== $field_errors ) {
			return $this->persist_validation_failure( $record->operation_id(), $field_errors );
		}
		$this->assert_media_allowed( $command );
		if ( ! $this->operations->claim_retry( $record->operation_id(), $site_id, $user_id ) ) {
			throw new ApiException( 'ypw_retry_conflict', __( 'This operation is already being reconciled or retried.', 'yaxii-product-workspace' ), 409 );
		}
		return $this->write_product( $command, $record->operation_id() );
	}

	private function assert_command_allowed( CreateProductCommand $command ): void {
		if ( ! $this->products->is_available() ) {
			throw new ApiException(
				'ypw_woocommerce_unavailable',
				__( 'WooCommerce is not available for product creation.', 'yaxii-product-workspace' ),
				503
			);
		}

		if ( ! $this->capabilities->can_create_products() ) {
			throw new ApiException(
				'ypw_forbidden',
				__( 'You are not allowed to create products.', 'yaxii-product-workspace' ),
				403
			);
		}

		if ( 'publish' === $command->status() && ! $this->capabilities->can_publish_products() ) {
			throw new ApiException(
				'ypw_publish_forbidden',
				__( 'You can create drafts but cannot publish products.', 'yaxii-product-workspace' ),
				403,
				array( 'status' => array( __( 'Choose Draft or ask an administrator for publishing access.', 'yaxii-product-workspace' ) ) )
			);
		}

		if ( ! $this->capabilities->can_assign_product_terms() ) {
			throw new ApiException(
				'ypw_term_assignment_forbidden',
				__( 'You are not allowed to assign product terms.', 'yaxii-product-workspace' ),
				403
			);
		}
	}

	private function assert_media_allowed( CreateProductCommand $command ): void {
		foreach ( $command->image_ids() as $image_id ) {
			if ( ! $this->capabilities->can_use_media( $image_id ) ) {
				throw new ApiException(
					'ypw_media_forbidden',
					__( 'You are not allowed to use one or more selected images.', 'yaxii-product-workspace' ),
					403
				);
			}
		}
	}

	private function replay_or_reconcile( OperationRecord $record ): OperationResult {
		if ( null !== $record->result() ) {
			return OperationResult::from_array( $record->result() );
		}

		$product = $this->products->find_by_operation( $record->operation_id() );
		if ( null === $product ) {
			return OperationResult::processing( $record->operation_id() );
		}

		$result = OperationResult::succeeded( $record->operation_id(), $product, true );
		return $this->persist_or_mark_uncertain( $result );
	}

	private function write_product( CreateProductCommand $command, string $operation_id ): OperationResult {
		try {
			$product = $this->products->create( $command, $operation_id );
			return $this->persist_or_mark_uncertain( OperationResult::succeeded( $operation_id, $product ) );
		} catch ( Throwable $exception ) {
			unset( $exception );
			$reconciled = $this->products->find_by_operation( $operation_id );
			if ( null !== $reconciled ) {
				return $this->persist_or_mark_uncertain(
					OperationResult::succeeded( $operation_id, $reconciled )
				);
			}

			$result = OperationResult::failed(
				$operation_id,
				new OperationFailure(
					'ypw_product_write_failed',
					__( 'WooCommerce could not save the product.', 'yaxii-product-workspace' ),
					array(),
					500
				)
			);

			return $this->persist_or_mark_uncertain( $result );
		}
	}

	/** @param array<string, array<string>> $field_errors Validation errors. */
	private function persist_validation_failure( string $operation_id, array $field_errors ): OperationResult {
		return $this->persist_or_mark_uncertain(
			OperationResult::failed(
				$operation_id,
				new OperationFailure(
					$this->validation_code( $field_errors ),
					__( 'WooCommerce rejected one or more product references.', 'yaxii-product-workspace' ),
					$field_errors,
					422
				)
			)
		);
	}

	private function persist_or_mark_uncertain( OperationResult $result ): OperationResult {
		try {
			$product    = $result->product();
			$product_id = is_array( $product ) && isset( $product['id'] ) ? (int) $product['id'] : null;
			$this->operations->complete(
				$result->operation_id(),
				$result->state(),
				$product_id,
				$result->to_array()
			);
			return $result;
		} catch ( Throwable $exception ) {
			unset( $exception );
			return OperationResult::processing( $result->operation_id(), true, false );
		}
	}

	/**
	 * @param array<string, array<string>> $field_errors Field-addressable validation errors.
	 */
	private function validation_code( array $field_errors ): string {
		if ( isset( $field_errors['sku'] ) ) {
			return 'ypw_duplicate_sku';
		}
		if ( isset( $field_errors['category_ids'] ) ) {
			return 'ypw_invalid_category';
		}
		if ( isset( $field_errors['image_ids'] ) ) {
			return 'ypw_invalid_media';
		}

		return 'ypw_validation_failed';
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
