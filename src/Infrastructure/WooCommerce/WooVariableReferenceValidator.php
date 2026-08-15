<?php
/**
 * WooCommerce reference validation for variable products.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use Yaxii\ProductWorkspace\Application\Products\ProductGateway;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductCommand;

/**
 * Validates global attributes, terms, SKUs, images, and edit ownership before writes.
 */
final class WooVariableReferenceValidator {
	private ProductGateway $parents;

	public function __construct( ProductGateway $parents ) {
		$this->parents = $parents;
	}

	/** @return array<string, array<string>> */
	public function validate( VariableProductCommand $command, int $product_id = 0 ): array {
		$errors = $this->parents->validate( $command->product(), $product_id );
		$errors = array_merge_recursive( $errors, $this->attribute_errors( $command ) );
		return array_merge_recursive( $errors, $this->combination_errors( $command, $product_id ) );
	}

	/** @return array<string, array<string>> */
	private function attribute_errors( VariableProductCommand $command ): array {
		$errors = array();
		foreach ( $command->plan()->attributes() as $index => $attribute ) {
			if ( ! $attribute->is_global() ) {
				continue;
			}
			$woo_attribute = wc_get_attribute( $attribute->attribute_id() );
			if ( ! is_object( $woo_attribute ) || ! isset( $woo_attribute->slug ) || $woo_attribute->slug !== $attribute->taxonomy() || ! taxonomy_exists( $attribute->taxonomy() ) ) {
				$errors[ "attributes.$index" ][] = __( 'Choose an existing WooCommerce global attribute.', 'yaxii-product-workspace' );
				continue;
			}
			foreach ( $attribute->options() as $term_id ) {
				if ( ! get_term( (int) $term_id, $attribute->taxonomy() ) instanceof \WP_Term ) {
					$errors[ "attributes.$index.option_ids" ][] = __( 'One or more selected terms do not belong to this attribute.', 'yaxii-product-workspace' );
				}
			}
		}
		return $errors;
	}

	/** @return array<string, array<string>> */
	private function combination_errors( VariableProductCommand $command, int $product_id ): array {
		$errors     = array();
		$seen_skus  = array();
		$parent_sku = mb_strtolower( $command->product()->sku() );
		foreach ( $command->plan()->combinations() as $index => $combination ) {
			$fields       = $combination->fields();
			$variation_id = $combination->variation_id();
			$sku          = (string) $fields['sku'];
			$sku_key      = mb_strtolower( $sku );
			if ( '' !== $sku && ( isset( $seen_skus[ $sku_key ] ) || $sku_key === $parent_sku || ! $this->sku_belongs_to_command( $sku, $variation_id, $product_id ) ) ) {
				$errors[ "combinations.$index.sku" ][] = __( 'Each variation SKU must be unique across WooCommerce.', 'yaxii-product-workspace' );
			}
			$seen_skus[ $sku_key ] = true;
			$image_id              = (int) $fields['image_id'];
			if ( 0 < $image_id && ( 'attachment' !== get_post_type( $image_id ) || ! wp_attachment_is_image( $image_id ) ) ) {
				$errors[ "combinations.$index.image_id" ][] = __( 'Choose a valid image attachment.', 'yaxii-product-workspace' );
			}
			if ( 0 < $variation_id && ! $this->variation_belongs_to( $variation_id, $product_id ) ) {
				$errors[ "combinations.$index.variation_id" ][] = __( 'The variation does not belong to this parent product.', 'yaxii-product-workspace' );
			}
		}
		return $errors;
	}

	private function sku_belongs_to_command( string $sku, int $variation_id, int $product_id ): bool {
		if ( wc_product_has_unique_sku( $variation_id, $sku ) ) {
			return true;
		}
		$existing_id = (int) wc_get_product_id_by_sku( $sku );
		if ( $existing_id === $variation_id ) {
			return true;
		}
		$existing = wc_get_product( $existing_id );
		return 0 < $product_id && $existing instanceof \WC_Product_Variation && $product_id === $existing->get_parent_id();
	}

	private function variation_belongs_to( int $variation_id, int $product_id ): bool {
		$variation = wc_get_product( $variation_id );
		return 0 < $product_id && $variation instanceof \WC_Product_Variation && $product_id === $variation->get_parent_id();
	}
}
