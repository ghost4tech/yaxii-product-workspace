<?php
/**
 * In-memory operation store test double.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Support;

use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationRequest;
use Yaxii\ProductWorkspace\Application\Operations\OperationReservation;
use Yaxii\ProductWorkspace\Application\Operations\OperationQuery;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;

/**
 * Models unique-key reservation behavior without WordPress persistence.
 */
final class FakeOperationStore implements OperationStore {
	/** @var array<string, OperationRecord> */
	private array $records_by_key = array();

	/** @var array<string, string> */
	private array $keys_by_operation = array();

	public int $reserve_calls  = 0;
	public bool $fail_complete = false;

	public function reserve( OperationRequest $request ): OperationReservation {
		++$this->reserve_calls;
		$key = implode(
			':',
			array( $request->site_id(), $request->user_id(), $request->operation_type(), $request->idempotency_key() )
		);
		if ( isset( $this->records_by_key[ $key ] ) ) {
			$record = $this->records_by_key[ $key ];
			return new OperationReservation( $record, false, $record->payload_hash() !== $request->payload_hash() );
		}

		$operation_id                             = '00000000-0000-4000-8000-' . str_pad( (string) count( $this->records_by_key ), 12, '0', STR_PAD_LEFT );
		$decoded_request                          = json_decode( $request->payload_json(), true );
		$record                                   = new OperationRecord(
			array(
				'operation_id'   => $operation_id,
				'operation_type' => $request->operation_type(),
				'payload_hash'   => $request->payload_hash(),
				'state'          => 'processing',
				'product_id'     => null,
				'result'         => null,
				'request'        => is_array( $decoded_request ) ? $decoded_request : null,
				'created_at'     => '2026-08-13 12:00:00',
				'updated_at'     => '2026-08-13 12:00:00',
			)
		);
		$this->records_by_key[ $key ]             = $record;
		$this->keys_by_operation[ $operation_id ] = $key;

		return new OperationReservation( $record, true, false );
	}

	public function find_for_user( string $operation_id, int $site_id, int $user_id ): ?OperationRecord {
		unset( $site_id, $user_id );
		$key = $this->keys_by_operation[ $operation_id ] ?? null;
		return is_string( $key ) ? $this->records_by_key[ $key ] : null;
	}

	public function query_for_user( OperationQuery $query, int $site_id, int $user_id ): array {
		unset( $site_id, $user_id );
		$all     = array_values(
			array_filter(
				$this->records_by_key,
				static fn ( OperationRecord $record ): bool => ! $record->is_dismissed()
			)
		);
		$records = $all;
		$records = array_values(
			array_filter(
				$records,
				static fn ( OperationRecord $record ): bool => 'all' === $query->state()
					|| ( 'active' === $query->state() && in_array( $record->state(), array( 'processing', 'uncertain' ), true ) )
					|| ( 'error' === $query->state() && in_array( $record->state(), array( 'failed', 'partial' ), true ) )
					|| $query->state() === $record->state()
			)
		);
		return array(
			'items'  => array_slice( $records, $query->offset(), $query->per_page() ),
			'total'  => count( $records ),
			'counts' => array(
				'all'     => count( $all ),
				'synced'  => $this->count_status( $all, 'succeeded', 'publish' ),
				'draft'   => $this->count_non_published_success( $all ),
				'pending' => $this->count_active( $all ),
				'error'   => $this->count_status( $all, 'failed' ) + $this->count_status( $all, 'partial' ),
			),
		);
	}

	public function claim_retry( string $operation_id, int $site_id, int $user_id ): bool {
		unset( $site_id, $user_id );
		$key = $this->keys_by_operation[ $operation_id ] ?? null;
		if ( ! is_string( $key ) || ! in_array( $this->records_by_key[ $key ]->state(), array( 'failed', 'partial' ), true ) ) {
			return false;
		}
		$this->replace_record( $key, 'processing', null, null, false );
		return true;
	}

	public function dismiss_for_user( string $operation_id, int $site_id, int $user_id ): bool {
		unset( $site_id, $user_id );
		$key = $this->keys_by_operation[ $operation_id ] ?? null;
		if ( ! is_string( $key ) ) {
			return false;
		}
		$record = $this->records_by_key[ $key ];
		$this->replace_record( $key, $record->state(), $record->product_id(), $record->result(), true );
		return true;
	}

	public function complete( string $operation_id, string $state, ?int $product_id, array $result ): void {
		if ( $this->fail_complete ) {
			throw new \RuntimeException( 'Simulated operation result persistence failure.' );
		}

		$key = $this->keys_by_operation[ $operation_id ];
		$this->replace_record( $key, $state, $product_id, $result, false );
	}

	/** @param array<string, mixed>|null $result */
	private function replace_record( string $key, string $state, ?int $product_id, ?array $result, bool $dismissed ): void {
		$record                       = $this->records_by_key[ $key ];
		$this->records_by_key[ $key ] = new OperationRecord(
			array(
				'operation_id'   => $record->operation_id(),
				'operation_type' => $record->operation_type(),
				'payload_hash'   => $record->payload_hash(),
				'state'          => $state,
				'product_id'     => $product_id,
				'result'         => $result,
				'request'        => $record->request(),
				'created_at'     => $record->created_at(),
				'updated_at'     => '2026-08-13 12:01:00',
				'dismissed'      => $dismissed,
			)
		);
	}

	/** @param array<int, OperationRecord> $records */
	private function count_status( array $records, string $state, string $product_status = '' ): int {
		return count(
			array_filter(
				$records,
				static function ( OperationRecord $record ) use ( $state, $product_status ): bool {
					$product = $record->result()['product'] ?? null;
					return $state === $record->state()
						&& ( '' === $product_status || ( is_array( $product ) && ( $product['status'] ?? '' ) === $product_status ) );
				}
			)
		);
	}

	/** @param array<int, OperationRecord> $records */
	private function count_non_published_success( array $records ): int {
		return count(
			array_filter(
				$records,
				static function ( OperationRecord $record ): bool {
					$product = $record->result()['product'] ?? null;
					return 'succeeded' === $record->state()
						&& ( ! is_array( $product ) || 'publish' !== ( $product['status'] ?? '' ) );
				}
			)
		);
	}

	/** @param array<int, OperationRecord> $records */
	private function count_active( array $records ): int {
		return count(
			array_filter(
				$records,
				static fn ( OperationRecord $record ): bool => in_array( $record->state(), array( 'processing', 'uncertain' ), true )
			)
		);
	}
}
