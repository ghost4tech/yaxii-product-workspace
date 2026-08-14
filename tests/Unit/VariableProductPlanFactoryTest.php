<?php
/**
 * Variable-product attribute and combination domain tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\VariableProducts\CombinationGenerator;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableAttribute;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationInputParser;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductPlanFactory;

/**
 * Proves the model is combination-centric and bounded before WooCommerce.
 */
final class VariableProductPlanFactoryTest extends TestCase {
	private CombinationGenerator $generator;
	private VariableProductPlanFactory $factory;

	protected function setUp(): void {
		$this->generator = new CombinationGenerator( new VariationInputParser() );
		$this->factory   = new VariableProductPlanFactory( $this->generator );
	}

	public function test_global_and_custom_attributes_generate_six_concrete_combinations(): void {
		$attributes   = $this->attributes();
		$combinations = $this->combinations_for( $attributes );
		$plan         = $this->factory->from_array(
			array(
				'attributes'   => $attributes,
				'combinations' => $combinations,
			)
		);

		self::assertSame( 6, $plan->projected_count() );
		self::assertCount( 6, $plan->combinations() );
		self::assertTrue( $plan->attributes()[0]->is_global() );
		self::assertSame( 7, $plan->attributes()[0]->attribute_id() );
		self::assertSame( 'pa_color', $plan->attributes()[0]->taxonomy() );
		self::assertFalse( $plan->attributes()[1]->is_global() );
		self::assertSame( array( 'S', 'M', 'L' ), $plan->attributes()[1]->options() );
		self::assertArrayNotHasKey( 'options', $plan->attributes()[0]->to_array() );
		self::assertArrayNotHasKey( 'attribute_id', $plan->attributes()[1]->to_array() );
		self::assertSame(
			array(
				array(
					'attribute_key' => 'global:7',
					'term_id'       => 101,
				),
				array(
					'attribute_key' => 'custom:size',
					'option'        => 'S',
				),
			),
			$plan->combinations()[0]->selections()
		);
		self::assertSame( 'global:7=t:102|custom:size=o:L', $plan->combinations()[5]->fingerprint() );
	}

	public function test_non_variation_attribute_is_preserved_but_not_projected(): void {
		$attributes   = $this->attributes();
		$attributes[] = array(
			'key'       => 'custom:material',
			'source'    => 'custom',
			'name'      => 'Material',
			'options'   => array( 'Cotton', 'Wool' ),
			'visible'   => true,
			'variation' => false,
			'position'  => 2,
		);
		$plan         = $this->factory->from_array(
			array(
				'attributes'   => $attributes,
				'combinations' => $this->combinations_for( $attributes ),
			)
		);

		self::assertSame( 6, $plan->projected_count() );
		self::assertCount( 3, $plan->attributes() );
	}

