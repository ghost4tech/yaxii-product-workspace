<?php
/**
 * Server-authoritative recent-operation REST controller.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Throwable;
use Yaxii\ProductWorkspace\Application\Access\CapabilityPolicy;
use Yaxii\ProductWorkspace\Application\Operations\OperationPresenter;
use Yaxii\ProductWorkspace\Application\Operations\OperationQuery;
use Yaxii\ProductWorkspace\Application\Operations\OperationRecord;
use Yaxii\ProductWorkspace\Application\Operations\OperationStore;
use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\CreateProductService;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductService;

defined( 'ABSPATH' ) || exit;

/**
 * Lists, reconciles, safely retries, and dismisses the current user's operations.
 */
final class OperationController extends \WP_REST_Controller {
	private OperationStore $operations;
	private OperationPresenter $presenter;
	private CreateProductService $service;
	private ?VariableProductService $variable_service;
	private CapabilityPolicy $capabilities;

	public function __construct(
		OperationStore $operations,
		OperationPresenter $presenter,
		CreateProductService $service,
		CapabilityPolicy $capabilities,
		?VariableProductService $variable_service = null
	) {
		$this->namespace        = 'yaxii-product-workspace/v1';
		$this->rest_base        = 'operations';
		$this->operations       = $operations;
		$this->presenter        = $presenter;
		$this->service          = $service;
		$this->capabilities     = $capabilities;
		$this->variable_service = $variable_service;
	}

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => $this->collection_args(),
			)
		);

		$route = '/' . $this->rest_base . '/(?P<id>[0-9a-fA-F-]{36})';
		register_rest_route(
			$this->namespace,
			$route,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'args' => $this->id_args(),
			)
		);
		register_rest_route(
			$this->namespace,
			$route . '/retry',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'retry_item' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => $this->id_args(),
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
	public function get_items( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$query = new OperationQuery(
					(int) $request->get_param( 'page' ),
					(int) $request->get_param( 'per_page' ),
					sanitize_text_field( (string) $request->get_param( 'search' ) ),
					sanitize_key( (string) $request->get_param( 'state' ) ),
					sanitize_key( (string) $request->get_param( 'product_status' ) )
				);
				$page  = $this->operations->query_for_user( $query, get_current_blog_id(), get_current_user_id() );
				$items = array_map( fn ( OperationRecord $record ): array => $this->presenter->present( $record ), $page['items'] );
				return array(
					'items'    => $items,
					'page'     => $query->page(),
					'per_page' => $query->per_page(),
					'has_more' => $query->page() * $query->per_page() < $page['total'],
					'total'    => $page['total'],
					'counts'   => $page['counts'],
				);
			}
		);
	}

	/** @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error */
	public function get_item( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$record = $this->require_record( (string) $request->get_param( 'id' ) );
				return $this->presenter->present( $record, $this->reconcile( $record ) );
			}
		);
	}

	/** @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error */
	public function retry_item( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$record = $this->require_record( (string) $request->get_param( 'id' ) );
				$result = $this->retry( $record );
				$fresh  = $this->require_record( $record->operation_id() );
				return $this->presenter->present( $fresh, $result );
			}
		);
	}

	private function reconcile( OperationRecord $record ): \Yaxii\ProductWorkspace\Application\Products\OperationResult {
		if ( 'variable_product_create' === $record->operation_type() ) {
			if ( null === $this->variable_service ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- ApiException is serialized by ApiError.
				throw new ApiException( 'ypw_operation_unavailable', __( 'Variable-product reconciliation is unavailable.', 'yaxii-product-workspace' ), 503 );
			}
			return $this->variable_service->reconcile( $record );
		}
		return $this->service->reconcile( $record );
	}

	private function retry( OperationRecord $record ): \Yaxii\ProductWorkspace\Application\Products\OperationResult {
		if ( 'variable_product_create' === $record->operation_type() ) {
			if ( null === $this->variable_service ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- ApiException is serialized by ApiError.
				throw new ApiException( 'ypw_operation_unavailable', __( 'Variable-product retry is unavailable.', 'yaxii-product-workspace' ), 503 );
			}
			return $this->variable_service->retry( $record, get_current_blog_id(), get_current_user_id() );
		}
		return $this->service->retry( $record, get_current_blog_id(), get_current_user_id() );
	}

	/** @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error */
	public function delete_item( $request ) {
		return $this->respond(
			function () use ( $request ): array {
				$operation_id = (string) $request->get_param( 'id' );
				$record       = $this->require_record( $operation_id );
				if ( in_array( $record->state(), array( 'processing', 'uncertain' ), true ) ) {
					throw $this->not_dismissible();
				}
				if ( ! $this->operations->dismiss_for_user( $operation_id, get_current_blog_id(), get_current_user_id() ) ) {
					throw $this->not_dismissible();
				}
				return array(
					'operation_id' => $operation_id,
					'dismissed'    => true,
				);
			}
		);
	}

	private function require_record( string $operation_id ): OperationRecord {
		$record = $this->operations->find_for_user( $operation_id, get_current_blog_id(), get_current_user_id() );
		if ( null === $record || $record->is_dismissed() ) {
			throw $this->not_found();
		}
		return $record;
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

	private function not_found(): ApiException {
		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns output escaping.
		return new ApiException( 'ypw_operation_not_found', __( 'The requested product operation was not found.', 'yaxii-product-workspace' ), 404 );
	}

	private function not_dismissible(): ApiException {
		// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns output escaping.
		return new ApiException( 'ypw_operation_not_dismissible', __( 'Wait for this operation to finish before removing it from the queue.', 'yaxii-product-workspace' ), 409 );
	}

	/** @return array<string, array<string, mixed>> */
	private function id_args(): array {
		return array(
			'id' => array(
				'type'     => 'string',
				'format'   => 'uuid',
				'required' => true,
			),
		);
	}

	/** @return array<string, array<string, mixed>> */
	private function collection_args(): array {
		return array(
			'page'           => array(
				'type'    => 'integer',
				'default' => 1,
				'minimum' => 1,
				'maximum' => 10000,
			),
			'per_page'       => array(
				'type'    => 'integer',
				'default' => 25,
				'minimum' => 1,
				'maximum' => 50,
			),
			'search'         => array(
				'type'      => 'string',
				'default'   => '',
				'maxLength' => 100,
			),
			'state'          => array(
				'type'    => 'string',
				'default' => 'all',
				'enum'    => array( 'all', 'succeeded', 'partial', 'failed', 'processing', 'uncertain', 'active', 'error' ),
			),
			'product_status' => array(
				'type'    => 'string',
				'default' => '',
				'enum'    => array( '', 'draft', 'publish', 'pending', 'unpublished' ),
			),
		);
	}
}
