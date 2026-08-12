<?php
/**
 * Plugin composition root.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace;

use Yaxii\ProductWorkspace\Admin\AdminPage;
use Yaxii\ProductWorkspace\Application\Access\WordPressCapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Bootstrap\BootstrapProvider;
use Yaxii\ProductWorkspace\Rest\BootstrapController;

defined( 'ABSPATH' ) || exit;

/**
 * Builds the small Phase 2 application graph and registers its hooks.
 */
final class Plugin {
	private AdminPage $admin_page;
	private BootstrapController $bootstrap_controller;

	private function __construct( AdminPage $admin_page, BootstrapController $bootstrap_controller ) {
		$this->admin_page           = $admin_page;
		$this->bootstrap_controller = $bootstrap_controller;
	}

	public static function create( string $plugin_file ): self {
		$capabilities = new WordPressCapabilityPolicy();
		$provider     = new BootstrapProvider( $capabilities );

		return new self(
			new AdminPage( $plugin_file, $capabilities ),
			new BootstrapController( $provider, $capabilities )
		);
	}

	public function register(): void {
		$this->admin_page->register();
		add_action( 'rest_api_init', array( $this->bootstrap_controller, 'register_routes' ) );
	}
}
