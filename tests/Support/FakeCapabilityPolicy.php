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
	public bool $create  = true;
	public bool $publish = true;
	public bool $upload  = true;

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
}
