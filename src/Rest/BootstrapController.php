<?php
/**
 * REST bootstrap controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Bootstrap\BootstrapProvider;

defined( 'ABSPATH' ) || exit;

/**
 * Exposes the current user and store configuration without secrets.
 */
final class BootstrapController extends \WP_REST_Controller {
	private BootstrapProvider $provider;
	private CapabilityPolicy $capabilities;

	public function __construct( BootstrapProvider $provider, CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'bootstrap';
		$this->provider     = $provider;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
				'schema'              => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		unset( $request );
		if ( ! is_user_logged_in() ) {
			return ApiError::unauthenticated();
		}

		return $this->capabilities->can_access_workspace() ? true : ApiError::forbidden();
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 */
	public function get_item( $request ): \WP_REST_Response {
		unset( $request );
		return rest_ensure_response( array( 'data' => $this->provider->get()->to_array() ) );
	}

	/**
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'yaxii_product_workspace_bootstrap',
			'type'       => 'object',
			'properties' => array(
				'data' => array(
					'type'     => 'object',
					'readonly' => true,
				),
			),
		);
	}
}
