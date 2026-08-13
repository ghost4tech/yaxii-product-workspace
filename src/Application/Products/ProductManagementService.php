<?php
/**
 * Simple-product read and mutation service.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;

/**
 * Enforces object access, optimistic concurrency, and reference policy.
 */
final class ProductManagementService {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- ApiException values are serialized by the REST error boundary.
	private CapabilityPolicy $capabilities;
	private ProductGateway $products;

	public function __construct( CapabilityPolicy $capabilities, ProductGateway $products ) {
		$this->capabilities = $capabilities;
		$this->products     = $products;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function query( ProductQuery $query ): array {
		$this->assert_workspace_access();
		return $this->products->query( $query );
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get( int $product_id ): array {
		$product = $this->require_product( $product_id );
		$this->assert_edit_access( $product_id );
		return $product;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function duplicate_prefill( int $product_id ): array {
		$this->get( $product_id );
		$prefill = $this->products->duplicate_prefill( $product_id );
		if ( null === $prefill ) {
			throw $this->not_found();
		}
		return $prefill;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function update( int $product_id, string $expected_version, CreateProductCommand $command ): array {
		$current = $this->get( $product_id );
		$this->assert_current_version( $current, $expected_version );
		$this->assert_command_access( $command );

		$field_errors = $this->products->validate( $command, $product_id );
		if ( array() !== $field_errors ) {
			throw new ApiException(
				$this->validation_code( $field_errors ),
				__( 'WooCommerce rejected one or more product fields.', 'yaxii-product-workspace' ),
				422,
				$field_errors
			);
		}
		$this->assert_media_access( $command );
		return $this->products->update( $product_id, $command );
	}

	/**
	 * @return array<string, mixed>
	 */
	public function trash( int $product_id, string $expected_version ): array {
		$current = $this->require_product( $product_id );
		if ( ! $this->capabilities->can_delete_product( $product_id ) ) {
			throw new ApiException( 'ypw_forbidden', __( 'You are not allowed to trash this product.', 'yaxii-product-workspace' ), 403 );
		}
		$this->assert_current_version( $current, $expected_version );
		return $this->products->trash( $product_id );
	}

	private function assert_workspace_access(): void {
		if ( ! $this->products->is_available() ) {
			throw new ApiException( 'ypw_woocommerce_unavailable', __( 'WooCommerce products are unavailable.', 'yaxii-product-workspace' ), 503 );
		}
		if ( ! $this->capabilities->can_create_products() ) {
			throw new ApiException( 'ypw_forbidden', __( 'You are not allowed to manage products.', 'yaxii-product-workspace' ), 403 );
		}
	}

	/**
	 * @return array<string, mixed>
	 */
	private function require_product( int $product_id ): array {
		$this->assert_workspace_access();
		$product = $this->products->get( $product_id );
		if ( null === $product ) {
			throw $this->not_found();
		}
		return $product;
	}

	private function assert_edit_access( int $product_id ): void {
		if ( ! $this->capabilities->can_edit_product( $product_id ) ) {
			throw new ApiException( 'ypw_forbidden', __( 'You are not allowed to edit this product.', 'yaxii-product-workspace' ), 403 );
		}
	}

	private function assert_command_access( CreateProductCommand $command ): void {
		if ( 'publish' === $command->status() && ! $this->capabilities->can_publish_products() ) {
			throw new ApiException( 'ypw_publish_forbidden', __( 'You cannot publish products.', 'yaxii-product-workspace' ), 403 );
		}
		if ( ! $this->capabilities->can_assign_product_terms() ) {
			throw new ApiException( 'ypw_term_assignment_forbidden', __( 'You cannot assign product terms.', 'yaxii-product-workspace' ), 403 );
		}
	}

	private function assert_media_access( CreateProductCommand $command ): void {
		foreach ( $command->image_ids() as $image_id ) {
			if ( ! $this->capabilities->can_use_media( $image_id ) ) {
				throw new ApiException( 'ypw_media_forbidden', __( 'You cannot use one or more selected images.', 'yaxii-product-workspace' ), 403 );
			}
		}
	}

	/**
	 * @param array<string, mixed> $current Current resource.
	 */
	private function assert_current_version( array $current, string $expected_version ): void {
		$current_version = isset( $current['version'] ) ? (string) $current['version'] : '';
		if ( '' === $expected_version || ! hash_equals( $current_version, $expected_version ) ) {
			throw new ApiException(
				'ypw_product_conflict',
				__( 'This product changed after it was opened. Reload it before saving.', 'yaxii-product-workspace' ),
				409
			);
		}
	}

	/**
	 * @param array<string, array<string>> $field_errors Validation errors.
	 */
	private function validation_code( array $field_errors ): string {
		return isset( $field_errors['sku'] ) ? 'ypw_duplicate_sku' : 'ypw_validation_failed';
	}

	private function not_found(): ApiException {
		return new ApiException( 'ypw_product_not_found', __( 'The requested simple product was not found.', 'yaxii-product-workspace' ), 404 );
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
