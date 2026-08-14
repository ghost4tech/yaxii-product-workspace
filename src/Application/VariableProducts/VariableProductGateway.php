<?php
/**
 * Variable-product WooCommerce persistence boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Defines the cohesive parent-plus-variations operations required by Free Phase 4.
 */
interface VariableProductGateway {
	public function is_available(): bool;

	/** @return array<string, array<string>> */
	public function validate( VariableProductCommand $command, int $product_id = 0 ): array;

	public function create( VariableProductCommand $command, string $operation_id ): VariableProductWriteResult;

	public function reconcile( VariableProductCommand $command, string $operation_id ): VariableProductWriteResult;

	public function update( int $product_id, VariableProductCommand $command ): VariableProductWriteResult;

	/** @return array<string, mixed>|null */
	public function get( int $product_id ): ?array;

	/** @return array<string, mixed>|null */
	public function find_by_operation( string $operation_id ): ?array;
}
