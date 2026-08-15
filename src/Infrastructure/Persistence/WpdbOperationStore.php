<?php
/**
 * wpdb operation persistence adapter.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationRequest;
use Yaxii\ProductWorkspace\Application\Operations\OperationReservation;
use Yaxii\ProductWorkspace\Application\Operations\OperationQuery;
use Yaxii\ProductWorkspace\Application\Operations\OperationMetricsStore;
use Yaxii\ProductWorkspace\Application\Operations\OperationSummaryWindow;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;

defined( 'ABSPATH' ) || exit;

/**
 * Uses a unique database key to serialize create commands safely.
 */
final class WpdbOperationStore implements OperationStore, OperationMetricsStore {
	private \wpdb $database;
	private string $table_name;
	private OperationRecordMapper $mapper;
	private WpdbOperationHistory $history;
	private WpdbOperationMetrics $metrics;

	public function __construct( \wpdb $database, string $table_name ) {
		$this->database   = $database;
		$this->table_name = $table_name;
		$this->mapper     = new OperationRecordMapper();
		$this->history    = new WpdbOperationHistory( $database, $table_name, $this->mapper );
		$this->metrics    = new WpdbOperationMetrics( $database, $table_name );
	}

	public function reserve( OperationRequest $request ): OperationReservation {
		$operation_id     = wp_generate_uuid4();
		$idempotency_hash = hash_hmac( 'sha256', $request->idempotency_key(), wp_salt( 'auth' ) );
		$timestamp        = current_time( 'mysql', true );
		$previous_errors  = $this->database->suppress_errors( true );
		$inserted         = $this->database->insert(
			$this->table_name,
			array(
				'operation_id'     => $operation_id,
				'site_id'          => $request->site_id(),
				'user_id'          => $request->user_id(),
				'operation_type'   => $request->operation_type(),
				'idempotency_hash' => $idempotency_hash,
				'payload_hash'     => $request->payload_hash(),
				'request_json'     => $request->payload_json(),
				'state'            => 'processing',
				'product_name'     => $request->product_name(),
				'product_sku'      => $request->product_sku(),
				'created_at'       => $timestamp,
				'updated_at'       => $timestamp,
			),
			array( '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		$this->database->suppress_errors( $previous_errors );

		if ( false !== $inserted ) {
			$record = new OperationRecord(
				array(
					'operation_id'   => $operation_id,
					'payload_hash'   => $request->payload_hash(),
					'operation_type' => $request->operation_type(),
					'state'          => 'processing',
					'product_id'     => null,
					'result'         => null,
					'request'        => $this->mapper->decode_json( $request->payload_json() ),
					'created_at'     => $timestamp,
					'updated_at'     => $timestamp,
				)
			);
			return new OperationReservation( $record, true, false );
		}

		$record = $this->find_by_key(
			$request->site_id(),
			$request->user_id(),
			$request->operation_type(),
			$idempotency_hash
		);
		if ( null === $record ) {
			throw new RuntimeException( 'Unable to reserve the product operation.' );
		}

		return new OperationReservation(
			$record,
			false,
			! hash_equals( $record->payload_hash(), $request->payload_hash() )
		);
	}

	public function find_for_user( string $operation_id, int $site_id, int $user_id ): ?OperationRecord {
		$sql = $this->database->prepare(
			'SELECT operation_id, operation_type, payload_hash, request_json, state, product_id, result_json, created_at, updated_at, dismissed_at FROM %i WHERE operation_id = %s AND site_id = %d AND user_id = %d',
			$this->table_name,
			$operation_id,
			$site_id,
			$user_id
		);

		return $this->mapper->from_row( $this->database->get_row( $sql, ARRAY_A ) );
	}

	public function query_for_user( OperationQuery $query, int $site_id, int $user_id ): array {
		return $this->history->query( $query, $site_id, $user_id );
	}

	public function summarize_for_user( OperationSummaryWindow $window, int $site_id, int $user_id ): array {
		return $this->metrics->summarize( $window, $site_id, $user_id );
	}

	public function claim_retry( string $operation_id, int $site_id, int $user_id ): bool {
		$sql     = $this->database->prepare(
			'UPDATE %i SET state = %s, result_json = NULL, updated_at = %s WHERE operation_id = %s AND site_id = %d AND user_id = %d AND state IN (%s, %s) AND dismissed_at IS NULL',
			$this->table_name,
			'processing',
			current_time( 'mysql', true ),
			$operation_id,
			$site_id,
			$user_id,
			'failed',
			'partial'
		);
		$updated = $this->database->query( $sql );
		return 1 === $updated;
	}

	public function dismiss_for_user( string $operation_id, int $site_id, int $user_id ): bool {
		return $this->history->dismiss( $operation_id, $site_id, $user_id );
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

		$values  = array(
			'state'       => $state,
			'product_id'  => $product_id,
			'result_json' => $result_json,
			'updated_at'  => current_time( 'mysql', true ),
		);
		$formats = array( '%s', '%d', '%s', '%s' );
		$product = $result['product'] ?? null;
		if ( is_array( $product ) ) {
			$values['product_name']   = sanitize_text_field( (string) ( $product['name'] ?? '' ) );
			$values['product_sku']    = sanitize_text_field( (string) ( $product['sku'] ?? '' ) );
			$values['product_status'] = sanitize_key( (string) ( $product['status'] ?? '' ) );
			$formats[]                = '%s';
			$formats[]                = '%s';
			$formats[]                = '%s';
		}

		$updated = $this->database->update(
			$this->table_name,
			$values,
			array( 'operation_id' => $operation_id ),
			$formats,
			array( '%s' )
		);

		if ( false === $updated ) {
			throw new RuntimeException( 'Unable to persist the product operation result.' );
		}
		$this->history->prune_for_operation( $operation_id );
	}

	private function find_by_key(
		int $site_id,
		int $user_id,
		string $operation_type,
		string $idempotency_hash
	): ?OperationRecord {
		$sql = $this->database->prepare(
			'SELECT operation_id, operation_type, payload_hash, request_json, state, product_id, result_json, created_at, updated_at, dismissed_at FROM %i WHERE site_id = %d AND user_id = %d AND operation_type = %s AND idempotency_hash = %s',
			$this->table_name,
			$site_id,
			$user_id,
			$operation_type,
			$idempotency_hash
		);

		return $this->mapper->from_row( $this->database->get_row( $sql, ARRAY_A ) );
	}
}
