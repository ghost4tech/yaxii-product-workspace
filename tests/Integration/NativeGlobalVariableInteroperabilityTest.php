<?php
/**
 * Native WooCommerce global-attribute variable-product tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * Proves native global IDs, terms, and concrete children survive an edit.
 */
final class NativeGlobalVariableInteroperabilityTest extends TestCase {
	private int $original_user_id;
	/** @var array<int> */
	private array $product_ids = array();
	/** @var array<int> */
	private array $attribute_ids = array();
	/** @var array<string, array<int>> */
	private array $term_ids    = array();
	private int $attachment_id = 0;

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		$administrators         = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		self::assertNotEmpty( $administrators );
		wp_set_current_user( (int) $administrators[0]->ID );
	}

	protected function tearDown(): void {
		foreach ( array_unique( $this->product_ids ) as $product_id ) {
			$product = wc_get_product( $product_id );
			$product instanceof \WC_Product ? $product->delete( true ) : wp_delete_post( $product_id, true );
		}
		if ( $this->attachment_id ) {
			wp_delete_attachment( $this->attachment_id, true );
		}
		foreach ( $this->term_ids as $taxonomy => $ids ) {
			foreach ( $ids as $term_id ) {
				wp_delete_term( $term_id, $taxonomy );
			}
		}
		foreach ( $this->attribute_ids as $attribute_id ) {
			wc_delete_attribute( $attribute_id );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_native_global_matrix_hydrates_and_updates_without_identity_markers(): void {
		$fixture  = $this->create_native_product();
		$resource = $this->data( $this->dispatch( 'GET', '/products/' . $fixture['parent_id'] ) );

		self::assertSame( 'variable', $resource['type'] );
		self::assertCount( 2, $resource['attributes'] );
		self::assertCount( 6, $resource['combinations'] );
		self::assertSame( $this->attribute_ids, array_column( $resource['attributes'], 'attribute_id' ) );
		self::assertSame( array_keys( $this->term_ids ), array_column( $resource['attributes'], 'taxonomy' ) );
		self::assertCount( 6, array_unique( array_column( $resource['combinations'], 'variation_id' ) ) );
		self::assertCount( 6, array_unique( array_column( $resource['combinations'], 'sku' ) ) );
		self::assertSame( array( '11', '12', '13', '14', '15', '16' ), array_column( $resource['combinations'], 'regular_price' ) );
		self::assertSame( array( 1, 2, 3, 4, 5, 6 ), array_column( $resource['combinations'], 'stock_quantity' ) );
		self::assertFalse( $resource['combinations'][5]['enabled'] );
		self::assertSame( $this->attachment_id, $resource['combinations'][0]['image_id'] );
		foreach ( $resource['combinations'] as $combination ) {
			self::assertGreaterThan( 0, $combination['selections'][0]['term_id'] );
			self::assertGreaterThan( 0, $combination['selections'][1]['term_id'] );
		}

		$this->assert_search_result( $fixture['name'], $fixture['parent_id'] );
		$this->assert_search_result( $fixture['variation_sku'], $fixture['parent_id'] );

		$original_children                             = array_column( $resource['combinations'], 'variation_id' );
		$resource['combinations'][0]['regular_price']  = '21.50';
		$resource['combinations'][0]['stock_quantity'] = 17;
		$resource['combinations'][0]['enabled']        = false;
		$payload                                       = array(
			'product'          => $this->editable_fields( $resource ),
			'attributes'       => $resource['attributes'],
			'combinations'     => $resource['combinations'],
			'expected_version' => $resource['version'],
		);
		$updated                                       = $this->data( $this->dispatch( 'PUT', '/variable-products/' . $fixture['parent_id'], $payload ) );

		self::assertSame( $original_children, array_column( $updated['product']['combinations'], 'variation_id' ) );
		self::assertSame( '21.50', $updated['product']['combinations'][0]['regular_price'] );
		self::assertSame( 17, $updated['product']['combinations'][0]['stock_quantity'] );
		self::assertFalse( $updated['product']['combinations'][0]['enabled'] );
		self::assertSame( $this->attribute_ids, array_column( $updated['product']['attributes'], 'attribute_id' ) );
		self::assertCount( 6, wc_get_product( $fixture['parent_id'] )->get_children() );
	}

	/** @return array{parent_id: int, name: string, variation_sku: string} */
	private function create_native_product(): array {
		$marker              = strtolower( wp_generate_password( 7, false ) );
		$color               = $this->global_attribute( 'Native Color', 'native_color_' . $marker, array( 'Red', 'Blue' ) );
		$size                = $this->global_attribute( 'Native Size', 'native_size_' . $marker, array( 'S', 'M', 'L' ) );
		$this->attachment_id = $this->image( 'native-global-' . $marker . '.png' );

		$attributes = array();
		foreach ( array( $color, $size ) as $position => $definition ) {
			$attribute = new \WC_Product_Attribute();
			$attribute->set_id( $definition['id'] );
			$attribute->set_name( $definition['taxonomy'] );
			$attribute->set_options( $definition['term_ids'] );
			$attribute->set_position( $position );
			$attribute->set_visible( true );
			$attribute->set_variation( true );
			$attributes[] = $attribute;
		}

		$name   = 'Native global variable ' . $marker;
		$parent = new \WC_Product_Variable();
		$parent->set_name( $name );
		$parent->set_status( 'publish' );
		$parent->set_attributes( $attributes );
		$parent_id           = $parent->save();
		$this->product_ids[] = $parent_id;

		$index         = 0;
		$variation_sku = '';
		foreach ( $color['slugs'] as $color_slug ) {
			foreach ( $size['slugs'] as $size_slug ) {
				++$index;
				$variation = new \WC_Product_Variation();
				$variation->set_parent_id( $parent_id );
				$variation->set_status( 6 === $index ? 'private' : 'publish' );
				$variation->set_attributes(
					array(
						$color['taxonomy'] => $color_slug,
						$size['taxonomy']  => $size_slug,
					)
				);
				$variation->set_regular_price( (string) ( 10 + $index ) );
				$variation->set_sku( 'NATIVE-GLOBAL-' . strtoupper( $marker ) . '-' . $index );
				$variation->set_manage_stock( true );
				$variation->set_stock_quantity( $index );
				$variation->set_image_id( 1 === $index ? $this->attachment_id : 0 );
				$variation_id        = $variation->save();
				$this->product_ids[] = $variation_id;
				$variation_sku       = 1 === $index ? $variation->get_sku() : $variation_sku;
			}
		}
		\WC_Product_Variable::sync( $parent_id );
		wc_delete_product_transients( $parent_id );
		self::assertSame( '', (string) get_post_meta( $parent_id, '_ypw_attribute_keys', true ) );

		return array(
			'parent_id'     => $parent_id,
			'name'          => $name,
			'variation_sku' => $variation_sku,
		);
	}

	/** @return array{id: int, taxonomy: string, term_ids: array<int>, slugs: array<string>} */
	private function global_attribute( string $name, string $slug, array $options ): array {
		$attribute_id = wc_create_attribute(
			array(
				'name'     => $name,
				'slug'     => $slug,
				'type'     => 'select',
				'order_by' => 'menu_order',
			)
		);
		self::assertIsInt( $attribute_id );
		self::assertGreaterThan( 0, $attribute_id );
		$this->attribute_ids[] = $attribute_id;
		$taxonomy              = wc_attribute_taxonomy_name( $slug );
		register_taxonomy(
			$taxonomy,
			'product',
			array(
				'public'       => false,
				'hierarchical' => false,
			)
		);
		$term_ids = array();
		$slugs    = array();
		foreach ( $options as $option ) {
			$term = wp_insert_term( $option, $taxonomy );
			self::assertIsArray( $term );
			$term_ids[] = (int) $term['term_id'];
			$stored     = get_term( (int) $term['term_id'], $taxonomy );
			self::assertInstanceOf( \WP_Term::class, $stored );
			$slugs[] = $stored->slug;
		}
		$this->term_ids[ $taxonomy ] = $term_ids;
		return array(
			'id'       => $attribute_id,
			'taxonomy' => $taxonomy,
			'term_ids' => $term_ids,
			'slugs'    => $slugs,
		);
	}

	private function assert_search_result( string $search, int $product_id ): void {
		$page = $this->data(
			$this->dispatch(
				'GET',
				'/products',
				array(
					'search'   => $search,
					'per_page' => 20,
				)
			)
		);
		self::assertContains( $product_id, array_column( $page['items'], 'id' ) );
	}

	/** @return array<string, mixed> */
	private function editable_fields( array $product_data ): array {
		$keys = array(
			'name',
			'slug',
			'description',
			'short_description',
			'status',
			'catalog_visibility',
			'sku',
			'manage_stock',
			'stock_quantity',
			'stock_status',
			'backorders',
			'sold_individually',
			'weight',
			'length',
			'width',
			'height',
			'shipping_class_id',
			'tax_status',
			'tax_class',
			'category_ids',
			'tag_ids',
			'image_ids',
		);
		return array_intersect_key( $product_data, array_flip( $keys ) );
	}

	private function image( string $filename ): int {
		$bytes      = hex2bin( '89504e470d0a1a0a0000000d4948445200000001000000010804000000b51c0c020000000b4944415478da6364f80f00010501012718e3660000000049454e44ae426082' );
		$upload     = wp_upload_bits( $filename, null, $bytes );
		$attachment = wp_insert_attachment(
			array(
				'post_title'     => $filename,
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/png',
			),
			$upload['file']
		);
		self::assertIsInt( $attachment );
		return $attachment;
	}

	/** @param array<string, mixed> $parameters */
	private function dispatch( string $method, string $path, array $parameters = array() ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/yaxii-product-workspace/v1' . $path );
		if ( 'GET' === $method ) {
			$request->set_query_params( $parameters );
		} else {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( (string) wp_json_encode( $parameters ) );
		}
		return rest_get_server()->dispatch( $request );
	}

	/** @return array<string, mixed> */
	private function data( \WP_REST_Response $response ): array {
		$data = $response->get_data();
		self::assertSame( 200, $response->get_status(), (string) wp_json_encode( $data ) );
		self::assertIsArray( $data );
		return $data['data'];
	}
}
