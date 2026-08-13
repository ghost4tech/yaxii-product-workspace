<?php
/**
 * Simple-product management service tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;
use Yaxii\ProductWorkspace\Application\Products\ProductManagementService;
use Yaxii\ProductWorkspace\Tests\Support\FakeCapabilityPolicy;
use Yaxii\ProductWorkspace\Tests\Support\FakeProductGateway;

/**
 * Covers conflict and object-access decisions without WordPress HTTP parsing.
 */
final class ProductManagementServiceTest extends TestCase {
	private FakeCapabilityPolicy $capabilities;
	private FakeProductGateway $products;
	private ProductManagementService $service;

	protected function setUp(): void {
		$this->capabilities = new FakeCapabilityPolicy();
		$this->products     = new FakeProductGateway();
		$this->service      = new ProductManagementService( $this->capabilities, $this->products );
		$this->products->create( $this->command(), 'operation-a' );
	}

	public function test_matching_version_updates_the_product(): void {
		$product = $this->service->update( 123, str_repeat( 'a', 64 ), $this->command( 'Updated' ) );

		self::assertSame( 'Updated', $product['name'] );
		self::assertSame( str_repeat( 'b', 64 ), $product['version'] );
	}

	public function test_stale_version_rejects_update_before_write(): void {
		$this->expectException( ApiException::class );
		$this->expectExceptionMessage( 'changed after it was opened' );

		$this->service->update( 123, str_repeat( 'f', 64 ), $this->command( 'Stale' ) );
	}

	public function test_duplicate_prefill_removes_unsafe_identity_fields(): void {
		$prefill = $this->service->duplicate_prefill( 123 );

		self::assertSame( 'Product (Copy)', $prefill['name'] );
		self::assertSame( '', $prefill['sku'] );
		self::assertSame( 'draft', $prefill['status'] );
		self::assertArrayNotHasKey( 'id', $prefill );
	}

	public function test_trash_requires_object_delete_capability(): void {
		$this->capabilities->delete = false;
		$this->expectApiCode( 'ypw_forbidden', fn () => $this->service->trash( 123, str_repeat( 'a', 64 ) ) );
	}

	public function test_update_requires_object_edit_capability(): void {
		$this->capabilities->edit = false;
		$this->expectApiCode( 'ypw_forbidden', fn () => $this->service->update( 123, str_repeat( 'a', 64 ), $this->command() ) );
	}

	public function test_update_requires_publish_capability(): void {
		$this->capabilities->publish = false;
		$this->expectApiCode( 'ypw_publish_forbidden', fn () => $this->service->update( 123, str_repeat( 'a', 64 ), $this->command( 'Product', 'publish' ) ) );
	}

	public function test_update_requires_term_assignment_capability(): void {
		$this->capabilities->assign_terms = false;
		$this->expectApiCode( 'ypw_term_assignment_forbidden', fn () => $this->service->update( 123, str_repeat( 'a', 64 ), $this->command() ) );
	}

	public function test_update_requires_access_to_selected_media(): void {
		$this->capabilities->use_media = false;
		$this->expectApiCode( 'ypw_media_forbidden', fn () => $this->service->update( 123, str_repeat( 'a', 64 ), $this->command( 'Product', 'draft', array( 44 ) ) ) );
	}

	/** @param array<int> $image_ids */
	private function command( string $name = 'Product', string $status = 'draft', array $image_ids = array() ): CreateProductCommand {
		return new CreateProductCommand(
			array(
				'name'               => $name,
				'slug'               => '',
				'description'        => '',
				'short_description'  => '',
				'status'             => $status,
				'catalog_visibility' => 'visible',
				'regular_price'      => '10.00',
				'sale_price'         => null,
				'date_on_sale_from'  => null,
				'date_on_sale_to'    => null,
				'sku'                => 'SKU-1',
				'manage_stock'       => false,
				'stock_quantity'     => null,
				'stock_status'       => 'instock',
				'backorders'         => 'no',
				'sold_individually'  => false,
				'weight'             => '',
				'length'             => '',
				'width'              => '',
				'height'             => '',
				'shipping_class_id'  => 0,
				'tax_status'         => 'taxable',
				'tax_class'          => '',
				'category_ids'       => array( 1 ),
				'tag_ids'            => array(),
				'image_ids'          => $image_ids,
			)
		);
	}

	/** @param callable(): void $operation */
	private function expectApiCode( string $code, callable $operation ): void {
		try {
			$operation();
			self::fail( 'Expected the product operation to be denied.' );
		} catch ( ApiException $exception ) {
			self::assertSame( $code, $exception->api_code() );
		}
	}
}
