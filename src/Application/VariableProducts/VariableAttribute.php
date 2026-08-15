<?php
/**
 * Canonical variable-product attribute.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\VariableProducts;

/**
 * Separates WooCommerce global attributes from product-local attributes.
 */
final class VariableAttribute {
	private string $key;
	private string $source;
	private string $name;
	private int $attribute_id;
	private string $taxonomy;
	/** @var array<int|string> */
	private array $options;
	private bool $visible;
	private bool $variation;
	private int $position;

	/**
	 * @param array{key: string, source: string, name: string, attribute_id: int, taxonomy: string, options: array<int|string>, visible: bool, variation: bool, position: int} $fields Validated attribute fields.
	 */
	public function __construct( array $fields ) {
		$this->key          = $fields['key'];
		$this->source       = $fields['source'];
		$this->name         = $fields['name'];
		$this->attribute_id = $fields['attribute_id'];
		$this->taxonomy     = $fields['taxonomy'];
		$this->options      = $fields['options'];
		$this->visible      = $fields['visible'];
		$this->variation    = $fields['variation'];
		$this->position     = $fields['position'];
	}

	public function key(): string {
		return $this->key;
	}

	public function source(): string {
		return $this->source;
	}

	public function name(): string {
		return $this->name;
	}

	public function attribute_id(): int {
		return $this->attribute_id;
	}

	public function taxonomy(): string {
		return $this->taxonomy;
	}

	/** @return array<int|string> */
	public function options(): array {
		return $this->options;
	}

	public function is_global(): bool {
		return 'global' === $this->source;
	}

	public function is_visible(): bool {
		return $this->visible;
	}

	public function is_for_variations(): bool {
		return $this->variation;
	}

	public function position(): int {
		return $this->position;
	}

	/** @return array<string, mixed> */
	public function to_array(): array {
		$common = array(
			'key'       => $this->key,
			'source'    => $this->source,
			'name'      => $this->name,
			'visible'   => $this->visible,
			'variation' => $this->variation,
			'position'  => $this->position,
		);
		return $this->is_global()
			? array_merge(
				$common,
				array(
					'attribute_id' => $this->attribute_id,
					'taxonomy'     => $this->taxonomy,
					'option_ids'   => $this->options,
				)
			)
			: array_merge( $common, array( 'options' => $this->options ) );
	}
}
