<?php
/**
 * WooCommerce simple-product mapping.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;

defined( 'ABSPATH' ) || exit;

/**
 * Maps validated fields to and from WooCommerce CRUD objects.
 */
final class WooProductMapper {
	public function apply( \WC_Product $product, CreateProductCommand $command ): void {
		$product->set_name( $command->name() );
		$product->set_slug( $command->slug() );
		$product->set_description( $command->description() );
		$product->set_short_description( $command->short_description() );
		$product->set_status( $command->status() );
		$product->set_catalog_visibility( $command->catalog_visibility() );
		$product->set_regular_price( $command->regular_price() );
		$product->set_sale_price( $command->sale_price() ?? '' );
		$product->set_date_on_sale_from( $command->date_on_sale_from() );
		$product->set_date_on_sale_to( $this->sale_end( $command->date_on_sale_to() ) );
		$product->set_sku( $command->sku() );
		$product->set_manage_stock( $command->manage_stock() );
		$product->set_stock_quantity( $command->stock_quantity() );
		$product->set_stock_status( $command->stock_status() );
		$product->set_backorders( $command->backorders() );
		$product->set_sold_individually( $command->sold_individually() );
		$product->set_weight( $command->weight() );
		$product->set_length( $command->length() );
		$product->set_width( $command->width() );
		$product->set_height( $command->height() );
		$product->set_shipping_class_id( $command->shipping_class_id() );
		$product->set_tax_status( $command->tax_status() );
		$product->set_tax_class( $command->tax_class() );
		$product->set_category_ids( $command->category_ids() );
		$product->set_tag_ids( $command->tag_ids() );
		$this->assign_images( $product, $command->image_ids() );
	}

	/**
	 * @return array<string, mixed>
	 */
	public function resource( \WC_Product $product ): array {
		$fields      = $this->fields( $product );
		$created_at  = $product->get_date_created();
		$modified_at = $product->get_date_modified();
		$version     = wp_json_encode( $fields );
		if ( false === $version ) {
			throw new RuntimeException( 'Unable to version the WooCommerce product.' );
		}

		return array_merge(
			$fields,
			array(
				'id'          => $product->get_id(),
				'type'        => $product->get_type(),
				'created_at'  => $created_at ? $created_at->format( DATE_ATOM ) : null,
				'modified_at' => $modified_at ? $modified_at->format( DATE_ATOM ) : null,
				'version'     => hash( 'sha256', $version ),
				'images'      => $this->images( $product ),
			)
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	public function duplicate_prefill( \WC_Product $product ): array {
		$fields         = $this->fields( $product );
		$fields['name'] = sprintf(
			/* translators: %s: source product name. */
			__( '%s (Copy)', 'yaxii-product-workspace' ),
			$product->get_name()
		);
		$fields['slug']   = '';
		$fields['sku']    = '';
		$fields['status'] = 'draft';
		return $fields;
	}

	/**
	 * @return array<string, mixed>
	 */
	private function fields( \WC_Product $product ): array {
		$from      = $product->get_date_on_sale_from();
		$to        = $product->get_date_on_sale_to();
		$image_ids = $this->image_ids( $product );

		return array(
			'name'               => $product->get_name(),
			'slug'               => $product->get_slug(),
			'description'        => $product->get_description(),
			'short_description'  => $product->get_short_description(),
			'status'             => $product->get_status(),
			'catalog_visibility' => $product->get_catalog_visibility(),
			'regular_price'      => $product->get_regular_price(),
			'sale_price'         => $product->get_sale_price(),
			'date_on_sale_from'  => $this->local_date( $from ),
			'date_on_sale_to'    => $this->local_date( $to ),
			'sku'                => $product->get_sku(),
			'manage_stock'       => $product->get_manage_stock(),
			'stock_quantity'     => $product->get_stock_quantity(),
			'stock_status'       => $product->get_stock_status(),
			'backorders'         => $product->get_backorders(),
			'sold_individually'  => $product->get_sold_individually(),
			'weight'             => $product->get_weight(),
			'length'             => $product->get_length(),
			'width'              => $product->get_width(),
			'height'             => $product->get_height(),
			'shipping_class_id'  => $product->get_shipping_class_id(),
			'tax_status'         => $product->get_tax_status(),
			'tax_class'          => $product->get_tax_class(),
			'category_ids'       => $product->get_category_ids(),
			'tag_ids'            => $product->get_tag_ids(),
			'image_ids'          => $image_ids,
		);
	}

	/**
	 * @return array<int, array{id: int, url: string, alt: string}>
	 */
	private function images( \WC_Product $product ): array {
		$image_ids = $this->image_ids( $product );
		return array_map(
			static function ( int $image_id ): array {
				$url = wp_get_attachment_image_url( $image_id, 'thumbnail' );
				return array(
					'id'  => $image_id,
					'url' => is_string( $url ) ? $url : '',
					'alt' => (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ),
				);
			},
			$image_ids
		);
	}

	/**
	 * @param array<int> $image_ids Valid attachment IDs.
	 */
	private function assign_images( \WC_Product $product, array $image_ids ): void {
		$product->set_image_id( (int) ( $image_ids[0] ?? 0 ) );
		$product->set_gallery_image_ids( array_slice( $image_ids, 1 ) );
	}

	/** @return array<int> */
	private function image_ids( \WC_Product $product ): array {
		$ids = array_filter( array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() ) );
		return array_values( array_map( 'intval', $ids ) );
	}

	private function sale_end( ?string $date ): ?string {
		return null === $date ? null : $date . ' 23:59:59';
	}

	private function local_date( ?\WC_DateTime $date ): ?string {
		if ( null === $date ) {
			return null;
		}
		$localized = clone $date;
		$localized->setTimezone( new \DateTimeZone( wc_timezone_string() ) );
		return $localized->format( 'Y-m-d' );
	}
}
