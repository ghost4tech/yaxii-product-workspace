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
	/** @var array<int, array<string, mixed>> */
	private array $combination_results;
	private bool $replayed;
	private int $http_status;

	/**
	 * @param array{operation_id: string, state: string, product: array<string, mixed>|null, warnings: array<int, string>, errors: array<int, array<string, mixed>>, combination_results?: array<int, array<string, mixed>>, replayed: bool, http_status: int} $values Resource values.
	 */
	private function __construct( array $values ) {
		$this->operation_id        = $values['operation_id'];
		$this->state               = $values['state'];
		$this->product             = $values['product'];
		$this->warnings            = $values['warnings'];
		$this->errors              = $values['errors'];
		$this->combination_results = $values['combination_results'] ?? array();
		$this->replayed            = $values['replayed'];
		$this->http_status         = $values['http_status'];
	}

	/**
	 * @param array<string, mixed>             $product Parent product resource.
	 * @param array<int, array<string, mixed>> $combination_results Exact write outcomes.
	 */
	public static function partial( string $operation_id, array $product, array $combination_results, bool $replayed = false ): self {
		return new self(
			array(
				'operation_id'        => $operation_id,
				'state'               => 'partial',
				'product'             => $product,
				'warnings'            => array( __( 'Some variations were not saved. Retry reconciliation before publishing.', 'yaxii-product-workspace' ) ),
				'errors'              => array(),
				'combination_results' => $combination_results,
				'replayed'            => $replayed,
				'http_status'         => 207,
			)
		);
	}

	/**
	 * @param array<string, mixed> $product Canonical product summary.
	 */
	/** @param array<string, mixed> $product Canonical product summary.
	 * @param array<int, array<string, mixed>> $combination_results Exact variation outcomes when applicable. */
	public static function succeeded( string $operation_id, array $product, bool $replayed = false, array $combination_results = array() ): self {
		return new self(
			array(
				'operation_id'        => $operation_id,
				'state'               => 'succeeded',
				'product'             => $product,
				'warnings'            => array(),
				'errors'              => array(),
				'combination_results' => $combination_results,
				'replayed'            => $replayed,
				'http_status'         => $replayed ? 200 : 201,
			)
		);
	}

	public static function failed( string $operation_id, OperationFailure $failure ): self {
		return new self(
			array(
				'operation_id' => $operation_id,
				'state'        => 'failed',
				'product'      => null,
				'warnings'     => array(),
				'errors'       => array( $failure->to_array() ),
				'replayed'     => false,
				'http_status'  => $failure->http_status(),
			)
		);
	}

	public static function processing( string $operation_id, bool $uncertain = false, bool $replayed = true ): self {
		return new self(
			array(
				'operation_id' => $operation_id,
				'state'        => $uncertain ? 'uncertain' : 'processing',
				'product'      => null,
				'warnings'     => array(),
				'errors'       => array(),
				'replayed'     => $replayed,
				'http_status'  => 202,
			)
		);
	}

	/**
	 * @param array<string, mixed> $data Stored operation result.
	 */
	public static function from_array( array $data, bool $replayed = true ): self {
		$product             = isset( $data['product'] ) && is_array( $data['product'] ) ? $data['product'] : null;
		$warnings            = isset( $data['warnings'] ) && is_array( $data['warnings'] ) ? $data['warnings'] : array();
		$errors              = isset( $data['errors'] ) && is_array( $data['errors'] ) ? $data['errors'] : array();
		$combination_results = isset( $data['combination_results'] ) && is_array( $data['combination_results'] ) ? $data['combination_results'] : array();
		$status              = isset( $data['http_status'] ) ? (int) $data['http_status'] : 200;

		return new self(
			array(
				'operation_id'        => (string) ( $data['operation_id'] ?? '' ),
				'state'               => (string) ( $data['state'] ?? 'failed' ),
				'product'             => $product,
				'warnings'            => array_values( array_filter( $warnings, 'is_string' ) ),
				'errors'              => array_values( array_filter( $errors, 'is_array' ) ),
				'combination_results' => array_values( array_filter( $combination_results, 'is_array' ) ),
				'replayed'            => $replayed,
				'http_status'         => ( $data['state'] ?? null ) === 'succeeded' ? 200 : $status,
			)
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
		$write_failure = isset( $this->errors[0]['code'] ) && 'ypw_product_write_failed' === $this->errors[0]['code'];
		return array(
			'operation_id'        => $this->operation_id,
			'state'               => $this->state,
			'product'             => $this->product,
			'warnings'            => $this->warnings,
			'errors'              => $this->errors,
			'combination_results' => $this->combination_results,
			'replayed'            => $this->replayed,
			'retry'               => array(
				'can_reconcile'    => in_array( $this->state, array( 'processing', 'uncertain' ), true ),
				'can_retry'        => $write_failure || 'partial' === $this->state,
				'safe_to_resubmit' => false,
			),
			'http_status'         => $this->http_status,
		);
	}
}
