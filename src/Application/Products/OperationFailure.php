<?php
/**
 * Structured operation failure.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Keeps the stable error resource and HTTP status together.
 */
final class OperationFailure {
	private string $code;
	private string $message;

	/** @var array<string, array<string>> */
	private array $fields;
	private int $http_status;

	/**
	 * @param array<string, array<string>> $fields Field-addressable messages.
	 */
	public function __construct( string $code, string $message, array $fields, int $http_status ) {
		$this->code        = $code;
		$this->message     = $message;
		$this->fields      = $fields;
		$this->http_status = $http_status;
	}

	public function http_status(): int {
		return $this->http_status;
	}

	/**
	 * @return array{code: string, message: string, fields: array<string, array<string>>}
	 */
	public function to_array(): array {
		return array(
			'code'    => $this->code,
			'message' => $this->message,
			'fields'  => $this->fields,
		);
	}
}
