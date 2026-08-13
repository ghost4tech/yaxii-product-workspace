<?php
/**
 * Versioned variable-product read and update service.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Products\ApiException;

/**
 * Protects edit access and validates every reference before a multi-object update.
 */
final class VariableProductManagementService {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST serialization owns structured API messages.
	private CapabilityPolicy $capabilities;
	private VariableProductGateway $products;

	public function __construct( CapabilityPolicy $capabilities, VariableProductGateway $products ) {
		$this->capabilities = $capabilities;
		$this->products     = $products;
	}

	/** @return array<string, mixed> */
	public function get( int $product_id ): array {
		$this->assert_available();
		if ( ! $this->capabilities->can_edit_product( $product_id ) ) {
			throw new ApiException( 'ypw_forbidden', __( 'You cannot edit this variable product.', 'yaxii-product-workspace' ), 403 );
		}
		$product = $this->products->get( $product_id );
		if ( null === $product ) {
			throw new ApiException( 'ypw_product_not_found', __( 'The requested variable product was not found.', 'yaxii-product-workspace' ), 404 );
		}
		return $product;
	}

	/** @return array<string, mixed> */
	public function update( int $product_id, string $expected_version, VariableProductCommand $command ): array {
		$current = $this->get( $product_id );
		$version = isset( $current['version'] ) ? (string) $current['version'] : '';
		if ( '' === $expected_version || ! hash_equals( $version, $expected_version ) ) {
			throw new ApiException( 'ypw_product_conflict', __( 'This variable product changed after it was opened. Reload it before saving.', 'yaxii-product-workspace' ), 409 );
		}
		$this->assert_command_access( $command );
		$errors = $this->products->validate( $command, $product_id );
		if ( array() !== $errors ) {
			throw new ApiException( isset( $errors['sku'] ) ? 'ypw_duplicate_sku' : 'ypw_validation_failed', __( 'WooCommerce rejected variable-product fields.', 'yaxii-product-workspace' ), 422, $errors );
		}
		$this->assert_media_access( $command );
		$write = $this->products->update( $product_id, $command );
		return array(
			'state'               => $write->is_partial() ? 'partial' : 'succeeded',
			'product'             => $write->product(),
			'combination_results' => $write->combination_results(),
		);
	}

	private function assert_available(): void {
		if ( ! $this->products->is_available() ) {
			throw new ApiException( 'ypw_woocommerce_unavailable', __( 'WooCommerce variable products are unavailable.', 'yaxii-product-workspace' ), 503 );
		}
	}

	private function assert_command_access( VariableProductCommand $command ): void {
		if ( 'publish' === $command->product()->status() && ! $this->capabilities->can_publish_products() ) {
			throw new ApiException( 'ypw_publish_forbidden', __( 'You cannot publish products.', 'yaxii-product-workspace' ), 403 );
		}
		if ( ! $this->capabilities->can_assign_product_terms() ) {
			throw new ApiException( 'ypw_term_assignment_forbidden', __( 'You cannot assign product attributes or terms.', 'yaxii-product-workspace' ), 403 );
		}
	}

	private function assert_media_access( VariableProductCommand $command ): void {
		$image_ids = $command->product()->image_ids();
		foreach ( $command->plan()->combinations() as $combination ) {
			$image_ids[] = (int) $combination->fields()['image_id'];
		}
		foreach ( array_unique( array_filter( $image_ids ) ) as $image_id ) {
			if ( ! $this->capabilities->can_use_media( (int) $image_id ) ) {
				throw new ApiException( 'ypw_media_forbidden', __( 'You cannot use one or more selected images.', 'yaxii-product-workspace' ), 403 );
			}
		}
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
