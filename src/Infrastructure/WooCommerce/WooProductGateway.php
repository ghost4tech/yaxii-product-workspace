<?php
/**
 * WooCommerce simple-product adapter.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;
use Yaxii\ProductWorkspace\Application\Products\ProductGateway;

defined( 'ABSPATH' ) || exit;

/**
 * Maps the Phase 2 command to supported WooCommerce CRUD setters.
 */
final class WooProductGateway implements ProductGateway {
	private const OPERATION_META_KEY = '_ypw_operation_id';

	public function is_available(): bool {
		return class_exists( 'WooCommerce' ) && class_exists( 'WC_Product_Simple' ) && defined( 'WC_VERSION' );
	}

	public function validate( CreateProductCommand $command ): array {
		$fields = array();
		if ( '' !== $command->sku() && ! wc_product_has_unique_sku( 0, $command->sku() ) ) {
			$fields['sku'][] = __( 'This SKU is already used by another product.', 'yaxii-product-workspace' );
		}

		foreach ( $command->category_ids() as $category_id ) {
			$term = get_term( $category_id, 'product_cat' );
			if ( ! $term instanceof \WP_Term ) {
				$fields['category_ids'][] = sprintf(
					/* translators: %d: invalid product-category term ID. */
					__( 'Category ID %d is not a valid product category.', 'yaxii-product-workspace' ),
					$category_id
				);
			}
		}

		foreach ( $command->image_ids() as $image_id ) {
			if ( 'attachment' !== get_post_type( $image_id ) || ! wp_attachment_is_image( $image_id ) ) {
				$fields['image_ids'][] = sprintf(
					/* translators: %d: invalid WordPress image attachment ID. */
					__( 'Media ID %d is not a valid image attachment.', 'yaxii-product-workspace' ),
					$image_id
				);
			}
		}

		return $fields;
	}

	public function create( CreateProductCommand $command, string $operation_id ): array {
		$product = new \WC_Product_Simple();
		$product->set_name( $command->name() );
		$product->set_status( $command->status() );
		$product->set_regular_price( $command->regular_price() );
		$product->set_sale_price( $command->sale_price() ?? '' );
		$product->set_manage_stock( $command->manage_stock() );
		$product->set_stock_status( $command->stock_status() );
		$product->set_category_ids( $command->category_ids() );
		$product->set_description( $command->description() );
		$product->set_short_description( $command->short_description() );
		$product->set_catalog_visibility( $command->catalog_visibility() );
		$product->set_tax_status( $command->tax_status() );

		if ( '' !== $command->sku() ) {
			$product->set_sku( $command->sku() );
		}
		if ( $command->manage_stock() ) {
			$product->set_stock_quantity( $command->stock_quantity() );
		}

		$image_ids = $command->image_ids();
		if ( array() !== $image_ids ) {
			$product->set_image_id( (int) array_shift( $image_ids ) );
			$product->set_gallery_image_ids( $image_ids );
		}

		$product->update_meta_data( self::OPERATION_META_KEY, $operation_id );
		$product_id = $product->save();
		if ( 0 >= $product_id ) {
			throw new RuntimeException( 'WooCommerce did not return a product ID.' );
		}

		return $this->summary( $product );
	}

	public function find_by_operation( string $operation_id ): ?array {
		$product_ids = get_posts(
			array(
				'post_type'              => 'product',
				'post_status'            => 'any',
				'fields'                 => 'ids',
				'numberposts'            => 1,
				'orderby'                => 'ID',
				'order'                  => 'ASC',
				'meta_key'               => self::OPERATION_META_KEY,
				'meta_value'             => $operation_id,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( array() === $product_ids ) {
			return null;
		}

		$product = wc_get_product( (int) $product_ids[0] );
		return $product instanceof \WC_Product ? $this->summary( $product ) : null;
	}

	/**
	 * @return array<string, mixed>
	 */
	private function summary( \WC_Product $product ): array {
		$created_at = $product->get_date_created();
		$image_ids  = array_values(
			array_filter(
				array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() )
			)
		);

		return array(
			'id'                 => $product->get_id(),
			'name'               => $product->get_name(),
			'sku'                => $product->get_sku(),
			'status'             => $product->get_status(),
			'regular_price'      => $product->get_regular_price(),
			'sale_price'         => $product->get_sale_price(),
			'manage_stock'       => $product->get_manage_stock(),
			'stock_quantity'     => $product->get_stock_quantity(),
			'stock_status'       => $product->get_stock_status(),
			'category_ids'       => $product->get_category_ids(),
			'image_ids'          => $image_ids,
			'catalog_visibility' => $product->get_catalog_visibility(),
			'created_at'         => $created_at ? $created_at->format( DATE_ATOM ) : null,
		);
	}
}
