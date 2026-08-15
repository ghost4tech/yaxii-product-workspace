<?php
/**
 * Operation pulse REST integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use DateTimeImmutable;
use DateTimeZone;
use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

final class OperationSummaryTest extends TestCase {
	private int $original_user_id;
	private int $administrator_id = 0;
	private int $subscriber_id    = 0;

	/** @var array<int, string> */
	private array $operation_ids = array();

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		$administrator          = wp_insert_user(
			array(
				'user_login' => 'ypw_pulse_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => wp_generate_password(),
				'role'       => 'administrator',
			)
		);
		self::assertIsInt( $administrator );
		$this->administrator_id = $administrator;
		wp_set_current_user( $this->administrator_id );
		SchemaManager::create()->maybe_upgrade();
		do_action( 'rest_api_init' );
	}

	protected function tearDown(): void {
		global $wpdb;
		foreach ( $this->operation_ids as $operation_id ) {
			$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		if ( 0 < $this->subscriber_id ) {
			wp_delete_user( $this->subscriber_id );
		}
		if ( 0 < $this->administrator_id ) {
			wp_delete_user( $this->administrator_id );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_summary_uses_real_outcomes_and_adjacent_rolling_windows(): void {
		$current_time   = new DateTimeImmutable( current_time( 'mysql', true ), new DateTimeZone( 'UTC' ) );
		$current_stamp  = $current_time->modify( '-1 hour' )->format( 'Y-m-d H:i:s' );
		$previous_stamp = $current_time->modify( '-8 days' )->format( 'Y-m-d H:i:s' );

		$this->insert_rows(
			array(
				array(
					'state'      => 'succeeded',
					'status'     => 'publish',
					'updated_at' => $current_stamp,
				),
				array(
					'state'      => 'succeeded',
					'status'     => 'draft',
					'updated_at' => $current_stamp,
					'dismissed'  => true,
				),
				array(
					'state'      => 'failed',
					'updated_at' => $current_stamp,
				),
				array(
					'state'      => 'partial',
					'updated_at' => $current_stamp,
				),
				array(
					'state'      => 'uncertain',
					'updated_at' => $current_stamp,
				),
				array(
					'state'      => 'processing',
					'updated_at' => $current_stamp,
				),
				array(
					'state'      => 'failed',
					'updated_at' => $current_stamp,
					'dismissed'  => true,
				),
				array(
					'state'      => 'succeeded',
					'status'     => 'publish',
					'updated_at' => $previous_stamp,
				),
				array(
					'state'      => 'failed',
					'updated_at' => $previous_stamp,
				),
			)
		);

		$response = $this->dispatch();
		$summary  = $this->data( $response );

		self::assertSame( 200, $response->get_status() );
		self::assertSame(
			array(
				'operations'      => 7,
				'published'       => 1,
				'succeeded'       => 2,
				'eligible'        => 5,
				'needs_attention' => 3,
			),
			$summary['current']
		);
		self::assertSame(
			array(
				'operations'      => 2,
				'published'       => 1,
				'succeeded'       => 1,
				'eligible'        => 2,
				'needs_attention' => 1,
			),
			$summary['previous']
		);
		self::assertCount( 7, $summary['buckets'] );
		self::assertSame( 7, array_sum( array_column( $summary['buckets'], 'operations' ) ) );
		self::assertSame( 24, $summary['window']['bucket_hours'] );
	}

	public function test_summary_requires_authentication_and_product_capability(): void {
		wp_set_current_user( 0 );
		self::assertSame( 401, $this->dispatch()->get_status() );

		$subscriber = wp_create_user( 'ypw_pulse_' . wp_generate_password( 8, false ), wp_generate_password() );
		self::assertIsInt( $subscriber );
		$this->subscriber_id = $subscriber;
		self::assertGreaterThan( 0, $this->subscriber_id );
		wp_set_current_user( $this->subscriber_id );
		self::assertSame( 403, $this->dispatch()->get_status() );
	}

	/** @param array<int, array<string, bool|string>> $rows */
	private function insert_rows( array $rows ): void {
		foreach ( $rows as $row ) {
			$this->insert_row( $row );
		}
	}

	/** @param array<string, bool|string> $row */
	private function insert_row( array $row ): void {
		global $wpdb;
		$operation_id          = wp_generate_uuid4();
		$this->operation_ids[] = $operation_id;
		$inserted              = $wpdb->insert(
			SchemaManager::create()->table_name(),
			array(
				'operation_id'     => $operation_id,
				'site_id'          => get_current_blog_id(),
				'user_id'          => $this->administrator_id,
				'operation_type'   => 'simple_product_create',
				'idempotency_hash' => hash( 'sha256', 'key-' . $operation_id ),
				'payload_hash'     => hash( 'sha256', 'payload-' . $operation_id ),
				'state'            => (string) $row['state'],
				'product_status'   => (string) ( $row['status'] ?? '' ),
				'dismissed_at'     => ! empty( $row['dismissed'] ) ? (string) $row['updated_at'] : null,
				'created_at'       => (string) $row['updated_at'],
				'updated_at'       => (string) $row['updated_at'],
			)
		);
		self::assertSame( 1, $inserted );
	}

	private function dispatch(): \WP_REST_Response {
		$request = new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/operations/summary' );
		return rest_get_server()->dispatch( $request );
	}

	/** @return array<string, mixed> */
	private function data( \WP_REST_Response $response ): array {
		$payload = $response->get_data();
		self::assertIsArray( $payload );
		self::assertArrayHasKey( 'data', $payload );
		return $payload['data'];
	}
}
