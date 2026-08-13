<?php
/**
 * Recent-operation and preference REST integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Operations\OperationRequest;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\OperationFailure;
use Yaxii\ProductWorkspace\Application\Products\OperationResult;
use Yaxii\ProductWorkspace\Application\Products\ProductFieldParser;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\WpdbOperationStore;

/**
 * Exercises server-authoritative queue and user-meta preference behavior.
 */
final class OperationWorkflowTest extends TestCase {
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
		$term = wp_insert_term( 'YPW operation ' . wp_generate_password( 7, false ), 'product_cat' );
		self::assertIsArray( $term );
		$this->category_id = (int) $term['term_id'];
	}

	protected function tearDown(): void {
		foreach ( array_unique( $this->product_ids ) as $product_id ) {
			wp_delete_post( $product_id, true );
		}
		wp_delete_term( $this->category_id, 'product_cat' );
		delete_user_meta( $this->administrator_id, 'ypw_workspace_preferences_v1' );
		global $wpdb;
		foreach ( array_unique( $this->operation_ids ) as $operation_id ) {
			$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_operation_list_is_bounded_searchable_and_dismissal_does_not_trash_product(): void {
		$first  = $this->create_product( 'YPW queue alpha' );
		$second = $this->create_product( 'YPW queue beta' );
		$page   = $this->data(
			$this->dispatch(
				'GET',
				'/operations',
				array(
					'page'     => 1,
					'per_page' => 1,
				)
			)
		);

		self::assertCount( 1, $page['items'] );
		self::assertTrue( $page['has_more'] );
		self::assertGreaterThanOrEqual( 2, $page['total'] );

		$search = $this->data(
			$this->dispatch(
				'GET',
				'/operations',
				array(
					'search'   => 'queue alpha',
					'per_page' => 10,
				)
			)
		);
		self::assertSame( $first['operation_id'], $search['items'][0]['operation_id'] );
		self::assertSame( $first['product']['id'], $search['items'][0]['product']['id'] );
		self::assertSame( 'YPW queue alpha', $search['items'][0]['input']['name'] );
		self::assertFalse( $search['items'][0]['retry']['can_retry'] );
		self::assertSame( 1, $search['counts']['all'] );
		self::assertSame( 1, $search['counts']['draft'] );

		$drafts = $this->data(
			$this->dispatch(
				'GET',
				'/operations',
				array(
					'search'         => 'YPW queue',
					'state'          => 'succeeded',
					'product_status' => 'unpublished',
				)
			)
		);
		self::assertSame( 2, $drafts['total'] );
		self::assertSame( 2, $drafts['counts']['draft'] );

		$dismissed = $this->dispatch( 'DELETE', '/operations/' . $first['operation_id'] );
		self::assertSame( 200, $dismissed->get_status() );
		self::assertTrue( $this->data( $dismissed )['dismissed'] );
		self::assertNotSame( 'trash', get_post_status( $first['product']['id'] ) );
		$after = $this->data( $this->dispatch( 'GET', '/operations', array( 'search' => 'queue alpha' ) ) );
		self::assertSame( 0, $after['total'] );
		self::assertNotSame( $first['operation_id'], $second['operation_id'] );
	}

	public function test_manual_retry_uses_the_stored_request_and_cannot_duplicate_after_success(): void {
		$operation_id = $this->failed_write_operation();
		$before       = $this->product_count();
		$response     = $this->dispatch( 'POST', '/operations/' . $operation_id . '/retry' );
		$result       = $this->data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertSame( $operation_id, $result['operation_id'] );
		self::assertSame( 'succeeded', $result['state'] );
		self::assertFalse( $result['retry']['can_retry'] );
		self::assertSame( $before + 1, $this->product_count() );
		$this->product_ids[] = (int) $result['product']['id'];

		$again = $this->dispatch( 'POST', '/operations/' . $operation_id . '/retry' );
		self::assertSame( 409, $again->get_status() );
		self::assertSame( 'ypw_retry_not_allowed', $again->get_data()['code'] );
		self::assertSame( $before + 1, $this->product_count() );
	}

	public function test_preferences_are_stored_for_the_current_wordpress_user(): void {
		$defaults = $this->data( $this->dispatch( 'GET', '/preferences' ) );
		self::assertTrue( $defaults['auto_focus_name'] );

		$response = $this->dispatch(
			'PUT',
			'/preferences',
			array(
				'auto_focus_name'        => false,
				'repeat_fields'          => array( 'category_ids', 'stock_status' ),
				'default_product_status' => 'draft',
				'queue_rows_per_page'    => 50,
			)
		);
		$updated  = $this->data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertFalse( $updated['auto_focus_name'] );
		self::assertSame( array( 'category_ids', 'stock_status' ), $updated['repeat_fields'] );
		self::assertSame( 'draft', $this->data( $this->dispatch( 'GET', '/preferences' ) )['default_product_status'] );
	}

	public function test_queue_and_preferences_require_authentication(): void {
		wp_set_current_user( 0 );
		self::assertSame( 401, $this->dispatch( 'GET', '/operations' )->get_status() );
		self::assertSame( 401, $this->dispatch( 'GET', '/preferences' )->get_status() );
	}

	public function test_processing_operation_cannot_be_dismissed(): void {
		$operation_id = $this->processing_operation( 'YPW active operation' );
		$response     = $this->dispatch( 'DELETE', '/operations/' . $operation_id );

		self::assertSame( 409, $response->get_status() );
		self::assertSame( 'ypw_operation_not_dismissible', $response->get_data()['code'] );
		$record = $this->data( $this->dispatch( 'GET', '/operations/' . $operation_id ) );
		self::assertSame( 'processing', $record['state'] );
	}

	/** @return array<string, mixed> */
	private function create_product( string $name ): array {
		$response = $this->dispatch( 'POST', '/products', $this->payload( $name ), wp_generate_uuid4() );
		$data     = $this->data( $response );
		self::assertSame( 201, $response->get_status(), (string) wp_json_encode( $response->get_data() ) );
		$this->operation_ids[] = (string) $data['operation_id'];
		$this->product_ids[]   = (int) $data['product']['id'];
		return $data;
	}

	private function failed_write_operation(): string {
		$operation_id = $this->processing_operation( 'YPW retry product' );
		global $wpdb;
		$store   = new WpdbOperationStore( $wpdb, SchemaManager::create()->table_name() );
		$failure = OperationResult::failed(
			$operation_id,
			new OperationFailure( 'ypw_product_write_failed', 'WooCommerce could not save the product.', array(), 500 )
		);
		$store->complete( $operation_id, 'failed', null, $failure->to_array() );
		return $operation_id;
	}

	private function processing_operation( string $name ): string {
		$command      = ( new CreateProductRequestFactory( new ProductFieldParser() ) )->from_array( $this->payload( $name ) );
		$payload_json = wp_json_encode( $command->to_array() );
		self::assertIsString( $payload_json );
		global $wpdb;
		$store                 = new WpdbOperationStore( $wpdb, SchemaManager::create()->table_name() );
		$reservation           = $store->reserve(
			new OperationRequest(
				array(
					'site_id'         => get_current_blog_id(),
					'user_id'         => get_current_user_id(),
					'operation_type'  => 'simple_product_create',
					'idempotency_key' => wp_generate_uuid4(),
					'payload_hash'    => hash( 'sha256', $payload_json ),
					'payload_json'    => $payload_json,
					'product_name'    => $command->name(),
					'product_sku'     => $command->sku(),
				)
			)
		);
		$operation_id          = $reservation->record()->operation_id();
		$this->operation_ids[] = $operation_id;
		return $operation_id;
	}

	/** @return array<string, mixed> */
	private function payload( string $name ): array {
		return array(
			'name'               => $name,
			'sku'                => 'YPW-OP-' . wp_generate_password( 9, false ),
			'regular_price'      => '15.00',
			'sale_price'         => null,
			'manage_stock'       => false,
			'stock_quantity'     => null,
			'stock_status'       => 'instock',
			'status'             => 'draft',
			'catalog_visibility' => 'visible',
			'tax_status'         => 'taxable',
			'description'        => '',
			'short_description'  => '',
			'category_ids'       => array( $this->category_id ),
			'image_ids'          => array(),
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
