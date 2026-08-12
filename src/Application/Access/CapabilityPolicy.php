<?php
/**
 * Capability contract for workspace operations.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Access;

/**
 * Centralizes capability decisions shared by the host and REST layer.
 */
interface CapabilityPolicy {
	public function can_access_workspace(): bool;

	public function can_create_products(): bool;

	public function can_publish_products(): bool;

	public function can_upload_media(): bool;
}
