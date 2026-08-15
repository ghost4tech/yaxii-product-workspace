<?php
/**
 * Builds the current-store bootstrap resource.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Bootstrap;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Infrastructure\WordPress\UserLocaleContext;
defined( 'ABSPATH' ) || exit;

/**
 * Reads only bounded, non-secret WordPress and WooCommerce settings.
 */
final class BootstrapProvider {
	private CapabilityPolicy $capabilities;
	private UserLocaleContext $locale;

	public function __construct( CapabilityPolicy $capabilities, UserLocaleContext $locale ) {

		$this->capabilities = $capabilities;
		$this->locale       = $locale;
	}

	public function get(): BootstrapResource {
		$user          = wp_get_current_user();
		$woo_available = class_exists( 'WooCommerce' ) && defined( 'WC_VERSION' );

		return new BootstrapResource(
			array(
				'user'         => array(
					'id'           => (int) $user->ID,
					'display_name' => (string) $user->display_name,
				),
				'capabilities' => array(
					'create_products'  => $this->capabilities->can_create_products(),
					'publish_products' => $this->capabilities->can_publish_products(),
					'upload_media'     => $this->capabilities->can_upload_media(),
				),
				'locale'       => $this->locale->current(),
				'woocommerce'  => $this->woocommerce_data( $woo_available ),
				'features'     => array(
					'simple_product_create'   => $woo_available,
					'simple_product_manage'   => $woo_available,
					'variable_product_create' => $woo_available,
					'category_lookup'         => $woo_available,
					'tag_lookup'              => $woo_available,
					'shipping_class_lookup'   => $woo_available,
					'media_selection'         => $this->capabilities->can_upload_media(),
					'operation_lookup'        => $woo_available,
					'operation_queue'         => $woo_available,
					'preferences'             => $woo_available,
				),
				'limits'       => array(
					'category_page_size'         => 20,
					'max_category_page_size'     => 50,
					'max_images'                 => 10,
					'max_variable_attributes'    => 5,
					'max_variable_options'       => 20,
					'max_variation_combinations' => 50,
				),
			)
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function woocommerce_data( bool $available ): array {
		if ( ! $available ) {
			return array(
				'available' => false,
				'version'   => null,
			);
		}

		return array(
			'available'          => true,
			'version'            => (string) WC_VERSION,
			'currency'           => get_woocommerce_currency(),
			'currency_symbol'    => html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'price_decimals'     => wc_get_price_decimals(),
			'decimal_separator'  => wc_get_price_decimal_separator(),
			'thousand_separator' => wc_get_price_thousand_separator(),
			'price_format'       => get_woocommerce_price_format(),
			'weight_unit'        => get_option( 'woocommerce_weight_unit', 'kg' ),
			'dimension_unit'     => get_option( 'woocommerce_dimension_unit', 'cm' ),
			'tax_classes'        => array_map(
				static fn ( $tax_class ): array => array(
					'name' => (string) $tax_class->name,
					'slug' => (string) $tax_class->slug,
				),
				\WC_Tax::get_tax_rate_classes()
			),
		);
	}
}
