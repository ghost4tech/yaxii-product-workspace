<?php
/**
 * Product finder REST regression coverage.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * Verifies that mixed WooCommerce product types keep their canonical shapes.
 */
final class ProductFinderControllerTest extends TestCase {
	private int $original_user_id;

	/** @var array<int> */
	private array $product_ids = array();

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
	}

	protected function tearDown(): void {
		foreach ( $this->product_ids as $product_id ) {
			wp_delete_post( $product_id, true );
		}
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_mixed_product_page_preserves_simple_and_variable_contracts(): void {
		$marker   = 'YPW finder ' . wp_generate_password( 8, false );
		$simple   = new \WC_Product_Simple();
		$variable = new \WC_Product_Variable();
		$private  = new \WC_Product_Simple();

		$this->save_product( $simple, $marker . ' simple', 'publish' );
		$this->save_product( $variable, $marker . ' variable', 'draft' );
		$this->save_product( $private, $marker . ' private', 'private' );

		$data = $this->request( $marker );
		self::assertSame( 2, $data['total'] );
		self::assertCount( 2, $data['items'] );
		$types = array_column( $data['items'], 'type' );
		sort( $types );
		self::assertSame( array( 'simple', 'variable' ), $types );

		$variable_items = array_values(
			array_filter(
				$data['items'],
				static fn( array $item ): bool => 'variable' === $item['type']
			)
		);
		self::assertCount( 1, $variable_items );
		$variable_item = $variable_items[0];
		self::assertArrayHasKey( 'attributes', $variable_item );
		self::assertArrayHasKey( 'combinations', $variable_item );
		self::assertArrayHasKey( 'projected_count', $variable_item );
	}

	/** @param \WC_Product $product Product fixture. */
	private function save_product( \WC_Product $product, string $name, string $status ): void {
		$product->set_name( $name );
		$product->set_status( $status );
		$product->set_regular_price( '19.99' );
		$this->product_ids[] = $product->save();
	}

	/** @return array<string, mixed> */
	private function request( string $search ): array {
		$request = new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/products' );
		$request->set_query_params(
			array(
				'page'     => 1,
				'per_page' => 10,
				'search'   => $search,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		self::assertSame( 200, $response->get_status() );
		$payload = $response->get_data();
		self::assertIsArray( $payload );
		return $payload['data'];
	}
}
