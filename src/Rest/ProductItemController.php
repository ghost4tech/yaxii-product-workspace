<?php
/**
 * Simple-product item REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductRequestFactory;
use Yaxii\ProductWorkspace\Application\Products\ProductManagementService;

defined( 'ABSPATH' ) || exit;

/**
 * Owns detail, versioned update, duplicate prefill, and trash HTTP concerns.
 */
final class ProductItemController extends \WP_REST_Controller {
	private CreateProductRequestFactory $request_factory;
	private ProductManagementService $management;
	private CapabilityPolicy $capabilities;

	public function __construct(
		CreateProductRequestFactory $request_factory,
		ProductManagementService $management,
		CapabilityPolicy $capabilities
	) {
		$this->namespace       = 'yaxii-product-workspace/v1';
		$this->rest_base       = 'products';
		$this->request_factory = $request_factory;
		$this->management      = $management;
		$this->capabilities    = $capabilities;
	}

	public function register_routes(): void {
		$route = '/' . $this->rest_base . '/(?P<id>[\d]+)';
		register_rest_route(
			$this->namespace,
			$route,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'edit_permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'edit_permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_permissions_check' ),
					'args'                => array( 'expected_version' => $this->version_arg() ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
		register_rest_route(
			$this->namespace,
			$route . '/duplicate',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_duplicate' ),
				'permission_callback' => array( $this, 'edit_permissions_check' ),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function edit_permissions_check( $request ) {
		return $this->object_permission( $request, false );
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function delete_permissions_check( $request ) {
		return $this->object_permission( $request, true );
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_item( $request ) {
		return $this->respond( fn (): array => $this->management->get( (int) $request->get_param( 'id' ) ) );
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_duplicate( $request ) {
		return $this->respond( fn (): array => $this->management->duplicate_prefill( (int) $request->get_param( 'id' ) ) );
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_item( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$payload = $request->get_json_params();
				if ( ! is_array( $payload ) || ! isset( $payload['expected_version'], $payload['product'] ) || ! is_string( $payload['expected_version'] ) || ! is_array( $payload['product'] ) ) {
					// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns output escaping.
					throw new ApiException( 'ypw_invalid_payload', __( 'Send an expected version and a complete product object.', 'yaxii-product-workspace' ), 400 );
				}
				return $this->management->update(
					(int) $request->get_param( 'id' ),
					$payload['expected_version'],
					$this->request_factory->from_complete_array( $payload['product'] )
				);
			}
		);
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_item( $request ) {
		return $this->respond(
			fn (): array => $this->management->trash(
				(int) $request->get_param( 'id' ),
				(string) $request->get_param( 'expected_version' )
			)
		);
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return SimpleProductSchema::request( true );
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	private function object_permission( $request, bool $delete ) {
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}
		$product_id = (int) $request->get_param( 'id' );
		$allowed    = $delete
			? $this->capabilities->can_delete_product( $product_id )
			: $this->capabilities->can_edit_product( $product_id );
		return $allowed ? true : ApiError::forbidden();
	}

	/**
	 * @param callable(): array<string, mixed> $operation Product operation.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function respond( callable $operation ) {
		try {
			return rest_ensure_response( array( 'data' => $operation() ) );
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
	private function version_arg(): array {
		return array(
			'type'      => 'string',
			'required'  => true,
			'minLength' => 64,
			'maxLength' => 64,
		);
	}
}
