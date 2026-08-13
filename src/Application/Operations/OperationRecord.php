<?php
/**
 * Durable operation record contract.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Immutable operation state read from persistence.
 */
final class OperationRecord {
	private string $operation_id;
	private string $payload_hash;
	private string $state;
	private ?int $product_id;

	/** @var array<string, mixed>|null */
	private ?array $result;

	/**
	 * @param array{operation_id: string, payload_hash: string, state: string, product_id: int|null, result: array<string, mixed>|null} $values Stored values.
	 */
	public function __construct( array $values ) {
		$this->operation_id = $values['operation_id'];
		$this->payload_hash = $values['payload_hash'];
		$this->state        = $values['state'];
		$this->product_id   = $values['product_id'];
		$this->result       = $values['result'];
	}

	public function operation_id(): string {
		return $this->operation_id;
	}

	public function payload_hash(): string {
		return $this->payload_hash;
	}

	public function state(): string {
		return $this->state;
	}

	public function product_id(): ?int {
		return $this->product_id;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function result(): ?array {
		return $this->result;
	}
}
