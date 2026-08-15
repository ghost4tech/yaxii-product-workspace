<?php
/**
 * Simple-product scalar and reference parsing.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

defined( 'ABSPATH' ) || exit;

/**
 * Normalizes individual untrusted field values and records addressable errors.
 */
final class ProductFieldParser {
	/** @param array<string, mixed> $payload Request data. */
	public function text( array $payload, string $key ): string {
		return isset( $payload[ $key ] ) && is_string( $payload[ $key ] ) ? trim( $payload[ $key ] ) : '';
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 * @param array<string>        $allowed Supported values.
	 */
	public function enum( array $payload, string $key, array $allowed, string $fallback, ValidationErrors $errors ): string {
		$value = $payload[ $key ] ?? $fallback;
		if ( ! is_string( $value ) || ! in_array( $value, $allowed, true ) ) {
			$errors->add( $key, __( 'Choose a supported value.', 'yaxii-product-workspace' ) );
			return $fallback;
		}
		return $value;
	}

	/** @param array<string, mixed> $payload Request data. */
	public function decimal( array $payload, string $key, bool $required, ValidationErrors $errors ): ?string {
		$value = $this->text( $payload, $key );
		if ( '' === $value ) {
			if ( $required ) {
				$errors->add( $key, __( 'A non-negative decimal value is required.', 'yaxii-product-workspace' ) );
			}
			return null;
		}
		if ( 1 !== preg_match( '/^(?:0|[1-9]\d{0,11})(?:\.\d{1,6})?$/', $value ) ) {
			$errors->add( $key, __( 'Enter a valid non-negative decimal value.', 'yaxii-product-workspace' ) );
			return null;
		}
		return $value;
	}

	/** @param array<string, mixed> $payload Request data. */
	public function date( array $payload, string $key, ValidationErrors $errors ): ?string {
		$value = $this->text( $payload, $key );
		if ( '' === $value ) {
			return null;
		}
		$date = \DateTimeImmutable::createFromFormat( '!Y-m-d', $value );
		if ( false === $date || $date->format( 'Y-m-d' ) !== $value ) {
			$errors->add( $key, __( 'Enter a valid calendar date.', 'yaxii-product-workspace' ) );
			return null;
		}
		return $value;
	}

	/** @param array<string, mixed> $payload Request data. */
	public function stock_quantity( array $payload, bool $manage_stock, ValidationErrors $errors ): ?int {
		$value = $payload['stock_quantity'] ?? null;
		if ( null === $value || '' === $value ) {
			if ( $manage_stock ) {
				$errors->add( 'stock_quantity', __( 'Stock quantity is required when stock management is enabled.', 'yaxii-product-workspace' ) );
			}
			return null;
		}
		if ( ! is_int( $value ) || 0 > $value ) {
			$errors->add( 'stock_quantity', __( 'Stock quantity must be a non-negative whole number.', 'yaxii-product-workspace' ) );
			return null;
		}
		return $manage_stock ? $value : null;
	}

	/** @param array<string, mixed> $payload Request data. */
	public function optional_id( array $payload, string $key, ValidationErrors $errors ): int {
		$value = $payload[ $key ] ?? 0;
		if ( '' === $value || 0 === $value ) {
			return 0;
		}
		if ( ! is_int( $value ) || 0 > $value ) {
			$errors->add( $key, __( 'Expected a positive numeric ID.', 'yaxii-product-workspace' ) );
			return 0;
		}
		return $value;
	}

	/** @param array<string, mixed> $payload Request data.
	 * @return array<int> */
	public function id_list( array $payload, string $key, int $limit, bool $required, ValidationErrors $errors ): array {
		$value = $payload[ $key ] ?? array();
		if ( ! is_array( $value ) ) {
			$errors->add( $key, __( 'Expected a list of numeric IDs.', 'yaxii-product-workspace' ) );
			return array();
		}
		$ids = array_values( array_unique( array_filter( $value, 'is_int' ) ) );
		if ( count( $ids ) !== count( $value ) || array_filter( $ids, static fn ( int $id ): bool => 0 >= $id ) ) {
			$errors->add( $key, __( 'Every referenced ID must be a positive integer.', 'yaxii-product-workspace' ) );
		}
		if ( $required && array() === $ids ) {
			$errors->add( $key, __( 'Select at least one product category.', 'yaxii-product-workspace' ) );
		}
		if ( $limit < count( $ids ) ) {
			$errors->add( $key, sprintf( /* translators: %d: maximum referenced items. */ __( 'No more than %d items are allowed.', 'yaxii-product-workspace' ), $limit ) );
		}
		return array_slice( $ids, 0, $limit );
	}

	public function decimal_is_greater( string $left, string $right ): bool {
		$left_parts  = array_pad( explode( '.', $left, 2 ), 2, '' );
		$right_parts = array_pad( explode( '.', $right, 2 ), 2, '' );
		$left_units  = ltrim( $left_parts[0] . str_pad( $left_parts[1], 6, '0' ), '0' );
		$right_units = ltrim( $right_parts[0] . str_pad( $right_parts[1], 6, '0' ), '0' );
		$left_units  = '' === $left_units ? '0' : $left_units;
		$right_units = '' === $right_units ? '0' : $right_units;
		return strlen( $left_units ) > strlen( $right_units )
			|| ( strlen( $left_units ) === strlen( $right_units ) && 0 < strcmp( $left_units, $right_units ) );
	}
}
