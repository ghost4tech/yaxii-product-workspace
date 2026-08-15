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
	private string $operation_type;
	private string $state;
	private ?int $product_id;
	private ?string $created_at;
	private ?string $updated_at;
	private bool $dismissed;

	/** @var array<string, mixed>|null */
	private ?array $request;

	/** @var array<string, mixed>|null */
	private ?array $result;

	/**
	 * @param array{operation_id: string, payload_hash: string, state: string, product_id: int|null, result: array<string, mixed>|null, operation_type?: string, request?: array<string, mixed>|null, created_at?: string|null, updated_at?: string|null, dismissed?: bool} $values Stored values.
	 */
	public function __construct( array $values ) {
		$this->operation_id   = $values['operation_id'];
		$this->payload_hash   = $values['payload_hash'];
		$this->operation_type = $values['operation_type'] ?? 'simple_product_create';
		$this->state          = $values['state'];
		$this->product_id     = $values['product_id'];
		$this->result         = $values['result'];
		$this->request        = $values['request'] ?? null;
		$this->created_at     = $values['created_at'] ?? null;
		$this->updated_at     = $values['updated_at'] ?? null;
		$this->dismissed      = $values['dismissed'] ?? false;
	}

	public function operation_id(): string {
		return $this->operation_id;
	}

	public function payload_hash(): string {
		return $this->payload_hash;
	}

	public function operation_type(): string {
		return $this->operation_type;
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

	/** @return array<string, mixed>|null */
	public function request(): ?array {
		return $this->request;
	}

	public function created_at(): ?string {
		return $this->created_at;
	}

	public function updated_at(): ?string {
		return $this->updated_at;
	}

	public function is_dismissed(): bool {
		return $this->dismissed;
	}

	public function can_retry(): bool {
		if ( ! in_array( $this->state, array( 'failed', 'partial' ), true ) || null === $this->request || null === $this->result ) {
			return false;
		}
		if ( 'partial' === $this->state && 'variable_product_create' === $this->operation_type ) {
			return true;
		}
		$errors = $this->result['errors'] ?? null;
		return is_array( $errors )
			&& isset( $errors[0]['code'] )
			&& 'ypw_product_write_failed' === $errors[0]['code'];
	}
}
