<?php
/**
 * PHPUnit bootstrap for pure PHP tests.
 *
 * @package YaxiiProductWorkspace
 */

require_once dirname( __DIR__ ) . '/vendor/autoload.php';

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __DIR__ ) . '/' );
}

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

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( string $value ): string {
		return trim( (string) preg_replace( '/<[^>]*>/', '', $value ) );
	}
}

if ( ! function_exists( 'sanitize_title' ) ) {
	function sanitize_title( string $value ): string {
		return trim( strtolower( (string) preg_replace( '/[^a-z0-9]+/i', '-', $value ) ), '-' );
	}
}

if ( ! function_exists( 'wp_kses_post' ) ) {
	function wp_kses_post( string $value ): string {
		return $value;
	}
}
