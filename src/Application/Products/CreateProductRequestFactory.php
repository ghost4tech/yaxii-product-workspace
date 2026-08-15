<?php
/**
 * Product request validation and normalization.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

defined( 'ABSPATH' ) || exit;

/**
 * Converts an untrusted REST body into a complete allowlisted product command.
 */
final class CreateProductRequestFactory {
	private const MAX_DESCRIPTION_LENGTH       = 100000;
	private const MAX_SHORT_DESCRIPTION_LENGTH = 10000;
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- ApiException values are serialized by the REST error boundary.
	private const ALLOWED_FIELDS = array(
		'name',
		'slug',
		'description',
		'short_description',
		'status',
		'catalog_visibility',
		'regular_price',
		'sale_price',
		'date_on_sale_from',
		'date_on_sale_to',
		'sku',
		'manage_stock',
		'stock_quantity',
		'stock_status',
		'backorders',
		'sold_individually',
		'weight',
		'length',
		'width',
		'height',
		'shipping_class_id',
		'tax_status',
		'tax_class',
		'category_ids',
		'tag_ids',
		'image_ids',
	);
	private ProductFieldParser $fields;

	public function __construct( ProductFieldParser $fields ) {
		$this->fields = $fields;
	}

	/**
	 * @param array<string, mixed> $payload Untrusted request data.
	 * @throws ApiException When the request is malformed.
	 */
	public function from_array( array $payload ): CreateProductCommand {
		$errors = new ValidationErrors();
		$this->reject_unknown_fields( $payload, $errors );
		$this->validate_field_types( $payload, $errors );

		$fields = $this->normalized_fields( $payload, $errors );
		$this->validate_relationships( $fields, $errors );
		$this->throw_if_invalid( $errors );

		return new CreateProductCommand( $fields );
	}

