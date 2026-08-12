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
	private BootstrapController $bootstrap_controller;
	private SchemaManager $schema_manager;
	private CategoryController $category_controller;
	private ProductController $product_controller;
	private OperationController $operation_controller;

	private function __construct(
		AdminPage $admin_page,
		BootstrapController $bootstrap_controller,
		SchemaManager $schema_manager,
		CategoryController $category_controller,
		ProductController $product_controller,
		OperationController $operation_controller
	) {
		$this->admin_page           = $admin_page;
		$this->bootstrap_controller = $bootstrap_controller;
		$this->schema_manager       = $schema_manager;
		$this->category_controller  = $category_controller;
		$this->product_controller   = $product_controller;
		$this->operation_controller = $operation_controller;
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
			new BootstrapController( $provider, $capabilities ),
			$schema,
			new CategoryController( $capabilities ),
			new ProductController( new CreateProductRequestFactory(), $service, $capabilities ),
			new OperationController( $operations, $service, $capabilities )
		);
	}

	public function register(): void {
		$this->admin_page->register();
		add_action( 'plugins_loaded', array( $this->schema_manager, 'maybe_upgrade' ), 20 );
		add_action( 'rest_api_init', array( $this->bootstrap_controller, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this->category_controller, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this->product_controller, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this->operation_controller, 'register_routes' ) );
	}
}
