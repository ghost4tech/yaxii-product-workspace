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

	private function is_woocommerce_available(): bool {
		return class_exists( 'WooCommerce' ) && defined( 'WC_VERSION' );
	}
}
