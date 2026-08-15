<?php
/**
 * Product request boundary tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\ProductFieldParser;

final class CreateProductRequestFactoryTest extends TestCase {
	public function test_rejects_oversized_rich_text_fields(): void {
		$factory                      = new CreateProductRequestFactory( new ProductFieldParser() );
		$payload                      = $this->payload();
		$payload['description']       = str_repeat( 'x', 100001 );
		$payload['short_description'] = str_repeat( 'y', 10001 );

		try {
			$factory->from_array( $payload );
			self::fail( 'Expected oversized descriptions to be rejected.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_validation_failed', $exception->api_code() );
			self::assertArrayHasKey( 'description', $exception->fields() );
			self::assertArrayHasKey( 'short_description', $exception->fields() );
		}
	}

	/** @return array<string, mixed> */
	private function payload(): array {
		return array(
			'name'              => 'Bounded product',
			'regular_price'     => '10.00',
			'description'       => '',
			'short_description' => '',
			'category_ids'      => array( 1 ),
		);
	}
}
