<?php
/**
 * Per-user workspace preference REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Preferences\PreferenceService;
use Yaxii\ProductWorkspace\Application\Products\ApiException;

defined( 'ABSPATH' ) || exit;

final class PreferenceController extends \WP_REST_Controller {
	private PreferenceService $service;
	private CapabilityPolicy $capabilities;

	public function __construct( PreferenceService $service, CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'preferences';
		$this->service      = $service;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/** @return true|\WP_Error */
	public function permissions_check() {
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}
		return $this->capabilities->can_create_products() ? true : ApiError::forbidden();
	}

	/** @param \WP_REST_Request $request Request object. */
	public function get_item( $request ): \WP_REST_Response {
		unset( $request );
		return rest_ensure_response( array( 'data' => $this->service->get( get_current_user_id() ) ) );
	}

	/** @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error */
	public function update_item( $request ) {
		try {
			$payload = $request->get_json_params();
			if ( ! is_array( $payload ) ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns output escaping.
				throw new ApiException( 'ypw_invalid_payload', __( 'Send a JSON preference object.', 'yaxii-product-workspace' ), 400 );
			}
			return rest_ensure_response( array( 'data' => $this->service->update( get_current_user_id(), $payload ) ) );
		} catch ( ApiException $exception ) {
			return ApiError::from_exception( $exception );
		} catch ( Throwable $exception ) {
			unset( $exception );
			return ApiError::server_failure();
		}
	}
}
