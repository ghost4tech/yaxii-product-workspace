<?php
/**
 * Product request validation and normalization.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

defined( 'ABSPATH' ) || exit;

/**
 * Converts an untrusted REST body into an allowlisted command.
 */
final class CreateProductRequestFactory {
	private const ALLOWED_FIELDS = array(
		'name',
		'sku',
		'regular_price',
		'sale_price',
		'manage_stock',
		'stock_quantity',
		'stock_status',
		'status',
		'catalog_visibility',
		'tax_status',
		'description',
		'short_description',
		'category_ids',
		'image_ids',
	);

	/**
	 * @param array<string, mixed> $payload Untrusted request data.
	 * @throws ApiException When the request is malformed.
	 */
	public function from_array( array $payload ): CreateProductCommand {
		$fields         = array();
		$unknown_fields = array_diff( array_keys( $payload ), self::ALLOWED_FIELDS );
		if ( array() !== $unknown_fields ) {
			$fields['_request'] = array( __( 'The request contains unsupported fields.', 'yaxii-product-workspace' ) );
		}

		$name          = sanitize_text_field( $this->string_value( $payload, 'name' ) );
		$sku           = sanitize_text_field( $this->string_value( $payload, 'sku' ) );
		$regular_price = $this->decimal_value( $payload, 'regular_price', true, $fields );
		$sale_price    = $this->decimal_value( $payload, 'sale_price', false, $fields );

		if ( '' === $name ) {
			$fields['name'][] = __( 'Product name is required.', 'yaxii-product-workspace' );
		} elseif ( 200 < mb_strlen( $name ) ) {
			$fields['name'][] = __( 'Product name must be 200 characters or fewer.', 'yaxii-product-workspace' );
		}

		if ( 100 < mb_strlen( $sku ) ) {
			$fields['sku'][] = __( 'SKU must be 100 characters or fewer.', 'yaxii-product-workspace' );
		}

		if ( null !== $regular_price && null !== $sale_price && (float) $sale_price > (float) $regular_price ) {
			$fields['sale_price'][] = __( 'Sale price cannot exceed the regular price.', 'yaxii-product-workspace' );
		}

		$manage_stock   = isset( $payload['manage_stock'] ) && true === $payload['manage_stock'];
		$stock_quantity = $this->stock_quantity( $payload, $manage_stock, $fields );
		$stock_status   = $this->enum_value(
			$payload,
			'stock_status',
			array( 'instock', 'outofstock', 'onbackorder' ),
			'instock',
			$fields
		);
		$status         = $this->enum_value( $payload, 'status', array( 'draft', 'publish' ), 'draft', $fields );
		$visibility     = $this->enum_value(
			$payload,
			'catalog_visibility',
			array( 'visible', 'catalog', 'search', 'hidden' ),
			'visible',
			$fields
		);
		$tax_status     = $this->enum_value(
			$payload,
			'tax_status',
			array( 'taxable', 'shipping', 'none' ),
			'taxable',
			$fields
		);

		$category_ids = $this->id_list( $payload, 'category_ids', 10, true, $fields );
		$image_ids    = $this->id_list( $payload, 'image_ids', 10, false, $fields );

		if ( array() !== $fields ) {
			// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST serialization handles structured API errors.
			throw new ApiException(
				'ypw_validation_failed',
				__( 'Review the highlighted product fields.', 'yaxii-product-workspace' ),
				400,
				$fields
			);
			// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}

		return new CreateProductCommand(
			$name,
			$sku,
			(string) $regular_price,
			$sale_price,
			$manage_stock,
			$stock_quantity,
			$stock_status,
			$status,
			$visibility,
			$tax_status,
			wp_kses_post( $this->string_value( $payload, 'description' ) ),
			wp_kses_post( $this->string_value( $payload, 'short_description' ) ),
			$category_ids,
			$image_ids
		);
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function string_value( array $payload, string $key ): string {
		return isset( $payload[ $key ] ) && is_string( $payload[ $key ] ) ? trim( $payload[ $key ] ) : '';
	}

	/**
	 * @param array<string, mixed>         $payload Request data.
	 * @param array<string, array<string>> $fields  Accumulated field errors.
	 */
	private function decimal_value( array $payload, string $key, bool $required, array &$fields ): ?string {
		$value = $this->string_value( $payload, $key );
		if ( '' === $value ) {
			if ( $required ) {
				$fields[ $key ][] = __( 'A non-negative decimal value is required.', 'yaxii-product-workspace' );
			}
			return null;
		}

		if ( 1 !== preg_match( '/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/', $value ) ) {
			$fields[ $key ][] = __( 'Enter a valid non-negative decimal value.', 'yaxii-product-workspace' );
			return null;
		}

		return $value;
	}

	/**
	 * @param array<string, mixed>         $payload Request data.
	 * @param array<string, array<string>> $fields  Accumulated field errors.
	 */
	private function stock_quantity( array $payload, bool $manage_stock, array &$fields ): ?int {
		$value = $payload['stock_quantity'] ?? null;
		if ( null === $value || '' === $value ) {
			if ( $manage_stock ) {
				$fields['stock_quantity'][] = __( 'Stock quantity is required when stock management is enabled.', 'yaxii-product-workspace' );
			}
			return null;
		}

		if ( ! is_int( $value ) || 0 > $value ) {
			$fields['stock_quantity'][] = __( 'Stock quantity must be a non-negative whole number.', 'yaxii-product-workspace' );
			return null;
		}

		return $value;
	}

	/**
	 * @param array<string, mixed>         $payload Request data.
	 * @param array<string>                $allowed Allowed values.
	 * @param array<string, array<string>> $fields  Accumulated field errors.
	 */
	private function enum_value(
		array $payload,
		string $key,
		array $allowed,
		string $fallback,
		array &$fields
	): string {
		$value = $payload[ $key ] ?? $fallback;
		if ( ! is_string( $value ) || ! in_array( $value, $allowed, true ) ) {
			$fields[ $key ][] = __( 'Choose a supported value.', 'yaxii-product-workspace' );
			return $fallback;
		}

		return $value;
	}

	/**
	 * @param array<string, mixed>         $payload Request data.
	 * @param array<string, array<string>> $fields  Accumulated field errors.
	 * @return array<int>
	 */
	private function id_list(
		array $payload,
		string $key,
		int $limit,
		bool $required,
		array &$fields
	): array {
		$value = $payload[ $key ] ?? array();
		if ( ! is_array( $value ) ) {
			$fields[ $key ][] = __( 'Expected a list of numeric IDs.', 'yaxii-product-workspace' );
			return array();
		}

		$ids = array_values( array_unique( array_filter( $value, 'is_int' ) ) );
		if ( count( $ids ) !== count( $value ) || array_filter( $ids, static fn ( int $id ): bool => 0 >= $id ) ) {
			$fields[ $key ][] = __( 'Every referenced ID must be a positive integer.', 'yaxii-product-workspace' );
		}
		if ( $required && array() === $ids ) {
			$fields[ $key ][] = __( 'Select at least one product category.', 'yaxii-product-workspace' );
		}
		if ( $limit < count( $ids ) ) {
			$fields[ $key ][] = sprintf(
				/* translators: %d: maximum number of referenced items. */
				__( 'No more than %d items are allowed.', 'yaxii-product-workspace' ),
				$limit
			);
		}

		return array_slice( $ids, 0, $limit );
	}
}
