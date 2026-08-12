<?php
/**
 * Server-authoritative operation result.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Stable resource shared by create and reconciliation endpoints.
 */
final class OperationResult {
	private string $operation_id;
	private string $state;

	/** @var array<string, mixed>|null */
	private ?array $product;

	/** @var array<int, string> */
	private array $warnings;

	/** @var array<int, array<string, mixed>> */
	private array $errors;
	private bool $replayed;
	private int $http_status;

	/**
	 * @param array<string, mixed>|null        $product  Canonical product summary.
	 * @param array<int, string>               $warnings Non-blocking warnings.
	 * @param array<int, array<string, mixed>> $errors   Structured errors.
	 */
	public function __construct(
		string $operation_id,
		string $state,
		?array $product,
		array $warnings,
		array $errors,
		bool $replayed,
		int $http_status
	) {
		$this->operation_id = $operation_id;
		$this->state        = $state;
		$this->product      = $product;
		$this->warnings     = $warnings;
		$this->errors       = $errors;
		$this->replayed     = $replayed;
		$this->http_status  = $http_status;
	}

	/**
	 * @param array<string, mixed> $product Canonical product summary.
	 */
	public static function succeeded( string $operation_id, array $product, bool $replayed = false ): self {
		return new self( $operation_id, 'succeeded', $product, array(), array(), $replayed, $replayed ? 200 : 201 );
	}

	/**
	 * @param array<string, array<string>> $fields Field-addressable messages.
	 */
	public static function failed(
		string $operation_id,
		string $code,
		string $message,
		array $fields,
		int $http_status
	): self {
		return new self(
			$operation_id,
			'failed',
			null,
			array(),
			array(
				array(
					'code'    => $code,
					'message' => $message,
					'fields'  => $fields,
				),
			),
			false,
			$http_status
		);
	}

	public static function processing( string $operation_id, bool $uncertain = false ): self {
		return new self(
			$operation_id,
			$uncertain ? 'uncertain' : 'processing',
			null,
			array(),
			array(),
			true,
			202
		);
	}

	/**
	 * @param array<string, mixed> $data Stored operation result.
	 */
	public static function from_array( array $data, bool $replayed = true ): self {
		$product  = isset( $data['product'] ) && is_array( $data['product'] ) ? $data['product'] : null;
		$warnings = isset( $data['warnings'] ) && is_array( $data['warnings'] ) ? $data['warnings'] : array();
		$errors   = isset( $data['errors'] ) && is_array( $data['errors'] ) ? $data['errors'] : array();
		$status   = isset( $data['http_status'] ) ? (int) $data['http_status'] : 200;

		return new self(
			(string) ( $data['operation_id'] ?? '' ),
			(string) ( $data['state'] ?? 'failed' ),
			$product,
			array_values( array_filter( $warnings, 'is_string' ) ),
			array_values( array_filter( $errors, 'is_array' ) ),
			$replayed,
			( $data['state'] ?? null ) === 'succeeded' ? 200 : $status
		);
	}

	public function operation_id(): string {
		return $this->operation_id;
	}

	public function state(): string {
		return $this->state;
	}

	public function http_status(): int {
		return $this->http_status;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function product(): ?array {
		return $this->product;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return array(
			'operation_id' => $this->operation_id,
			'state'        => $this->state,
			'product'      => $this->product,
			'warnings'     => $this->warnings,
			'errors'       => $this->errors,
			'replayed'     => $this->replayed,
			'retry'        => array(
				'can_reconcile'    => in_array( $this->state, array( 'processing', 'uncertain', 'failed' ), true ),
				'safe_to_resubmit' => in_array( $this->state, array( 'processing', 'uncertain' ), true ),
			),
			'http_status'  => $this->http_status,
		);
	}
}
