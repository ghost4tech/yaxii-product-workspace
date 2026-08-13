<?php
/**
 * Bounded simple-product query.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Products;

/**
 * Carries only the supported list filters.
 */
final class ProductQuery {
	private int $page;
	private int $per_page;
	private string $search;
	private string $status;

	public function __construct( int $page, int $per_page, string $search, string $status ) {
		$this->page     = max( 1, $page );
		$this->per_page = min( 50, max( 1, $per_page ) );
		$this->search   = $search;
		$this->status   = $status;
	}

	public function page(): int {
		return $this->page;
	}

	public function per_page(): int {
		return $this->per_page;
	}

	public function search(): string {
		return $this->search;
	}

	public function status(): string {
		return $this->status;
	}
}
