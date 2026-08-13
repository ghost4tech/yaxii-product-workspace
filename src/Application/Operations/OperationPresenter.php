<?php
/**
 * Recent-operation API resource mapping.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

use Yaxii\ProductWorkspace\Application\Products\OperationResult;

/**
 * Combines immutable ledger metadata with the canonical operation result.
 */
final class OperationPresenter {
	/** @return array<string, mixed> */
	public function present( OperationRecord $record, ?OperationResult $resolved = null ): array {
		if ( null !== $resolved ) {
			$resource = $resolved->to_array();
		} elseif ( null !== $record->result() ) {
			$resource = OperationResult::from_array( $record->result(), false )->to_array();
		} else {
			$resource = OperationResult::processing( $record->operation_id() )->to_array();
		}
		$resource['retry']['can_retry'] = $record->can_retry();
		$resource['input']              = $record->request();
		$resource['created_at']         = $record->created_at();
		$resource['updated_at']         = $record->updated_at();
		return $resource;
	}
}
