<?php
/**
 * Operation pulse persistence boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Reads bounded, per-user operation aggregates.
 */
interface OperationMetricsStore {
	/**
	 * @return array{
	 *   current: array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int},
	 *   previous: array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int},
	 *   buckets: array<int, array{operations: int, published: int, succeeded: int, eligible: int, needs_attention: int}>
	 * }
	 */
	public function summarize_for_user( OperationSummaryWindow $window, int $site_id, int $user_id ): array;
}
