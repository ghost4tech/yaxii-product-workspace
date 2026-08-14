<?php
/**
 * Server-authoritative operation pulse REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use DateTimeImmutable;
use DateTimeZone;
use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Operations\OperationMetricsStore;
use Yaxii\ProductWorkspace\Application\Operations\OperationSummaryWindow;

defined( 'ABSPATH' ) || exit;

/**
 * Exposes a bounded recent-versus-previous operational summary.
 */
final class OperationSummaryController extends \WP_REST_Controller {
	private OperationMetricsStore $metrics;
	private CapabilityPolicy $capabilities;

	public function __construct( OperationMetricsStore $metrics, CapabilityPolicy $capabilities ) {
		$this->namespace    = 'yaxii-product-workspace/v1';
		$this->rest_base    = 'operations/summary';
		$this->metrics      = $metrics;
		$this->capabilities = $capabilities;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'permissions_check' ),
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

	/** @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error */
	public function get_item( $request ) {
		unset( $request );
		try {
			$now     = new DateTimeImmutable( current_time( 'mysql', true ), new DateTimeZone( 'UTC' ) );
			$window  = new OperationSummaryWindow( $now );
			$summary = $this->metrics->summarize_for_user( $window, get_current_blog_id(), get_current_user_id() );
			return rest_ensure_response( array( 'data' => array_merge( $summary, array( 'window' => $window->to_array() ) ) ) );
		} catch ( Throwable $exception ) {
			unset( $exception );
			return ApiError::server_failure();
		}
	}
}
