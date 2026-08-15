<?php
/**
 * Complete simple-product REST lifecycle integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

/**
 * Exercises the Phase 3 read, update, prefill, search, and trash contracts.
 */
final class SimpleProductLifecycleTest extends TestCase {
	private int $original_user_id;
	private int $administrator_id;

	/** @var array<string, int> */
	private array $term_ids = array();

	/** @var array<int> */
	private array $attachment_ids = array();

	/** @var array<int> */
	private array $product_ids = array();

	/** @var array<string> */
	private array $operation_ids = array();
	private int $additional_category_id;
	private string $tax_class;

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
		$this->administrator_id = (int) $administrators[0]->ID;
		wp_set_current_user( $this->administrator_id );
		SchemaManager::create()->maybe_upgrade();
		do_action( 'rest_api_init' );
		$this->create_references();
	}

	protected function tearDown(): void {
		foreach ( array_unique( $this->product_ids ) as $product_id ) {
			wp_delete_post( $product_id, true );
		}
		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		wp_delete_term( $this->additional_category_id, 'product_cat' );
		foreach ( $this->term_ids as $taxonomy => $term_id ) {
			wp_delete_term( $term_id, $taxonomy );
		}
		\WC_Tax::delete_tax_class_by( 'slug', $this->tax_class );
		global $wpdb;
		foreach ( array_unique( $this->operation_ids ) as $operation_id ) {
			$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_full_field_create_detail_and_bounded_search_round_trip(): void {
		$created = $this->create_product();
		$product = $created['product'];

		self::assertSame( 'publish', $product['status'] );
		self::assertSame( 'ypw-lifecycle-product', $product['slug'] );
		self::assertSame( '9.25', $product['sale_price'] );
		self::assertSame( '2030-01-10', $product['date_on_sale_from'] );
		self::assertSame( 11, $product['stock_quantity'] );
		self::assertSame( 'notify', $product['backorders'] );
		self::assertTrue( $product['sold_individually'] );
		self::assertSame( $this->term_ids['product_shipping_class'], $product['shipping_class_id'] );
		self::assertSame( $this->tax_class, $product['tax_class'] );
		self::assertSame( $this->attachment_ids, $product['image_ids'] );
		self::assertSame( array( $this->term_ids['product_cat'], $this->additional_category_id ), $product['category_ids'] );
		self::assertStringContainsString( '<h2>Details</h2>', $product['description'] );
		self::assertStringContainsString( '<ul><li>Durable formatting</li></ul>', $product['description'] );
		self::assertStringContainsString( (string) wp_get_attachment_url( $this->attachment_ids[0] ), $product['description'] );
		self::assertStringNotContainsString( '<script', $product['description'] );
		self::assertStringNotContainsString( 'javascript:', $product['short_description'] );

		$detail = $this->data( $this->dispatch( 'GET', '/products/' . $product['id'] ) );
		self::assertSame( $product['version'], $detail['version'] );
		self::assertSame( $product['tag_ids'], $detail['tag_ids'] );

		$search = $this->data(
			$this->dispatch(
				'GET',
				'/products',
				array(
					'search'   => $product['sku'],
					'per_page' => 1,
				)
			)
		);
		self::assertSame( 1, $search['per_page'] );
		self::assertLessThanOrEqual( 1, count( $search['items'] ) );
		self::assertSame( $product['id'], $search['items'][0]['id'] );
	}

	public function test_update_rejects_a_stale_version_without_overwriting(): void {
		$current                          = $this->create_product()['product'];
		$updated_fields                   = $this->payload();
		$updated_fields['name']           = 'YPW lifecycle updated';
		$updated_fields['regular_price']  = '18.50';
		$updated_fields['stock_quantity'] = 4;
		$response                         = $this->dispatch(
			'PUT',
			'/products/' . $current['id'],
			array(
				'expected_version' => $current['version'],
				'product'          => $updated_fields,
			)
		);
		$updated                          = $this->data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertSame( 'YPW lifecycle updated', $updated['name'] );
		self::assertNotSame( $current['version'], $updated['version'] );

		$stale_fields         = $updated_fields;
		$stale_fields['name'] = 'YPW stale overwrite';
		$conflict             = $this->dispatch(
			'PUT',
			'/products/' . $current['id'],
			array(
				'expected_version' => $current['version'],
				'product'          => $stale_fields,
			)
		);
		self::assertSame( 409, $conflict->get_status() );
		self::assertSame( 'ypw_product_conflict', $conflict->get_data()['code'] );
		self::assertSame( 'YPW lifecycle updated', $this->data( $this->dispatch( 'GET', '/products/' . $current['id'] ) )['name'] );
	}

	public function test_duplicate_is_a_safe_prefill_and_does_not_write(): void {
		$product = $this->create_product()['product'];
		$before  = $this->product_count();
		$prefill = $this->data( $this->dispatch( 'GET', '/products/' . $product['id'] . '/duplicate' ) );

		self::assertSame( $before, $this->product_count() );
		self::assertSame(
			/* translators: %s: source product name. */
			sprintf( __( '%s (Copy)', 'yaxii-product-workspace' ), $product['name'] ),
			$prefill['name']
		);
		self::assertSame( '', $prefill['slug'] );
		self::assertSame( '', $prefill['sku'] );
		self::assertSame( 'draft', $prefill['status'] );
		self::assertArrayNotHasKey( 'id', $prefill );
		self::assertSame( $product['category_ids'], $prefill['category_ids'] );
	}

	public function test_trash_requires_the_current_version_and_uses_woocommerce_state(): void {
		$product  = $this->create_product()['product'];
		$conflict = $this->dispatch( 'DELETE', '/products/' . $product['id'], array( 'expected_version' => str_repeat( '0', 64 ) ) );
		self::assertSame( 409, $conflict->get_status() );
		self::assertNotSame( 'trash', get_post_status( $product['id'] ) );

		$response = $this->dispatch( 'DELETE', '/products/' . $product['id'], array( 'expected_version' => $product['version'] ) );
		self::assertSame( 200, $response->get_status() );
		self::assertSame(
			array(
				'id'     => $product['id'],
				'status' => 'trash',
			),
			$this->data( $response )
		);
		self::assertSame( 'trash', get_post_status( $product['id'] ) );
	}

	public function test_object_edit_capability_is_enforced_by_the_item_route(): void {
		$product_id = (int) $this->create_product()['product']['id'];
		$deny_edit  = static function ( array $caps, string $cap, int $user_id, array $args ) use ( $product_id ): array {
			unset( $user_id );
			return 'edit_post' === $cap && (int) ( $args[0] ?? 0 ) === $product_id ? array( 'do_not_allow' ) : $caps;
		};
		add_filter( 'map_meta_cap', $deny_edit, 10, 4 );
		$response = $this->dispatch( 'GET', '/products/' . $product_id );
		remove_filter( 'map_meta_cap', $deny_edit, 10 );

		self::assertSame( 403, $response->get_status() );
		self::assertSame( 'ypw_forbidden', $response->get_data()['code'] );
	}

	private function create_references(): void {
		$names = array(
			'product_cat'            => 'YPW lifecycle category',
			'product_tag'            => 'YPW lifecycle tag',
			'product_shipping_class' => 'YPW lifecycle shipping',
		);
		foreach ( $names as $taxonomy => $name ) {
			$term = wp_insert_term( $name . ' ' . wp_generate_password( 5, false ), $taxonomy );
			self::assertIsArray( $term );
			$this->term_ids[ $taxonomy ] = (int) $term['term_id'];
		}
		$category = wp_insert_term(
			'YPW lifecycle child ' . wp_generate_password( 5, false ),
			'product_cat',
			array( 'parent' => $this->term_ids['product_cat'] )
		);
		self::assertIsArray( $category );
		$this->additional_category_id = (int) $category['term_id'];

		$this->tax_class = 'ypw-tax-' . strtolower( wp_generate_password( 6, false ) );
		self::assertIsArray( \WC_Tax::create_tax_class( 'YPW lifecycle tax ' . $this->tax_class, $this->tax_class ) );
		foreach ( array( 'featured', 'gallery' ) as $label ) {
			$image  = hex2bin( '89504e470d0a1a0a0000000d4948445200000001000000010804000000b51c0c020000000b4944415478da6364f80f00010501012718e3660000000049454e44ae426082' );
			$upload = wp_upload_bits( 'ypw-' . $label . '-' . wp_generate_password( 6, false ) . '.png', null, $image );
			self::assertFalse( $upload['error'] );
			$attachment_id = wp_insert_attachment(
				array(
					'post_title'     => 'YPW ' . $label,
					'post_status'    => 'inherit',
					'post_mime_type' => 'image/png',
					'post_author'    => $this->administrator_id,
				),
				$upload['file']
			);
			self::assertIsInt( $attachment_id );
			$this->attachment_ids[] = $attachment_id;
		}
	}

	/** @return array<string, mixed> */
	private function create_product(): array {
		$response = $this->dispatch( 'POST', '/products', $this->payload(), wp_generate_uuid4() );
		$data     = $this->data( $response );
		self::assertSame( 201, $response->get_status(), (string) wp_json_encode( $response->get_data() ) );
		$this->operation_ids[] = (string) $data['operation_id'];
		$this->product_ids[]   = (int) $data['product']['id'];
		return $data;
	}

	/** @return array<string, mixed> */
	private function payload(): array {
		return array(
			'name'               => 'YPW lifecycle product',
			'slug'               => 'ypw-lifecycle-product',
			'description'        => '<h2>Details</h2><ul><li>Durable formatting</li></ul><p><a href="https://example.test/guide">Guide</a></p><img src="' . esc_url_raw( (string) wp_get_attachment_url( $this->attachment_ids[0] ) ) . '" alt="Guide"><script>alert(1)</script>',
			'short_description'  => '<p><strong>Lifecycle short description.</strong> <a href="javascript:alert(1)">Unsafe</a></p>',
			'status'             => 'publish',
			'catalog_visibility' => 'catalog',
			'regular_price'      => '12.50',
			'sale_price'         => '9.25',
			'date_on_sale_from'  => '2030-01-10',
			'date_on_sale_to'    => '2030-01-20',
			'sku'                => 'YPW-LIFE-' . wp_generate_password( 8, false ),
			'manage_stock'       => true,
			'stock_quantity'     => 11,
			'stock_status'       => 'instock',
			'backorders'         => 'notify',
			'sold_individually'  => true,
			'weight'             => '1.25',
			'length'             => '12',
			'width'              => '8.5',
			'height'             => '3',
			'shipping_class_id'  => $this->term_ids['product_shipping_class'],
			'tax_status'         => 'taxable',
			'tax_class'          => $this->tax_class,
			'category_ids'       => array( $this->term_ids['product_cat'], $this->additional_category_id ),
			'tag_ids'            => array( $this->term_ids['product_tag'] ),
			'image_ids'          => $this->attachment_ids,
		);
	}

	/** @param array<string, mixed> $parameters */
	private function dispatch( string $method, string $path, array $parameters = array(), ?string $idempotency_key = null ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/yaxii-product-workspace/v1' . $path );
		if ( 'GET' === $method || 'DELETE' === $method ) {
			$request->set_query_params( $parameters );
		} else {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( (string) wp_json_encode( $parameters ) );
		}
		if ( null !== $idempotency_key ) {
			$request->set_header( 'idempotency-key', $idempotency_key );
		}
		return rest_get_server()->dispatch( $request );
	}

	/** @return array<string, mixed> */
	private function data( \WP_REST_Response $response ): array {
		$data = $response->get_data();
		self::assertIsArray( $data );
		self::assertArrayHasKey( 'data', $data );
		return $data['data'];
	}

	private function product_count(): int {
		return array_sum( array_map( 'intval', get_object_vars( wp_count_posts( 'product' ) ) ) );
	}
}
