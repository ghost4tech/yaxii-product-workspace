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
	public function reserve( OperationRequest $request ): OperationReservation;

	public function find_for_user( string $operation_id, int $site_id, int $user_id ): ?OperationRecord;

	/**
	 * @return array{items: array<int, OperationRecord>, total: int, counts: array{all: int, synced: int, draft: int, pending: int, error: int}}
	 */
	public function query_for_user( OperationQuery $query, int $site_id, int $user_id ): array;

	public function claim_retry( string $operation_id, int $site_id, int $user_id ): bool;

	public function dismiss_for_user( string $operation_id, int $site_id, int $user_id ): bool;

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
