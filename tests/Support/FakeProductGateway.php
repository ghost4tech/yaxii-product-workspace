<?php
/**
 * Product gateway test double.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Support;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;
use Yaxii\ProductWorkspace\Application\Products\ProductGateway;
use Yaxii\ProductWorkspace\Application\Products\ProductQuery;

/**
 * Configurable product writer for application-service tests.
 */
final class FakeProductGateway implements ProductGateway {
	public bool $available   = true;
	public bool $fail_write  = false;
	public int $create_calls = 0;

	/** @var array<string, array<string>> */
	public array $validation_errors = array();

	/** @var array<string, array<string, mixed>> */
	private array $products_by_operation = array();

	public function is_available(): bool {
		return $this->available;
	}

	public function validate( CreateProductCommand $command, int $product_id = 0 ): array {
		unset( $command, $product_id );
		return $this->validation_errors;
	}

	public function create( CreateProductCommand $command, string $operation_id ): array {
		++$this->create_calls;
		if ( $this->fail_write ) {
			throw new RuntimeException( 'Simulated WooCommerce write failure.' );
		}

		$product                                      = array(
			'id'            => 123,
			'name'          => $command->name(),
			'sku'           => $command->sku(),
			'status'        => $command->status(),
			'regular_price' => $command->regular_price(),
		);
		$this->products_by_operation[ $operation_id ] = $product;
		return $product;
	}

	public function find_by_operation( string $operation_id ): ?array {
		return $this->products_by_operation[ $operation_id ] ?? null;
	}

	public function get( int $product_id ): ?array {
		foreach ( $this->products_by_operation as $product ) {
			if ( $product_id === (int) $product['id'] ) {
				return $product + array( 'version' => str_repeat( 'a', 64 ) );
			}
		}
		return null;
	}

	public function query( ProductQuery $query ): array {
		unset( $query );
		return array(
			'items'    => array(),
			'page'     => 1,
			'per_page' => 20,
			'has_more' => false,
			'total'    => 0,
		);
	}

	public function update( int $product_id, CreateProductCommand $command ): array {
		return array(
			'id'      => $product_id,
			'name'    => $command->name(),
			'version' => str_repeat( 'b', 64 ),
		);
	}

	public function trash( int $product_id ): array {
		return array(
			'id'     => $product_id,
			'status' => 'trash',
		);
	}

	public function duplicate_prefill( int $product_id ): ?array {
		$product = $this->get( $product_id );
		if ( null === $product ) {
			return null;
		}
		return array(
			'name'   => $product['name'] . ' (Copy)',
			'sku'    => '',
			'status' => 'draft',
		);
	}
}
