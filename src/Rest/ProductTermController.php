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
					'parent'   => array(
						'type'    => 'integer',
						'minimum' => 0,
					),
					'include'  => array(
						'type'     => 'array',
						'default'  => array(),
						'maxItems' => 20,
						'items'    => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
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

		$page         = max( 1, (int) $request->get_param( 'page' ) );
		$per_page     = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) );
		$search       = sanitize_text_field( (string) $request->get_param( 'search' ) );
		$hierarchical = is_taxonomy_hierarchical( $this->taxonomy );
		$include      = $hierarchical ? array_map( 'intval', (array) $request->get_param( 'include' ) ) : array();
		$term_args    = array(
			'taxonomy'   => $this->taxonomy,
			'hide_empty' => false,
			'number'     => $per_page + 1,
			'offset'     => ( $page - 1 ) * $per_page,
			'orderby'    => 'name',
			'order'      => 'ASC',
			'search'     => $search,
		);
		if ( array() !== $include ) {
			$term_args['include'] = array_slice( array_values( array_unique( $include ) ), 0, 20 );
			$term_args['number']  = min( $per_page + 1, count( $term_args['include'] ) );
			$term_args['offset']  = 0;
		} elseif ( $hierarchical && '' === $search ) {
			$term_args['parent'] = max( 0, (int) ( $request->get_param( 'parent' ) ?? 0 ) );
		}

		$terms = get_terms( $term_args );
		if ( is_wp_error( $terms ) ) {
			return new \WP_Error( 'ypw_term_query_failed', __( 'Product terms could not be loaded.', 'yaxii-product-workspace' ), array( 'status' => 500 ) );
		}

		$has_more = count( $terms ) > $per_page;
		$items    = array_map( array( $this, 'term_resource' ), array_slice( $terms, 0, $per_page ) );

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

	/** @return array<string, mixed> */
	private function term_resource( \WP_Term $term ): array {
		$resource = array(
			'id'     => $term->term_id,
			'name'   => $term->name,
			'slug'   => $term->slug,
			'parent' => $term->parent,
			'count'  => $term->count,
		);
		if ( ! is_taxonomy_hierarchical( $this->taxonomy ) ) {
			return $resource;
		}

		$resource['has_children'] = $this->has_children( $term->term_id );
		$resource['ancestors']    = array_values(
			array_filter(
				array_map(
					fn ( int $term_id ): ?array => $this->ancestor_resource( $term_id ),
					array_reverse( get_ancestors( $term->term_id, $this->taxonomy, 'taxonomy' ) )
				)
			)
		);
		return $resource;
	}

	private function has_children( int $term_id ): bool {
		$children = get_terms(
			array(
				'taxonomy'   => $this->taxonomy,
				'hide_empty' => false,
				'parent'     => $term_id,
				'number'     => 1,
				'fields'     => 'ids',
			)
		);

		return ! is_wp_error( $children ) && array() !== $children;
	}

	/** @return array<string, mixed>|null */
	private function ancestor_resource( int $term_id ): ?array {
		$term = get_term( $term_id, $this->taxonomy );
		return $term instanceof \WP_Term ? array(
			'id'     => $term->term_id,
			'name'   => $term->name,
			'slug'   => $term->slug,
			'parent' => $term->parent,
			'count'  => $term->count,
		) : null;
	}
}
