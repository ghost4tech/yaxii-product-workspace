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
use Yaxii\ProductWorkspace\Application\Products\ProductQuery;

defined( 'ABSPATH' ) || exit;

/**
 * Owns bounded product queries and supported WooCommerce CRUD operations.
 */
final class WooProductGateway implements ProductGateway {
	private const OPERATION_META_KEY = '_ypw_operation_id';

	private WooProductMapper $mapper;
	private ?WooVariableProductMapper $variable_mapper;

	public function __construct( WooProductMapper $mapper, ?WooVariableProductMapper $variable_mapper = null ) {
		$this->mapper          = $mapper;
		$this->variable_mapper = $variable_mapper;
	}

	public function is_available(): bool {
		return class_exists( 'WooCommerce' ) && class_exists( 'WC_Product_Simple' ) && defined( 'WC_VERSION' );
	}

	public function validate( CreateProductCommand $command, int $product_id = 0 ): array {
		$fields = array();
		if ( '' !== $command->sku() && ! wc_product_has_unique_sku( $product_id, $command->sku() ) ) {
			$fields['sku'][] = __( 'This SKU is already used by another product.', 'yaxii-product-workspace' );
		}
		$fields = array_merge_recursive( $fields, $this->term_errors( $command->category_ids(), 'product_cat', 'category_ids' ) );
		$fields = array_merge_recursive( $fields, $this->term_errors( $command->tag_ids(), 'product_tag', 'tag_ids' ) );
		if ( 0 < $command->shipping_class_id() ) {
			$fields = array_merge_recursive( $fields, $this->term_errors( array( $command->shipping_class_id() ), 'product_shipping_class', 'shipping_class_id' ) );
		}
		return array_merge_recursive( $fields, $this->image_errors( $command->image_ids() ), $this->tax_class_errors( $command->tax_class() ) );
	}

	public function create( CreateProductCommand $command, string $operation_id ): array {
		$product = new \WC_Product_Simple();
		$this->mapper->apply( $product, $command );
		$product->update_meta_data( self::OPERATION_META_KEY, $operation_id );
		$product_id = $product->save();
		if ( 0 >= $product_id ) {
			throw new RuntimeException( 'WooCommerce did not return a product ID.' );
		}
		return $this->persisted_resource( $product_id );
	}

	public function get( int $product_id ): ?array {
		$product = wc_get_product( $product_id );
		if ( $product instanceof \WC_Product_Simple ) {
			return $this->mapper->resource( $product );
		}
		return $product instanceof \WC_Product_Variable && null !== $this->variable_mapper ? $this->variable_mapper->resource( $product ) : null;
	}

	public function query( ProductQuery $query ): array {
		$exact_id = $this->exact_sku_id( $query );
		$slots    = 0 < $exact_id && 1 === $query->page() ? $query->per_page() - 1 : $query->per_page();
		$offset   = ( $query->page() - 1 ) * $query->per_page() - ( 0 < $exact_id && 1 < $query->page() ? 1 : 0 );
		$wp_query = new \WP_Query( $this->query_args( $query, $exact_id, max( 1, $slots ), $offset ) );
		$ids      = 0 === $slots ? array() : array_map( 'intval', $wp_query->posts );
		if ( 0 < $exact_id && 1 === $query->page() ) {
			array_unshift( $ids, $exact_id );
		}
		$items = array();
		foreach ( $ids as $product_id ) {
			$product = wc_get_product( $product_id );
			if ( ! current_user_can( 'edit_post', $product_id ) ) {
				continue;
			}
			if ( $product instanceof \WC_Product_Simple ) {
				$items[] = $this->mapper->resource( $product );
			} elseif ( $product instanceof \WC_Product_Variable && null !== $this->variable_mapper ) {
				$items[] = $this->variable_mapper->resource( $product );
			}
		}
		$total = (int) $wp_query->found_posts + ( 0 < $exact_id ? 1 : 0 );

		return array(
			'items'    => $items,
			'page'     => $query->page(),
			'per_page' => $query->per_page(),
			'has_more' => $query->page() * $query->per_page() < $total,
			'total'    => $total,
		);
	}

