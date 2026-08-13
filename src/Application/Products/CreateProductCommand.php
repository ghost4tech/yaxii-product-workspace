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
	private string $name;
	private string $sku;
	private string $regular_price;
	private ?string $sale_price;
	private bool $manage_stock;
	private ?int $stock_quantity;
	private string $stock_status;
	private string $status;
	private string $catalog_visibility;
	private string $tax_status;
	private string $description;
	private string $short_description;

	/** @var array<int> */
	private array $category_ids;

	/** @var array<int> */
	private array $image_ids;

	/**
	 * @param array{name: string, sku: string, regular_price: string, sale_price: string|null, manage_stock: bool, stock_quantity: int|null, stock_status: string, status: string, catalog_visibility: string, tax_status: string, description: string, short_description: string, category_ids: array<int>, image_ids: array<int>} $values Validated values.
	 */
	public function __construct( array $values ) {
		$this->name               = $values['name'];
		$this->sku                = $values['sku'];
		$this->regular_price      = $values['regular_price'];
		$this->sale_price         = $values['sale_price'];
		$this->manage_stock       = $values['manage_stock'];
		$this->stock_quantity     = $values['stock_quantity'];
		$this->stock_status       = $values['stock_status'];
		$this->status             = $values['status'];
		$this->catalog_visibility = $values['catalog_visibility'];
		$this->tax_status         = $values['tax_status'];
		$this->description        = $values['description'];
		$this->short_description  = $values['short_description'];
		$this->category_ids       = $values['category_ids'];
		$this->image_ids          = $values['image_ids'];
	}

	public function name(): string {
		return $this->name;
	}

	public function sku(): string {
		return $this->sku;
	}

	public function regular_price(): string {
		return $this->regular_price;
	}

	public function sale_price(): ?string {
		return $this->sale_price;
	}

	public function manage_stock(): bool {
		return $this->manage_stock;
	}

	public function stock_quantity(): ?int {
		return $this->stock_quantity;
	}

	public function stock_status(): string {
		return $this->stock_status;
	}

	public function status(): string {
		return $this->status;
	}

	public function catalog_visibility(): string {
		return $this->catalog_visibility;
	}

	public function tax_status(): string {
		return $this->tax_status;
	}

	public function description(): string {
		return $this->description;
	}

	public function short_description(): string {
		return $this->short_description;
	}

	/**
	 * @return array<int>
	 */
	public function category_ids(): array {
		return $this->category_ids;
	}

	/**
	 * @return array<int>
	 */
	public function image_ids(): array {
		return $this->image_ids;
	}

	/**
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return array(
			'name'               => $this->name,
			'sku'                => $this->sku,
			'regular_price'      => $this->regular_price,
			'sale_price'         => $this->sale_price,
			'manage_stock'       => $this->manage_stock,
			'stock_quantity'     => $this->stock_quantity,
			'stock_status'       => $this->stock_status,
			'status'             => $this->status,
			'catalog_visibility' => $this->catalog_visibility,
			'tax_status'         => $this->tax_status,
			'description'        => $this->description,
			'short_description'  => $this->short_description,
			'category_ids'       => $this->category_ids,
			'image_ids'          => $this->image_ids,
		);
	}
}
