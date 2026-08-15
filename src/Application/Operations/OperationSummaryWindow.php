<?php
/**
 * Bounded operation-summary time window.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Defines two adjacent seven-day periods and daily graph buckets.
 */
final class OperationSummaryWindow {
	private const BUCKET_COUNT = 7;
	private const BUCKET_HOURS = 24;

	private DateTimeImmutable $ends_at;

	public function __construct( DateTimeImmutable $ends_at ) {
		$this->ends_at = $ends_at->setTimezone( new DateTimeZone( 'UTC' ) );
	}

	public function current_starts_at(): DateTimeImmutable {
		return $this->ends_at->modify( '-' . self::BUCKET_COUNT . ' days' );
	}

	public function previous_starts_at(): DateTimeImmutable {
		return $this->ends_at->modify( '-' . ( self::BUCKET_COUNT * 2 ) . ' days' );
	}

	public function ends_at(): DateTimeImmutable {
		return $this->ends_at;
	}

	public function bucket_count(): int {
		return self::BUCKET_COUNT;
	}

	/** @return array<int, string> */
	public function current_bucket_starts(): array {
		$starts_at = $this->current_starts_at();
		$buckets   = array();
		for ( $index = 0; $index < self::BUCKET_COUNT; ++$index ) {
			$buckets[] = $starts_at->modify( '+' . $index . ' days' )->format( DATE_ATOM );
		}
		return $buckets;
	}

	/** @return array{starts_at: string, ends_at: string, previous_starts_at: string, bucket_hours: int} */
	public function to_array(): array {
		return array(
			'starts_at'          => $this->current_starts_at()->format( DATE_ATOM ),
			'ends_at'            => $this->ends_at->format( DATE_ATOM ),
			'previous_starts_at' => $this->previous_starts_at()->format( DATE_ATOM ),
			'bucket_hours'       => self::BUCKET_HOURS,
		);
	}

	public function sql_datetime( DateTimeImmutable $date ): string {
		return $date->format( 'Y-m-d H:i:s' );
	}
}
