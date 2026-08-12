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
	 * @param array<string, mixed>|null $result Canonical stored result.
	 */
	public function __construct(
		string $operation_id,
		string $payload_hash,
		string $state,
		?int $product_id,
		?array $result
	) {
		$this->operation_id = $operation_id;
		$this->payload_hash = $payload_hash;
		$this->state        = $state;
		$this->product_id   = $product_id;
		$this->result       = $result;
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
