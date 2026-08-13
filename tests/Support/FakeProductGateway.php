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

	public function validate( CreateProductCommand $command ): array {
		unset( $command );
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
}
