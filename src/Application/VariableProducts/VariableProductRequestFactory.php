<?php
/**
 * Variable-product request composition.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;

/**
 * Parses the parent and plan through their existing allowlisted validators.
 */
final class VariableProductRequestFactory {
	private CreateProductRequestFactory $products;
	private VariableProductPlanFactory $plans;

	public function __construct( CreateProductRequestFactory $products, VariableProductPlanFactory $plans ) {
		$this->products = $products;
		$this->plans    = $plans;
	}

	/** @param array<string, mixed> $payload Untrusted request. */
	public function from_array( array $payload ): VariableProductCommand {
		if ( array() !== array_diff( array_keys( $payload ), array( 'product', 'attributes', 'combinations' ) )
			|| ! isset( $payload['product'], $payload['attributes'], $payload['combinations'] )
			|| ! is_array( $payload['product'] ) || ! is_array( $payload['attributes'] ) || ! is_array( $payload['combinations'] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns escaping.
			throw new ApiException( 'ypw_invalid_variable_product', __( 'Send one product, attribute list, and combination list.', 'yaxii-product-workspace' ), 400 );
		}
		$product_payload                      = $payload['product'];
		$product_payload['regular_price']     = '0';
		$product_payload['sale_price']        = null;
		$product_payload['date_on_sale_from'] = null;
		$product_payload['date_on_sale_to']   = null;
		return new VariableProductCommand(
			$this->products->from_array( $product_payload ),
			$this->plans->from_array(
				array(
					'attributes'   => $payload['attributes'],
					'combinations' => $payload['combinations'],
				)
			)
		);
	}
}
