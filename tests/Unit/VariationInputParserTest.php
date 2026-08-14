<?php
/**
 * Variation commercial-field validation tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationInputParser;

final class VariationInputParserTest extends TestCase {
	private VariationInputParser $parser;

	protected function setUp(): void {
		$this->parser = new VariationInputParser();
	}

	public function test_enabled_variation_requires_a_valid_price(): void {
		$this->expectFieldError( 'combinations.0.regular_price', array( 'regular_price' => '' ) );
		$this->expectFieldError( 'combinations.0.regular_price', array( 'regular_price' => '-2' ) );
	}

	public function test_sale_price_cannot_exceed_regular_price(): void {
		$this->expectFieldError(
			'combinations.0.sale_price',
			array(
				'regular_price' => '10',
				'sale_price'    => '11',
			)
		);
	}

	public function test_disabled_variation_can_have_no_price(): void {
		$parsed = $this->parser->parse(
			$this->input(
				array(
					'enabled'       => false,
					'regular_price' => '',
				)
			),
			0
		);
		self::assertSame( '', $parsed['fields']['regular_price'] );
	}

	/** @param array<string, mixed> $changes */
	private function expectFieldError( string $field, array $changes ): void {
		try {
			$this->parser->parse( $this->input( $changes ), 0 );
			self::fail( 'Expected invalid variation fields.' );
		} catch ( ApiException $exception ) {
			self::assertArrayHasKey( $field, $exception->fields() );
		}
	}

	/** @param array<string, mixed> $changes
	 * @return array<string, mixed> */
	private function input( array $changes ): array {
		return array_merge(
			array(
				'client_id'      => '10000000-0000-4000-8000-000000000001',
				'variation_id'   => 0,
				'selections'     => array(),
				'enabled'        => true,
				'regular_price'  => '10',
				'sale_price'     => null,
				'sku'            => '',
				'manage_stock'   => false,
				'stock_quantity' => null,
				'stock_status'   => 'instock',
				'image_id'       => 0,
			),
			$changes
		);
	}
}
