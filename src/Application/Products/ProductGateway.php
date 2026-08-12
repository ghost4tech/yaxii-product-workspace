<?php
/**
 * WooCommerce product persistence boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Defines only the WooCommerce behavior required by the Phase 2 slice.
 */
interface ProductGateway {
	public function is_available(): bool;

	/**
	 * @return array<string, array<string>> Field-addressable validation errors.
	 */
	public function validate( CreateProductCommand $command ): array;

	/**
	 * @return array<string, mixed> Canonical product summary.
	 */
	public function create( CreateProductCommand $command, string $operation_id ): array;

	/**
	 * @return array<string, mixed>|null Canonical product summary when reconciled.
	 */
	public function find_by_operation( string $operation_id ): ?array;
}