	public function update( int $product_id, CreateProductCommand $command ): array {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof \WC_Product_Simple && ! $product instanceof \WC_Product_Variable ) {
			throw new RuntimeException( 'The requested product is unavailable.' );
		}
		$this->mapper->apply( $product, $command );
		$product->save();
		return $this->persisted_resource( $product_id );
	}

	public function trash( int $product_id ): array {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof \WC_Product_Simple ) {
			throw new RuntimeException( 'The requested simple product is unavailable.' );
		}
		$product->delete( false );
		return array(
			'id'     => $product_id,
			'status' => (string) get_post_status( $product_id ),
		);
	}

	public function duplicate_prefill( int $product_id ): ?array {
		$product = wc_get_product( $product_id );
		return $product instanceof \WC_Product_Simple ? $this->mapper->duplicate_prefill( $product ) : null;
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
		return array() === $product_ids ? null : $this->get( (int) $product_ids[0] );
	}

	/**
	 * @param array<int> $term_ids Term IDs.
	 * @return array<string, array<string>>
	 */
	private function term_errors( array $term_ids, string $taxonomy, string $field ): array {
		$errors = array();
		foreach ( $term_ids as $term_id ) {
			if ( ! get_term( $term_id, $taxonomy ) instanceof \WP_Term ) {
				$errors[ $field ][] = sprintf(
					/* translators: %d: invalid term ID. */
					__( 'Term ID %d is not valid for this product field.', 'yaxii-product-workspace' ),
					$term_id
				);
			}
		}
		return $errors;
	}

	/**
	 * @param array<int> $image_ids Image attachment IDs.
	 * @return array<string, array<string>>
	 */
	private function image_errors( array $image_ids ): array {
		$errors = array();
		foreach ( $image_ids as $image_id ) {
			if ( 'attachment' !== get_post_type( $image_id ) || ! wp_attachment_is_image( $image_id ) ) {
				$errors['image_ids'][] = sprintf(
					/* translators: %d: invalid image attachment ID. */
					__( 'Media ID %d is not a valid image attachment.', 'yaxii-product-workspace' ),
					$image_id
				);
			}
		}
		return $errors;
	}

	/** @return array<string, array<string>> */
	private function tax_class_errors( string $tax_class ): array {
		$classes = \WC_Tax::get_tax_class_slugs();
		if ( '' !== $tax_class && ! in_array( $tax_class, $classes, true ) ) {
			return array( 'tax_class' => array( __( 'Choose a configured WooCommerce tax class.', 'yaxii-product-workspace' ) ) );
		}
		return array();
	}

	/**
	 * @return array<string, mixed>
	 */
	private function query_args( ProductQuery $query, int $exact_id, int $limit, int $offset ): array {
		$statuses = 'all' === $query->status()
			? array( 'publish', 'draft', 'pending' )
			: array( $query->status() );
		return array(
			'post_type'              => 'product',
			'post_status'            => $statuses,
			'posts_per_page'         => $limit,
			'offset'                 => max( 0, $offset ),
			'post__not_in'           => 0 < $exact_id ? array( $exact_id ) : array(),
			's'                      => $query->search(),
			'fields'                 => 'ids',
			'orderby'                => 'modified',
			'order'                  => 'DESC',
			'perm'                   => 'editable',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query'              => array(
				array(
					'taxonomy' => 'product_type',
					'field'    => 'slug',
					'terms'    => null === $this->variable_mapper ? array( 'simple' ) : array( 'simple', 'variable' ),
				),
			),
		);
	}

	private function exact_sku_id( ProductQuery $query ): int {
		if ( '' === $query->search() ) {
			return 0;
		}
		$sku_id    = wc_get_product_id_by_sku( $query->search() );
		$product   = $sku_id ? wc_get_product( $sku_id ) : false;
		$supported = $product instanceof \WC_Product_Simple
			|| ( $product instanceof \WC_Product_Variable && null !== $this->variable_mapper );
		if ( ! $supported || ! current_user_can( 'edit_post', $sku_id ) ) {
			return 0;
		}
		$status = $product->get_status();
		if ( ! in_array( $status, array( 'publish', 'draft', 'pending' ), true ) ) {
			return 0;
		}
		return 'all' === $query->status() || $query->status() === $status ? (int) $sku_id : 0;
	}

	/** @return array<string, mixed> */
	private function persisted_resource( int $product_id ): array {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof \WC_Product_Simple ) {
			throw new RuntimeException( 'WooCommerce could not reload the saved simple product.' );
		}
		return $this->mapper->resource( $product );
	}
}
