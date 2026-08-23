<?php
/**
 * Variable-product attribute validation regressions.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\VariableProducts\CombinationGenerator;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableAttribute;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductPlanFactory;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationInputParser;

final class VariableAttributeValidationTest extends TestCase {
	private CombinationGenerator $generator;
	private VariableProductPlanFactory $factory;

	protected function setUp(): void {
		$this->generator = new CombinationGenerator( new VariationInputParser() );
		$this->factory   = new VariableProductPlanFactory( $this->generator );
	}

	public function test_two_custom_attributes_generate_six_combinations(): void {
		$attributes = array(
			$this->custom_attribute( 'custom:color', 'Color', array( 'Black', 'White' ), 0 ),
			$this->custom_attribute( 'custom:size', 'Size', array( 'S', 'M', 'L' ), 1 ),
		);
		$plan       = $this->factory->from_array(
			array(
				'attributes'   => $attributes,
				'combinations' => $this->combinations( $attributes ),
			)
		);

		self::assertSame( 6, $plan->projected_count() );
		self::assertCount( 6, $plan->combinations() );
	}

	public function test_empty_name_identifies_the_attribute(): void {
		$this->expect_field_error(
			'attributes.1.name',
			'Attribute 2 needs a name.',
			array(
				$this->custom_attribute( 'custom:color', 'Color', array( 'Black', 'White' ), 0 ),
				$this->custom_attribute( 'custom:size', '', array( 'S', 'M', 'L' ), 1 ),
			)
		);
	}

	public function test_woocommerce_normalized_name_collision_is_rejected(): void {
		$this->expect_field_error(
			'attributes.1',
			'Attribute 2 name “Size!” duplicates an earlier attribute after normalization.',
			array(
				$this->custom_attribute( 'custom:size', 'Size', array( 'S' ), 0 ),
				$this->custom_attribute( 'custom:size-alt', 'Size!', array( 'M' ), 1 ),
			)
		);
	}

	public function test_global_and_custom_woocommerce_name_collision_is_rejected(): void {
		$this->expect_field_error(
			'attributes.1',
			'Attribute 2 name “pa_size” duplicates an earlier attribute after normalization.',
			array(
				array(
					'key'          => 'global:7',
					'source'       => 'global',
					'name'         => 'Size',
					'attribute_id' => 7,
					'taxonomy'     => 'pa_size',
					'option_ids'   => array( 101 ),
					'visible'      => true,
					'variation'    => true,
					'position'     => 0,
				),
				$this->custom_attribute( 'custom:pa-size', 'pa_size', array( 'M' ), 1 ),
			)
		);
	}

	/** @return array<string, mixed> */
	private function custom_attribute( string $key, string $name, array $options, int $position ): array {
		return array(
			'key'       => $key,
			'source'    => 'custom',
			'name'      => $name,
			'options'   => $options,
			'visible'   => true,
			'variation' => true,
			'position'  => $position,
		);
	}

	/** @param array<int, array<string, mixed>> $attributes
	 * @return array<int, array<string, mixed>> */
	private function combinations( array $attributes ): array {
		$models = array_map(
			static fn ( array $attribute ): VariableAttribute => new VariableAttribute(
				array(
					'key'          => $attribute['key'],
					'source'       => 'custom',
					'name'         => $attribute['name'],
					'attribute_id' => 0,
					'taxonomy'     => '',
					'options'      => $attribute['options'],
					'visible'      => true,
					'variation'    => true,
					'position'     => $attribute['position'],
				)
			),
			$attributes
		);
		$result = array();
		foreach ( array_values( $this->generator->expected( $models ) ) as $index => $selections ) {
			$result[] = array(
				'client_id'      => sprintf( '20000000-0000-4000-8000-%012d', $index + 1 ),
				'variation_id'   => 0,
				'selections'     => $selections,
				'enabled'        => true,
				'regular_price'  => '10',
				'sale_price'     => null,
				'sku'            => 'CUSTOM-' . $index,
				'manage_stock'   => false,
				'stock_quantity' => null,
				'stock_status'   => 'instock',
				'image_id'       => 0,
			);
		}
		return $result;
	}

	/** @param array<int, array<string, mixed>> $attributes */
	private function expect_field_error( string $field, string $message, array $attributes ): void {
		try {
			$this->factory->from_array(
				array(
					'attributes'   => $attributes,
					'combinations' => array(),
				)
			);
			self::fail( 'Expected an invalid variation plan.' );
		} catch ( ApiException $exception ) {
			self::assertSame( array( $message ), $exception->fields()[ $field ] ?? array() );
		}
	}
}
