<?php
/**
 * Simple-product create REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;

defined( 'ABSPATH' ) || exit;

/**
 * Parses HTTP input and delegates product creation to the application service.
 */
final class ProductController extends \WP_REST_Controller {
	private CreateProductRequestFactory $request_factory;
	private CreateProductService $service;
	private CapabilityPolicy $capabilities;

	public function __construct(
		CreateProductRequestFactory $request_factory,
		CreateProductService $service,
		CapabilityPolicy $capabilities
	) {
		$this->namespace       = 'yaxii-product-workspace/v1';
		$this->rest_base       = 'products';
		$this->request_factory = $request_factory;
		$this->service         = $service;
		$this->capabilities    = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_item' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
				'schema'              => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		unset( $request );
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}

		return $this->capabilities->can_create_products() ? true : ApiError::forbidden();
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {
		try {
			$idempotency_key = strtolower( trim( $request->get_header( 'idempotency-key' ) ) );
			if ( ! $this->is_uuid( $idempotency_key ) ) {
				throw new ApiException(
					'ypw_invalid_idempotency_key',
					__( 'A valid UUID Idempotency-Key header is required.', 'yaxii-product-workspace' ),
					400
				);
			}

			$payload = $request->get_json_params();
			if ( ! is_array( $payload ) ) {
				throw new ApiException(
					'ypw_invalid_payload',
					__( 'Send a JSON object containing the product fields.', 'yaxii-product-workspace' ),
					400
				);
			}

			$result   = $this->service->create(
				$this->request_factory->from_array( $payload ),
				$idempotency_key,
				get_current_blog_id(),
				get_current_user_id()
			);
			$response = rest_ensure_response( array( 'data' => $result->to_array() ) );
			$response->set_status( $result->http_status() );
			return $response;
		} catch ( ApiException $exception ) {
			return ApiError::from_exception( $exception );
		}
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'yaxii_simple_product_create',
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => array( 'name', 'regular_price', 'category_ids', 'status' ),
			'properties'           => array(
				'name'               => array(
					'type'      => 'string',
					'maxLength' => 200,
				),
				'sku'                => array(
					'type'      => 'string',
					'maxLength' => 100,
				),
				'regular_price'      => array( 'type' => 'string' ),
				'sale_price'         => array( 'type' => array( 'string', 'null' ) ),
				'manage_stock'       => array( 'type' => 'boolean' ),
				'stock_quantity'     => array(
					'type'    => array( 'integer', 'null' ),
					'minimum' => 0,
				),
				'stock_status'       => array(
					'type' => 'string',
					'enum' => array( 'instock', 'outofstock', 'onbackorder' ),
				),
				'status'             => array(
					'type' => 'string',
					'enum' => array( 'draft', 'publish' ),
				),
				'catalog_visibility' => array(
					'type' => 'string',
					'enum' => array( 'visible', 'catalog', 'search', 'hidden' ),
				),
				'tax_status'         => array(
					'type' => 'string',
					'enum' => array( 'taxable', 'shipping', 'none' ),
				),
				'description'        => array( 'type' => 'string' ),
				'short_description'  => array( 'type' => 'string' ),
				'category_ids'       => array(
					'type'     => 'array',
					'items'    => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
					'maxItems' => 10,
				),
				'image_ids'          => array(
					'type'     => 'array',
					'items'    => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
					'maxItems' => 10,
				),
			),
		);
	}

	private function is_uuid( string $value ): bool {
		return 1 === preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $value );
	}
}
