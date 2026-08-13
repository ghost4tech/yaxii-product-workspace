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
		$errors = new ValidationErrors();
		$this->validate_types( $payload, $errors );
		$unknown_fields = array_diff( array_keys( $payload ), self::ALLOWED_FIELDS );
		if ( array() !== $unknown_fields ) {
			$errors->add( '_request', __( 'The request contains unsupported fields.', 'yaxii-product-workspace' ) );
		}

		$name          = sanitize_text_field( $this->string_value( $payload, 'name' ) );
		$sku           = sanitize_text_field( $this->string_value( $payload, 'sku' ) );
		$regular_price = $this->decimal_value( $payload, 'regular_price', true, $errors );
		$sale_price    = $this->decimal_value( $payload, 'sale_price', false, $errors );

		if ( '' === $name ) {
			$errors->add( 'name', __( 'Product name is required.', 'yaxii-product-workspace' ) );
		} elseif ( 200 < mb_strlen( $name ) ) {
			$errors->add( 'name', __( 'Product name must be 200 characters or fewer.', 'yaxii-product-workspace' ) );
		}

		if ( 100 < mb_strlen( $sku ) ) {
			$errors->add( 'sku', __( 'SKU must be 100 characters or fewer.', 'yaxii-product-workspace' ) );
		}

		if ( null !== $regular_price && null !== $sale_price && $this->decimal_is_greater( $sale_price, $regular_price ) ) {
			$errors->add( 'sale_price', __( 'Sale price cannot exceed the regular price.', 'yaxii-product-workspace' ) );
		}

		$manage_stock   = isset( $payload['manage_stock'] ) && true === $payload['manage_stock'];
		$stock_quantity = $this->stock_quantity( $payload, $manage_stock, $errors );
		$stock_status   = $this->enum_value(
			$payload['stock_status'] ?? 'instock',
			'stock_status',
			array( 'instock', 'outofstock', 'onbackorder' ),
			$errors
		);
		$status         = $this->enum_value( $payload['status'] ?? 'draft', 'status', array( 'draft', 'publish' ), $errors );
		$visibility     = $this->enum_value(
			$payload['catalog_visibility'] ?? 'visible',
			'catalog_visibility',
			array( 'visible', 'catalog', 'search', 'hidden' ),
			$errors
		);
		$tax_status     = $this->enum_value(
			$payload['tax_status'] ?? 'taxable',
			'tax_status',
			array( 'taxable', 'shipping', 'none' ),
			$errors
		);

		$category_ids = $this->id_list( $payload['category_ids'] ?? array(), 'category_ids', 10, $errors );
		$image_ids    = $this->id_list( $payload['image_ids'] ?? array(), 'image_ids', 10, $errors );
		if ( array() === $category_ids ) {
			$errors->add( 'category_ids', __( 'Select at least one product category.', 'yaxii-product-workspace' ) );
		}

		if ( $errors->has_errors() ) {
			// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST serialization handles structured API errors.
			throw new ApiException(
				'ypw_validation_failed',
				__( 'Review the highlighted product fields.', 'yaxii-product-workspace' ),
				400,
				$errors->all()
			);
			// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}

		return new CreateProductCommand(
			array(
				'name'               => $name,
				'sku'                => $sku,
				'regular_price'      => (string) $regular_price,
				'sale_price'         => $sale_price,
				'manage_stock'       => $manage_stock,
				'stock_quantity'     => $stock_quantity,
				'stock_status'       => $stock_status,
				'status'             => $status,
				'catalog_visibility' => $visibility,
				'tax_status'         => $tax_status,
				'description'        => wp_kses_post( $this->string_value( $payload, 'description' ) ),
				'short_description'  => wp_kses_post( $this->string_value( $payload, 'short_description' ) ),
				'category_ids'       => $category_ids,
				'image_ids'          => $image_ids,
			)
		);
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function string_value( array $payload, string $key ): string {
		return isset( $payload[ $key ] ) && is_string( $payload[ $key ] ) ? trim( $payload[ $key ] ) : '';
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function validate_types( array $payload, ValidationErrors $errors ): void {
		$string_fields = array(
			'name',
			'sku',
			'regular_price',
			'sale_price',
			'stock_status',
			'status',
			'catalog_visibility',
			'tax_status',
			'description',
			'short_description',
		);

		foreach ( $string_fields as $field ) {
			$value = $payload[ $field ] ?? null;
			if ( array_key_exists( $field, $payload ) && null !== $value && ! is_string( $value ) ) {
				$errors->add( $field, __( 'Expected a text value.', 'yaxii-product-workspace' ) );
			}
		}

		if ( isset( $payload['manage_stock'] ) && ! is_bool( $payload['manage_stock'] ) ) {
			$errors->add( 'manage_stock', __( 'Expected true or false.', 'yaxii-product-workspace' ) );
		}
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function decimal_value( array $payload, string $key, bool $required, ValidationErrors $errors ): ?string {
		$value = $this->string_value( $payload, $key );
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

	private function decimal_is_greater( string $left, string $right ): bool {
		$left_parts  = array_pad( explode( '.', $left, 2 ), 2, '' );
		$right_parts = array_pad( explode( '.', $right, 2 ), 2, '' );
		$left_units  = ltrim( $left_parts[0], '0' ) . str_pad( $left_parts[1], 6, '0' );
		$right_units = ltrim( $right_parts[0], '0' ) . str_pad( $right_parts[1], 6, '0' );
		$left_units  = ltrim( $left_units, '0' );
		$right_units = ltrim( $right_units, '0' );
		$left_units  = '' === $left_units ? '0' : $left_units;
		$right_units = '' === $right_units ? '0' : $right_units;

		return strlen( $left_units ) > strlen( $right_units )
			|| ( strlen( $left_units ) === strlen( $right_units ) && 0 < strcmp( $left_units, $right_units ) );
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function stock_quantity( array $payload, bool $manage_stock, ValidationErrors $errors ): ?int {
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

		return $value;
	}

	/**
	 * @param mixed         $value   Untrusted value.
	 * @param array<string> $allowed Allowed values.
	 */
	private function enum_value(
		$value,
		string $key,
		array $allowed,
		ValidationErrors $errors
	): string {
		if ( ! is_string( $value ) || ! in_array( $value, $allowed, true ) ) {
			$errors->add( $key, __( 'Choose a supported value.', 'yaxii-product-workspace' ) );
			return $allowed[0];
		}

		return $value;
	}

	/**
	 * @param mixed $value Untrusted value.
	 * @return array<int>
	 */
	private function id_list(
		$value,
		string $key,
		int $limit,
		ValidationErrors $errors
	): array {
		if ( ! is_array( $value ) ) {
			$errors->add( $key, __( 'Expected a list of numeric IDs.', 'yaxii-product-workspace' ) );
			return array();
		}

		$ids = array_values( array_unique( array_filter( $value, 'is_int' ) ) );
		if ( count( $ids ) !== count( $value ) || array_filter( $ids, static fn ( int $id ): bool => 0 >= $id ) ) {
			$errors->add( $key, __( 'Every referenced ID must be a positive integer.', 'yaxii-product-workspace' ) );
		}
		if ( $limit < count( $ids ) ) {
			$errors->add(
				$key,
				sprintf(
				/* translators: %d: maximum number of referenced items. */
					__( 'No more than %d items are allowed.', 'yaxii-product-workspace' ),
					$limit
				)
			);
		}

		return array_slice( $ids, 0, $limit );
	}
}
