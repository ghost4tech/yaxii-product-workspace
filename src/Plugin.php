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
use Yaxii\ProductWorkspace\Application\Operations\OperationPresenter;
use Yaxii\ProductWorkspace\Application\Preferences\PreferenceService;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;
use Yaxii\ProductWorkspace\Application\Products\ProductFieldParser;
use Yaxii\ProductWorkspace\Application\Products\ProductManagementService;
use Yaxii\ProductWorkspace\Application\VariableProducts\CombinationGenerator;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductManagementService;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductPlanFactory;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductRequestFactory;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductService;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationInputParser;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\SchemaManager;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\WpdbOperationStore;
use Yaxii\ProductWorkspace\Infrastructure\Persistence\WordPressPreferenceRepository;
use Yaxii\ProductWorkspace\Infrastructure\WordPress\UserLocaleContext;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooProductGateway;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooAttributeCatalog;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooProductMapper;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooVariableProductGateway;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooVariableProductMapper;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooVariableReferenceValidator;
use Yaxii\ProductWorkspace\Infrastructure\WooCommerce\WooVariationWriter;
use Yaxii\ProductWorkspace\Rest\BootstrapController;
use Yaxii\ProductWorkspace\Rest\OperationController;
use Yaxii\ProductWorkspace\Rest\OperationSummaryController;
use Yaxii\ProductWorkspace\Rest\PreferenceController;
use Yaxii\ProductWorkspace\Rest\ProductController;
use Yaxii\ProductWorkspace\Rest\ProductItemController;
use Yaxii\ProductWorkspace\Rest\ProductAttributeController;
use Yaxii\ProductWorkspace\Rest\ProductTermController;
use Yaxii\ProductWorkspace\Rest\VariableProductController;

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
		$locale       = new UserLocaleContext();
		$provider     = new BootstrapProvider( $capabilities, $locale );
		$schema       = SchemaManager::create();
		global $wpdb;
		$operations          = new WpdbOperationStore( $wpdb, $schema->table_name() );
		$field_parser        = new ProductFieldParser();
		$product_mapper      = new WooProductMapper();
		$variable_mapper     = new WooVariableProductMapper( $product_mapper );
		$products            = new WooProductGateway( $product_mapper, $variable_mapper );
		$factory             = new CreateProductRequestFactory( $field_parser );
		$service             = new CreateProductService( $capabilities, $operations, $products, $factory );
		$management          = new ProductManagementService( $capabilities, $products );
		$variable_gateway    = new WooVariableProductGateway(
			$product_mapper,
			$variable_mapper,
			new WooVariableReferenceValidator( $products ),
			new WooVariationWriter()
		);
		$variable_requests   = new VariableProductRequestFactory(
			$factory,
			new VariableProductPlanFactory( new CombinationGenerator( new VariationInputParser( $field_parser ) ) )
		);
		$variable_service    = new VariableProductService( $capabilities, $operations, $variable_gateway, $variable_requests );
		$variable_management = new VariableProductManagementService( $capabilities, $variable_gateway );
		$preferences         = new PreferenceService(
			new WordPressPreferenceRepository(),
			class_exists( 'WC_Tax' ) ? \WC_Tax::get_tax_class_slugs() : array()
		);

		return new self(
			new AdminPage( $plugin_file, $capabilities, $locale ),
			$schema,
			array(
				new BootstrapController( $provider, $capabilities ),
				new ProductTermController( $capabilities, 'categories', 'product_cat' ),
				new ProductTermController( $capabilities, 'tags', 'product_tag' ),
				new ProductTermController( $capabilities, 'shipping-classes', 'product_shipping_class' ),
				new ProductAttributeController( new WooAttributeCatalog(), $capabilities ),
				new ProductController( $factory, $service, $management, $capabilities ),
				new ProductItemController( $factory, $management, $capabilities ),
				new VariableProductController( $variable_requests, $variable_service, $variable_management, $capabilities ),
				new OperationController( $operations, new OperationPresenter(), $service, $capabilities, $variable_service ),
				new OperationSummaryController( $operations, $capabilities ),
				new PreferenceController( $preferences, $capabilities ),
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
