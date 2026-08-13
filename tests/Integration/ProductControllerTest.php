<?php
/**
 * Product REST and WooCommerce integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

/**
 * Exercises real WooCommerce persistence and cleanup on the LocalWP store.
 */
final class ProductControllerTest extends TestCase {
	private int $original_user_id;
	private int $administrator_id;
	private int $category_id;

	/** @var array<int> */
	private array $product_ids = array();

	/** @var array<string> */
	private array $operation_ids = array();

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

		$term = wp_insert_term( 'YPW test ' . wp_generate_uuid4(), 'product_cat' );
		self::assertIsArray( $term );
		$this->category_id = (int) $term['term_id'];
	}

	protected function tearDown(): void {
		foreach ( array_unique( $this->product_ids ) as $product_id ) {
			wp_delete_post( $product_id, true );
		}
		wp_delete_term( $this->category_id, 'product_cat' );

		global $wpdb;
		$table = SchemaManager::create()->table_name();
		foreach ( array_unique( $this->operation_ids ) as $operation_id ) {
			$wpdb->delete( $table, array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_authorized_draft_create_persists_canonical_values(): void {
		$response = $this->create_request( $this->payload( 'draft' ) );
		$data     = $this->result_data( $response );

		self::assertSame( 201, $response->get_status() );
		self::assertSame( 'succeeded', $data['state'] );
		self::assertSame( 'draft', $data['product']['status'] );
		self::assertSame( '19.99', $data['product']['regular_price'] );
		self::assertSame( array( $this->category_id ), $data['product']['category_ids'] );
	}

	public function test_authorized_publish_create_persists_published_product(): void {
		$response = $this->create_request( $this->payload( 'publish' ) );
		$data     = $this->result_data( $response );

		self::assertSame( 201, $response->get_status() );
		self::assertSame( 'publish', $data['product']['status'] );
	}

	public function test_created_operation_can_be_reconciled_by_its_owner(): void {
		$created      = $this->create_request( $this->payload( 'draft' ) );
		$created_data = $this->result_data( $created );
		$request      = new \WP_REST_Request(
			'GET',
			'/yaxii-product-workspace/v1/operations/' . $created_data['operation_id']
		);
		$response     = rest_get_server()->dispatch( $request );
		$data         = $this->result_data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertSame( $created_data['product']['id'], $data['product']['id'] );
		self::assertSame( 'succeeded', $data['state'] );
	}

	public function test_category_lookup_is_bounded(): void {
		$request = new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/categories' );
		$request->set_query_params(
			array(
				'page'     => 1,
				'per_page' => 1,
				'search'   => 'YPW test',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $this->result_data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertCount( 1, $data['items'] );
		self::assertSame( 1, $data['per_page'] );
	}

	public function test_publish_is_denied_without_capability_and_writes_nothing(): void {
		$before = $this->product_count();
		$filter = static function ( array $all_caps ): array {
			unset( $all_caps['publish_products'] );
			return $all_caps;
		};
		add_filter( 'user_has_cap', $filter );
		$response = $this->create_request( $this->payload( 'publish' ) );
		remove_filter( 'user_has_cap', $filter );

		self::assertSame( 403, $response->get_status() );
		self::assertSame( 'ypw_publish_forbidden', $response->get_data()['code'] );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_unauthenticated_request_writes_nothing(): void {
		$before = $this->product_count();
		wp_set_current_user( 0 );
		$response = $this->create_request( $this->payload( 'draft' ) );

		self::assertSame( 401, $response->get_status() );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_wordpress_cookie_auth_rejects_an_invalid_nonce(): void {
		global $wp_rest_auth_cookie;
		$previous_auth_cookie       = $wp_rest_auth_cookie;
		$wp_rest_auth_cookie        = true;
		$_SERVER['HTTP_X_WP_NONCE'] = 'invalid-rest-nonce';
		$result                     = rest_cookie_check_errors( null );
		unset( $_SERVER['HTTP_X_WP_NONCE'] );
		$wp_rest_auth_cookie = $previous_auth_cookie;

		self::assertInstanceOf( \WP_Error::class, $result );
		self::assertSame( 'rest_cookie_invalid_nonce', $result->get_error_code() );
	}

	public function test_malformed_payload_writes_nothing(): void {
		$payload                 = $this->payload( 'draft' );
		$payload['sku']          = array( 'not-a-string' );
		$payload['manage_stock'] = 'yes';
		$before                  = $this->product_count();
		$response                = $this->create_request( $payload );

		self::assertSame( 400, $response->get_status() );
		self::assertSame( 'ypw_validation_failed', $response->get_data()['code'] );
		self::assertArrayHasKey( 'sku', $response->get_data()['data']['fields'] );
		self::assertArrayHasKey( 'manage_stock', $response->get_data()['data']['fields'] );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_sale_price_above_regular_price_writes_nothing(): void {
		$payload                  = $this->payload( 'draft' );
		$payload['regular_price'] = '10.000000';
		$payload['sale_price']    = '10.000001';
		$before                   = $this->product_count();
		$response                 = $this->create_request( $payload );

		self::assertSame( 400, $response->get_status() );
		self::assertArrayHasKey( 'sale_price', $response->get_data()['data']['fields'] );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_duplicate_sku_returns_a_field_error_and_writes_nothing(): void {
		$existing = new \WC_Product_Simple();
		$existing->set_name( 'YPW existing SKU test' );
		$existing->set_status( 'draft' );
		$existing->set_regular_price( '10' );
		$existing->set_sku( 'YPW-DUPLICATE-' . wp_generate_password( 8, false ) );
		$this->product_ids[] = $existing->save();

		$payload        = $this->payload( 'draft' );
		$payload['sku'] = $existing->get_sku();
		$before         = $this->product_count();
		$response       = $this->create_request( $payload );
		$data           = $this->result_data( $response );

		self::assertSame( 422, $response->get_status() );
		self::assertSame( 'ypw_duplicate_sku', $data['errors'][0]['code'] );
		self::assertArrayHasKey( 'sku', $data['errors'][0]['fields'] );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_invalid_category_and_media_return_field_errors_without_writes(): void {
		$payload                 = $this->payload( 'draft' );
		$payload['category_ids'] = array( 999999999 );
		$payload['image_ids']    = array( 999999998 );
		$before                  = $this->product_count();
		$response                = $this->create_request( $payload );
		$data                    = $this->result_data( $response );

		self::assertSame( 422, $response->get_status() );
		self::assertArrayHasKey( 'category_ids', $data['errors'][0]['fields'] );
		self::assertArrayHasKey( 'image_ids', $data['errors'][0]['fields'] );
		self::assertSame( $before, $this->product_count() );
	}

	public function test_same_idempotency_key_replays_one_product_and_conflicting_reuse_is_rejected(): void {
		$key             = wp_generate_uuid4();
		$payload         = $this->payload( 'draft' );
		$first           = $this->create_request( $payload, $key );
		$replayed        = $this->create_request( $payload, $key );
		$changed         = $payload;
		$changed['name'] = 'YPW changed idempotency payload';
		$conflict        = $this->create_request( $changed, $key );

		$first_data    = $this->result_data( $first );
		$replayed_data = $this->result_data( $replayed );
		self::assertSame( 201, $first->get_status() );
		self::assertSame( 200, $replayed->get_status() );
		self::assertSame( $first_data['product']['id'], $replayed_data['product']['id'] );
		self::assertTrue( $replayed_data['replayed'] );
		self::assertSame( 409, $conflict->get_status() );
		self::assertSame( 'ypw_idempotency_conflict', $conflict->get_data()['code'] );
	}

	/**
	 * @param array<string, mixed> $payload Request payload.
	 */
	private function create_request( array $payload, ?string $key = null ): \WP_REST_Response {
		$request = new \WP_REST_Request( 'POST', '/yaxii-product-workspace/v1/products' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_header( 'idempotency-key', $key ?? wp_generate_uuid4() );
		$request->set_body( (string) wp_json_encode( $payload ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		if ( is_array( $data ) && isset( $data['data']['operation_id'] ) ) {
			$this->operation_ids[] = (string) $data['data']['operation_id'];
		}
		if ( is_array( $data ) && isset( $data['data']['product']['id'] ) ) {
			$this->product_ids[] = (int) $data['data']['product']['id'];
		}

		return $response;
	}

	/**
	 * @return array<string, mixed>
	 */
	private function payload( string $status ): array {
		return array(
			'name'               => 'YPW integration ' . wp_generate_password( 8, false ),
			'sku'                => 'YPW-' . wp_generate_password( 12, false ),
			'regular_price'      => '19.99',
			'sale_price'         => '14.99',
			'manage_stock'       => true,
			'stock_quantity'     => 7,
			'stock_status'       => 'instock',
			'status'             => $status,
			'catalog_visibility' => 'visible',
			'tax_status'         => 'taxable',
			'description'        => '<p>Long description</p>',
			'short_description'  => '<p>Short description</p>',
			'category_ids'       => array( $this->category_id ),
			'image_ids'          => array(),
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function result_data( \WP_REST_Response $response ): array {
		$data = $response->get_data();
		self::assertIsArray( $data );
		self::assertArrayHasKey( 'data', $data );
		return $data['data'];
	}

	private function product_count(): int {
		$counts = wp_count_posts( 'product' );
		return array_sum( array_map( 'intval', get_object_vars( $counts ) ) );
	}
}
