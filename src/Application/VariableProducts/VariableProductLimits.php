<?php
/**
 * Free variable-product limits.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Keeps the synchronous Free boundary explicit and shared by validators.
 */
final class VariableProductLimits {
	public const MAX_ATTRIBUTES   = 5;
	public const MAX_OPTIONS      = 20;
	public const MAX_COMBINATIONS = 50;
}
