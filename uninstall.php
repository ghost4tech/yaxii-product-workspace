<?php
/**
 * Remove only data owned by Yaxii Product Workspace.
 *
 * WooCommerce products, terms, attachments, and their business data are retained.
 *
 * @package YaxiiProductWorkspace
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Remove site-scoped storage for the active blog.
 */
function yaxii_product_workspace_delete_site_data(): void {
	global $wpdb;

	$table_name = $wpdb->prefix . 'ypw_operations';
	$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table_name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall owns this plugin table.
	delete_option( 'ypw_operation_schema_version' );
}

if ( is_multisite() ) {
	$yaxii_product_workspace_site_ids = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $yaxii_product_workspace_site_ids as $yaxii_product_workspace_site_id ) {
		switch_to_blog( (int) $yaxii_product_workspace_site_id );
		yaxii_product_workspace_delete_site_data();
		restore_current_blog();
	}
} else {
	yaxii_product_workspace_delete_site_data();
}

delete_metadata( 'user', 0, 'ypw_workspace_preferences_v1', '', true );
delete_post_meta_by_key( '_ypw_operation_id' );
delete_post_meta_by_key( '_ypw_attribute_keys' );
delete_post_meta_by_key( '_ypw_combination_id' );
