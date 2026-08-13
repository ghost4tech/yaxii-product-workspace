<?php
/**
 * Legacy operation queue compatibility integration test.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

/**
 * Protects existing operation history when its stored result predates Phase 3.
 */
final class LegacyOperationCompatibilityTest extends TestCase {
	private int $original_user_id;
	private int $administrator_id;
	private string $operation_id;

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
		$this->operation_id     = wp_generate_uuid4();
		wp_set_current_user( $this->administrator_id );
		SchemaManager::create()->maybe_upgrade();
		do_action( 'rest_api_init' );
	}

	protected function tearDown(): void {
		global $wpdb;
		$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $this->operation_id ), array( '%s' ) );
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_schema_upgrade_backfills_legacy_operation_search_and_status_fields(): void {
		$this->insert_legacy_operation();
		global $wpdb;
		update_option( 'ypw_operation_schema_version', '3', false );
		SchemaManager::create()->maybe_upgrade();
		$row = $wpdb->get_row(
			$wpdb->prepare(
				'SELECT product_name, product_sku, product_status FROM %i WHERE operation_id = %s',
				SchemaManager::create()->table_name(),
				$this->operation_id
			),
			ARRAY_A
		);
		self::assertIsArray( $row );
		self::assertSame( 'YPW legacy queue product', $row['product_name'] );
		self::assertSame( 'YPW-LEGACY-314', $row['product_sku'] );
		self::assertSame( 'publish', $row['product_status'] );

		$page = $this->data(
			$this->dispatch(
				array(
					'search'         => 'legacy queue',
					'state'          => 'succeeded',
					'product_status' => 'publish',
				)
			)
		);

		self::assertSame( 1, $page['total'] );
		self::assertSame( 314, $page['items'][0]['product']['id'] );
		self::assertSame( 'publish', $page['items'][0]['product']['status'] );
		self::assertSame( 1, $page['counts']['synced'] );
	}

	private function insert_legacy_operation(): void {
		$result = array(
			'operation_id' => $this->operation_id,
			'state'        => 'succeeded',
			'product'      => array(
				'id'     => 314,
				'name'   => 'YPW legacy queue product',
				'sku'    => 'YPW-LEGACY-314',
				'status' => 'publish',
			),
			'warnings'     => array(),
			'errors'       => array(),
			'replayed'     => false,
			'retry'        => array(
				'can_reconcile'    => false,
				'safe_to_resubmit' => false,
			),
			'http_status'  => 201,
		);
		global $wpdb;
		$inserted = $wpdb->insert(
			SchemaManager::create()->table_name(),
			array(
				'operation_id'     => $this->operation_id,
				'site_id'          => get_current_blog_id(),
				'user_id'          => $this->administrator_id,
				'operation_type'   => 'simple_product_create',
				'idempotency_hash' => hash( 'sha256', 'legacy-key-' . $this->operation_id ),
				'payload_hash'     => hash( 'sha256', 'legacy-payload-' . $this->operation_id ),
				'state'            => 'succeeded',
				'product_id'       => 314,
				'result_json'      => wp_json_encode( $result ),
				'created_at'       => '2026-08-13 13:03:32',
				'updated_at'       => '2026-08-13 13:03:33',
			),
			array( '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s' )
		);
		self::assertSame( 1, $inserted );
	}

	/** @param array<string, mixed> $parameters */
	private function dispatch( array $parameters ): \WP_REST_Response {
		$request = new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/operations' );
		$request->set_query_params( $parameters );
		return rest_get_server()->dispatch( $request );
	}

	/** @return array<string, mixed> */
	private function data( \WP_REST_Response $response ): array {
		self::assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		self::assertIsArray( $data );
		self::assertArrayHasKey( 'data', $data );
		return $data['data'];
	}
}
