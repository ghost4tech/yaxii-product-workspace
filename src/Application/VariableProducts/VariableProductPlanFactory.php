<?php
/**
 * Variable-product plan validation.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Products\ApiException;

/**
 * Converts untrusted attribute and combination data into a canonical plan.
 */
final class VariableProductPlanFactory {
	private CombinationGenerator $combinations;

	public function __construct( CombinationGenerator $combinations ) {
		$this->combinations = $combinations;
	}

	/**
	 * @param array<string, mixed> $payload Untrusted plan object.
	 */
	public function from_array( array $payload ): VariableProductPlan {
		if ( array() !== array_diff( array_keys( $payload ), array( 'attributes', 'combinations' ) ) ) {
			$this->invalid( '_request', __( 'The variation plan contains unsupported fields.', 'yaxii-product-workspace' ) );
		}
		if ( ! isset( $payload['attributes'], $payload['combinations'] ) || ! is_array( $payload['attributes'] ) || ! is_array( $payload['combinations'] ) ) {
			$this->invalid( '_request', __( 'Send attribute and combination lists.', 'yaxii-product-workspace' ) );
		}

		$attributes = $this->attributes( $payload['attributes'] );
		$projected  = $this->combinations->projected_count( $attributes );
		if ( 0 === $projected ) {
			$this->invalid( 'attributes', __( 'At least one attribute must be used for variations.', 'yaxii-product-workspace' ) );
		}
		if ( VariableProductLimits::MAX_COMBINATIONS < $projected ) {
			$this->invalid(
				'combinations',
				sprintf(
					/* translators: 1: projected combinations, 2: maximum supported combinations. */
					__( '%1$d combinations exceed the maximum of %2$d supported in a single save.', 'yaxii-product-workspace' ),
					$projected,
					VariableProductLimits::MAX_COMBINATIONS
				)
			);
		}

		return new VariableProductPlan(
			$attributes,
			$this->combinations->normalize( $attributes, $payload['combinations'] ),
			$projected
		);
	}

	/**
	 * @param array<int, mixed> $payload Untrusted attributes.
	 * @return array<VariableAttribute>
	 */
	private function attributes( array $payload ): array {
		if ( array() === $payload || VariableProductLimits::MAX_ATTRIBUTES < count( $payload ) ) {
			$this->invalid( 'attributes', sprintf( /* translators: %d: maximum attributes. */ __( 'Add between one and %d attributes.', 'yaxii-product-workspace' ), VariableProductLimits::MAX_ATTRIBUTES ) );
		}
		$attributes = array();
		$keys       = array();
		$identities = array();
		$positions  = array();
		foreach ( $payload as $index => $attribute_input ) {
			if ( ! is_array( $attribute_input ) ) {
				$this->invalid( "attributes.$index", __( 'Each attribute must be an object.', 'yaxii-product-workspace' ) );
			}
			$attribute = $this->attribute( $attribute_input, $index );
			$identity  = $attribute->is_global() ? 'global:' . $attribute->attribute_id() : 'custom:' . mb_strtolower( $attribute->name() );
			if ( isset( $keys[ $attribute->key() ] ) || isset( $identities[ $identity ] ) ) {
				$this->invalid( "attributes.$index", __( 'Duplicate attributes are not allowed.', 'yaxii-product-workspace' ) );
			}
			if ( isset( $positions[ $attribute->position() ] ) ) {
				$this->invalid( "attributes.$index.position", __( 'Each attribute requires a unique position.', 'yaxii-product-workspace' ) );
			}
			$keys[ $attribute->key() ]           = true;
			$identities[ $identity ]             = true;
			$positions[ $attribute->position() ] = true;
			$attributes[]                        = $attribute;
		}
		usort( $attributes, static fn ( VariableAttribute $left, VariableAttribute $right ): int => $left->position() <=> $right->position() );
		return $attributes;
	}

	/** @param array<string, mixed> $attribute_input Untrusted attribute. */
	private function attribute( array $attribute_input, int $index ): VariableAttribute {
		$allowed = array( 'key', 'source', 'name', 'attribute_id', 'taxonomy', 'option_ids', 'options', 'visible', 'variation', 'position' );
		if ( array() !== array_diff( array_keys( $attribute_input ), $allowed ) ) {
			$this->invalid( "attributes.$index", __( 'The attribute contains unsupported fields.', 'yaxii-product-workspace' ) );
		}
		$key       = isset( $attribute_input['key'] ) && is_string( $attribute_input['key'] ) ? trim( $attribute_input['key'] ) : '';
		$source    = $attribute_input['source'] ?? '';
		$name      = isset( $attribute_input['name'] ) && is_string( $attribute_input['name'] ) ? sanitize_text_field( $attribute_input['name'] ) : '';
		$position  = $attribute_input['position'] ?? $index;
		$visible   = $attribute_input['visible'] ?? true;
		$variation = $attribute_input['variation'] ?? true;
		if ( 1 !== preg_match( '/^[a-z0-9][a-z0-9:_-]{0,63}$/', $key ) ) {
			$this->invalid( "attributes.$index.key", __( 'Use a stable lowercase attribute key.', 'yaxii-product-workspace' ) );
		}
		if ( ! in_array( $source, array( 'global', 'custom' ), true ) || '' === $name || 40 < mb_strlen( $name ) ) {
			$this->invalid( "attributes.$index", __( 'Choose a supported source and an attribute name up to 40 characters.', 'yaxii-product-workspace' ) );
		}
		if ( ! is_int( $position ) || 0 > $position || VariableProductLimits::MAX_ATTRIBUTES <= $position || ! is_bool( $visible ) || ! is_bool( $variation ) ) {
			$this->invalid( "attributes.$index", __( 'Attribute visibility, variation use, or position is invalid.', 'yaxii-product-workspace' ) );
		}

		$base_fields = array(
			'key'          => $key,
			'source'       => $source,
			'name'         => $name,
			'visible'      => $visible,
			'variation'    => $variation,
			'position'     => $position,
			'attribute_id' => 0,
			'taxonomy'     => '',
			'options'      => array(),
		);
		return 'global' === $source
			? $this->global_attribute( $attribute_input, $index, $base_fields )
			: $this->custom_attribute( $attribute_input, $index, $base_fields );
	}

