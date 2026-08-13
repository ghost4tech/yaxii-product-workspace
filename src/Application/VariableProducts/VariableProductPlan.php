<?php
/**
 * Validated variable-product plan.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Holds a complete bounded attribute and combination plan.
 */
final class VariableProductPlan {
	/** @var array<VariableAttribute> */
	private array $attributes;
	/** @var array<VariationCombination> */
	private array $combinations;
	private int $projected_count;

	/**
	 * @param array<VariableAttribute>     $attributes Validated attributes.
	 * @param array<VariationCombination> $combinations Concrete combinations.
	 */
	public function __construct( array $attributes, array $combinations, int $projected_count ) {
		$this->attributes      = $attributes;
		$this->combinations    = $combinations;
		$this->projected_count = $projected_count;
	}

	/** @return array<VariableAttribute> */
	public function attributes(): array {
		return $this->attributes;
	}

	/** @return array<VariationCombination> */
	public function combinations(): array {
		return $this->combinations;
	}

	public function projected_count(): int {
		return $this->projected_count;
	}

	/** @return array<string, mixed> */
	public function to_array(): array {
		return array(
			'attributes'      => array_map( static fn ( VariableAttribute $attribute ): array => $attribute->to_array(), $this->attributes ),
			'combinations'    => array_map( static fn ( VariationCombination $combination ): array => $combination->to_array(), $this->combinations ),
			'projected_count' => $this->projected_count,
		);
	}
}
