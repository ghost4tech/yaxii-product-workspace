<?php
/**
 * Per-user workspace preference tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Preferences\PreferenceService;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Tests\Support\FakePreferenceRepository;

final class PreferenceServiceTest extends TestCase {
	private PreferenceService $service;

	protected function setUp(): void {
		$this->service = new PreferenceService( new FakePreferenceRepository(), array( 'reduced-rate' ) );
	}

	public function test_defaults_are_stable_and_user_updates_are_isolated(): void {
		$defaults = $this->service->get( 10 );
		$updated  = $this->service->update(
			10,
			array(
				'auto_focus_name'   => false,
				'repeat_fields'     => array( 'category_ids', 'tax_status' ),
				'default_tax_class' => 'reduced-rate',
			)
		);

		self::assertTrue( $defaults['auto_focus_name'] );
		self::assertFalse( $updated['auto_focus_name'] );
		self::assertSame( array( 'category_ids', 'tax_status' ), $updated['repeat_fields'] );
		self::assertSame( 'reduced-rate', $updated['default_tax_class'] );
		self::assertTrue( $this->service->get( 11 )['auto_focus_name'] );
	}

	public function test_unknown_or_unapproved_preferences_are_rejected(): void {
		try {
			$this->service->update(
				10,
				array(
					'unknown_toggle'      => true,
					'repeat_fields'       => array( 'sku' ),
					'queue_rows_per_page' => 100,
				)
			);
			self::fail( 'Expected invalid preferences to be rejected.' );
		} catch ( ApiException $exception ) {
			self::assertSame( 'ypw_validation_failed', $exception->api_code() );
			self::assertArrayHasKey( '_request', $exception->fields() );
			self::assertArrayHasKey( 'repeat_fields', $exception->fields() );
			self::assertArrayHasKey( 'queue_rows_per_page', $exception->fields() );
		}
	}
}
