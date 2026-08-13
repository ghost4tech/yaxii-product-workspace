<?php
/**
 * Product request validation errors.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Collects field-addressable validation messages without output parameters.
 */
final class ValidationErrors {
	/** @var array<string, array<string>> */
	private array $fields = array();

	public function add( string $field, string $message ): void {
		$this->fields[ $field ][] = $message;
	}

	public function has_errors(): bool {
		return array() !== $this->fields;
	}

	/**
	 * @return array<string, array<string>>
	 */
	public function all(): array {
		return $this->fields;
	}
}
