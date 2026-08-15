<?php
/**
 * Concrete variation combination.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Commercial values belong to this concrete selection set, never to options.
 */
final class VariationCombination {
	private string $client_id;
	private int $variation_id;
	/** @var array<int, array<string, int|string>> */
	private array $selections;
	/** @var array<string, mixed> */
	private array $fields;
	private string $fingerprint;

	/**
	 * @param array{client_id: string, variation_id: int, selections: array<int, array<string, int|string>>, fields: array<string, mixed>, fingerprint: string} $combination Validated combination fields.
	 */
	public function __construct( array $combination ) {
		$this->client_id    = $combination['client_id'];
		$this->variation_id = $combination['variation_id'];
		$this->selections   = $combination['selections'];
		$this->fields       = $combination['fields'];
		$this->fingerprint  = $combination['fingerprint'];
	}

	public function client_id(): string {
		return $this->client_id;
	}

	public function variation_id(): int {
		return $this->variation_id;
	}

	public function fingerprint(): string {
		return $this->fingerprint;
	}

	/** @return array<int, array<string, int|string>> */
	public function selections(): array {
		return $this->selections;
	}

	/** @return array<string, mixed> */
	public function fields(): array {
		return $this->fields;
	}

	/** @return array<string, mixed> */
	public function to_array(): array {
		return array_merge(
			array(
				'client_id'    => $this->client_id,
				'variation_id' => $this->variation_id,
				'selections'   => $this->selections,
			),
			$this->fields
		);
	}
}
