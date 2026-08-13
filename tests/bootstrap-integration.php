<?php
/**
 * PHPUnit bootstrap for the active LocalWP integration site.
 *
 * @package YaxiiProductWorkspace
 */

$ypw_wp_root = getenv( 'YPW_WP_ROOT' );
if ( ! is_string( $ypw_wp_root ) || '' === $ypw_wp_root ) {
	$ypw_wp_root = dirname( __DIR__, 4 );
}

if ( ! is_readable( $ypw_wp_root . '/wp-load.php' ) ) {
	throw new RuntimeException( 'Set YPW_WP_ROOT to a readable WordPress installation.' );
}

require_once $ypw_wp_root . '/wp-load.php';
require_once dirname( __DIR__ ) . '/vendor/autoload.php';
