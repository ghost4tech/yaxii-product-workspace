<?php
/**
 * Simple-product collection REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;
use Yaxii\ProductWorkspace\Application\Products\ProductManagementService;
use Yaxii\ProductWorkspace\Application\Products\ProductQuery;

defined( 'ABSPATH' ) || exit;

/**
 * Parses collection HTTP input and delegates to application services.
 */
final class ProductController extends \WP_REST_Controller {
	private CreateProductRequestFactory $request_factory;
	private CreateProductService $create_service;
	private ProductManagementService $management;
	private CapabilityPolicy $capabilities;

	public function __construct(
		CreateProductRequestFactory $request_factory,
		CreateProductService $create_service,
		ProductManagementService $management,
		CapabilityPolicy $capabilities
	) {
		$this->namespace       = 'yaxii-product-workspace/v1';
		$this->rest_base       = 'products';
		$this->request_factory = $request_factory;
		$this->create_service  = $create_service;
		$this->management      = $management;
		$this->capabilities    = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->collection_args(),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * @return true|\WP_Error
	 */
	public function permissions_check() {
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}
		return $this->capabilities->can_create_products() ? true : ApiError::forbidden();
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) {
		try {
			$query = new ProductQuery(
				(int) $request->get_param( 'page' ),
				(int) $request->get_param( 'per_page' ),
				sanitize_text_field( (string) $request->get_param( 'search' ) ),
				sanitize_key( (string) $request->get_param( 'status' ) )
			);
			return rest_ensure_response( array( 'data' => $this->management->query( $query ) ) );
		} catch ( ApiException $exception ) {
			return ApiError::from_exception( $exception );
		} catch ( Throwable $exception ) {
			unset( $exception );
			return ApiError::server_failure();
		}
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {
		try {
			$idempotency_key = strtolower( trim( $request->get_header( 'idempotency-key' ) ) );
			if ( ! wp_is_uuid( $idempotency_key ) ) {
				throw new ApiException( 'ypw_invalid_idempotency_key', __( 'A valid UUID Idempotency-Key header is required.', 'yaxii-product-workspace' ), 400 );
			}
			$payload = $request->get_json_params();
			if ( ! is_array( $payload ) ) {
				throw new ApiException( 'ypw_invalid_payload', __( 'Send a JSON object containing the product fields.', 'yaxii-product-workspace' ), 400 );
			}
			$result   = $this->create_service->create( $this->request_factory->from_array( $payload ), $idempotency_key, get_current_blog_id(), get_current_user_id() );
			$response = rest_ensure_response( array( 'data' => $result->to_array() ) );
			$response->set_status( $result->http_status() );
			return $response;
		} catch ( ApiException $exception ) {
			return ApiError::from_exception( $exception );
		} catch ( Throwable $exception ) {
			unset( $exception );
			return ApiError::server_failure();
		}
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return SimpleProductSchema::request();
	}

	/**
	 * @return array<string, array<string, mixed>>
	 */
	private function collection_args(): array {
		return array(
			'page'     => array(
				'type'    => 'integer',
				'default' => 1,
				'minimum' => 1,
				'maximum' => 10000,
			),
			'per_page' => array(
				'type'    => 'integer',
				'default' => 20,
				'minimum' => 1,
				'maximum' => 50,
			),
			'search'   => array(
				'type'      => 'string',
				'default'   => '',
				'maxLength' => 100,
			),
			'status'   => array(
				'type'    => 'string',
				'default' => 'all',
				'enum'    => array( 'all', 'publish', 'draft', 'pending' ),
			),
		);
	}
}
