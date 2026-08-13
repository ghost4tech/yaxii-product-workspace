<?php
/**
 * Operation table lifecycle.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

defined( 'ABSPATH' ) || exit;

/**
 * Creates and upgrades the minimal durable idempotency store.
 */
final class SchemaManager {
	public const VERSION = '3';

	private const VERSION_OPTION = 'ypw_operation_schema_version';

	private \wpdb $database;

	public function __construct( \wpdb $database ) {
		$this->database = $database;
	}

	public static function create(): self {
		global $wpdb;

		return new self( $wpdb );
	}

	public static function activate(): void {
		self::create()->install();
	}

	public function maybe_upgrade(): void {
		if ( self::VERSION !== get_option( self::VERSION_OPTION ) ) {
			$this->install();
		}
	}

	public function table_name(): string {
		return $this->database->prefix . 'ypw_operations';
	}

	private function install(): void {
		$table_name      = $this->table_name();
		$charset_collate = $this->database->get_charset_collate();
		$sql             = "CREATE TABLE {$table_name} (
			operation_id char(36) NOT NULL,
			site_id bigint(20) unsigned NOT NULL,
			user_id bigint(20) unsigned NOT NULL,
			operation_type varchar(40) NOT NULL,
			idempotency_hash char(64) NOT NULL,
			payload_hash char(64) NOT NULL,
			request_json longtext NULL,
			state varchar(20) NOT NULL,
			product_id bigint(20) unsigned NULL,
			product_name varchar(200) NOT NULL DEFAULT '',
			product_sku varchar(100) NOT NULL DEFAULT '',
			product_status varchar(20) NOT NULL DEFAULT '',
			result_json longtext NULL,
			dismissed_at datetime NULL,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY  (operation_id),
			UNIQUE KEY request_identity (site_id,user_id,operation_type,idempotency_hash),
			KEY user_state (site_id,user_id,state),
			KEY user_updated (site_id,user_id,updated_at)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
		update_option( self::VERSION_OPTION, self::VERSION, false );
	}
}
