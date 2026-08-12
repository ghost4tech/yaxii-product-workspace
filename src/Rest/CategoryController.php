<?php
/**
 * Bounded product-category REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;

defined( 'ABSPATH' ) || exit;

/**
 * Provides paged category choices from the current store.
 */
final class CategoryController extends \WP_REST_Controller {
	private CapabilityPolicy $capabilities;

	public function __construct( CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'categories';
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'page'     => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
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
				),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) {
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
	public function get_items( $request ) {
		if ( ! taxonomy_exists( 'product_cat' ) ) {
			return new \WP_Error(
				'ypw_woocommerce_unavailable',
				__( 'WooCommerce product categories are unavailable.', 'yaxii-product-workspace' ),
				array( 'status' => 503 )
			);
		}

		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) );
		$search   = sanitize_text_field( (string) $request->get_param( 'search' ) );
		$terms    = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
				'number'     => $per_page,
				'offset'     => ( $page - 1 ) * $per_page,
				'orderby'    => 'name',
				'order'      => 'ASC',
				'search'     => $search,
			)
		);

		if ( is_wp_error( $terms ) ) {
			return new \WP_Error(
				'ypw_category_query_failed',
				__( 'Product categories could not be loaded.', 'yaxii-product-workspace' ),
				array( 'status' => 500 )
			);
		}

		$items = array_map(
			static function ( \WP_Term $term ): array {
				return array(
					'id'     => $term->term_id,
					'name'   => $term->name,
					'slug'   => $term->slug,
					'parent' => $term->parent,
					'count'  => $term->count,
				);
			},
			$terms
		);

		return rest_ensure_response(
			array(
				'data' => array(
					'items'    => $items,
					'page'     => $page,
					'per_page' => $per_page,
					'has_more' => count( $items ) === $per_page,
				),
			)
		);
	}
}
