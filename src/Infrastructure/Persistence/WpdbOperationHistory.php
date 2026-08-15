<?php
/**
 * Bounded operation history persistence.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use Yaxii\ProductWorkspace\Application\Operations\OperationQuery;

defined( 'ABSPATH' ) || exit;

/**
 * Owns list, dismissal, and retention queries for the recent-operation queue.
 */
final class WpdbOperationHistory {
	private \wpdb $database;
	private string $table_name;
	private OperationRecordMapper $mapper;

	public function __construct( \wpdb $database, string $table_name, OperationRecordMapper $mapper ) {
		$this->database   = $database;
		$this->table_name = $table_name;
		$this->mapper     = $mapper;
	}

	/** @return array{items: array<int, \Yaxii\ProductWorkspace\Application\Operations\OperationRecord>, total: int, counts: array{all: int, synced: int, draft: int, pending: int, error: int}} */
	public function query( OperationQuery $query, int $site_id, int $user_id ): array {
		$base_conditions = ' FROM %i WHERE site_id = %d AND user_id = %d AND dismissed_at IS NULL';
		$base_values     = array( $this->table_name, $site_id, $user_id );
		if ( '' !== $query->search() ) {
			$like             = '%' . $this->database->esc_like( $query->search() ) . '%';
			$base_conditions .= ' AND (product_name LIKE %s OR product_sku LIKE %s)';
			$base_values[]    = $like;
			$base_values[]    = $like;
		}
		$conditions = $base_conditions;
		$values     = $base_values;
		if ( 'active' === $query->state() ) {
			$conditions .= " AND state IN ('processing', 'uncertain')";
		} elseif ( 'error' === $query->state() ) {
			$conditions .= " AND state IN ('failed', 'partial')";
		} elseif ( 'all' !== $query->state() ) {
			$conditions .= ' AND state = %s';
			$values[]    = $query->state();
		}
		if ( '' !== $query->product_status() ) {
			if ( 'unpublished' === $query->product_status() ) {
				$conditions .= " AND product_status <> 'publish'";
			} else {
				$conditions .= ' AND product_status = %s';
				$values[]    = $query->product_status();
			}
		}

		$count_sql = $this->database->prepare( 'SELECT COUNT(*)' . $conditions, $values );
		$list_sql  = $this->database->prepare(
			'SELECT operation_id, operation_type, payload_hash, request_json, state, product_id, result_json, created_at, updated_at, dismissed_at'
			. $conditions . ' ORDER BY updated_at DESC, operation_id DESC LIMIT %d OFFSET %d',
			array_merge( $values, array( $query->per_page(), $query->offset() ) )
		);
		$records   = array();
		foreach ( $this->database->get_results( $list_sql, ARRAY_A ) as $row ) {
			$record = $this->mapper->from_row( $row );
			if ( null !== $record ) {
				$records[] = $record;
			}
		}
		return array(
			'items'  => $records,
			'total'  => (int) $this->database->get_var( $count_sql ),
			'counts' => $this->counts( $base_conditions, $base_values ),
		);
	}

	/** @param array<int, int|string> $values
	 * @return array{all: int, synced: int, draft: int, pending: int, error: int} */
	private function counts( string $conditions, array $values ): array {
		$sql = $this->database->prepare(
			"SELECT COUNT(*) AS all_count,
			SUM(state = 'succeeded' AND product_status = 'publish') AS synced_count,
			SUM(state = 'succeeded' AND product_status <> 'publish') AS draft_count,
			SUM(state IN ('processing', 'uncertain')) AS pending_count,
			SUM(state IN ('failed', 'partial')) AS error_count" . $conditions,
			$values
		);
		$row = $this->database->get_row( $sql, ARRAY_A );
		return array(
			'all'     => (int) ( $row['all_count'] ?? 0 ),
			'synced'  => (int) ( $row['synced_count'] ?? 0 ),
			'draft'   => (int) ( $row['draft_count'] ?? 0 ),
			'pending' => (int) ( $row['pending_count'] ?? 0 ),
			'error'   => (int) ( $row['error_count'] ?? 0 ),
		);
	}

	public function dismiss( string $operation_id, int $site_id, int $user_id ): bool {
		$sql     = $this->database->prepare(
			"UPDATE %i SET dismissed_at = %s
			WHERE operation_id = %s AND site_id = %d AND user_id = %d
			AND state IN ('succeeded', 'failed', 'partial') AND dismissed_at IS NULL",
			$this->table_name,
			current_time( 'mysql', true ),
			$operation_id,
			$site_id,
			$user_id
		);
		$updated = $this->database->query( $sql );
		if ( 1 === $updated ) {
			$this->prune_for_user( $site_id, $user_id );
		}
		return 1 === $updated;
	}

	public function prune_for_operation( string $operation_id ): void {
		$sql = $this->database->prepare( 'SELECT site_id, user_id FROM %i WHERE operation_id = %s', $this->table_name, $operation_id );
		$row = $this->database->get_row( $sql, ARRAY_A );
		if ( is_array( $row ) ) {
			$this->prune_for_user( (int) $row['site_id'], (int) $row['user_id'] );
		}
	}

	private function prune_for_user( int $site_id, int $user_id ): void {
		$sql = $this->database->prepare(
			"DELETE FROM %i WHERE site_id = %d AND user_id = %d AND state NOT IN ('processing', 'uncertain')
			AND operation_id NOT IN (
				SELECT operation_id FROM (
					SELECT operation_id FROM %i WHERE site_id = %d AND user_id = %d AND state NOT IN ('processing', 'uncertain')
					ORDER BY updated_at DESC, operation_id DESC LIMIT 200
				) AS ypw_retained_operations
			)",
			$this->table_name,
			$site_id,
			$user_id,
			$this->table_name,
			$site_id,
			$user_id
		);
		$this->database->query( $sql );
	}
}