	/**
	 * @param array<string, mixed> $payload Complete update payload.
	 * @throws ApiException When any field is omitted.
	 */
	public function from_complete_array( array $payload ): CreateProductCommand {
		if ( array() !== array_diff( self::ALLOWED_FIELDS, array_keys( $payload ) ) ) {
			throw new ApiException(
				'ypw_incomplete_product',
				__( 'Every product field must be present; send an empty value to clear a field.', 'yaxii-product-workspace' ),
				400,
				array( '_request' => array( __( 'Reload the product before saving this update.', 'yaxii-product-workspace' ) ) )
			);
		}
		return $this->from_array( $payload );
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 * @return array<string, mixed>
	 */
	private function normalized_fields( array $payload, ValidationErrors $errors ): array {
		$name              = sanitize_text_field( $this->fields->text( $payload, 'name' ) );
		$sku               = sanitize_text_field( $this->fields->text( $payload, 'sku' ) );
		$description       = $this->fields->text( $payload, 'description' );
		$short_description = $this->fields->text( $payload, 'short_description' );
		$this->validate_text_lengths( $name, $sku, $description, $short_description, $errors );

		$manage_stock = true === ( $payload['manage_stock'] ?? false );
		return array(
			'name'               => $name,
			'slug'               => sanitize_title( $this->fields->text( $payload, 'slug' ) ),
			'description'        => wp_kses_post( $description ),
			'short_description'  => wp_kses_post( $short_description ),
			'status'             => $this->fields->enum( $payload, 'status', array( 'draft', 'publish', 'pending' ), 'draft', $errors ),
			'catalog_visibility' => $this->fields->enum( $payload, 'catalog_visibility', array( 'visible', 'catalog', 'search', 'hidden' ), 'visible', $errors ),
			'regular_price'      => (string) $this->fields->decimal( $payload, 'regular_price', true, $errors ),
			'sale_price'         => $this->fields->decimal( $payload, 'sale_price', false, $errors ),
			'date_on_sale_from'  => $this->fields->date( $payload, 'date_on_sale_from', $errors ),
			'date_on_sale_to'    => $this->fields->date( $payload, 'date_on_sale_to', $errors ),
			'sku'                => $sku,
			'manage_stock'       => $manage_stock,
			'stock_quantity'     => $this->fields->stock_quantity( $payload, $manage_stock, $errors ),
			'stock_status'       => $this->fields->enum( $payload, 'stock_status', array( 'instock', 'outofstock', 'onbackorder' ), 'instock', $errors ),
			'backorders'         => $this->fields->enum( $payload, 'backorders', array( 'no', 'notify', 'yes' ), 'no', $errors ),
			'sold_individually'  => true === ( $payload['sold_individually'] ?? false ),
			'weight'             => (string) ( $this->fields->decimal( $payload, 'weight', false, $errors ) ?? '' ),
			'length'             => (string) ( $this->fields->decimal( $payload, 'length', false, $errors ) ?? '' ),
			'width'              => (string) ( $this->fields->decimal( $payload, 'width', false, $errors ) ?? '' ),
			'height'             => (string) ( $this->fields->decimal( $payload, 'height', false, $errors ) ?? '' ),
			'shipping_class_id'  => $this->fields->optional_id( $payload, 'shipping_class_id', $errors ),
			'tax_status'         => $this->fields->enum( $payload, 'tax_status', array( 'taxable', 'shipping', 'none' ), 'taxable', $errors ),
			'tax_class'          => sanitize_title( $this->fields->text( $payload, 'tax_class' ) ),
			'category_ids'       => $this->fields->id_list( $payload, 'category_ids', 20, true, $errors ),
			'tag_ids'            => $this->fields->id_list( $payload, 'tag_ids', 20, false, $errors ),
			'image_ids'          => $this->fields->id_list( $payload, 'image_ids', 10, false, $errors ),
		);
	}

	private function validate_text_lengths( string $name, string $sku, string $description, string $short_description, ValidationErrors $errors ): void {
		if ( '' === $name ) {
			$errors->add( 'name', __( 'Product name is required.', 'yaxii-product-workspace' ) );
		} elseif ( 200 < mb_strlen( $name ) ) {
			$errors->add( 'name', __( 'Product name must be 200 characters or fewer.', 'yaxii-product-workspace' ) );
		}
		if ( 100 < mb_strlen( $sku ) ) {
			$errors->add( 'sku', __( 'SKU must be 100 characters or fewer.', 'yaxii-product-workspace' ) );
		}
		if ( self::MAX_DESCRIPTION_LENGTH < mb_strlen( $description ) ) {
			$errors->add( 'description', __( 'Description is too large to save.', 'yaxii-product-workspace' ) );
		}
		if ( self::MAX_SHORT_DESCRIPTION_LENGTH < mb_strlen( $short_description ) ) {
			$errors->add( 'short_description', __( 'Short description is too large to save.', 'yaxii-product-workspace' ) );
		}
	}

	/**
	 * @param array<string, mixed> $fields Normalized fields.
	 */
	private function validate_relationships( array $fields, ValidationErrors $errors ): void {
		$sale    = $fields['sale_price'];
		$regular = $fields['regular_price'];
		if ( is_string( $sale ) && $this->fields->decimal_is_greater( $sale, (string) $regular ) ) {
			$errors->add( 'sale_price', __( 'Sale price cannot exceed the regular price.', 'yaxii-product-workspace' ) );
		}
		$from = $fields['date_on_sale_from'];
		$to   = $fields['date_on_sale_to'];
		if ( is_string( $from ) && is_string( $to ) && $from > $to ) {
			$errors->add( 'date_on_sale_to', __( 'Sale end date cannot be before the start date.', 'yaxii-product-workspace' ) );
		}
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function reject_unknown_fields( array $payload, ValidationErrors $errors ): void {
		if ( array() !== array_diff( array_keys( $payload ), self::ALLOWED_FIELDS ) ) {
			$errors->add( '_request', __( 'The request contains unsupported fields.', 'yaxii-product-workspace' ) );
		}
	}

	/**
	 * @param array<string, mixed> $payload Request data.
	 */
	private function validate_field_types( array $payload, ValidationErrors $errors ): void {
		$string_fields = array_diff( self::ALLOWED_FIELDS, array( 'manage_stock', 'sold_individually', 'stock_quantity', 'shipping_class_id', 'category_ids', 'tag_ids', 'image_ids' ) );
		foreach ( $string_fields as $field ) {
			if ( array_key_exists( $field, $payload ) && null !== $payload[ $field ] && ! is_string( $payload[ $field ] ) ) {
				$errors->add( $field, __( 'Expected a text value.', 'yaxii-product-workspace' ) );
			}
		}
		foreach ( array( 'manage_stock', 'sold_individually' ) as $field ) {
			if ( array_key_exists( $field, $payload ) && ! is_bool( $payload[ $field ] ) ) {
				$errors->add( $field, __( 'Expected true or false.', 'yaxii-product-workspace' ) );
			}
		}
	}

	/**
	 * @throws ApiException When validation failed.
	 */
	private function throw_if_invalid( ValidationErrors $errors ): void {
		if ( ! $errors->has_errors() ) {
			return;
		}
		throw new ApiException( 'ypw_validation_failed', __( 'Review the highlighted product fields.', 'yaxii-product-workspace' ), 400, $errors->all() );
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
