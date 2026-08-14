<?php
/**
 * Bounded operation pulse persistence.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use Yaxii\ProductWorkspace\Application\Operations\OperationSummaryWindow;

defined( 'ABSPATH' ) || exit;

/**
 * Aggregates recent ledger outcomes with one indexed query.
 */
final class WpdbOperationMetrics {
	private \wpdb $database;
	private string $table_name;

	public function __construct( \wpdb $database, string $table_name ) {
		$this->database   = $database;
		$this->table_name = $table_name;
	}

	/**
	 * @return array{
	 *   current: array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int},
	 *   previous: array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int},
	 *   buckets: array<int, array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int}>
	 * }
	 */
	public function summarize( OperationSummaryWindow $window, int $site_id, int $user_id ): array {
		$buckets = array_fill( 0, $window->bucket_count() * 2, $this->empty_counts() );
		foreach ( $this->metric_rows( $window, $site_id, $user_id ) as $row ) {
			$index = (int) $row['bucket_index'];
			if ( isset( $buckets[ $index ] ) ) {
				$buckets[ $index ] = $this->counts_from_row( $row );
			}
		}
		$previous = array_slice( $buckets, 0, $window->bucket_count() );
		$current  = array_slice( $buckets, $window->bucket_count() );
		return array(
			'current'  => $this->sum_counts( $current ),
			'previous' => $this->sum_counts( $previous ),
			'buckets'  => $current,
		);
	}

	/** @return array<int, array<string, int|string>> */
	private function metric_rows( OperationSummaryWindow $window, int $site_id, int $user_id ): array {
		$previous_start = $window->sql_datetime( $window->previous_starts_at() );
		$sql            = $this->database->prepare(
			"SELECT FLOOR(TIMESTAMPDIFF(SECOND, %s, updated_at) / 86400) AS bucket_index,
			COUNT(*) AS operations_count,
			SUM(state = 'succeeded' AND product_status = 'publish') AS published_count,
			SUM(state = 'succeeded') AS succeeded_count,
			SUM(state IN ('succeeded', 'failed', 'partial')) AS eligible_count,
			SUM(dismissed_at IS NULL AND state IN ('failed', 'partial', 'uncertain')) AS attention_count
			FROM %i WHERE site_id = %d AND user_id = %d AND updated_at >= %s AND updated_at < %s
			GROUP BY bucket_index ORDER BY bucket_index",
			$previous_start,
			$this->table_name,
			$site_id,
			$user_id,
			$previous_start,
			$window->sql_datetime( $window->ends_at() )
		);
		$rows           = $this->database->get_results( $sql, ARRAY_A );
		return is_array( $rows ) ? $rows : array();
	}

	/** @return array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int} */
	private function empty_counts(): array {
		return array(
			'operations'      => 0,
			'published'       => 0,
			'succeeded'       => 0,
			'eligible'        => 0,
			'needs_attention' => 0,
		);
	}

	/** @param array<string, int|string> $row
	 * @return array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int} */
	private function counts_from_row( array $row ): array {
		return array(
			'operations'      => (int) ( $row['operations_count'] ?? 0 ),
			'published'       => (int) ( $row['published_count'] ?? 0 ),
			'succeeded'       => (int) ( $row['succeeded_count'] ?? 0 ),
			'eligible'        => (int) ( $row['eligible_count'] ?? 0 ),
			'needs_attention' => (int) ( $row['attention_count'] ?? 0 ),
		);
	}

	/** @param array<int, array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int}> $buckets
	 * @return array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int} */
	private function sum_counts( array $buckets ): array {
		$totals = $this->empty_counts();
		foreach ( $buckets as $counts ) {
			foreach ( $totals as $metric => $total ) {
				$totals[ $metric ] = $total + $counts[ $metric ];
			}
		}
		return $totals;
	}
}
