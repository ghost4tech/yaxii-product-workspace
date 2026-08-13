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

$ypw_wordpress_loaded = false;
register_shutdown_function(
	static function () use ( &$ypw_wordpress_loaded ): void {
		if ( ! $ypw_wordpress_loaded ) {
			throw new RuntimeException( 'WordPress did not finish booting; the integration run is invalid.' );
		}
	}
);
require_once $ypw_wp_root . '/wp-load.php';
$ypw_wordpress_loaded = true;
require_once dirname( __DIR__ ) . '/vendor/autoload.php';
