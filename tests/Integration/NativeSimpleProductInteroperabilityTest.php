<?php
/**
 * Native WooCommerce simple-product interoperability tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * Covers native products without Product Workspace metadata.
 */
final class NativeSimpleProductInteroperabilityTest extends TestCase {
	private int $original_user_id;
	/** @var array<int> */
	private array $product_ids = array();
	/** @var array<int> */
	private array $term_ids = array();
	/** @var array<int> */
	private array $attachment_ids = array();
	private int $limited_user_id  = 0;

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
		foreach ( $this->product_ids as $product_id ) {
			$product = wc_get_product( $product_id );
			$product instanceof \WC_Product ? $product->delete( true ) : wp_delete_post( $product_id, true );
		}
		foreach ( $this->term_ids as $term_id ) {
			$term = get_term( $term_id );
			if ( $term instanceof \WP_Term ) {
				wp_delete_term( $term_id, $term->taxonomy );
			}
		}
		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		if ( $this->limited_user_id ) {
			wp_delete_user( $this->limited_user_id );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_native_simple_search_hydrate_and_update_round_trip(): void {
		$marker      = strtolower( wp_generate_password( 8, false ) );
		$category_id = $this->term( 'Native category ' . $marker, 'product_cat' );
		$tag_id      = $this->term( 'Native tag ' . $marker, 'product_tag' );
		$shipping_id = $this->term( 'Native shipping ' . $marker, 'product_shipping_class' );
		$image_id    = $this->image( 'native-simple-' . $marker . '.png' );
		$gallery_id  = $this->image( 'native-gallery-' . $marker . '.png' );

		$product = new \WC_Product_Simple();
		$product->set_name( 'Native simple ' . $marker );
		$product->set_slug( 'native-simple-' . $marker );
		$product->set_status( 'publish' );
		$product->set_regular_price( '29.99' );
		$product->set_sale_price( '24.99' );
		$product->set_sku( 'NATIVE-SIMPLE-' . strtoupper( $marker ) );
		$product->set_category_ids( array( $category_id ) );
		$product->set_tag_ids( array( $tag_id ) );
		$product->set_image_id( $image_id );
		$product->set_gallery_image_ids( array( $gallery_id ) );
		$product->set_manage_stock( true );
		$product->set_stock_quantity( 9 );
		$product->set_weight( '1.5' );
		$product->set_length( '20' );
		$product->set_width( '10' );
		$product->set_height( '5' );
		$product->set_shipping_class_id( $shipping_id );
		$product->set_tax_status( 'taxable' );
		$product->set_description( '<p>Native long description</p>' );
		$product->set_short_description( '<p>Native short description</p>' );
		$product_id          = $product->save();
		$this->product_ids[] = $product_id;

		self::assertSame( '', (string) get_post_meta( $product_id, '_ypw_operation_id', true ) );
		$this->assert_search_result( 'Native simple ' . $marker, $product_id, 'simple' );
		$this->assert_search_result( $product->get_sku(), $product_id, 'simple' );

		$resource = $this->data( $this->dispatch( 'GET', '/products/' . $product_id ) );
		self::assertSame( 'native-simple-' . $marker, $resource['slug'] );
		self::assertSame( '24.99', $resource['sale_price'] );
		self::assertSame( array( $category_id ), $resource['category_ids'] );
		self::assertSame( array( $tag_id ), $resource['tag_ids'] );
		self::assertSame( array( $image_id, $gallery_id ), $resource['image_ids'] );
		self::assertSame( 9, $resource['stock_quantity'] );
		self::assertSame( $shipping_id, $resource['shipping_class_id'] );
		self::assertStringContainsString( 'post=' . $product_id, $resource['native_edit_url'] );

		$update                   = $this->editable_fields( $resource );
		$update['regular_price']  = '31.50';
		$update['stock_quantity'] = 7;
		$updated                  = $this->data(
			$this->dispatch(
				'PUT',
				'/products/' . $product_id,
				array(
					'expected_version' => $resource['version'],
					'product'          => $update,
				)
			)
		);
		self::assertSame( '31.50', $updated['regular_price'] );
		self::assertSame( 7, $updated['stock_quantity'] );
		self::assertSame( $product_id, $updated['id'] );
	}

	public function test_unsupported_product_type_has_a_bounded_error(): void {
		$product_id = $this->create_unsupported_product();
		$response   = $this->dispatch( 'GET', '/products/' . $product_id );
		self::assertSame( 422, $response->get_status() );
		self::assertSame( 'ypw_unsupported_product_type', $response->get_data()['code'] );
	}

	public function test_missing_and_insufficient_access_are_bounded(): void {
		$missing = $this->dispatch( 'GET', '/products/999999999' );
		self::assertSame( 403, $missing->get_status() );
		self::assertSame( 'ypw_forbidden', $missing->get_data()['code'] );

		$product_id = $this->create_unsupported_product();
		$user_id    = wp_create_user(
			'ypw-limited-' . strtolower( wp_generate_password( 6, false ) ),
			wp_generate_password( 24 ),
			'ypw-limited-' . strtolower( wp_generate_password( 6, false ) ) . '@example.test'
		);
		self::assertIsInt( $user_id );
		$this->limited_user_id = $user_id;
		wp_set_current_user( $this->limited_user_id );
		$forbidden = $this->dispatch( 'GET', '/products/' . $product_id );
		self::assertSame( 403, $forbidden->get_status() );
		self::assertSame( 'ypw_forbidden', $forbidden->get_data()['code'] );
	}

	private function create_unsupported_product(): int {
		$product = new \WC_Product_Grouped();
		$product->set_name( 'Native unsupported ' . wp_generate_password( 6, false ) );
		$product->set_status( 'draft' );
		$product_id          = $product->save();
		$this->product_ids[] = $product_id;
		return $product_id;
	}

	private function assert_search_result( string $search, int $product_id, string $type ): void {
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
		$result = array_values( array_filter( $page['items'], static fn ( array $item ): bool => $product_id === $item['id'] ) )[0];
		self::assertSame( $type, $result['type'] );
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
			'regular_price',
			'sale_price',
			'date_on_sale_from',
			'date_on_sale_to',
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

	private function term( string $name, string $taxonomy ): int {
		$term = wp_insert_term( $name, $taxonomy );
		self::assertIsArray( $term );
		$this->term_ids[] = (int) $term['term_id'];
		return (int) $term['term_id'];
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
		$this->attachment_ids[] = $attachment;
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
