<?php
/**
 * Measure bounded Product Workspace REST reads inside a loaded WordPress runtime.
 *
 * Usage: wp eval-file tools/performance-probe.php <administrator-user-id>
 *
 * @package YaxiiProductWorkspace
 */

if ( empty( $args[0] ) ) {
	throw new RuntimeException( 'Provide an administrator user ID.' );
}

global $wpdb;
wp_set_current_user( (int) $args[0] );

$yaxii_product_workspace_probes = array(
	array( '/yaxii-product-workspace/v1/products', array( 'per_page' => 20 ) ),
	array( '/yaxii-product-workspace/v1/categories', array( 'per_page' => 50, 'parent' => 0 ) ),
	array( '/yaxii-product-workspace/v1/operations', array( 'per_page' => 20 ) ),
	array( '/yaxii-product-workspace/v1/operations/summary', array() ),
);

foreach ( $yaxii_product_workspace_probes as $yaxii_product_workspace_probe ) {
	$yaxii_product_workspace_request = new WP_REST_Request( 'GET', $yaxii_product_workspace_probe[0] );
	$yaxii_product_workspace_request->set_query_params( $yaxii_product_workspace_probe[1] );
	$yaxii_product_workspace_query_start = $wpdb->num_queries;
	$yaxii_product_workspace_time_start  = microtime( true );
	$yaxii_product_workspace_response    = rest_do_request( $yaxii_product_workspace_request );
	echo wp_json_encode(
		array(
			'route'        => $yaxii_product_workspace_probe[0],
			'status'       => $yaxii_product_workspace_response->get_status(),
			'queries'      => $wpdb->num_queries - $yaxii_product_workspace_query_start,
			'milliseconds' => round( ( microtime( true ) - $yaxii_product_workspace_time_start ) * 1000, 2 ),
		)
	) . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI emits JSON.
}
