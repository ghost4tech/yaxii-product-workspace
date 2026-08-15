<?php
/**
Plugin Name: Yaxii Product Workspace
Plugin URI: https://yaxii.dev/
Description: A focused WooCommerce product-entry workspace for WordPress administrators.
Version: 0.2.0-alpha.1
Requires at least: 6.5
Requires PHP: 7.4
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

define( 'YAXII_PRODUCT_WORKSPACE_VERSION', '0.2.0-alpha.1' );
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
