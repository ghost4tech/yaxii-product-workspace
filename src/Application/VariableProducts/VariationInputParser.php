<?php
/**
 * Variation combination input parsing.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\ProductFieldParser;
use Yaxii\ProductWorkspace\Application\Products\ValidationErrors;

/**
 * Validates the identity and commercial fields of one concrete variation.
 */
final class VariationInputParser {
	private ProductFieldParser $fields;

	public function __construct( ?ProductFieldParser $fields = null ) {
		$this->fields = $fields ?? new ProductFieldParser();
	}

	/**
	 * @param array<string, mixed> $combination Untrusted combination.
	 * @return array{client_id: string, variation_id: int, fields: array<string, bool|int|string|null>}
	 */
	public function parse( array $combination, int $index ): array {
		$this->reject_unknown_fields( $combination, $index );
		$client_id = isset( $combination['client_id'] ) && is_string( $combination['client_id'] ) ? strtolower( $combination['client_id'] ) : '';
		if ( ! $this->is_uuid( $client_id ) ) {
			$this->invalid( "combinations.$index.client_id", __( 'Each combination requires a unique client UUID.', 'yaxii-product-workspace' ) );
		}
		return array(
			'client_id'    => $client_id,
			'variation_id' => $this->non_negative_int( $combination['variation_id'] ?? 0, "combinations.$index.variation_id" ),
			'fields'       => $this->commercial_fields( $combination, $index ),
		);
	}

	/**
	 * @param array<string, mixed> $combination Untrusted combination.
	 * @return array<string, bool|int|string|null>
	 */
	private function commercial_fields( array $combination, int $index ): array {
		$enabled      = $this->boolean_field( $combination, 'enabled', $index );
		$manage_stock = $this->boolean_field( $combination, 'manage_stock', $index );
		$regular      = $this->string_field( $combination, 'regular_price', $index );
		$sale         = $combination['sale_price'] ?? null;
		$sku          = $this->string_field( $combination, 'sku', $index );
		if ( null !== $sale && ! is_string( $sale ) ) {
			$this->invalid( "combinations.$index.sale_price", __( 'Expected a price or null.', 'yaxii-product-workspace' ) );
		}
		if ( 100 < mb_strlen( $sku ) ) {
			$this->invalid( "combinations.$index.sku", __( 'Variation SKU must be 100 characters or fewer.', 'yaxii-product-workspace' ) );
		}
		$regular = $this->price( $regular, "combinations.$index.regular_price", $enabled );
		$sale    = null === $sale ? null : $this->price( $sale, "combinations.$index.sale_price", false );
		if ( null !== $sale && '' !== $sale && '' !== $regular && $this->fields->decimal_is_greater( $sale, $regular ) ) {
			$this->invalid( "combinations.$index.sale_price", __( 'Sale price cannot exceed the regular price.', 'yaxii-product-workspace' ) );
		}
		$stock_quantity = $this->stock_quantity( $combination, $index, $manage_stock );
		return array(
			'enabled'        => $enabled,
			'regular_price'  => $regular,
			'sale_price'     => $sale,
			'sku'            => sanitize_text_field( $sku ),
			'manage_stock'   => $manage_stock,
			'stock_quantity' => $stock_quantity,
			'stock_status'   => $this->stock_status( $combination, $index ),
			'image_id'       => $this->non_negative_int( $combination['image_id'] ?? 0, "combinations.$index.image_id" ),
		);
	}

	private function price( string $value, string $field, bool $required ): string {
		$errors     = new ValidationErrors();
		$field_name = substr( $field, strrpos( $field, '.' ) + 1 );
		$parsed     = $this->fields->decimal( array( $field_name => trim( $value ) ), $field_name, $required, $errors );
		if ( $errors->has_errors() ) {
			$message = $errors->all()[ $field_name ][0] ?? __( 'Enter a valid non-negative decimal value.', 'yaxii-product-workspace' );
			$this->invalid( $field, $message );
		}
		return $parsed ?? '';
	}

	/** @param array<string, mixed> $combination */
	private function stock_quantity( array $combination, int $index, bool $manage_stock ): ?int {
		$quantity = $combination['stock_quantity'] ?? null;
		if ( null !== $quantity && ( ! is_int( $quantity ) || 0 > $quantity ) ) {
			$this->invalid( "combinations.$index.stock_quantity", __( 'Stock quantity must be a non-negative whole number.', 'yaxii-product-workspace' ) );
		}
		if ( $manage_stock && null === $quantity ) {
			$this->invalid( "combinations.$index.stock_quantity", __( 'Stock quantity is required when stock management is enabled.', 'yaxii-product-workspace' ) );
		}
		return $quantity;
	}

	/** @param array<string, mixed> $combination */
	private function stock_status( array $combination, int $index ): string {
		$stock_status = $combination['stock_status'] ?? 'instock';
		if ( ! is_string( $stock_status ) || ! in_array( $stock_status, array( 'instock', 'outofstock', 'onbackorder' ), true ) ) {
			$this->invalid( "combinations.$index.stock_status", __( 'Choose a supported stock status.', 'yaxii-product-workspace' ) );
		}
		return $stock_status;
	}

	/** @param array<string, mixed> $combination */
	private function reject_unknown_fields( array $combination, int $index ): void {
		$allowed = array(
			'client_id',
			'variation_id',
			'selections',
			'enabled',
			'regular_price',
			'sale_price',
			'sku',
			'manage_stock',
			'stock_quantity',
			'stock_status',
			'image_id',
		);
		if ( array() !== array_diff( array_keys( $combination ), $allowed ) ) {
			$this->invalid( "combinations.$index", __( 'The combination contains unsupported fields.', 'yaxii-product-workspace' ) );
		}
	}

	/** @param array<string, mixed> $combination */
	private function boolean_field( array $combination, string $field, int $index ): bool {
		if ( ! isset( $combination[ $field ] ) || ! is_bool( $combination[ $field ] ) ) {
			$this->invalid( "combinations.$index.$field", __( 'Expected true or false.', 'yaxii-product-workspace' ) );
		}
		return $combination[ $field ];
	}

	/** @param array<string, mixed> $combination */
	private function string_field( array $combination, string $field, int $index ): string {
		if ( ! isset( $combination[ $field ] ) || ! is_string( $combination[ $field ] ) ) {
			$this->invalid( "combinations.$index.$field", __( 'Expected a text value.', 'yaxii-product-workspace' ) );
		}
		return $combination[ $field ];
	}

	/** @param mixed $identifier Untrusted identifier. */
	private function non_negative_int( $identifier, string $field ): int {
		if ( ! is_int( $identifier ) || 0 > $identifier ) {
			$this->invalid( $field, __( 'Expected a non-negative numeric ID.', 'yaxii-product-workspace' ) );
		}
		return $identifier;
	}

	private function is_uuid( string $uuid ): bool {
		return 1 === preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $uuid );
	}

	private function invalid( string $field, string $message ): void {
		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns escaping.
		throw new ApiException( 'ypw_invalid_variation_plan', __( 'Review the variable-product combinations.', 'yaxii-product-workspace' ), 400, array( $field => array( $message ) ) );
	}
}
