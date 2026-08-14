<?php

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;

final class VariableProductLifecycleTest extends TestCase {
	private int $original_user_id;
	private int $administrator_id;
	private int $category_id;
	private int $attribute_id;
	private string $taxonomy;
	private array $color_ids     = array();
	private array $product_ids   = array();
	private array $operation_ids = array();
	private int $attachment_id;

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
		$this->administrator_id = (int) $admins[0]->ID;
		wp_set_current_user( $this->administrator_id );
		SchemaManager::create()->maybe_upgrade();
		do_action( 'rest_api_init' );
		$this->create_references();
	}
	protected function tearDown(): void {
		foreach ( array_unique( $this->product_ids ) as $product_id ) {
			$product = wc_get_product( $product_id );
			$product instanceof \WC_Product ? $product->delete( true ) : wp_delete_post( $product_id, true );
		}
		wp_delete_attachment( $this->attachment_id, true );
		foreach ( $this->color_ids as $term_id ) {
			wp_delete_term( $term_id, $this->taxonomy );
		}
		wc_delete_attribute( $this->attribute_id );
		wp_delete_term( $this->category_id, 'product_cat' );
		global $wpdb;
		foreach ( array_unique( $this->operation_ids ) as $operation_id ) {
			$wpdb->delete( SchemaManager::create()->table_name(), array( 'operation_id' => $operation_id ), array( '%s' ) );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}
	public function test_two_attribute_create_hydrate_catalog_and_idempotent_replay(): void {
		$key     = wp_generate_uuid4();
		$payload = $this->payload();
		$created = $this->data( $this->dispatch( 'POST', '/variable-products', $payload, $key ) );
		$product = $created['product'];
		$this->track( $created );

		self::assertSame( 'succeeded', $created['state'] );
		self::assertSame( 'variable', $product['type'] );
		self::assertCount( 6, $product['combinations'] );
		self::assertCount( 6, array_unique( array_column( $product['combinations'], 'variation_id' ) ) );
		self::assertSame( array( '11', '12', '13', '14', '15', '16' ), array_column( $product['combinations'], 'regular_price' ) );
		self::assertSame( array( 1, 2, 3, 4, 5, 6 ), array_column( $product['combinations'], 'stock_quantity' ) );

		$detail = $this->data( $this->dispatch( 'GET', '/variable-products/' . $product['id'] ) );
		self::assertSame( $product['version'], $detail['version'] );
		self::assertEquals( $payload['attributes'], $detail['attributes'] );
		$replay = $this->data( $this->dispatch( 'POST', '/variable-products', $payload, $key ) );
		self::assertSame( $product['id'], $replay['product']['id'] );
		self::assertSame( 6, count( wc_get_product( $product['id'] )->get_children() ) );

		$attributes = $this->data( $this->dispatch( 'GET', '/attributes' ) );
		self::assertContains( $this->attribute_id, array_column( $attributes, 'id' ) );
		$terms = $this->data( $this->dispatch( 'GET', '/attributes/' . $this->attribute_id . '/terms' ) );
		self::assertSame( $this->color_ids, array_column( $terms, 'id' ) );
	}
	public function test_edit_round_trip_and_stale_conflict(): void {
		$created                                      = $this->create_product();
		$payload                                      = $this->payload();
		$payload['combinations']                      = $created['product']['combinations'];
		$payload['combinations'][0]['regular_price']  = '27.50';
		$payload['combinations'][0]['sku']            = 'YPW-EDITED-' . wp_generate_password( 5, false );
		$payload['combinations'][0]['stock_quantity'] = 19;
		$payload['combinations'][0]['enabled']        = false;
		$payload['expected_version']                  = $created['product']['version'];

		$updated = $this->data( $this->dispatch( 'PUT', '/variable-products/' . $created['product']['id'], $payload ) );
		self::assertSame( 'succeeded', $updated['state'] );
		$detail = $this->data( $this->dispatch( 'GET', '/variable-products/' . $created['product']['id'] ) );
		self::assertSame( '27.50', $detail['combinations'][0]['regular_price'] );
		self::assertSame( 19, $detail['combinations'][0]['stock_quantity'] );
		self::assertFalse( $detail['combinations'][0]['enabled'] );

		$stale = $this->dispatch( 'PUT', '/variable-products/' . $created['product']['id'], $payload );
		self::assertSame( 409, $stale->get_status() );
		self::assertSame( 'ypw_product_conflict', $stale->get_data()['code'] );
	}
	public function test_invalid_term_and_duplicate_sku_write_no_product(): void {
		$before                                    = $this->product_count();
		$payload                                   = $this->payload();
		$payload['attributes'][0]['option_ids'][0] = 99999999;
		$payload['combinations'][0]['selections'][0]['term_id'] = 99999999;
		$response = $this->dispatch( 'POST', '/variable-products', $payload, wp_generate_uuid4() );
		self::assertSame( 400, $response->get_status() );
		self::assertSame( 'ypw_invalid_variation_plan', $response->get_data()['code'] );
		self::assertSame( $before, $this->product_count() );

		$payload                           = $this->payload();
		$payload['combinations'][1]['sku'] = $payload['combinations'][0]['sku'];
		$response                          = $this->dispatch( 'POST', '/variable-products', $payload, wp_generate_uuid4() );
		$data                              = $this->data( $response );
		$this->operation_ids[]             = $data['operation_id'];
		self::assertSame( 'failed', $data['state'] );
		self::assertSame( $before, $this->product_count() );
	}
	public function test_partial_failure_queue_and_safe_recovery(): void {
		$payload   = $this->payload();
		$failed_id = $payload['combinations'][2]['client_id'];
		$failure   = static function ( $variation, string $client_id ) use ( $failed_id ): void {
			unset( $variation );
			if ( $failed_id === $client_id ) {
				throw new \RuntimeException( 'Controlled integration failure.' );
			}
		};
		add_action( 'ypw_before_variation_save', $failure, 10, 2 );
		$partial = $this->data( $this->dispatch( 'POST', '/variable-products', $payload, wp_generate_uuid4() ) );
		remove_action( 'ypw_before_variation_save', $failure, 10 );
		$this->track( $partial );
		self::assertSame( 'partial', $partial['state'] );
		self::assertCount( 1, array_filter( $partial['combination_results'], static fn ( array $item ): bool => 'failed' === $item['state'] ) );
		self::assertSame( 'draft', $partial['product']['status'] );
		self::assertCount( 5, wc_get_product( $partial['product']['id'] )->get_children() );
		$queue = $this->data( $this->dispatch( 'GET', '/operations', array( 'search' => $payload['product']['name'] ) ) );
		self::assertSame( 'partial', $queue['items'][0]['state'] );
		self::assertTrue( $queue['items'][0]['retry']['can_retry'] );
		$error_queue = $this->data( $this->dispatch( 'GET', '/operations', array( 'state' => 'error' ) ) );
		self::assertSame( 'partial', $error_queue['items'][0]['state'] );
		$recovered = $this->data( $this->dispatch( 'POST', '/operations/' . $partial['operation_id'] . '/retry' ) );
		self::assertSame( 'succeeded', $recovered['state'] );
		self::assertSame( $partial['product']['id'], $recovered['product']['id'] );
		self::assertCount( 6, wc_get_product( $partial['product']['id'] )->get_children() );
	}
	public function test_unauthorized_and_malformed_requests_write_nothing(): void {
		$before = $this->product_count();
		wp_set_current_user( 0 );
		$unauthorized = $this->dispatch( 'POST', '/variable-products', $this->payload(), wp_generate_uuid4() );
		self::assertSame( 401, $unauthorized->get_status() );
		wp_set_current_user( $this->administrator_id );

		$payload                    = $this->payload();
		$payload['product']['name'] = array( 'not-text' );
		$malformed                  = $this->dispatch( 'POST', '/variable-products', $payload, wp_generate_uuid4() );
		self::assertSame( 400, $malformed->get_status() );
		self::assertSame( $before, $this->product_count() );
	}

	private function create_references(): void {
		$category = wp_insert_term( 'YPW variable ' . wp_generate_password( 5, false ), 'product_cat' );
		self::assertIsArray( $category );
		$this->category_id  = (int) $category['term_id'];
		$slug               = 'ypw_color_' . strtolower( wp_generate_password( 5, false ) );
		$this->attribute_id = wc_create_attribute(
			array(
				'name'     => 'YPW Color',
				'slug'     => $slug,
				'type'     => 'select',
				'order_by' => 'menu_order',
			)
		);
		self::assertGreaterThan( 0, $this->attribute_id );
		$this->taxonomy = wc_attribute_taxonomy_name( $slug );
		register_taxonomy(
			$this->taxonomy,
			'product',
			array(
				'public'       => false,
				'hierarchical' => false,
			)
		);
		foreach ( array( 'Black', 'White' ) as $color ) {
			$term = wp_insert_term( $color, $this->taxonomy );
			self::assertIsArray( $term );
			$this->color_ids[] = (int) $term['term_id'];
		}
		$image               = hex2bin( '89504e470d0a1a0a0000000d4948445200000001000000010804000000b51c0c020000000b4944415478da6364f80f00010501012718e3660000000049454e44ae426082' );
		$upload              = wp_upload_bits( 'ypw-variable-' . wp_generate_password( 5, false ) . '.png', null, $image );
		$this->attachment_id = wp_insert_attachment(
			array(
				'post_title'     => 'YPW variation',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/png',
				'post_author'    => $this->administrator_id,
			),
			$upload['file']
		);
	}

	private function payload(): array {
		$attributes   = array(
			array(
				'key'          => 'global:' . $this->attribute_id,
				'source'       => 'global',
				'name'         => 'YPW Color',
				'attribute_id' => $this->attribute_id,
				'taxonomy'     => $this->taxonomy,
				'option_ids'   => $this->color_ids,
				'visible'      => true,
				'variation'    => true,
				'position'     => 0,
			),
			array(
				'key'       => 'custom:size',
				'source'    => 'custom',
				'name'      => 'Size',
				'options'   => array( 'S', 'M', 'L' ),
				'visible'   => true,
				'variation' => true,
				'position'  => 1,
			),
		);
		$combinations = array();
		$index        = 0;
		foreach ( $this->color_ids as $term_id ) {
			foreach ( array( 'S', 'M', 'L' ) as $size ) {
				++$index;
				$combinations[] = array(
					'client_id'      => sprintf( '10000000-0000-4000-8000-%012d', $index ),
					'variation_id'   => 0,
					'selections'     => array(
						array(
							'attribute_key' => 'global:' . $this->attribute_id,
							'term_id'       => $term_id,
						),
						array(
							'attribute_key' => 'custom:size',
							'option'        => $size,
						),
					),
					'enabled'        => true,
					'regular_price'  => (string) ( 10 + $index ),
					'sale_price'     => null,
					'sku'            => 'YPW-VAR-' . $index . '-' . wp_generate_password( 5, false ),
					'manage_stock'   => true,
					'stock_quantity' => $index,
					'stock_status'   => 'instock',
					'image_id'       => $this->attachment_id,
				);
			}
		}
		return array(
			'product'      => array(
				'name'         => 'YPW variable ' . wp_generate_password( 7, false ),
				'status'       => 'publish',
				'category_ids' => array( $this->category_id ),
				'image_ids'    => array( $this->attachment_id ),
			),
			'attributes'   => $attributes,
			'combinations' => $combinations,
		);
	}

	private function create_product(): array {
		$data = $this->data( $this->dispatch( 'POST', '/variable-products', $this->payload(), wp_generate_uuid4() ) );
		$this->track( $data );
		self::assertSame( 'succeeded', $data['state'], (string) wp_json_encode( $data ) );
		return $data;
	}

	private function track( array $data ): void {
		$this->operation_ids[] = (string) $data['operation_id'];
		$this->product_ids[]   = (int) $data['product']['id'];
	}

	private function dispatch( string $method, string $path, array $parameters = array(), ?string $key = null ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/yaxii-product-workspace/v1' . $path );
		if ( 'GET' === $method ) {
			$request->set_query_params( $parameters );
		} else {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( (string) wp_json_encode( $parameters ) );
		}
		if ( null !== $key ) {
			$request->set_header( 'idempotency-key', $key );
		}
		return rest_get_server()->dispatch( $request );
	}

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
