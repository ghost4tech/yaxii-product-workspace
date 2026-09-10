<?php
/**
 * Native WooCommerce and Product Workspace navigation links.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Admin;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;

defined( 'ABSPATH' ) || exit;

/**
 * Owns the canonical read-only deep link and native product entry points.
 */
final class ProductNavigation {
	public const MENU_SLUG = 'yaxii-product-workspace';

	private CapabilityPolicy $capabilities;

	public function __construct( CapabilityPolicy $capabilities ) {
		$this->capabilities = $capabilities;
	}

	public function register(): void {
		add_filter( 'post_row_actions', array( $this, 'row_actions' ), 10, 2 );
		add_action( 'post_submitbox_misc_actions', array( $this, 'render_native_editor_action' ) );
	}

	/**
	 * @param array<string, string> $actions Existing post actions.
	 * @return array<string, string>
	 */
	public function row_actions( array $actions, \WP_Post $post ): array {
		if ( ! $this->can_open( $post ) ) {
			return $actions;
		}

		$actions['yaxii_product_workspace'] = sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( $this->workspace_url( $post->ID ) ),
			esc_html__( 'Edit with Yaxii Product Workspace', 'yaxii-product-workspace' )
		);
		return $actions;
	}

	public function render_native_editor_action( \WP_Post $post ): void {
		if ( ! $this->can_open( $post ) ) {
			return;
		}
		?>
		<div class="misc-pub-section yaxii-product-workspace-action">
			<a class="button button-secondary" href="<?php echo esc_url( $this->workspace_url( $post->ID ) ); ?>">
				<?php echo esc_html__( 'Open in Product Workspace', 'yaxii-product-workspace' ); ?>
			</a>
		</div>
		<?php
	}

	public function workspace_url( int $product_id ): string {
		return (string) add_query_arg(
			array(
				'page'    => self::MENU_SLUG,
				'product' => absint( $product_id ),
			),
			admin_url( 'admin.php' )
		);
	}

	public function requested_product_id(): ?int {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation cannot trigger a mutation.
		if ( ! isset( $_GET['product'] ) ) {
			return null;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation cannot trigger a mutation.
		if ( ! is_scalar( $_GET['product'] ) ) {
			return 0;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation cannot trigger a mutation.
		$value = sanitize_text_field( wp_unslash( (string) $_GET['product'] ) );
		if ( '' === $value || ! ctype_digit( $value ) ) {
			return 0;
		}
		return absint( $value );
	}

	private function can_open( \WP_Post $post ): bool {
		if ( 'product' !== $post->post_type || ! $this->capabilities->can_edit_product( $post->ID ) || ! function_exists( 'wc_get_product' ) ) {
			return false;
		}
		$product = wc_get_product( $post->ID );
		return $product instanceof \WC_Product && in_array( $product->get_type(), array( 'simple', 'variable' ), true );
	}
}
