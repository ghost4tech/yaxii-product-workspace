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
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\WpdbOperationStore;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooProductGateway;
use Yaxii\ProductWorkspace\Rest\BootstrapController;
use Yaxii\ProductWorkspace\Rest\CategoryController;
use Yaxii\ProductWorkspace\Rest\OperationController;
use Yaxii\ProductWorkspace\Rest\ProductController;

defined( 'ABSPATH' ) || exit;

/**
 * Builds the small Phase 2 application graph and registers its hooks.
 */
final class Plugin {
	private AdminPage $admin_page;
	private SchemaManager $schema_manager;

	/** @var array<int, \WP_REST_Controller> */
	private array $rest_controllers;

	/**
	 * @param array<int, \WP_REST_Controller> $rest_controllers REST endpoints to register.
	 */
	private function __construct(
		AdminPage $admin_page,
		SchemaManager $schema_manager,
		array $rest_controllers
	) {
		$this->admin_page       = $admin_page;
		$this->schema_manager   = $schema_manager;
		$this->rest_controllers = $rest_controllers;
	}

	public static function create( string $plugin_file ): self {
		$capabilities = new WordPressCapabilityPolicy();
		$provider     = new BootstrapProvider( $capabilities );
		$schema       = SchemaManager::create();
		global $wpdb;
		$operations = new WpdbOperationStore( $wpdb, $schema->table_name() );
		$products   = new WooProductGateway();
		$service    = new CreateProductService( $capabilities, $operations, $products );

		return new self(
			new AdminPage( $plugin_file, $capabilities ),
			$schema,
			array(
				new BootstrapController( $provider, $capabilities ),
				new CategoryController( $capabilities ),
				new ProductController( new CreateProductRequestFactory(), $service, $capabilities ),
				new OperationController( $operations, $service, $capabilities ),
			)
		);
	}

	public function register(): void {
		$this->admin_page->register();
		add_action( 'plugins_loaded', array( $this->schema_manager, 'maybe_upgrade' ), 20 );
		foreach ( $this->rest_controllers as $controller ) {
			add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
		}
	}
}