	public function test_duplicate_combination_is_rejected(): void {
		$attributes                    = array( $this->attributes()[0] );
		$combinations                  = $this->combinations_for( $attributes );
		$combinations[1]['selections'] = $combinations[0]['selections'];

		$this->expectPlanError(
			'combinations.1.selections',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => $combinations,
				)
			)
		);
	}

	public function test_unknown_term_reference_is_rejected(): void {
		$attributes                                  = array( $this->attributes()[0] );
		$combinations                                = $this->combinations_for( $attributes );
		$combinations[1]['selections'][0]['term_id'] = 999;

		$this->expectPlanError(
			'combinations.1.selections',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => $combinations,
				)
			)
		);
	}

	public function test_selection_fields_are_source_specific(): void {
		$attributes                                 = $this->attributes();
		$combinations                               = $this->combinations_for( $attributes );
		$combinations[0]['selections'][0]['option'] = 'Black';

		$this->expectPlanError(
			'combinations.0.selections',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => $combinations,
				)
			)
		);
	}

	public function test_duplicate_custom_options_are_case_insensitive(): void {
		$attributes = array(
			array(
				'key'       => 'custom:size',
				'source'    => 'custom',
				'name'      => 'Size',
				'options'   => array( 'Small', 'small' ),
				'visible'   => true,
				'variation' => true,
				'position'  => 0,
			),
		);

		$this->expectPlanError(
			'attributes.0.options',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => array(),
				)
			)
		);
	}

	public function test_duplicate_attribute_identity_is_rejected(): void {
		$attributes   = $this->attributes();
		$attributes[] = array_merge(
			$attributes[0],
			array(
				'key'      => 'global:7-copy',
				'position' => 2,
			)
		);

		$this->expectPlanError(
			'attributes.2',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => array(),
				)
			)
		);
	}

	public function test_custom_attributes_cannot_smuggle_global_references(): void {
		$attributes                    = $this->attributes();
		$attributes[1]['attribute_id'] = 9;

		$this->expectPlanError(
			'attributes.1',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => array(),
				)
			)
		);
	}

	public function test_projected_count_over_fifty_is_rejected_before_rows(): void {
		$attributes = array();
		foreach ( array( 'color', 'size', 'material', 'style' ) as $position => $name ) {
			$attributes[] = array(
				'key'       => 'custom:' . $name,
				'source'    => 'custom',
				'name'      => ucfirst( $name ),
				'options'   => array( 'One', 'Two', 'Three', 'Four' ),
				'visible'   => true,
				'variation' => true,
				'position'  => $position,
			);
		}
		self::assertSame( 256, $this->generator->projected_count( $this->attribute_models( $attributes ) ) );

		$this->expectPlanError(
			'combinations',
			fn () => $this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => array(),
				)
			)
		);
	}

	/** @return array<int, array<string, mixed>> */
	private function attributes(): array {
		return array(
			array(
				'key'          => 'global:7',
				'source'       => 'global',
				'name'         => 'Color',
				'attribute_id' => 7,
				'taxonomy'     => 'pa_color',
				'option_ids'   => array( 101, 102 ),
				'visible'      => true,
				'variation'    => true,
				'position'     => 0,
			),
			array(
				'key'       => 'custom:size',
				'source'    => 'custom',
				'name'      => 'Size',
				'options'   => array( 'S', 'M', 'L' ),
				'visible'   => true,
				'variation' => true,
				'position'  => 1,
			),
		);
	}

	/** @param array<int, array<string, mixed>> $payload @return array<int, array<string, mixed>> */
	private function combinations_for( array $payload ): array {
		$result = array();
		foreach ( array_values( $this->generator->expected( $this->attribute_models( $payload ) ) ) as $index => $selections ) {
			$result[] = array(
				'client_id'      => sprintf( '00000000-0000-4000-8000-%012d', $index + 1 ),
				'variation_id'   => 0,
				'selections'     => $selections,
				'enabled'        => true,
				'regular_price'  => (string) ( 10 + $index ),
				'sale_price'     => null,
				'sku'            => 'VAR-' . $index,
				'manage_stock'   => true,
				'stock_quantity' => $index,
				'stock_status'   => 'instock',
				'image_id'       => 0,
			);
		}
		return $result;
	}

	/** @param array<int, array<string, mixed>> $payload @return array<int, VariableAttribute> */
	private function attribute_models( array $payload ): array {
		return array_map(
			static function ( array $item ): VariableAttribute {
				$is_global = 'global' === $item['source'];
				return new VariableAttribute(
					array(
						'key'          => $item['key'],
						'source'       => $item['source'],
						'name'         => $item['name'],
						'attribute_id' => $is_global ? $item['attribute_id'] : 0,
						'taxonomy'     => $is_global ? $item['taxonomy'] : '',
						'options'      => $is_global ? $item['option_ids'] : $item['options'],
						'visible'      => $item['visible'],
						'variation'    => $item['variation'],
						'position'     => $item['position'],
					)
				);
			},
			$payload
		);
	}

	/** @param callable(): void $operation */
	private function expectPlanError( string $field, callable $operation ): void {
		try {
			$operation();
			self::fail( 'Expected an invalid variation plan.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_invalid_variation_plan', $exception->api_code() );
			self::assertArrayHasKey( $field, $exception->fields() );
		}
	}
}
