<?php
/**
 * Stable REST error factory.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Rest;

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
}
