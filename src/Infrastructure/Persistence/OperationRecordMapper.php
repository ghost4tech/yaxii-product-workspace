<?php
/**
 * Operation database-row mapping.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;

/**
 * Hydrates durable operation records without leaking database rows upstream.
 */
final class OperationRecordMapper {
	/** @param array<string, mixed>|null $row Database row. */
	public function from_row( ?array $row ): ?OperationRecord {
		if ( null === $row ) {
			return null;
		}
		return new OperationRecord(
			array(
				'operation_id'   => (string) $row['operation_id'],
				'operation_type' => (string) ( $row['operation_type'] ?? '' ),
				'payload_hash'   => (string) $row['payload_hash'],
				'state'          => (string) $row['state'],
				'product_id'     => isset( $row['product_id'] ) ? (int) $row['product_id'] : null,
				'result'         => $this->decode_json( $row['result_json'] ?? null ),
				'request'        => $this->decode_json( $row['request_json'] ?? null ),
				'created_at'     => isset( $row['created_at'] ) ? (string) $row['created_at'] : null,
				'updated_at'     => isset( $row['updated_at'] ) ? (string) $row['updated_at'] : null,
				'dismissed'      => ! empty( $row['dismissed_at'] ),
			)
		);
	}

	/** @param mixed $json Stored JSON value.
	 * @return array<string, mixed>|null */
	public function decode_json( $json ): ?array {
		if ( ! is_string( $json ) || '' === $json ) {
			return null;
		}
		$decoded = json_decode( $json, true );
		return is_array( $decoded ) ? $decoded : null;
	}
}
