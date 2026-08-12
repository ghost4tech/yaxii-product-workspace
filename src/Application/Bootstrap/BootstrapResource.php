<?php
/**
 * Typed bootstrap resource.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Bootstrap;

/**
 * Immutable data returned by the same-origin bootstrap endpoint.
 */
final class BootstrapResource {
	/** @var array<string, mixed> */
	private array $data;

	/**
	 * @param array<string, mixed> $data Validated bootstrap data.
	 */
	public function __construct( array $data ) {
		$this->data = $data;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return $this->data;
	}
}
