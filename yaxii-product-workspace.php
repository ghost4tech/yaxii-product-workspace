<?php
/**
Plugin Name: Yaxii Product Workspace
Plugin URI: https://github.com/ghost4tech/yaxii-product-workspace
Description: A focused WooCommerce product-entry workspace for WordPress administrators.
Version: 1.0.0
Requires at least: 7.0
Requires PHP: 8.1
Requires Plugins: woocommerce
Author: Yaxii Dev
Author URI: https://yaxii.dev/
Text Domain: yaxii-product-workspace
Domain Path: /languages
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Plugin bootstrap.
 *
 * @package YaxiiProductWorkspace
 */

defined( 'ABSPATH' ) || exit;

define( 'YAXII_PRODUCT_WORKSPACE_VERSION', '1.0.0' );
define( 'YAXII_PRODUCT_WORKSPACE_FILE', __FILE__ );

$yaxii_product_workspace_autoloader = __DIR__ . '/vendor/autoload.php';

if ( is_readable( $yaxii_product_workspace_autoloader ) ) {
	require_once $yaxii_product_workspace_autoloader;

	register_activation_hook( __FILE__, array( Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager::class, 'activate' ) );
	Yaxii\ProductWorkspace\Plugin::create( __FILE__ )->register();
} else {
	add_action(
		'admin_notices',
		static function (): void {
			if ( current_user_can( 'activate_plugins' ) ) {
				echo '<div class="notice notice-error"><p>';
				echo esc_html__( 'Yaxii Product Workspace cannot start because its Composer dependencies are missing.', 'yaxii-product-workspace' );
				echo '</p></div>';
			}
		}
	);
}
