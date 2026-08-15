<?php
/**
 * Capability policy test double.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Support;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;

/**
 * Configurable capability policy for application-service tests.
 */
final class FakeCapabilityPolicy implements CapabilityPolicy {
	public bool $create       = true;
	public bool $publish      = true;
	public bool $upload       = true;
	public bool $edit         = true;
	public bool $delete       = true;
	public bool $use_media    = true;
	public bool $assign_terms = true;

	public function can_access_workspace(): bool {
		return $this->create;
	}

	public function can_create_products(): bool {
		return $this->create;
	}

	public function can_publish_products(): bool {
		return $this->publish;
	}

	public function can_upload_media(): bool {
		return $this->upload;
	}

	public function can_edit_product( int $product_id ): bool {
		unset( $product_id );
		return $this->edit;
	}

	public function can_delete_product( int $product_id ): bool {
		unset( $product_id );
		return $this->delete;
	}

	public function can_use_media( int $attachment_id ): bool {
		unset( $attachment_id );
		return $this->use_media;
	}

	public function can_assign_product_terms(): bool {
		return $this->assign_terms;
	}
}
