<?php
/**
 * Operation reservation request.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Carries the identity used for one atomic idempotency reservation.
 */
final class OperationRequest {
	private int $site_id;
	private int $user_id;
	private string $operation_type;
	private string $idempotency_key;
	private string $payload_hash;
	private string $payload_json;
	private string $product_name;
	private string $product_sku;

	/**
	 * @param array{site_id: int, user_id: int, operation_type: string, idempotency_key: string, payload_hash: string, payload_json: string, product_name: string, product_sku: string} $values Reservation values.
	 */
	public function __construct( array $values ) {
		$this->site_id         = $values['site_id'];
		$this->user_id         = $values['user_id'];
		$this->operation_type  = $values['operation_type'];
		$this->idempotency_key = $values['idempotency_key'];
		$this->payload_hash    = $values['payload_hash'];
		$this->payload_json    = $values['payload_json'];
		$this->product_name    = $values['product_name'];
		$this->product_sku     = $values['product_sku'];
	}

	public function site_id(): int {
		return $this->site_id;
	}

	public function user_id(): int {
		return $this->user_id;
	}

	public function operation_type(): string {
		return $this->operation_type;
	}

	public function idempotency_key(): string {
		return $this->idempotency_key;
	}

	public function payload_hash(): string {
		return $this->payload_hash;
	}

	public function payload_json(): string {
		return $this->payload_json;
	}

	public function product_name(): string {
		return $this->product_name;
	}

	public function product_sku(): string {
		return $this->product_sku;
	}
}
