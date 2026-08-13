<?php
/**
 * PHPUnit bootstrap for pure PHP tests.
 *
 * @package YaxiiProductWorkspace
 */

require_once dirname( __DIR__ ) . '/vendor/autoload.php';

if ( ! function_exists( '__' ) ) {
	function __( string $text, string $domain = 'default' ): string {
		unset( $domain );
		return $text;
	}
}

if ( ! function_exists( 'wp_json_encode' ) ) {
	/**
	 * @param mixed $value Value to encode.
	 * @return string|false
	 */
	function wp_json_encode( $value ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode -- WordPress is intentionally unavailable in unit tests.
		return json_encode( $value );
	}
}
