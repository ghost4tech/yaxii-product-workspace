<?php
/**
 * Global WooCommerce attribute lookup boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

interface AttributeCatalog {
	/** @return array<int, array<string, mixed>> */
	public function attributes(): array;

	/** @return array<int, array<string, mixed>> */
	public function terms( int $attribute_id, string $search, int $limit ): array;
}
