<?php
/**
 * Hierarchical product-category REST integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

final class ProductCategoryControllerTest extends TestCase {
	private int $original_user_id;

	/** @var array<int> */
	private array $term_ids = array();

	/** @var array<int> */
	private array $user_ids = array();

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		$administrators         = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		self::assertNotEmpty( $administrators );
		wp_set_current_user( (int) $administrators[0]->ID );
		do_action( 'rest_api_init' );
		$this->create_hierarchy();
	}

	protected function tearDown(): void {
		foreach ( array_reverse( $this->term_ids ) as $term_id ) {
			wp_delete_term( $term_id, 'product_cat' );
		}
		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_route_requires_authentication_and_product_capability(): void {
		wp_set_current_user( 0 );
		$unauthenticated = rest_get_server()->dispatch( new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/categories' ) );
		self::assertSame( 401, $unauthenticated->get_status() );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'ypw_category_reader_' . strtolower( wp_generate_password( 8, false ) ),
				'user_pass'  => wp_generate_password( 20 ),
				'user_email' => wp_generate_uuid4() . '@example.test',
				'role'       => 'subscriber',
			)
		);
		self::assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		wp_set_current_user( $user_id );

		$forbidden = rest_get_server()->dispatch( new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/categories' ) );
		self::assertSame( 403, $forbidden->get_status() );
	}

	public function test_children_are_loaded_one_bounded_level_at_a_time(): void {
		$data = $this->request(
			array(
				'parent'   => $this->term_ids[0],
				'page'     => 1,
				'per_page' => 10,
			)
		);

		self::assertSame( array( $this->term_ids[1] ), array_column( $data['items'], 'id' ) );
		self::assertTrue( $data['items'][0]['has_children'] );
		self::assertFalse( $data['has_more'] );
	}

	public function test_search_result_contains_ancestor_context(): void {
		$data      = $this->request(
			array(
				'search'   => 'Grandchild ' . $this->term_ids[2],
				'per_page' => 10,
			)
		);
		$match     = $data['items'][0];
		$ancestors = array_column( $match['ancestors'], 'id' );

		self::assertSame( $this->term_ids[2], $match['id'] );
		self::assertSame( array( $this->term_ids[0], $this->term_ids[1] ), $ancestors );
	}

	public function test_selected_ids_can_be_hydrated_outside_loaded_branch(): void {
		$data = $this->request(
			array(
				'include'  => array( $this->term_ids[2] ),
				'per_page' => 20,
			)
		);

		self::assertSame( array( $this->term_ids[2] ), array_column( $data['items'], 'id' ) );
	}

	/** @param array<string, mixed> $query
	 * @return array<string, mixed> */
	private function request( array $query ): array {
		$request = new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/categories' );
		$request->set_query_params( $query );
		$response = rest_get_server()->dispatch( $request );
		self::assertSame( 200, $response->get_status() );
		$body = $response->get_data();
		self::assertIsArray( $body );
		self::assertIsArray( $body['data'] );
		return $body['data'];
	}

	private function create_hierarchy(): void {
		$root = wp_insert_term( 'YPW category root ' . wp_generate_uuid4(), 'product_cat' );
		self::assertIsArray( $root );
		$this->term_ids[] = (int) $root['term_id'];

		$child = wp_insert_term(
			'YPW category child ' . wp_generate_uuid4(),
			'product_cat',
			array( 'parent' => $this->term_ids[0] )
		);
		self::assertIsArray( $child );
		$this->term_ids[] = (int) $child['term_id'];

		$grandchild = wp_insert_term(
			'Grandchild pending',
			'product_cat',
			array( 'parent' => $this->term_ids[1] )
		);
		self::assertIsArray( $grandchild );
		$this->term_ids[] = (int) $grandchild['term_id'];
		wp_update_term(
			$this->term_ids[2],
			'product_cat',
			array( 'name' => 'Grandchild ' . $this->term_ids[2] )
		);
	}
}
