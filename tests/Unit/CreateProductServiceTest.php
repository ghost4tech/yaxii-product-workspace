<?php
/**
 * Product creation service tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;
use Yaxii\ProductWorkspace\Tests\Support\FakeCapabilityPolicy;
use Yaxii\ProductWorkspace\Tests\Support\FakeOperationStore;
use Yaxii\ProductWorkspace\Tests\Support\FakeProductGateway;

/**
 * Covers application behavior independently from WordPress HTTP parsing.
 */
final class CreateProductServiceTest extends TestCase {
	private FakeCapabilityPolicy $capabilities;
	private FakeOperationStore $operations;
	private FakeProductGateway $products;
	private CreateProductService $service;

	protected function setUp(): void {
		$this->capabilities = new FakeCapabilityPolicy();
		$this->operations   = new FakeOperationStore();
		$this->products     = new FakeProductGateway();
		$this->service      = new CreateProductService( $this->capabilities, $this->operations, $this->products );
	}

	public function test_same_key_and_payload_replays_without_a_second_write(): void {
		$first  = $this->service->create( $this->command(), 'key-a', 1, 2 );
		$second = $this->service->create( $this->command(), 'key-a', 1, 2 );

		self::assertSame( 'succeeded', $first->state() );
		self::assertSame( $first->operation_id(), $second->operation_id() );
		self::assertTrue( $second->to_array()['replayed'] );
		self::assertSame( 1, $this->products->create_calls );
	}

	public function test_same_key_with_different_payload_conflicts(): void {
		$this->service->create( $this->command(), 'key-a', 1, 2 );

		try {
			$this->service->create( $this->command( 'Changed name' ), 'key-a', 1, 2 );
			self::fail( 'Expected an idempotency conflict.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_idempotency_conflict', $exception->api_code() );
			self::assertSame( 409, $exception->status() );
		}
		self::assertSame( 1, $this->products->create_calls );
	}

	public function test_publish_is_denied_before_reservation_without_capability(): void {
		$this->capabilities->publish = false;

		try {
			$this->service->create( $this->command( 'Product', 'publish' ), 'key-a', 1, 2 );
			self::fail( 'Expected publishing to be denied.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_publish_forbidden', $exception->api_code() );
		}
		self::assertSame( 0, $this->operations->reserve_calls );
		self::assertSame( 0, $this->products->create_calls );
	}

	public function test_reference_validation_failure_is_durable_and_writes_no_product(): void {
		$this->products->validation_errors = array( 'category_ids' => array( 'Invalid category.' ) );
		$result                            = $this->service->create( $this->command(), 'key-a', 1, 2 );

		self::assertSame( 'failed', $result->state() );
		self::assertSame( 422, $result->http_status() );
		self::assertSame( 0, $this->products->create_calls );
	}

	public function test_write_failure_never_returns_success(): void {
		$this->products->fail_write = true;
		$result                     = $this->service->create( $this->command(), 'key-a', 1, 2 );

		self::assertSame( 'failed', $result->state() );
		self::assertSame( 500, $result->http_status() );
		self::assertNull( $result->product() );
	}

	public function test_uncertain_result_reconciles_from_the_woo_operation_marker(): void {
		$this->operations->fail_complete = true;
		$uncertain                       = $this->service->create( $this->command(), 'key-a', 1, 2 );
		$record                          = $this->operations->find_for_user( $uncertain->operation_id(), 1, 2 );

		self::assertSame( 'uncertain', $uncertain->state() );
		self::assertNotNull( $record );

		$this->operations->fail_complete = false;
		$reconciled                      = $this->service->reconcile( $record );
		self::assertSame( 'succeeded', $reconciled->state() );
		self::assertSame( 123, $reconciled->product()['id'] );
	}

	public function test_woocommerce_unavailable_fails_before_reservation(): void {
		$this->products->available = false;

		try {
			$this->service->create( $this->command(), 'key-a', 1, 2 );
			self::fail( 'Expected WooCommerce to be unavailable.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_woocommerce_unavailable', $exception->api_code() );
		}
		self::assertSame( 0, $this->operations->reserve_calls );
		self::assertSame( 0, $this->products->create_calls );
	}

	private function command( string $name = 'Product', string $status = 'draft' ): CreateProductCommand {
		return new CreateProductCommand(
			$name,
			'SKU-1',
			'10.00',
			null,
			false,
			null,
			'instock',
			$status,
			'visible',
			'taxable',
			'',
			'',
			array( 1 ),
			array()
		);
	}
}
