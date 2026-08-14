<?php
/**
 * Variable-product multi-object write result.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Keeps exact per-combination outcomes beside the reloaded parent resource.
 */
final class VariableProductWriteResult {
	/** @var array<string, mixed> */
	private array $product;
	/** @var array<int, array<string, mixed>> */
	private array $combination_results;

	/** @param array<string, mixed> $product Parent resource.
	 * @param array<int, array<string, mixed>> $combination_results Per-combination outcomes. */
	public function __construct( array $product, array $combination_results ) {
		$this->product             = $product;
		$this->combination_results = $combination_results;
	}

	/** @return array<string, mixed> */
	public function product(): array {
		return $this->product;
	}

	/** @return array<int, array<string, mixed>> */
	public function combination_results(): array {
		return $this->combination_results;
	}

	public function is_partial(): bool {
		return array() !== array_filter( $this->combination_results, static fn ( array $result ): bool => 'failed' === ( $result['state'] ?? '' ) );
	}
}
