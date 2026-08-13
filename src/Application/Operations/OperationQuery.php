<?php
/**
 * Bounded operation history query.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Operations;

/**
 * Carries the supported server-side queue filters.
 */
final class OperationQuery {
	private int $page;
	private int $per_page;
	private string $search;
	private string $state;
	private string $product_status;

	public function __construct( int $page, int $per_page, string $search, string $state, string $product_status = '' ) {
		$this->page           = max( 1, $page );
		$this->per_page       = min( 50, max( 1, $per_page ) );
		$this->search         = $search;
		$this->state          = $state;
		$this->product_status = $product_status;
	}

	public function page(): int {
		return $this->page;
	}

	public function per_page(): int {
		return $this->per_page;
	}

	public function offset(): int {
		return ( $this->page - 1 ) * $this->per_page;
	}

	public function search(): string {
		return $this->search;
	}

	public function state(): string {
		return $this->state;
	}

	public function product_status(): string {
		return $this->product_status;
	}
}
