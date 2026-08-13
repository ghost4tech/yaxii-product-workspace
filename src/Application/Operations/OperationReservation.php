<?php
/**
 * Idempotency reservation result.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Describes whether a caller owns a new operation or found an existing one.
 */
final class OperationReservation {
	private OperationRecord $record;
	private bool $created;
	private bool $conflict;

	public function __construct( OperationRecord $record, bool $created, bool $conflict ) {
		$this->record   = $record;
		$this->created  = $created;
		$this->conflict = $conflict;
	}

	public function record(): OperationRecord {
		return $this->record;
	}

	public function was_created(): bool {
		return $this->created;
	}

	public function is_conflict(): bool {
		return $this->conflict;
	}
}
