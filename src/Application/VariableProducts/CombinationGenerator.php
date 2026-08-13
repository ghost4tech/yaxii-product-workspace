<?php
/**
 * Variable-combination generation and normalization.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

use Yaxii\ProductWorkspace\Application\Products\ApiException;

/**
 * Generates a bounded Cartesian product and validates explicit combinations.
 */
final class CombinationGenerator {
	private VariationInputParser $inputs;

	public function __construct( VariationInputParser $inputs ) {
		$this->inputs = $inputs;
	}

	/** @param array<VariableAttribute> $attributes */
	public function projected_count( array $attributes ): int {
		$count = 1;
		$used  = 0;
		foreach ( $attributes as $attribute ) {
			if ( ! $attribute->is_for_variations() ) {
				continue;
			}
			++$used;
			$count *= count( $attribute->options() );
		}
		return 0 === $used ? 0 : $count;
	}

	/**
	 * @param array<VariableAttribute>    $attributes Validated attributes.
	 * @param array<int, mixed>           $payload Explicit combination payloads.
	 * @return array<VariationCombination>
	 */
	public function normalize( array $attributes, array $payload ): array {
		$expected = $this->expected( $attributes );
		if ( count( $payload ) !== count( $expected ) ) {
			$this->invalid( 'combinations', __( 'Generate every projected variation combination before saving.', 'yaxii-product-workspace' ) );
		}
		$by_key            = $this->variation_attributes_by_key( $attributes );
		$seen_client_ids   = array();
		$seen_combinations = array();
		$normalized        = array();
		foreach ( $payload as $index => $combination ) {
			$normalized_combination = $this->normalize_combination( $combination, $index, $by_key, $expected );
			$client_id              = $normalized_combination->client_id();
			$fingerprint            = $normalized_combination->fingerprint();
			if ( isset( $seen_client_ids[ $client_id ] ) ) {
				$this->invalid( "combinations.$index.client_id", __( 'Each combination requires a unique client UUID.', 'yaxii-product-workspace' ) );
			}
			if ( isset( $seen_combinations[ $fingerprint ] ) ) {
				$this->invalid( "combinations.$index.selections", __( 'Duplicate variation combinations are not allowed.', 'yaxii-product-workspace' ) );
			}
			$seen_client_ids[ $client_id ]     = true;
			$seen_combinations[ $fingerprint ] = true;
			$normalized[]                      = $normalized_combination;
		}
		return $normalized;
	}

	/**
	 * @param mixed                                                    $combination_input Untrusted combination.
	 * @param array<string, VariableAttribute>                         $attributes Variation attributes by key.
	 * @param array<string, array<int, array<string, int|string>>>     $expected Expected selection sets.
	 */
	private function normalize_combination( $combination_input, int $index, array $attributes, array $expected ): VariationCombination {
		if ( ! is_array( $combination_input ) ) {
			$this->invalid( "combinations.$index", __( 'Each combination must be an object.', 'yaxii-product-workspace' ) );
		}
		$parsed      = $this->inputs->parse( $combination_input, $index );
		$selections  = $this->normalize_selections( $combination_input['selections'] ?? null, $attributes, $index );
		$fingerprint = $this->fingerprint( $selections );
		if ( ! isset( $expected[ $fingerprint ] ) ) {
			$this->invalid( "combinations.$index.selections", __( 'The combination references an unknown attribute option.', 'yaxii-product-workspace' ) );
		}
		return new VariationCombination(
			array(
				'client_id'    => $parsed['client_id'],
				'variation_id' => $parsed['variation_id'],
				'selections'   => $selections,
				'fields'       => $parsed['fields'],
				'fingerprint'  => $fingerprint,
			)
		);
	}

	/**
	 * @param array<VariableAttribute> $attributes Validated attributes.
	 * @return array<string, VariableAttribute>
	 */
	private function variation_attributes_by_key( array $attributes ): array {
		$by_key = array();
		foreach ( $attributes as $attribute ) {
			if ( $attribute->is_for_variations() ) {
				$by_key[ $attribute->key() ] = $attribute;
			}
		}
		return $by_key;
	}

