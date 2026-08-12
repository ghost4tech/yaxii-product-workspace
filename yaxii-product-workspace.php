<?php
/*
Plugin Name: Yaxii Product Workspace
Plugin URI: https://yaxii.dev/
Description: A focused WooCommerce product-entry workspace for WordPress administrators.
Version: 0.1.0-alpha.1
Requires at least: 6.5
Requires PHP: 7.4
Author: Yaxii Dev
Author URI: https://yaxii.dev/
Text Domain: yaxii-product-workspace
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Plugin bootstrap.
 *
 * @package YaxiiProductWorkspace
 */

defined( 'ABSPATH' ) || exit;

define( 'YAXII_PRODUCT_WORKSPACE_VERSION', '0.1.0-alpha.1' );

require_once __DIR__ . '/includes/AdminPage.php';

$yaxii_product_workspace_admin_page = new Yaxii\ProductWorkspace\AdminPage( __FILE__ );
$yaxii_product_workspace_admin_page->register();
