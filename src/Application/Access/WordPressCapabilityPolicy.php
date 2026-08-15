<?php
/**
 * WordPress-backed capability policy.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Access;

defined( 'ABSPATH' ) || exit;

/**
 * Uses native product and media capabilities as the server authority.
 */
final class WordPressCapabilityPolicy implements CapabilityPolicy {
	public function can_access_workspace(): bool {
		return $this->is_woocommerce_available()
			? current_user_can( 'edit_products' )
			: current_user_can( 'manage_options' );
	}

	public function can_create_products(): bool {
		return $this->is_woocommerce_available() && current_user_can( 'edit_products' );
	}

	public function can_publish_products(): bool {
		return $this->can_create_products() && current_user_can( 'publish_products' );
	}

	public function can_upload_media(): bool {
		return current_user_can( 'upload_files' );
	}

	public function can_edit_product( int $product_id ): bool {
		return $this->can_create_products() && current_user_can( 'edit_post', $product_id );
	}

	public function can_delete_product( int $product_id ): bool {
		return $this->can_create_products() && current_user_can( 'delete_post', $product_id );
	}

	public function can_use_media( int $attachment_id ): bool {
		return $this->can_upload_media() && current_user_can( 'edit_post', $attachment_id );
	}

	public function can_assign_product_terms(): bool {
		return $this->can_create_products() && current_user_can( 'assign_product_terms' );
	}

	private function is_woocommerce_available(): bool {
		return class_exists( 'WooCommerce' ) && defined( 'WC_VERSION' );
	}
}
