<?php
/**
 * Complete variable-product command.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Products\CreateProductCommand;

/**
 * Composes reusable parent fields with a concrete variation plan.
 */
final class VariableProductCommand {
	private CreateProductCommand $product;
	private VariableProductPlan $plan;

	public function __construct( CreateProductCommand $product, VariableProductPlan $plan ) {
		$this->product = $product;
		$this->plan    = $plan;
	}

	public function product(): CreateProductCommand {
		return $this->product;
	}

	public function plan(): VariableProductPlan {
		return $this->plan;
	}

	/** @return array<string, mixed> */
	public function to_array(): array {
		return array(
			'product'      => $this->product->to_array(),
			'attributes'   => $this->plan->to_array()['attributes'],
			'combinations' => $this->plan->to_array()['combinations'],
		);
	}
}
