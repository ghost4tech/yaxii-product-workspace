<?php
/**
 * Simple-product REST schemas.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps collection and item routes on one field contract.
 */
final class SimpleProductSchema {
	/**
	 * @return array<string, mixed>
	 */
	public static function request( bool $complete = false ): array {
		$properties = self::properties();
		$required   = $complete ? array_keys( $properties ) : array( 'name', 'regular_price', 'category_ids', 'status' );
		return array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'yaxii_simple_product',
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => $required,
			'properties'           => $properties,
		);
	}

	/**
	 * @return array<string, array<string, mixed>>
	 */
	private static function properties(): array {
		return array(
			'name'               => array(
				'type'      => 'string',
				'maxLength' => 200,
			),
			'slug'               => array(
				'type'      => 'string',
				'maxLength' => 200,
			),
			'description'        => array( 'type' => 'string' ),
			'short_description'  => array( 'type' => 'string' ),
			'status'             => self::enum( array( 'draft', 'publish', 'pending' ) ),
			'catalog_visibility' => self::enum( array( 'visible', 'catalog', 'search', 'hidden' ) ),
			'regular_price'      => array( 'type' => 'string' ),
			'sale_price'         => array( 'type' => array( 'string', 'null' ) ),
			'date_on_sale_from'  => array( 'type' => array( 'string', 'null' ) ),
			'date_on_sale_to'    => array( 'type' => array( 'string', 'null' ) ),
			'sku'                => array(
				'type'      => 'string',
				'maxLength' => 100,
			),
			'manage_stock'       => array( 'type' => 'boolean' ),
			'stock_quantity'     => array(
				'type'    => array( 'integer', 'null' ),
				'minimum' => 0,
			),
			'stock_status'       => self::enum( array( 'instock', 'outofstock', 'onbackorder' ) ),
			'backorders'         => self::enum( array( 'no', 'notify', 'yes' ) ),
			'sold_individually'  => array( 'type' => 'boolean' ),
			'weight'             => array( 'type' => 'string' ),
			'length'             => array( 'type' => 'string' ),
			'width'              => array( 'type' => 'string' ),
			'height'             => array( 'type' => 'string' ),
			'shipping_class_id'  => array(
				'type'    => array( 'integer', 'null' ),
				'minimum' => 0,
			),
			'tax_status'         => self::enum( array( 'taxable', 'shipping', 'none' ) ),
			'tax_class'          => array(
				'type'      => 'string',
				'maxLength' => 200,
			),
			'category_ids'       => self::ids( 20 ),
			'tag_ids'            => self::ids( 20 ),
			'image_ids'          => self::ids( 10 ),
		);
	}

	/**
	 * @param array<string> $values Enum values.
	 * @return array<string, mixed>
	 */
	private static function enum( array $values ): array {
		return array(
			'type' => 'string',
			'enum' => $values,
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	private static function ids( int $maximum ): array {
		return array(
			'type'     => 'array',
			'items'    => array(
				'type'    => 'integer',
				'minimum' => 1,
			),
			'maxItems' => $maximum,
		);
	}
}
