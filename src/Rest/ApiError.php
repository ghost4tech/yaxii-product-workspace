<?php
/**
 * Stable REST error factory.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

use Yaxii\ProductWorkspace\Application\Products\ApiException;

defined( 'ABSPATH' ) || exit;

/**
 * Creates translation-ready, structured API errors.
 */
final class ApiError {
	public static function unauthenticated(): \WP_Error {
		return new \WP_Error(
			'ypw_not_authenticated',
			__( 'You must be signed in to use Product Workspace.', 'yaxii-product-workspace' ),
			array( 'status' => 401 )
		);
	}

	public static function forbidden(): \WP_Error {
		return new \WP_Error(
			'ypw_forbidden',
			__( 'You are not allowed to manage products.', 'yaxii-product-workspace' ),
			array( 'status' => 403 )
		);
	}

	public static function server_failure(): \WP_Error {
		return new \WP_Error(
			'ypw_server_error',
			__( 'The product operation could not be completed.', 'yaxii-product-workspace' ),
			array( 'status' => 500 )
		);
	}

	public static function from_exception( ApiException $exception ): \WP_Error {
		$data = array( 'status' => $exception->status() );
		if ( array() !== $exception->fields() ) {
			$data['fields'] = $exception->fields();
		}

		return new \WP_Error( $exception->api_code(), $exception->getMessage(), $data );
	}
}