	/**
	 * @param array<VariableAttribute> $attributes Validated attributes.
	 * @return array<string, array<int, array<string, int|string>>>
	 */
	public function expected( array $attributes ): array {
		$rows = array( array() );
		foreach ( $attributes as $attribute ) {
			if ( ! $attribute->is_for_variations() ) {
				continue;
			}
			$expanded_rows = array();
			foreach ( $rows as $row ) {
				foreach ( $attribute->options() as $option ) {
					$selection = array( 'attribute_key' => $attribute->key() );
					$selection[ $attribute->is_global() ? 'term_id' : 'option' ] = $option;
					$expanded_rows[] = array_merge( $row, array( $selection ) );
				}
			}
			$rows = $expanded_rows;
		}
		$combinations_by_fingerprint = array();
		foreach ( $rows as $selections ) {
			if ( array() !== $selections ) {
				$combinations_by_fingerprint[ $this->fingerprint( $selections ) ] = $selections;
			}
		}
		return $combinations_by_fingerprint;
	}

	/**
	 * @param mixed                            $selections_input Untrusted selections.
	 * @param array<string, VariableAttribute> $attributes Variation attributes by key.
	 * @return array<int, array<string, int|string>>
	 */
	private function normalize_selections( $selections_input, array $attributes, int $index ): array {
		if ( ! is_array( $selections_input ) || count( $selections_input ) !== count( $attributes ) ) {
			$this->invalid( "combinations.$index.selections", __( 'Select one option from every variation attribute.', 'yaxii-product-workspace' ) );
		}
		$selected = array();
		foreach ( $selections_input as $selection ) {
			$key = is_array( $selection ) && isset( $selection['attribute_key'] ) && is_string( $selection['attribute_key'] ) ? $selection['attribute_key'] : '';
			if ( ! isset( $attributes[ $key ] ) || isset( $selected[ $key ] ) ) {
				$this->invalid( "combinations.$index.selections", __( 'The combination contains an invalid or duplicate attribute reference.', 'yaxii-product-workspace' ) );
			}
			$attribute = $attributes[ $key ];
			$allowed   = array( 'attribute_key', $attribute->is_global() ? 'term_id' : 'option' );
			if ( array() !== array_diff( array_keys( $selection ), $allowed ) ) {
				$this->invalid( "combinations.$index.selections", __( 'The combination selection contains unsupported fields.', 'yaxii-product-workspace' ) );
			}
			$option = $attribute->is_global() ? ( $selection['term_id'] ?? null ) : ( $selection['option'] ?? null );
			if ( ! in_array( $option, $attribute->options(), true ) ) {
				$this->invalid( "combinations.$index.selections", __( 'The combination contains an unknown attribute option.', 'yaxii-product-workspace' ) );
			}
			$normalized = array( 'attribute_key' => $key );
			$normalized[ $attribute->is_global() ? 'term_id' : 'option' ] = $option;
			$selected[ $key ] = $normalized;
		}
		$ordered_selections = array();
		foreach ( $attributes as $key => $attribute ) {
			unset( $attribute );
			$ordered_selections[] = $selected[ $key ];
		}
		return $ordered_selections;
	}

	/** @param array<int, array<string, int|string>> $selections */
	public function fingerprint( array $selections ): string {
		$tokens = array_map(
			static fn ( array $selection ): string => $selection['attribute_key'] . '=' . ( isset( $selection['term_id'] ) ? 't:' . $selection['term_id'] : 'o:' . $selection['option'] ),
			$selections
		);
		return implode( '|', $tokens );
	}

	private function invalid( string $field, string $message ): void {
		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns escaping.
		throw new ApiException( 'ypw_invalid_variation_plan', __( 'Review the variable-product combinations.', 'yaxii-product-workspace' ), 400, array( $field => array( $message ) ) );
	}
}
