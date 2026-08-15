<?php
/**
 * Operation summary window tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Unit;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Application\Operations\OperationSummaryWindow;

final class OperationSummaryWindowTest extends TestCase {
	public function test_window_defines_adjacent_seven_day_periods_and_daily_buckets(): void {
		$window  = new OperationSummaryWindow( new DateTimeImmutable( '2026-08-14T12:00:00+02:00' ) );
		$payload = $window->to_array();
		$buckets = $window->current_bucket_starts();

		self::assertSame( '2026-08-07T10:00:00+00:00', $payload['starts_at'] );
		self::assertSame( '2026-07-31T10:00:00+00:00', $payload['previous_starts_at'] );
		self::assertSame( '2026-08-14T10:00:00+00:00', $payload['ends_at'] );
		self::assertSame( 24, $payload['bucket_hours'] );
		self::assertCount( 7, $buckets );
		self::assertSame( '2026-08-13T10:00:00+00:00', $buckets[6] );
	}
}
