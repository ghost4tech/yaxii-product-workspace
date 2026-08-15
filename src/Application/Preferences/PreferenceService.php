<?php
/**
 * Per-user workflow preference service.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Preferences;

use Yaxii\ProductWorkspace\Application\Products\ApiException;
use Yaxii\ProductWorkspace\Application\Products\ValidationErrors;

/**
 * Owns the bounded, useful Free workflow preference contract.
 */
final class PreferenceService {
	// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped -- REST error serialization owns output escaping.
	private const REPEAT_FIELDS = array(
		'category_ids',
		'regular_price',
		'sale_price',
		'manage_stock',
		'stock_quantity',
		'stock_status',
		'backorders',
		'sold_individually',
		'weight',
		'dimensions',
		'shipping_class_id',
		'tax_status',
		'tax_class',
		'catalog_visibility',
	);

	private PreferenceRepository $repository;

	/** @var array<string> */
	private array $tax_classes;

	/** @param array<string> $tax_classes Configured WooCommerce tax-class slugs. */
	public function __construct( PreferenceRepository $repository, array $tax_classes ) {
		$this->repository  = $repository;
		$this->tax_classes = array_merge( array( '' ), $tax_classes );
	}

	/** @return array<string, mixed> */
	public function get( int $user_id ): array {
		$values = array_merge( $this->defaults(), $this->allow_stored( $this->repository->get_for_user( $user_id ) ) );
		$errors = new ValidationErrors();
		$this->validate( $values, $errors );
		return $errors->has_errors() ? $this->defaults() : $this->canonical( $values );
	}

	/** @param array<string, mixed> $payload Untrusted partial update.
	 * @return array<string, mixed> */
	public function update( int $user_id, array $payload ): array {
		$errors  = new ValidationErrors();
		$current = $this->get( $user_id );
		if ( array() !== array_diff( array_keys( $payload ), array_keys( $current ) ) ) {
			$errors->add( '_request', __( 'The preference request contains unsupported fields.', 'yaxii-product-workspace' ) );
		}
		$next = array_merge( $current, $payload );
		$this->validate( $next, $errors );
		if ( $errors->has_errors() ) {
			throw new ApiException( 'ypw_validation_failed', __( 'Review the workspace preferences.', 'yaxii-product-workspace' ), 400, $errors->all() );
		}
		$canonical = $this->canonical( $next );
		$this->repository->save_for_user( $user_id, $canonical );
		return $canonical;
	}

	/** @return array<string, mixed> */
	private function defaults(): array {
		return array(
			'auto_focus_name'            => true,
			'repeat_fields'              => array(),
			'default_product_status'     => 'publish',
			'default_catalog_visibility' => 'visible',
			'default_manage_stock'       => false,
			'default_stock_status'       => 'instock',
			'default_backorders'         => 'no',
			'default_sold_individually'  => false,
			'default_tax_status'         => 'taxable',
			'default_tax_class'          => '',
			'queue_group_by_day'         => true,
			'relative_timestamps'        => true,
			'queue_rows_per_page'        => 25,
			'confirm_queue_dismiss'      => false,
		);
	}

	/** @param array<string, mixed> $stored Stored values.
	 * @return array<string, mixed> */
	private function allow_stored( array $stored ): array {
		return array_intersect_key( $stored, $this->defaults() );
	}

	/** @param array<string, mixed> $values Merged values. */
	private function validate( array $values, ValidationErrors $errors ): void {
		foreach ( array( 'auto_focus_name', 'default_manage_stock', 'default_sold_individually', 'queue_group_by_day', 'relative_timestamps', 'confirm_queue_dismiss' ) as $field ) {
			if ( ! is_bool( $values[ $field ] ) ) {
				$errors->add( $field, __( 'Expected true or false.', 'yaxii-product-workspace' ) );
			}
		}
		$this->enum( $values, 'default_product_status', array( 'publish', 'draft', 'pending' ), $errors );
		$this->enum( $values, 'default_catalog_visibility', array( 'visible', 'catalog', 'search', 'hidden' ), $errors );
		$this->enum( $values, 'default_stock_status', array( 'instock', 'outofstock', 'onbackorder' ), $errors );
		$this->enum( $values, 'default_backorders', array( 'no', 'notify', 'yes' ), $errors );
		$this->enum( $values, 'default_tax_status', array( 'taxable', 'shipping', 'none' ), $errors );
		$this->enum( $values, 'default_tax_class', $this->tax_classes, $errors );
		$repeat = $values['repeat_fields'];
		if ( ! is_array( $repeat ) || array_filter( $repeat, static fn ( $field ): bool => ! is_string( $field ) || ! in_array( $field, self::REPEAT_FIELDS, true ) ) ) {
			$errors->add( 'repeat_fields', __( 'Choose only supported repeat fields.', 'yaxii-product-workspace' ) );
		}
		if ( ! is_int( $values['queue_rows_per_page'] ) || ! in_array( $values['queue_rows_per_page'], array( 10, 25, 50 ), true ) ) {
			$errors->add( 'queue_rows_per_page', __( 'Choose 10, 25, or 50 queue rows.', 'yaxii-product-workspace' ) );
		}
	}

	/** @param array<string, mixed> $values Values to check.
	 * @param array<string> $allowed Supported values. */
	private function enum( array $values, string $field, array $allowed, ValidationErrors $errors ): void {
		if ( ! is_string( $values[ $field ] ) || ! in_array( $values[ $field ], $allowed, true ) ) {
			$errors->add( $field, __( 'Choose a supported value.', 'yaxii-product-workspace' ) );
		}
	}

	/** @param array<string, mixed> $values Validated values.
	 * @return array<string, mixed> */
	private function canonical( array $values ): array {
		$values['repeat_fields'] = array_values( array_unique( $values['repeat_fields'] ) );
		return array_intersect_key( $values, $this->defaults() );
	}
	// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
}
