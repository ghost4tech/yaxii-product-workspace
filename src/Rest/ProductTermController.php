<?php
/**
 * Bounded product-term REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;

defined( 'ABSPATH' ) || exit;

/**
 * Provides paged term choices for one allowlisted WooCommerce taxonomy.
 */
final class ProductTermController extends \WP_REST_Controller {
	private CapabilityPolicy $capabilities;
	private string $taxonomy;

	public function __construct( CapabilityPolicy $capabilities, string $rest_base, string $taxonomy ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = $rest_base;
		$this->capabilities = $capabilities;
		$this->taxonomy     = $taxonomy;
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
				),
			)
		);
	}

	/**
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
		if ( ! taxonomy_exists( $this->taxonomy ) ) {
			return new \WP_Error(
				'ypw_taxonomy_unavailable',
				__( 'The requested WooCommerce product taxonomy is unavailable.', 'yaxii-product-workspace' ),
				array( 'status' => 503 )
			);
		}

		$page      = max( 1, (int) $request->get_param( 'page' ) );
		$per_page  = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) );
		$term_args = array(
			'taxonomy'   => $this->taxonomy,
			'hide_empty' => false,
			'number'     => $per_page + 1,
			'offset'     => ( $page - 1 ) * $per_page,
			'orderby'    => 'name',
			'order'      => 'ASC',
			'search'     => sanitize_text_field( (string) $request->get_param( 'search' ) ),
		);
		$terms     = get_terms( $term_args );
		if ( is_wp_error( $terms ) ) {
			return new \WP_Error( 'ypw_term_query_failed', __( 'Product terms could not be loaded.', 'yaxii-product-workspace' ), array( 'status' => 500 ) );
		}

		$has_more = count( $terms ) > $per_page;
		$items    = array_map(
			static fn ( \WP_Term $term ): array => array(
				'id'     => $term->term_id,
				'name'   => $term->name,
				'slug'   => $term->slug,
				'parent' => $term->parent,
				'count'  => $term->count,
			),
			array_slice( $terms, 0, $per_page )
		);

		return rest_ensure_response(
			array(
				'data' => array(
					'items'    => $items,
					'page'     => $page,
					'per_page' => $per_page,
					'has_more' => $has_more,
				),
			)
		);
	}
}
