<?php
/**
 * Variable-product attribute-source and localization matrix.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

final class VariableAttributeMatrixTest extends TestCase {
	private int $original_user_id;
	private int $category_id;
	/** @var array<int> */
	private array $attribute_ids = array();
	/** @var array<string, array<int>> */
	private array $term_ids = array();
	/** @var array<int> */
	private array $product_ids = array();
	/** @var array<string> */
	private array $operation_ids = array();

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		$admins                 = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		self::assertNotEmpty( $admins );
		wp_set_current_user( (int) $admins[0]->ID );
		SchemaManager::create()->maybe_upgrade();
		do_action( 'rest_api_init' );
		$category = wp_insert_term( 'YPW matrix ' . wp_generate_password( 6, false ), 'product_cat' );
		self::assertIsArray( $category );
		$this->category_id = (int) $category['term_id'];
	}

	protected function tearDown(): void {
		foreach ( $this->product_ids as $product_id ) {
			$product = wc_get_product( $product_id );
			$product instanceof \WC_Product ? $product->delete( true ) : wp_delete_post( $product_id, true );
		}
		foreach ( $this->term_ids as $taxonomy => $term_ids ) {
			foreach ( $term_ids as $term_id ) {
				wp_delete_term( $term_id, $taxonomy );
			}
		}
		foreach ( $this->attribute_ids as $attribute_id ) {
			wc_delete_attribute( $attribute_id );
		}
		wp_delete_term( $this->category_id, 'product_cat' );
		global $wpdb;
		foreach ( $this->operation_ids as $operation_id ) {
			$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_two_global_attributes_create_and_hydrate_six_variations(): void {
		$color      = $this->global_attribute( 'Matrix Color', array( 'Black', 'White' ) );
		$size       = $this->global_attribute( 'Matrix Size', array( 'Small', 'Medium', 'Large' ) );
		$attributes = array(
			$this->global_payload( $color, 0 ),
			$this->global_payload( $size, 1 ),
		);

		$product = $this->create( $attributes );
		self::assertCount( 6, $product['combinations'] );
		$detail = $this->data( $this->dispatch( 'GET', '/variable-products/' . $product['id'] ) );
		self::assertSame( array_column( $attributes, 'attribute_id' ), array_column( $detail['attributes'], 'attribute_id' ) );
		self::assertEqualsCanonicalizing( $attributes[0]['option_ids'], $detail['attributes'][0]['option_ids'] );
		self::assertEqualsCanonicalizing( $attributes[1]['option_ids'], $detail['attributes'][1]['option_ids'] );
		self::assertCount( 6, $detail['combinations'] );
	}

	public function test_non_latin_custom_attributes_create_and_hydrate_six_variations(): void {
		$attributes = array(
			$this->custom_payload( 'custom:color', 'اللون', array( 'أسود', 'أبيض' ), 0 ),
			$this->custom_payload( 'custom:size', 'المقاس', array( 'صغير', 'متوسط', 'كبير' ), 1 ),
		);

		$product = $this->create( $attributes );
		self::assertCount( 6, $product['combinations'] );
		$detail = $this->data( $this->dispatch( 'GET', '/variable-products/' . $product['id'] ) );
		self::assertSame( array( 'اللون', 'المقاس' ), array_column( $detail['attributes'], 'name' ) );
		self::assertCount( 6, $detail['combinations'] );
	}

	public function test_normalized_custom_name_collision_writes_nothing(): void {
		$before     = $this->product_count();
		$attributes = array(
			$this->custom_payload( 'custom:size', 'Size', array( 'S' ), 0 ),
			$this->custom_payload( 'custom:size-alt', 'Size!', array( 'M' ), 1 ),
		);
		$response   = $this->dispatch( 'POST', '/variable-products', $this->payload( $attributes ), wp_generate_uuid4() );

		self::assertSame( 400, $response->get_status() );
		self::assertSame( 'ypw_invalid_variation_plan', $response->get_data()['code'] );
		self::assertArrayHasKey( 'attributes.1', $response->get_data()['data']['fields'] );
		self::assertSame( $before, $this->product_count() );
	}

	/** @return array{id: int, name: string, taxonomy: string, option_ids: array<int>} */
	private function global_attribute( string $name, array $options ): array {
		$slug = 'ypw_matrix_' . strtolower( wp_generate_password( 6, false ) );
		$id   = wc_create_attribute(
			array(
				'name' => $name,
				'slug' => $slug,
				'type' => 'select',
			)
		);
		self::assertGreaterThan( 0, $id );
		$this->attribute_ids[] = $id;
		$taxonomy              = wc_attribute_taxonomy_name( $slug );
		register_taxonomy( $taxonomy, 'product', array( 'public' => false ) );
		$term_ids = array();
		foreach ( $options as $option ) {
			$term = wp_insert_term( $option, $taxonomy );
			self::assertIsArray( $term );
			$term_ids[] = (int) $term['term_id'];
		}
		$this->term_ids[ $taxonomy ] = $term_ids;
		return array(
			'id'         => $id,
			'name'       => $name,
			'taxonomy'   => $taxonomy,
			'option_ids' => $term_ids,
		);
	}

	/** @param array{id: int, name: string, taxonomy: string, option_ids: array<int>} $attribute
	 * @return array<string, mixed> */
	private function global_payload( array $attribute, int $position ): array {
		return array(
			'key'          => 'global:' . $attribute['id'],
			'source'       => 'global',
			'name'         => $attribute['name'],
			'attribute_id' => $attribute['id'],
			'taxonomy'     => $attribute['taxonomy'],
			'option_ids'   => $attribute['option_ids'],
			'visible'      => true,
			'variation'    => true,
			'position'     => $position,
		);
	}

	/** @return array<string, mixed> */
	private function custom_payload( string $key, string $name, array $options, int $position ): array {
		return array(
			'key'       => $key,
			'source'    => 'custom',
			'name'      => $name,
			'options'   => $options,
			'visible'   => true,
			'variation' => true,
			'position'  => $position,
		);
	}

	/** @param array<int, array<string, mixed>> $attributes
	 * @return array<string, mixed> */
	private function payload( array $attributes ): array {
		$rows = array( array() );
		foreach ( $attributes as $attribute ) {
			$options  = 'global' === $attribute['source'] ? $attribute['option_ids'] : $attribute['options'];
			$expanded = array();
			foreach ( $rows as $row ) {
				foreach ( $options as $option ) {
					$selection = array( 'attribute_key' => $attribute['key'] );
					$selection[ 'global' === $attribute['source'] ? 'term_id' : 'option' ] = $option;
					$expanded[] = array_merge( $row, array( $selection ) );
				}
			}
			$rows = $expanded;
		}
		$combinations = array();
		foreach ( $rows as $index => $selections ) {
			$combinations[] = array(
				'client_id'      => sprintf( '30000000-0000-4000-8000-%012d', $index + 1 ),
				'variation_id'   => 0,
				'selections'     => $selections,
				'enabled'        => true,
				'regular_price'  => (string) ( 20 + $index ),
				'sale_price'     => null,
				'sku'            => 'MATRIX-' . wp_generate_password( 6, false ),
				'manage_stock'   => false,
				'stock_quantity' => null,
				'stock_status'   => 'instock',
				'image_id'       => 0,
			);
		}
		return array(
			'product'      => array(
				'name'         => 'YPW matrix ' . wp_generate_password( 7, false ),
				'status'       => 'publish',
				'category_ids' => array( $this->category_id ),
				'image_ids'    => array(),
			),
			'attributes'   => $attributes,
			'combinations' => $combinations,
		);
	}

	/** @param array<int, array<string, mixed>> $attributes
	 * @return array<string, mixed> */
	private function create( array $attributes ): array {
		$data                  = $this->data( $this->dispatch( 'POST', '/variable-products', $this->payload( $attributes ), wp_generate_uuid4() ) );
		$this->operation_ids[] = $data['operation_id'];
		$this->product_ids[]   = $data['product']['id'];
		self::assertSame( 'succeeded', $data['state'], (string) wp_json_encode( $data ) );
		return $data['product'];
	}

	private function dispatch( string $method, string $path, array $parameters = array(), ?string $key = null ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/yaxii-product-workspace/v1' . $path );
		if ( 'GET' === $method ) {
			$request->set_query_params( $parameters );
		} else {
			$request->set_body( (string) wp_json_encode( $parameters ) );
			$request->set_header( 'content-type', 'application/json' );
		}
		if ( null !== $key ) {
			$request->set_header( 'idempotency-key', $key );
		}
		return rest_get_server()->dispatch( $request );
	}

	/** @return array<string, mixed> */
	private function data( \WP_REST_Response $response ): array {
		$data = $response->get_data();
		self::assertIsArray( $data );
		self::assertArrayHasKey( 'data', $data, (string) wp_json_encode( $data ) );
		return $data['data'];
	}

	private function product_count(): int {
		return array_sum( array_map( 'intval', get_object_vars( wp_count_posts( 'product' ) ) ) );
	}
}
