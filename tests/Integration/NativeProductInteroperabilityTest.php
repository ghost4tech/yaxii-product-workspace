<?php
/**
 * Native WooCommerce product interoperability regressions.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * Covers products without Product Workspace operation or identity metadata.
 */
final class NativeProductInteroperabilityTest extends TestCase {
	private int $original_user_id;

	/** @var array<int> */
	private array $product_ids = array();

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
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_native_variable_inherited_stock_hydrates_as_editable_values(): void {
		$fixture = $this->native_variable_product();
		$product = $this->data( $this->dispatch( 'GET', '/products/' . $fixture['parent_id'] ) );

		self::assertSame( 'variable', $product['type'] );
		self::assertCount( 2, $product['attributes'] );
		self::assertSame( array( 'Red', 'Blue' ), $product['attributes'][0]['options'] );
		self::assertSame( array( 'S', 'M', 'L' ), $product['attributes'][1]['options'] );
		self::assertCount( 6, $product['combinations'] );
		self::assertCount( 6, array_unique( array_column( $product['combinations'], 'sku' ) ) );
		self::assertSame( array( '21', '22', '23', '24', '25', '26' ), array_column( $product['combinations'], 'regular_price' ) );
		self::assertFalse( $product['combinations'][5]['enabled'] );
		self::assertFalse( $product['combinations'][0]['manage_stock'] );
		self::assertNull( $product['combinations'][0]['stock_quantity'] );

		$children                                    = array_column( $product['combinations'], 'variation_id' );
		$product['combinations'][0]['regular_price'] = '33.00';
		$product['combinations'][0]['enabled']       = false;
		$updated                                     = $this->data(
			$this->dispatch(
				'PUT',
				'/variable-products/' . $fixture['parent_id'],
				array(
					'product'          => $this->editable_fields( $product ),
					'attributes'       => $product['attributes'],
					'combinations'     => $product['combinations'],
					'expected_version' => $product['version'],
				)
			)
		);
		self::assertSame( $children, array_column( $updated['product']['combinations'], 'variation_id' ) );
		self::assertSame( '33.00', $updated['product']['combinations'][0]['regular_price'] );
		self::assertFalse( $updated['product']['combinations'][0]['enabled'] );
		self::assertCount( 6, wc_get_product( $fixture['parent_id'] )->get_children() );
	}

	public function test_native_variation_sku_search_returns_its_parent_product(): void {
		$fixture = $this->native_variable_product();
		$page    = $this->data(
			$this->dispatch(
				'GET',
				'/products',
				array(
					'search'   => $fixture['variation_sku'],
					'per_page' => 20,
				)
			)
		);

		self::assertCount( 1, $page['items'] );
		self::assertSame( $fixture['parent_id'], $page['items'][0]['id'] );
		self::assertSame( 'variable', $page['items'][0]['type'] );
	}

	/** @return array{parent_id: int, variation_sku: string} */
	private function native_variable_product(): array {
		$marker     = strtolower( wp_generate_password( 8, false ) );
		$attributes = array();
		foreach ( array(
			'Color' => array( 'Red', 'Blue' ),
			'Size'  => array( 'S', 'M', 'L' ),
		) as $name => $options ) {
			$attribute = new \WC_Product_Attribute();
			$attribute->set_name( $name );
			$attribute->set_options( $options );
			$attribute->set_position( count( $attributes ) );
			$attribute->set_visible( true );
			$attribute->set_variation( true );
			$attributes[] = $attribute;
		}

		$parent = new \WC_Product_Variable();
		$parent->set_name( 'Native variable ' . $marker );
		$parent->set_status( 'publish' );
		$parent->set_manage_stock( true );
		$parent->set_stock_quantity( 12 );
		$parent->set_attributes( $attributes );
		$parent_id           = $parent->save();
		$this->product_ids[] = $parent_id;

		$variation_sku = '';
		$index         = 0;
		foreach ( array( 'Red', 'Blue' ) as $color ) {
			foreach ( array( 'S', 'M', 'L' ) as $size ) {
				++$index;
				$variation = new \WC_Product_Variation();
				$variation->set_parent_id( $parent_id );
				$variation->set_status( 6 === $index ? 'private' : 'publish' );
				$variation->set_attributes(
					array(
						'color' => $color,
						'size'  => $size,
					)
				);
				$variation->set_regular_price( (string) ( 20 + $index ) );
				$variation->set_manage_stock( false );
				$variation->set_sku( 'NATIVE-VAR-' . $marker . '-' . $index );
				$variation_id        = $variation->save();
				$this->product_ids[] = $variation_id;
				if ( 1 === $index ) {
					$variation_sku = $variation->get_sku();
				}
			}
		}

		\WC_Product_Variable::sync( $parent_id );
		wc_delete_product_transients( $parent_id );

		self::assertSame( '', (string) get_post_meta( $parent_id, '_ypw_operation_id', true ) );
		self::assertSame( '', (string) get_post_meta( $parent_id, '_ypw_attribute_keys', true ) );

		return array(
			'parent_id'     => $parent_id,
			'variation_sku' => $variation_sku,
		);
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
		self::assertArrayHasKey( 'data', $data );
		return $data['data'];
	}
}
