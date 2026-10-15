<?php
/**
 * WordPress admin host for the Product Workspace frontend.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Admin;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Infrastructure\WordPress\UserLocaleContext;

defined( 'ABSPATH' ) || exit;

/**
 * Mounts and scopes the approved Lovable application in wp-admin.
 */
final class AdminPage {
	private const MENU_SLUG    = 'yaxii-product-workspace';
	private const SCRIPT_NAME  = 'yaxii-product-workspace-app';
	private const SHELL_STYLE  = 'yaxii-product-workspace-admin-shell';
	private const STYLE_PREFIX = 'yaxii-product-workspace-app';

	private string $hook_suffix = '';
	private string $plugin_file;
	private CapabilityPolicy $capabilities;
	private UserLocaleContext $locale;

	public function __construct( string $plugin_file, CapabilityPolicy $capabilities, UserLocaleContext $locale ) {
		$this->plugin_file  = $plugin_file;
		$this->capabilities = $capabilities;
		$this->locale       = $locale;
	}

	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );
		add_filter( 'admin_footer_text', array( $this, 'footer_text' ), 99 );
		add_filter( 'update_footer', array( $this, 'footer_text' ), 99 );
		add_filter( 'script_loader_tag', array( $this, 'mark_script_as_module' ), 10, 2 );
	}

	public function add_menu_page(): void {
		$this->hook_suffix = (string) add_menu_page(
			__( 'Yaxii Product Workspace', 'yaxii-product-workspace' ),
			__( 'Product Workspace', 'yaxii-product-workspace' ),
			$this->required_capability(),
			self::MENU_SLUG,
			array( $this, 'render_page' ),
			'dashicons-products',
			56
		);
	}

	public function enqueue_assets( string $hook_suffix ): void {
		if ( $hook_suffix !== $this->hook_suffix ) {
			return;
		}

		$this->enqueue_shell_style();
		$entry = $this->manifest_entry();
		if ( null === $entry ) {
			return;
		}

		wp_enqueue_media();
		$build_path = plugin_dir_path( $this->plugin_file ) . 'assets/build/';
		$build_url  = plugin_dir_url( $this->plugin_file ) . 'assets/build/';
		$this->enqueue_application_script( $entry['file'], $build_path, $build_url );
		$this->enqueue_styles( $entry['css'], $build_path, $build_url );
	}

	private function enqueue_shell_style(): void {
		$relative_path = 'assets/admin-shell.css';
		$path          = plugin_dir_path( $this->plugin_file ) . $relative_path;
		wp_enqueue_style(
			self::SHELL_STYLE,
			plugin_dir_url( $this->plugin_file ) . $relative_path,
			array(),
			$this->asset_version( $path )
		);
	}

	public function admin_body_class( string $classes ): string {
		return $this->is_workspace_screen() ? trim( $classes . ' yaxii-product-workspace-admin' ) : $classes;
	}

	public function footer_text( string $text ): string {
		return $this->is_workspace_screen() ? '' : $text;
	}

	private function is_workspace_screen(): bool {
		$screen = get_current_screen();
		return $screen instanceof \WP_Screen && $screen->id === $this->hook_suffix;
	}

	private function enqueue_application_script( string $script, string $build_path, string $build_url ): void {
		wp_enqueue_script(
			self::SCRIPT_NAME,
			$build_url . $script,
			array( 'wp-element', 'wp-i18n', 'react-jsx-runtime' ),
			$this->asset_version( $build_path . $script ),
			true
		);

		wp_set_script_translations(
			self::SCRIPT_NAME,
			'yaxii-product-workspace',
			plugin_dir_path( $this->plugin_file ) . 'languages'
		);
		wp_add_inline_script(
			self::SCRIPT_NAME,
			'window.yaxiiProductWorkspaceConfig = ' . wp_json_encode( $this->host_data() ) . ';',
			'before'
		);
	}

	/**
	 * @param array<string> $styles Stylesheet paths.
	 */
	private function enqueue_styles( array $styles, string $build_path, string $build_url ): void {
		foreach ( $styles as $index => $stylesheet ) {
			wp_enqueue_style(
				self::STYLE_PREFIX . '-' . $index,
				$build_url . $stylesheet,
				array(),
				$this->asset_version( $build_path . $stylesheet )
			);
		}
	}

	public function mark_script_as_module( string $tag, string $handle ): string {
		if ( self::SCRIPT_NAME !== $handle ) {
			return $tag;
		}

		if ( false === strpos( $tag, ' type=' ) ) {
			return str_replace( '<script ', '<script type="module" ', $tag );
		}

		$module_tag = preg_replace( '/\stype=(["\']).*?\1/', ' type="module"', $tag, 1 );
		return is_string( $module_tag ) ? $module_tag : $tag;
	}

	public function render_page(): void {
		if ( ! $this->capabilities->can_access_workspace() ) {
			wp_die( esc_html__( 'You are not allowed to access this workspace.', 'yaxii-product-workspace' ) );
		}
		?>
		<div class="wrap yaxii-product-workspace-page">
			<h1 class="screen-reader-text"><?php echo esc_html__( 'Yaxii Product Workspace', 'yaxii-product-workspace' ); ?></h1>
			<div id="yaxii-product-workspace">
				<div id="yaxii-product-workspace-app">
					<div class="notice notice-info inline"><p><?php echo esc_html( $this->fallback_message() ); ?></p></div>
				</div>
				<div id="yaxii-product-workspace-portals"></div>
			</div>
		</div>
		<?php
	}

	/**
	 * @return array<string, mixed>
	 */
	private function host_data(): array {
		$locale = $this->locale->current();

		return array(
			'direction'              => $locale['direction'],
			'environment'            => 'wordpress',
			'frontendAvailable'      => null !== $this->manifest_entry(),
			'isWooCommerceAvailable' => $this->is_woocommerce_available(),
			'locale'                 => $locale['code'],
			'nonce'                  => wp_create_nonce( 'wp_rest' ),
			'pluginVersion'          => YAXII_PRODUCT_WORKSPACE_VERSION,
			'mediaRestUrl'           => esc_url_raw( rest_url( 'wp/v2/media' ) ),
			'restUrl'                => esc_url_raw( rest_url( 'yaxii-product-workspace/v1/' ) ),
		);
	}

	private function fallback_message(): string {
		if ( null === $this->manifest_entry() ) {
			return __( 'The Product Workspace frontend is unavailable because its built assets are missing.', 'yaxii-product-workspace' );
		}

		if ( ! $this->is_woocommerce_available() ) {
			return __( 'WooCommerce must be installed and active before the Product Workspace can be used.', 'yaxii-product-workspace' );
		}

		return __( 'Loading Yaxii Product Workspace...', 'yaxii-product-workspace' );
	}

	private function required_capability(): string {
		return $this->is_woocommerce_available() ? 'edit_products' : 'manage_options';
	}

	private function is_woocommerce_available(): bool {
		return class_exists( 'WooCommerce' ) && defined( 'WC_VERSION' );
	}

	/**
	 * @return array{file: string, css: array<string>}|null
	 */
	private function manifest_entry(): ?array {
		static $entry = false;

		if ( false !== $entry ) {
			return $entry;
		}

		$manifest_path = plugin_dir_path( $this->plugin_file ) . 'assets/build/.vite/manifest.json';
		if ( ! is_readable( $manifest_path ) ) {
			$entry = null;
			return null;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reads a local generated manifest.
		$manifest  = json_decode( (string) file_get_contents( $manifest_path ), true );
		$candidate = is_array( $manifest ) ? ( $manifest['src/main.tsx'] ?? null ) : null;
		if ( ! is_array( $candidate ) || ! isset( $candidate['file'] ) || ! is_string( $candidate['file'] ) ) {
			$entry = null;
			return null;
		}

		$css   = isset( $candidate['css'] ) && is_array( $candidate['css'] ) ? $candidate['css'] : array();
		$entry = array(
			'file' => $candidate['file'],
			'css'  => array_values( array_filter( $css, 'is_string' ) ),
		);

		return $entry;
	}

	private function asset_version( string $path ): string {
		$modified = is_file( $path ) ? filemtime( $path ) : false;
		return false === $modified ? YAXII_PRODUCT_WORKSPACE_VERSION : (string) $modified;
	}
}
