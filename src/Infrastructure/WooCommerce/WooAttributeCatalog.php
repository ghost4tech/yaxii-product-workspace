<?php
/**
 * WooCommerce global attribute catalog.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use Yaxii\ProductWorkspace\Application\VariableProducts\AttributeCatalog;

final class WooAttributeCatalog implements AttributeCatalog {
	public function attributes(): array {
		$attributes = array();
		foreach ( wc_get_attribute_taxonomies() as $attribute ) {
			$taxonomy = wc_attribute_taxonomy_name( $attribute->attribute_name );
			if ( taxonomy_exists( $taxonomy ) ) {
				$attributes[] = array(
					'id'       => (int) $attribute->attribute_id,
					'name'     => (string) $attribute->attribute_label,
					'taxonomy' => $taxonomy,
					'order_by' => (string) $attribute->attribute_orderby,
				);
			}
		}
		return array_slice( $attributes, 0, 100 );
	}

	public function terms( int $attribute_id, string $search, int $limit ): array {
		$attribute = wc_get_attribute( $attribute_id );
		if ( ! is_object( $attribute ) || ! isset( $attribute->slug ) || ! is_string( $attribute->slug ) || ! taxonomy_exists( $attribute->slug ) ) {
			return array();
		}
		$terms = get_terms(
			array(
				'taxonomy'   => $attribute->slug,
				'hide_empty' => false,
				'number'     => min( 100, max( 1, $limit ) ),
				's'          => $search,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);
		if ( is_wp_error( $terms ) ) {
			return array();
		}
		return array_map(
			static fn ( \WP_Term $term ): array => array(
				'id'   => $term->term_id,
				'name' => $term->name,
				'slug' => $term->slug,
			),
			$terms
		);
	}
}
