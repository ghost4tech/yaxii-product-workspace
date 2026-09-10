<?php
/**
 * Native WooCommerce product-navigation integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Admin\ProductNavigation;
use Yaxii\ProductWorkspace\Tests\Support\FakeCapabilityPolicy;

/**
 * Covers the canonical deep link and its native WooCommerce entry points.
 */
final class ProductNavigationTest extends TestCase {
	private FakeCapabilityPolicy $capabilities;
	private ProductNavigation $navigation;
	/** @var array<int> */
	private array $product_ids = array();
	/** @var array<string, mixed> */
	private array $original_get = array();

	protected function setUp(): void {
		parent::setUp();
		$this->capabilities = new FakeCapabilityPolicy();
		$this->navigation   = new ProductNavigation( $this->capabilities );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Test snapshot of read-only navigation input.
		$this->original_get = $_GET;
	}

	protected function tearDown(): void {
		foreach ( $this->product_ids as $product_id ) {
			$product = wc_get_product( $product_id );
			$product instanceof \WC_Product ? $product->delete( true ) : wp_delete_post( $product_id, true );
		}
		$_GET = $this->original_get;
		parent::tearDown();
	}

	public function test_row_action_preserves_native_actions_and_uses_canonical_url(): void {
		$product_id = $this->create_product( new \WC_Product_Simple() );
		$post       = get_post( $product_id );
		self::assertInstanceOf( \WP_Post::class, $post );

		$actions = $this->navigation->row_actions(
			array(
				'edit'  => '<a>Edit</a>',
				'trash' => '<a>Trash</a>',
			),
			$post
		);

		self::assertSame( '<a>Edit</a>', $actions['edit'] );
		self::assertSame( '<a>Trash</a>', $actions['trash'] );
		self::assertStringContainsString( 'Edit with Yaxii Product Workspace', $actions['yaxii_product_workspace'] );
		self::assertStringContainsString( 'page=yaxii-product-workspace', html_entity_decode( $actions['yaxii_product_workspace'] ) );
		self::assertStringContainsString( 'product=' . $product_id, html_entity_decode( $actions['yaxii_product_workspace'] ) );
	}

	public function test_actions_are_bounded_by_type_and_object_capability(): void {
		$simple_id   = $this->create_product( new \WC_Product_Simple() );
		$variable_id = $this->create_product( new \WC_Product_Variable() );
		$grouped_id  = $this->create_product( new \WC_Product_Grouped() );

		foreach ( array( $simple_id, $variable_id ) as $product_id ) {
			$post = get_post( $product_id );
			self::assertInstanceOf( \WP_Post::class, $post );
			self::assertArrayHasKey( 'yaxii_product_workspace', $this->navigation->row_actions( array(), $post ) );
		}

		$post = get_post( $grouped_id );
		self::assertInstanceOf( \WP_Post::class, $post );
		self::assertArrayNotHasKey( 'yaxii_product_workspace', $this->navigation->row_actions( array(), $post ) );

		$this->capabilities->edit = false;
		$post                     = get_post( $simple_id );
		self::assertInstanceOf( \WP_Post::class, $post );
		self::assertSame( array( 'edit' => 'kept' ), $this->navigation->row_actions( array( 'edit' => 'kept' ), $post ) );
	}

	public function test_native_editor_action_is_compact_and_supported_only(): void {
		$simple_id = $this->create_product( new \WC_Product_Simple() );
		$post      = get_post( $simple_id );
		self::assertInstanceOf( \WP_Post::class, $post );

		ob_start();
		$this->navigation->render_native_editor_action( $post );
		$output = (string) ob_get_clean();
		self::assertStringContainsString( 'button button-secondary', $output );
		self::assertStringContainsString( 'Open in Product Workspace', $output );
		self::assertStringContainsString( 'product=' . $simple_id, html_entity_decode( $output ) );

		$this->capabilities->edit = false;
		ob_start();
		$this->navigation->render_native_editor_action( $post );
		self::assertSame( '', (string) ob_get_clean() );
	}

	public function test_deep_link_parameter_is_validated_without_mutation(): void {
		unset( $_GET['product'] );
		self::assertNull( $this->navigation->requested_product_id() );

		$_GET['product'] = '42';
		self::assertSame( 42, $this->navigation->requested_product_id() );

		foreach ( array( '0', '-1', '1.2', '12x', array( '12' ) ) as $invalid ) {
			$_GET['product'] = $invalid;
			self::assertSame( 0, $this->navigation->requested_product_id() );
		}
	}

	private function create_product( \WC_Product $product ): int {
		$product->set_name( 'YPW navigation ' . wp_generate_password( 6, false ) );
		$product->set_status( 'draft' );
		$product_id          = $product->save();
		$this->product_ids[] = $product_id;
		return $product_id;
	}
}
