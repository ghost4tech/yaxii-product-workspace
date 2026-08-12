<?php
/**
 * Operation reconciliation REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;

defined( 'ABSPATH' ) || exit;

/**
 * Returns only operation records owned by the current site user.
 */
final class OperationController extends \WP_REST_Controller {
	private OperationStore $operations;
	private CreateProductService $service;
	private CapabilityPolicy $capabilities;

	public function __construct(
		OperationStore $operations,
		CreateProductService $service,
		CapabilityPolicy $capabilities
	) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'operations';
		$this->operations   = $operations;
		$this->service      = $service;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[0-9a-fA-F-]{36})',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
				'args'                => array(
					'id' => array(
						'type'     => 'string',
						'format'   => 'uuid',
						'required' => true,
					),
				),
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

		return $this->capabilities->can_create_products() ? true : ApiError::forbidden();
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_item( $request ) {
		$record = $this->operations->find_for_user(
			(string) $request->get_param( 'id' ),
			get_current_blog_id(),
			get_current_user_id()
		);

		if ( null === $record ) {
			return new \WP_Error(
				'ypw_operation_not_found',
				__( 'The requested product operation was not found.', 'yaxii-product-workspace' ),
				array( 'status' => 404 )
			);
		}

		$result = $this->service->reconcile( $record );

		return rest_ensure_response( array( 'data' => $result->to_array() ) );
	}
}
