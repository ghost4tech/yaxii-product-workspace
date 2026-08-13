<?php
/**
 * WooCommerce variable-product mapping.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableAttribute;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductLimits;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductPlan;

/**
 * Maps parent attributes and concrete WC variations to the canonical contract.
 */
final class WooVariableProductMapper {
	public const ATTRIBUTE_KEYS_META = '_ypw_attribute_keys';
	public const COMBINATION_META    = '_ypw_combination_id';
	private WooProductMapper $products;

	public function __construct( WooProductMapper $products ) {
		$this->products = $products;
	}

	public function apply_attributes( \WC_Product_Variable $product, VariableProductPlan $plan ): void {
		$attributes = array();
		$key_map    = array();
		foreach ( $plan->attributes() as $attribute ) {
			$woo_attribute = new \WC_Product_Attribute();
			$woo_attribute->set_id( $attribute->attribute_id() );
			$woo_attribute->set_name( $attribute->is_global() ? $attribute->taxonomy() : $attribute->name() );
			$woo_attribute->set_options( $attribute->options() );
			$woo_attribute->set_position( $attribute->position() );
			$woo_attribute->set_visible( $attribute->is_visible() );
			$woo_attribute->set_variation( $attribute->is_for_variations() );
			$attributes[]                          = $woo_attribute;
			$key_map[ $woo_attribute->get_name() ] = $attribute->key();
		}
		$product->set_attributes( $attributes );
		$product->update_meta_data( self::ATTRIBUTE_KEYS_META, $key_map );
	}

	/** @return array<string, mixed> */
	public function resource( \WC_Product_Variable $product ): array {
		$resource                    = $this->products->resource( $product );
		$resource['attributes']      = $this->attributes( $product );
		$resource['combinations']    = $this->combinations( $product, $resource['attributes'] );
		$resource['projected_count'] = count( $resource['combinations'] );
		unset( $resource['version'] );
		$json = wp_json_encode( $resource );
		if ( false === $json ) {
			throw new RuntimeException( 'Unable to version the variable product.' );
		}
		$resource['version'] = hash( 'sha256', $json );
		return $resource;
	}

	/** @return array<int, array<string, mixed>> */
	private function attributes( \WC_Product_Variable $product ): array {
		$key_map = $product->get_meta( self::ATTRIBUTE_KEYS_META, true );
		$key_map = is_array( $key_map ) ? $key_map : array();
		$result  = array();
		foreach ( $product->get_attributes() as $attribute ) {
			if ( ! $attribute instanceof \WC_Product_Attribute ) {
				continue;
			}
			$global     = $attribute->is_taxonomy();
			$definition = $global ? wc_get_attribute( $attribute->get_id() ) : null;
			$name       = $global && is_object( $definition ) && isset( $definition->name ) ? (string) $definition->name : $attribute->get_name();
			$common     = array(
				'key'       => (string) ( $key_map[ $attribute->get_name() ] ?? ( $global ? 'global:' . $attribute->get_id() : 'custom:' . sanitize_title( $name ) ) ),
				'source'    => $global ? 'global' : 'custom',
				'name'      => $name,
				'visible'   => $attribute->get_visible(),
				'variation' => $attribute->get_variation(),
				'position'  => $attribute->get_position(),
			);
			$result[]   = $global
				? array_merge(
					$common,
					array(
						'attribute_id' => $attribute->get_id(),
						'taxonomy'     => $attribute->get_name(),
						'option_ids'   => array_map( 'intval', $attribute->get_options() ),
					)
				)
				: array_merge( $common, array( 'options' => array_values( array_map( 'strval', $attribute->get_options() ) ) ) );
		}
		usort( $result, static fn ( array $left, array $right ): int => (int) $left['position'] <=> (int) $right['position'] );
		return $result;
	}

	/** @param array<int, array<string, mixed>> $attributes
	 * @return array<int, array<string, mixed>> */
	private function combinations( \WC_Product_Variable $product, array $attributes ): array {
		$children = $product->get_children();
		if ( VariableProductLimits::MAX_COMBINATIONS < count( $children ) ) {
			throw new RuntimeException( 'This variable product exceeds the Free combination limit.' );
		}
		$result = array();
		foreach ( $children as $variation_id ) {
			$variation = wc_get_product( $variation_id );
			if ( $variation instanceof \WC_Product_Variation ) {
				$result[] = $this->combination( $variation, $attributes );
			}
		}
		return $result;
	}

	/** @param array<int, array<string, mixed>> $attributes
	 * @return array<string, mixed> */
	private function combination( \WC_Product_Variation $variation, array $attributes ): array {
		$selections = array();
		$values     = $variation->get_attributes();
		foreach ( $attributes as $attribute ) {
			if ( ! $attribute['variation'] ) {
				continue;
			}
			$woo_key = 'global' === $attribute['source'] ? (string) $attribute['taxonomy'] : sanitize_title( (string) $attribute['name'] );
			$value   = (string) ( $values[ $woo_key ] ?? '' );
			if ( 'global' === $attribute['source'] ) {
				$term         = get_term_by( 'slug', $value, (string) $attribute['taxonomy'] );
				$selections[] = array(
					'attribute_key' => $attribute['key'],
					'term_id'       => $term instanceof \WP_Term ? $term->term_id : 0,
				);
			} else {
				$selections[] = array(
					'attribute_key' => $attribute['key'],
					'option'        => $value,
				);
			}
		}
		$client_id = (string) $variation->get_meta( self::COMBINATION_META, true );
		return array(
			'client_id'      => wp_is_uuid( $client_id ) ? $client_id : $this->legacy_client_id( $variation->get_id() ),
			'variation_id'   => $variation->get_id(),
			'selections'     => $selections,
			'enabled'        => 'publish' === $variation->get_status(),
			'regular_price'  => $variation->get_regular_price(),
			'sale_price'     => '' === $variation->get_sale_price() ? null : $variation->get_sale_price(),
			'sku'            => $variation->get_sku(),
			'manage_stock'   => $variation->get_manage_stock(),
			'stock_quantity' => $variation->get_stock_quantity(),
			'stock_status'   => $variation->get_stock_status(),
			'image_id'       => $variation->get_image_id(),
		);
	}

	private function legacy_client_id( int $variation_id ): string {
		$hex = substr( hash( 'sha256', 'ypw-variation-' . $variation_id ), 0, 32 );
		return substr( $hex, 0, 8 ) . '-' . substr( $hex, 8, 4 ) . '-4' . substr( $hex, 13, 3 ) . '-8' . substr( $hex, 17, 3 ) . '-' . substr( $hex, 20, 12 );
	}
}
