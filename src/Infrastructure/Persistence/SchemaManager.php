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
	public const VERSION = '4';

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
		$this->backfill_product_summaries();
		update_option( self::VERSION_OPTION, self::VERSION, false );
	}

	private function backfill_product_summaries(): void {
		$cursor    = '';
		$row_count = 200;
		do {
			$rows = $this->legacy_product_summary_rows( $cursor );
			if ( array() === $rows ) {
				return;
			}
			$row_count = count( $rows );

			foreach ( $rows as $row ) {
				$cursor = $this->backfill_product_summary_row( $row );
			}
		} while ( 200 === $row_count );
	}

	/** @param array<string, mixed> $row Stored operation row. */
	private function backfill_product_summary_row( array $row ): string {
		$operation_result = json_decode( (string) $row['result_json'], true );
		$product          = is_array( $operation_result ) ? ( $operation_result['product'] ?? null ) : null;
		if ( is_array( $product ) ) {
			$this->backfill_product_summary( $row, $product );
		}
		return (string) $row['operation_id'];
	}

	/** @return array<int, array<string, mixed>> */
	private function legacy_product_summary_rows( string $cursor ): array {
		$sql  = $this->database->prepare(
			"SELECT operation_id, product_id, product_name, product_sku, product_status, result_json
			FROM %i WHERE state = 'succeeded' AND operation_id > %s
			AND (product_id IS NULL OR product_name = '' OR product_sku = '' OR product_status = '')
			ORDER BY operation_id ASC LIMIT 200",
			$this->table_name(),
			$cursor
		);
		$rows = $this->database->get_results( $sql, ARRAY_A );
		return is_array( $rows ) ? $rows : array();
	}

	/** @param array<string, mixed> $row Stored operation row.
	 * @param array<string, mixed> $product Stored product result. */
	private function backfill_product_summary( array $row, array $product ): void {
		$values = $this->product_summary_values( $row, $product );
		if ( array() === $values ) {
			return;
		}
		$formats = array_map(
			static fn ( string $column ): string => 'product_id' === $column ? '%d' : '%s',
			array_keys( $values )
		);
		$updated = $this->database->update(
			$this->table_name(),
			$values,
			array( 'operation_id' => (string) $row['operation_id'] ),
			$formats,
			array( '%s' )
		);
		if ( false === $updated ) {
			throw new \RuntimeException( 'Unable to backfill the product operation summary.' );
		}
	}

	/** @param array<string, mixed> $row Stored operation row.
	 * @param array<string, mixed> $product Stored product result.
	 * @return array<string, int|string> */
	private function product_summary_values( array $row, array $product ): array {
		$values = array();
		if ( empty( $row['product_id'] ) && isset( $product['id'] ) && 0 < (int) $product['id'] ) {
			$values['product_id'] = (int) $product['id'];
		}
		foreach ( array( 'name', 'sku' ) as $field ) {
			$column = 'product_' . $field;
			if ( '' === (string) $row[ $column ] && isset( $product[ $field ] ) && is_string( $product[ $field ] ) ) {
				$values[ $column ] = sanitize_text_field( $product[ $field ] );
			}
		}
		if ( '' === (string) $row['product_status'] && isset( $product['status'] ) && is_string( $product['status'] ) ) {
			$values['product_status'] = sanitize_key( $product['status'] );
		}
		return $values;
	}
}
