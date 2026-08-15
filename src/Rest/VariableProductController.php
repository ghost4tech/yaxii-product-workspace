<?php
/**
 * Variable-product create, read, and update REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductManagementService;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductRequestFactory;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductService;

final class VariableProductController extends \WP_REST_Controller {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- ApiException is serialized by ApiError.
	private VariableProductRequestFactory $requests;
	private VariableProductService $creates;
	private VariableProductManagementService $management;
	private CapabilityPolicy $capabilities;

	public function __construct( VariableProductRequestFactory $requests, VariableProductService $creates, VariableProductManagementService $management, CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'variable-products';
		$this->requests     = $requests;
		$this->creates      = $creates;
		$this->management   = $management;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_item' ),
				'permission_callback' => array( $this, 'create_permissions_check' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
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
			)
		);
	}

	/** @return true|\WP_Error */
	public function create_permissions_check() {
		return $this->permission( 0 );
	}

	/** @param \WP_REST_Request $request Request.
	 * @return true|\WP_Error */
	public function edit_permissions_check( $request ) {
		return $this->permission( (int) $request->get_param( 'id' ) );
	}

	/** @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error */
	public function create_item( $request ) {
		try {
			$key = strtolower( trim( $request->get_header( 'idempotency-key' ) ) );
			if ( ! wp_is_uuid( $key ) ) {
				throw new ApiException( 'ypw_invalid_idempotency_key', __( 'A valid UUID Idempotency-Key header is required.', 'yaxii-product-workspace' ), 400 );
			}
			$result   = $this->creates->create( $this->requests->from_array( $this->payload( $request ) ), $key, get_current_blog_id(), get_current_user_id() );
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

	/** @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error */
	public function get_item( $request ) {
		return $this->respond( fn (): array => $this->management->get( (int) $request->get_param( 'id' ) ) );
	}

	/** @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error */
	public function update_item( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$payload = $this->payload( $request );
				if ( ! isset( $payload['expected_version'] ) || ! is_string( $payload['expected_version'] ) ) {
					throw new ApiException( 'ypw_invalid_payload', __( 'Send the expected product version.', 'yaxii-product-workspace' ), 400 );
				}
				$version = $payload['expected_version'];
				unset( $payload['expected_version'] );
				return $this->management->update( (int) $request->get_param( 'id' ), $version, $this->requests->from_array( $payload ) );
			}
		);
	}

	/** @param \WP_REST_Request $request Request.
	 * @return array<string, mixed> */
	private function payload( $request ): array {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			throw new ApiException( 'ypw_invalid_payload', __( 'Send a JSON variable-product object.', 'yaxii-product-workspace' ), 400 );
		}
		return $payload;
	}

	/** @return true|\WP_Error */
	private function permission( int $product_id ) {
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}
		$allowed = 0 === $product_id ? $this->capabilities->can_create_products() : $this->capabilities->can_edit_product( $product_id );
		return $allowed ? true : ApiError::forbidden();
	}

	/** @param callable(): array<string, mixed> $operation
	 * @return \WP_REST_Response|\WP_Error */
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
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
