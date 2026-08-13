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
		$record                                   = new OperationRecord(
			array(
				'operation_id' => $operation_id,
				'payload_hash' => $request->payload_hash(),
				'state'        => 'processing',
				'product_id'   => null,
				'result'       => null,
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

	public function complete( string $operation_id, string $state, ?int $product_id, array $result ): void {
		if ( $this->fail_complete ) {
			throw new \RuntimeException( 'Simulated operation result persistence failure.' );
		}

		$key                          = $this->keys_by_operation[ $operation_id ];
		$record                       = $this->records_by_key[ $key ];
		$this->records_by_key[ $key ] = new OperationRecord(
			array(
				'operation_id' => $operation_id,
				'payload_hash' => $record->payload_hash(),
				'state'        => $state,
				'product_id'   => $product_id,
				'result'       => $result,
			)
		);
	}
}
