<?php
/**
 * wpdb operation persistence adapter.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationReservation;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;

defined( 'ABSPATH' ) || exit;

/**
 * Uses a unique database key to serialize create commands safely.
 */
final class WpdbOperationStore implements OperationStore {
	private \wpdb $database;
	private string $table_name;

	public function __construct( \wpdb $database, string $table_name ) {
		$this->database   = $database;
		$this->table_name = $table_name;
	}

	public function reserve(
		int $site_id,
		int $user_id,
		string $operation_type,
		string $idempotency_key,
		string $payload_hash
	): OperationReservation {
		$operation_id     = wp_generate_uuid4();
		$idempotency_hash = hash_hmac( 'sha256', $idempotency_key, wp_salt( 'auth' ) );
		$timestamp        = current_time( 'mysql', true );
		$previous_errors  = $this->database->suppress_errors( true );
		$inserted         = $this->database->insert(
			$this->table_name,
			array(
				'operation_id'     => $operation_id,
				'site_id'          => $site_id,
				'user_id'          => $user_id,
				'operation_type'   => $operation_type,
				'idempotency_hash' => $idempotency_hash,
				'payload_hash'     => $payload_hash,
				'state'            => 'processing',
				'created_at'       => $timestamp,
				'updated_at'       => $timestamp,
			),
			array( '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		$this->database->suppress_errors( $previous_errors );

		if ( false !== $inserted ) {
			$record = new OperationRecord( $operation_id, $payload_hash, 'processing', null, null );
			return new OperationReservation( $record, true, false );
		}

		$record = $this->find_by_key( $site_id, $user_id, $operation_type, $idempotency_hash );
		if ( null === $record ) {
			throw new RuntimeException( 'Unable to reserve the product operation.' );
		}

		return new OperationReservation(
			$record,
			false,
			! hash_equals( $record->payload_hash(), $payload_hash )
		);
	}

	public function find_for_user( string $operation_id, int $site_id, int $user_id ): ?OperationRecord {
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is generated from wpdb prefix.
		$sql = $this->database->prepare(
			"SELECT operation_id, payload_hash, state, product_id, result_json FROM {$this->table_name} WHERE operation_id = %s AND site_id = %d AND user_id = %d",
			$operation_id,
			$site_id,
			$user_id
		);

		return $this->record_from_row( $this->database->get_row( $sql, ARRAY_A ) );
	}

	public function complete(
		string $operation_id,
		string $state,
		?int $product_id,
		array $result
	): void {
		$result_json = wp_json_encode( $result );
		if ( false === $result_json ) {
			throw new RuntimeException( 'Unable to encode the product operation result.' );
		}

		$updated = $this->database->update(
			$this->table_name,
			array(
				'state'       => $state,
				'product_id'  => $product_id,
				'result_json' => $result_json,
				'updated_at'  => current_time( 'mysql', true ),
			),
			array( 'operation_id' => $operation_id ),
			array( '%s', '%d', '%s', '%s' ),
			array( '%s' )
		);

		if ( false === $updated ) {
			throw new RuntimeException( 'Unable to persist the product operation result.' );
		}
	}

	private function find_by_key(
		int $site_id,
		int $user_id,
		string $operation_type,
		string $idempotency_hash
	): ?OperationRecord {
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is generated from wpdb prefix.
		$sql = $this->database->prepare(
			"SELECT operation_id, payload_hash, state, product_id, result_json FROM {$this->table_name} WHERE site_id = %d AND user_id = %d AND operation_type = %s AND idempotency_hash = %s",
			$site_id,
			$user_id,
			$operation_type,
			$idempotency_hash
		);

		return $this->record_from_row( $this->database->get_row( $sql, ARRAY_A ) );
	}

	/**
	 * @param array<string, mixed>|null $row Database row.
	 */
	private function record_from_row( ?array $row ): ?OperationRecord {
		if ( null === $row ) {
			return null;
		}

		$result = null;
		if ( isset( $row['result_json'] ) && is_string( $row['result_json'] ) ) {
			$decoded = json_decode( $row['result_json'], true );
			$result  = is_array( $decoded ) ? $decoded : null;
		}

		return new OperationRecord(
			(string) $row['operation_id'],
			(string) $row['payload_hash'],
			(string) $row['state'],
			isset( $row['product_id'] ) ? (int) $row['product_id'] : null,
			$result
		);
	}
}
