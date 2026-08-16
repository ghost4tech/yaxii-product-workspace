<?php
/**
 * Concrete WooCommerce variation writer.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableAttribute;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationCombination;

/**
 * Maps one validated combination onto one WC_Product_Variation.
 */
final class WooVariationWriter {
	/** @param array<string, VariableAttribute> $attributes */
	public function save( int $parent_id, VariationCombination $combination, array $attributes, ?\WC_Product_Variation $existing = null ): int {
		$variation = $existing ?? new \WC_Product_Variation();
		$variation->set_parent_id( $parent_id );
		$variation->set_attributes( $this->selection_values( $combination, $attributes ) );
		$fields = $combination->fields();
		$variation->set_status( $fields['enabled'] ? 'publish' : 'private' );
		$variation->set_regular_price( (string) $fields['regular_price'] );
		$variation->set_sale_price( null === $fields['sale_price'] ? '' : (string) $fields['sale_price'] );
		$variation->set_sku( (string) $fields['sku'] );
		$variation->set_manage_stock( (bool) $fields['manage_stock'] );
		$variation->set_stock_quantity( $fields['stock_quantity'] );
		$variation->set_stock_status( (string) $fields['stock_status'] );
		$variation->set_image_id( (int) $fields['image_id'] );
		$variation->update_meta_data( WooVariableProductMapper::COMBINATION_META, $combination->client_id() );
		do_action( 'yaxii_product_workspace_before_variation_save', $variation, $combination->client_id(), $parent_id );
		$variation_id = $variation->save();
		if ( 0 >= $variation_id ) {
			throw new RuntimeException( 'WooCommerce did not return a variation ID.' );
		}
		return $variation_id;
	}

	/** @param array<string, VariableAttribute> $attributes
	 * @return array<string, string> */
	private function selection_values( VariationCombination $combination, array $attributes ): array {
		$values = array();
		foreach ( $combination->selections() as $selection ) {
			$key       = (string) $selection['attribute_key'];
			$attribute = $attributes[ $key ] ?? null;
			if ( ! $attribute instanceof VariableAttribute ) {
				throw new RuntimeException( 'Unknown variation attribute.' );
			}
			if ( $attribute->is_global() ) {
				$term = get_term( (int) $selection['term_id'], $attribute->taxonomy() );
				if ( ! $term instanceof \WP_Term ) {
					throw new RuntimeException( 'Unknown global attribute term.' );
				}
				$values[ $attribute->taxonomy() ] = $term->slug;
			} else {
				$values[ sanitize_title( $attribute->name() ) ] = (string) $selection['option'];
			}
		}
		return $values;
	}
}
