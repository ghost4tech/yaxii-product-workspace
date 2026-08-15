<?php
/**
 * Validated simple-product create command.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Immutable allowlisted values accepted by the application service.
 */
final class CreateProductCommand {
	/** @var array<string, mixed> */
	private array $fields;

	/**
	 * @param array<string, mixed> $values Validated allowlisted values.
	 */
	public function __construct( array $values ) {
		$this->fields = $values;
	}

	public function name(): string {
		return (string) $this->fields['name'];
	}

	public function slug(): string {
		return (string) $this->fields['slug'];
	}

	public function sku(): string {
		return (string) $this->fields['sku'];
	}

	public function regular_price(): string {
		return (string) $this->fields['regular_price'];
	}

	public function sale_price(): ?string {
		return is_string( $this->fields['sale_price'] ) ? $this->fields['sale_price'] : null;
	}

	public function date_on_sale_from(): ?string {
		return is_string( $this->fields['date_on_sale_from'] ) ? $this->fields['date_on_sale_from'] : null;
	}

	public function date_on_sale_to(): ?string {
		return is_string( $this->fields['date_on_sale_to'] ) ? $this->fields['date_on_sale_to'] : null;
	}

	public function manage_stock(): bool {
		return true === $this->fields['manage_stock'];
	}

	public function stock_quantity(): ?int {
		return is_int( $this->fields['stock_quantity'] ) ? $this->fields['stock_quantity'] : null;
	}

	public function stock_status(): string {
		return (string) $this->fields['stock_status'];
	}

	public function backorders(): string {
		return (string) $this->fields['backorders'];
	}

	public function sold_individually(): bool {
		return true === $this->fields['sold_individually'];
	}

	public function status(): string {
		return (string) $this->fields['status'];
	}

	public function catalog_visibility(): string {
		return (string) $this->fields['catalog_visibility'];
	}

	public function tax_status(): string {
		return (string) $this->fields['tax_status'];
	}

	public function tax_class(): string {
		return (string) $this->fields['tax_class'];
	}

	public function description(): string {
		return (string) $this->fields['description'];
	}

	public function short_description(): string {
		return (string) $this->fields['short_description'];
	}

	public function weight(): string {
		return (string) $this->fields['weight'];
	}

	public function length(): string {
		return (string) $this->fields['length'];
	}

	public function width(): string {
		return (string) $this->fields['width'];
	}

	public function height(): string {
		return (string) $this->fields['height'];
	}

	public function shipping_class_id(): int {
		return (int) $this->fields['shipping_class_id'];
	}

	/**
	 * @return array<int>
	 */
	public function category_ids(): array {
		return $this->fields['category_ids'];
	}

	/**
	 * @return array<int>
	 */
	public function tag_ids(): array {
		return $this->fields['tag_ids'];
	}

	/**
	 * @return array<int>
	 */
	public function image_ids(): array {
		return $this->fields['image_ids'];
	}

	/**
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return $this->fields;
	}
}
