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

	public function can_edit_product( int $product_id ): bool;

	public function can_delete_product( int $product_id ): bool;

	public function can_use_media( int $attachment_id ): bool;

	public function can_assign_product_terms(): bool;
}