	/**
	 * @param array<string, mixed> $attribute_input Untrusted attribute.
	 * @param array<string, mixed> $base_fields Validated common fields.
	 */
	private function global_attribute( array $attribute_input, int $index, array $base_fields ): VariableAttribute {
		if ( array_key_exists( 'options', $attribute_input ) ) {
			$this->invalid( "attributes.$index.options", __( 'Global attributes use term IDs, not custom option text.', 'yaxii-product-workspace' ) );
		}
		$id       = $attribute_input['attribute_id'] ?? 0;
		$taxonomy = $attribute_input['taxonomy'] ?? '';
		$options  = $attribute_input['option_ids'] ?? null;
		if ( ! is_int( $id ) || 0 >= $id || ! is_string( $taxonomy ) || 1 !== preg_match( '/^pa_[a-z0-9_-]+$/', $taxonomy ) ) {
			$this->invalid( "attributes.$index", __( 'Global attributes require a real WooCommerce attribute ID and pa_* taxonomy.', 'yaxii-product-workspace' ) );
		}
		$ids                         = $this->positive_unique_ids( $options, "attributes.$index.option_ids" );
		$base_fields['attribute_id'] = $id;
		$base_fields['taxonomy']     = $taxonomy;
		$base_fields['options']      = $ids;
		return new VariableAttribute( $base_fields );
	}

	/**
	 * @param array<string, mixed> $attribute_input Untrusted attribute.
	 * @param array<string, mixed> $base_fields Validated common fields.
	 */
	private function custom_attribute( array $attribute_input, int $index, array $base_fields ): VariableAttribute {
		if ( array_intersect( array_keys( $attribute_input ), array( 'attribute_id', 'taxonomy', 'option_ids' ) ) ) {
			$this->invalid( "attributes.$index", __( 'Custom attributes cannot reference a global taxonomy or term IDs.', 'yaxii-product-workspace' ) );
		}
		$options = $attribute_input['options'] ?? null;
		if ( ! is_array( $options ) || array() === $options || VariableProductLimits::MAX_OPTIONS < count( $options ) ) {
			$this->invalid( "attributes.$index.options", __( 'Select between one and 20 custom options.', 'yaxii-product-workspace' ) );
		}
		$custom_options    = array();
		$seen_option_names = array();
		foreach ( $options as $option ) {
			$normalized = is_string( $option ) ? sanitize_text_field( $option ) : '';
			$identity   = mb_strtolower( $normalized );
			if ( '' === $normalized || 100 < mb_strlen( $normalized ) || isset( $seen_option_names[ $identity ] ) ) {
				$this->invalid( "attributes.$index.options", __( 'Custom options must be unique non-empty values up to 100 characters.', 'yaxii-product-workspace' ) );
			}
			$seen_option_names[ $identity ] = true;
			$custom_options[]               = $normalized;
		}
		$base_fields['options'] = $custom_options;
		return new VariableAttribute( $base_fields );
	}

	/**
	 * @param mixed $identifiers_input Untrusted identifiers.
	 * @return array<int>
	 */
	private function positive_unique_ids( $identifiers_input, string $field ): array {
		if ( ! is_array( $identifiers_input ) || array() === $identifiers_input || VariableProductLimits::MAX_OPTIONS < count( $identifiers_input ) ) {
			$this->invalid( $field, __( 'Select between one and 20 attribute terms.', 'yaxii-product-workspace' ) );
		}
		$ids = array_values( array_unique( array_filter( $identifiers_input, 'is_int' ) ) );
		if ( count( $ids ) !== count( $identifiers_input ) || array_filter( $ids, static fn ( int $id ): bool => 0 >= $id ) ) {
			$this->invalid( $field, __( 'Attribute term IDs must be unique positive integers.', 'yaxii-product-workspace' ) );
		}
		return $ids;
	}

	private function invalid( string $field, string $message ): void {
		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns escaping.
		throw new ApiException( 'ypw_invalid_variation_plan', __( 'Review the variable-product attributes.', 'yaxii-product-workspace' ), 400, array( $field => array( $message ) ) );
	}
}
