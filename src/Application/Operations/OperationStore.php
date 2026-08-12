<?php
/**
 * Operation persistence boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Provides atomic idempotency reservations and durable result storage.
 */
interface OperationStore {
	public function reserve(
		int $site_id,
		int $user_id,
		string $operation_type,
		string $idempotency_key,
		string $payload_hash
	): OperationReservation;

	public function find_for_user( string $operation_id, int $site_id, int $user_id ): ?OperationRecord;

	/**
	 * @param array<string, mixed> $result Canonical operation result.
	 */
	public function complete(
		string $operation_id,
		string $state,
		?int $product_id,
		array $result
	): void;
}
