<?php
/**
 * Stable application exception for REST mapping.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

use RuntimeException;

/**
 * Carries a public error code, status, and optional field errors.
 */
final class ApiException extends RuntimeException {
	private string $api_code;
	private int $status;

	/** @var array<string, array<string>> */
	private array $fields;

	/**
	 * @param array<string, array<string>> $fields Field-addressable messages.
	 */
	public function __construct( string $api_code, string $message, int $status, array $fields = array() ) {
		parent::__construct( $message );
		$this->api_code = $api_code;
		$this->status   = $status;
		$this->fields   = $fields;
	}

	public function api_code(): string {
		return $this->api_code;
	}

	public function status(): int {
		return $this->status;
	}

	/**
	 * @return array<string, array<string>>
	 */
	public function fields(): array {
		return $this->fields;
	}
}
