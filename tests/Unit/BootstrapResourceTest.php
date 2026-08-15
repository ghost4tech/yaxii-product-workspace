<?php
/**
 * Bootstrap resource tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Bootstrap\BootstrapResource;

/**
 * Verifies that the immutable resource returns its validated payload.
 */
final class BootstrapResourceTest extends TestCase {
	public function test_it_returns_the_original_resource_data(): void {
		$data = array(
			'locale' => array(
				'code'      => 'en_US',
				'direction' => 'ltr',
			),
			'limits' => array( 'max_images' => 10 ),
		);

		self::assertSame( $data, ( new BootstrapResource( $data ) )->to_array() );
	}
}
