<?php
/**
 * Bounded global WooCommerce attribute REST resources.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\VariableProducts\AttributeCatalog;

final class ProductAttributeController extends \WP_REST_Controller {
	private AttributeCatalog $catalog;
	private CapabilityPolicy $capabilities;

	public function __construct( AttributeCatalog $catalog, CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'attributes';
		$this->catalog      = $catalog;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/terms',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_terms' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'search' => array(
						'type'      => 'string',
						'default'   => '',
						'maxLength' => 100,
					),
					'limit'  => array(
						'type'    => 'integer',
						'default' => 50,
						'minimum' => 1,
						'maximum' => 100,
					),
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

	/** @return \WP_REST_Response|\WP_Error */
	public function get_items( $request ) {
		unset( $request );
		return $this->respond( fn (): array => $this->catalog->attributes() );
	}

	/** @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error */
	public function get_terms( $request ) {
		return $this->respond( fn (): array => $this->catalog->terms( (int) $request->get_param( 'id' ), sanitize_text_field( (string) $request->get_param( 'search' ) ), (int) $request->get_param( 'limit' ) ) );
	}

	/** @param callable(): array<int, array<string, mixed>> $operation
	 * @return \WP_REST_Response|\WP_Error */
	private function respond( callable $operation ) {
		try {
			return rest_ensure_response( array( 'data' => $operation() ) );
		} catch ( Throwable $exception ) {
			unset( $exception );
			return ApiError::server_failure();
		}
	}
}
