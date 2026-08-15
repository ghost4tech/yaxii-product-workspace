<?php
/**
 * WooCommerce variable-product adapter.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WooCommerce;

use RuntimeException;
use Throwable;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableAttribute;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductCommand;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductGateway;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariableProductWriteResult;
use Yaxii\ProductWorkspace\Application\VariableProducts\VariationCombination;

/**
 * Persists a parent and all variations in one bounded server-side operation.
 */
final class WooVariableProductGateway implements VariableProductGateway {
	private const OPERATION_META = '_ypw_operation_id';
	private WooProductMapper $products;
	private WooVariableProductMapper $mapper;
	private WooVariableReferenceValidator $validator;
	private WooVariationWriter $variations;

	public function __construct( WooProductMapper $products, WooVariableProductMapper $mapper, WooVariableReferenceValidator $validator, WooVariationWriter $variations ) {
		$this->products   = $products;
		$this->mapper     = $mapper;
		$this->validator  = $validator;
		$this->variations = $variations;
	}

	public function is_available(): bool {
		return class_exists( 'WooCommerce' ) && class_exists( 'WC_Product_Variable' ) && class_exists( 'WC_Product_Variation' );
	}

	public function validate( VariableProductCommand $command, int $product_id = 0 ): array {
		if ( 0 < $product_id && ! wc_get_product( $product_id ) instanceof \WC_Product_Variable ) {
			return array( 'type' => array( __( 'The requested product is not a variable product.', 'yaxii-product-workspace' ) ) );
		}
		return $this->validator->validate( $command, $product_id );
	}

	public function create( VariableProductCommand $command, string $operation_id ): VariableProductWriteResult {
		$existing = $this->product_by_operation( $operation_id );
		if ( $existing instanceof \WC_Product_Variable ) {
			return $this->reconcile( $command, $operation_id );
		}
		$product = new \WC_Product_Variable();
		$this->products->apply( $product, $command->product() );
		$product->set_status( 'draft' );
		$this->mapper->apply_attributes( $product, $command->plan() );
		$product->update_meta_data( self::OPERATION_META, $operation_id );
		$product_id = $product->save();
		if ( 0 >= $product_id ) {
			throw new RuntimeException( 'WooCommerce did not return a variable product ID.' );
		}
		return $this->write_plan( $product, $command, false );
	}

	public function reconcile( VariableProductCommand $command, string $operation_id ): VariableProductWriteResult {
		$product = $this->product_by_operation( $operation_id );
		if ( ! $product instanceof \WC_Product_Variable ) {
			return $this->create( $command, $operation_id );
		}
		return $this->write_plan( $product, $command, false );
	}

	public function update( int $product_id, VariableProductCommand $command ): VariableProductWriteResult {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof \WC_Product_Variable ) {
			throw new RuntimeException( 'The variable product is unavailable.' );
		}
		return $this->write_plan( $product, $command, true );
	}

	public function get( int $product_id ): ?array {
		$product = wc_get_product( $product_id );
		return $product instanceof \WC_Product_Variable ? $this->mapper->resource( $product ) : null;
	}

	public function find_by_operation( string $operation_id ): ?array {
		$product = $this->product_by_operation( $operation_id );
		return $product instanceof \WC_Product_Variable ? $this->mapper->resource( $product ) : null;
	}

	private function write_plan( \WC_Product_Variable $product, VariableProductCommand $command, bool $remove_missing ): VariableProductWriteResult {
		$this->products->apply( $product, $command->product() );
		$product->set_status( 'draft' );
		$this->mapper->apply_attributes( $product, $command->plan() );
		$product->save();
		$existing = $this->existing_by_client_id( $product );
		$kept     = array();
		$results  = array();
		$attrs    = $this->attributes_by_key( $command );
		foreach ( $command->plan()->combinations() as $combination ) {
			$variation = $this->existing_variation( $combination, $product->get_id(), $existing );
			try {
				$id        = $this->variations->save( $product->get_id(), $combination, $attrs, $variation );
				$kept[]    = $id;
				$results[] = $this->combination_result( $combination, 'succeeded', $id );
			} catch ( Throwable $exception ) {
				$id        = $variation instanceof \WC_Product_Variation ? $variation->get_id() : 0;
				$kept[]    = $id;
				$results[] = $this->combination_result( $combination, 'failed', $id );
				unset( $exception );
			}
		}
		if ( $remove_missing ) {
			$this->delete_removed( $product, array_filter( $kept ), $results );
		}
		$this->synchronize( $product );
		if ( array() === array_filter( $results, static fn ( array $result ): bool => 'failed' === $result['state'] ) ) {
			$product->set_status( $command->product()->status() );
			$product->save();
		}
		return new VariableProductWriteResult( $this->persisted_resource( $product->get_id() ), $results );
	}

	/** @return array<string, VariableAttribute> */
	private function attributes_by_key( VariableProductCommand $command ): array {
		$result = array();
		foreach ( $command->plan()->attributes() as $attribute ) {
			$result[ $attribute->key() ] = $attribute;
		}
		return $result;
	}

	/** @return array<string, \WC_Product_Variation> */
	private function existing_by_client_id( \WC_Product_Variable $product ): array {
		$result = array();
		foreach ( $product->get_children() as $variation_id ) {
			$variation = wc_get_product( $variation_id );
			if ( $variation instanceof \WC_Product_Variation ) {
				$client_id = (string) $variation->get_meta( WooVariableProductMapper::COMBINATION_META, true );
				if ( wp_is_uuid( $client_id ) ) {
					$result[ $client_id ] = $variation;
				}
			}
		}
		return $result;
	}

	/** @param array<string, \WC_Product_Variation> $existing */
	private function existing_variation( VariationCombination $combination, int $parent_id, array $existing ): ?\WC_Product_Variation {
		if ( isset( $existing[ $combination->client_id() ] ) ) {
			return $existing[ $combination->client_id() ];
		}
		if ( 0 >= $combination->variation_id() ) {
			return null;
		}
		$variation = wc_get_product( $combination->variation_id() );
		return $variation instanceof \WC_Product_Variation && $parent_id === $variation->get_parent_id() ? $variation : null;
	}

	/** @param array<int> $kept
	 * @param array<int, array<string, mixed>> $results */
	private function delete_removed( \WC_Product_Variable $product, array $kept, array &$results ): void {
		foreach ( array_diff( $product->get_children(), $kept ) as $variation_id ) {
			$variation = wc_get_product( $variation_id );
			if ( $variation instanceof \WC_Product_Variation ) {
				$variation->delete( true );
				$results[] = array(
					'client_id'    => '',
					'variation_id' => (int) $variation_id,
					'fingerprint'  => '',
					'state'        => 'deleted',
					'error'        => null,
				);
			}
		}
	}

	private function synchronize( \WC_Product_Variable $product ): void {
		\WC_Product_Variable::sync( $product->get_id() );
		wc_delete_product_transients( $product->get_id() );
	}

	/** @return array<string, mixed> */
	private function combination_result( VariationCombination $combination, string $state, int $variation_id ): array {
		return array(
			'client_id'    => $combination->client_id(),
			'variation_id' => $variation_id,
			'fingerprint'  => $combination->fingerprint(),
			'state'        => $state,
			'error'        => 'failed' === $state ? array(
				'code'    => 'ypw_variation_write_failed',
				'message' => __( 'WooCommerce could not save this variation.', 'yaxii-product-workspace' ),
			) : null,
		);
	}

	private function product_by_operation( string $operation_id ): ?\WC_Product_Variable {
		$ids     = get_posts(
			array(
				'post_type'     => 'product',
				'post_status'   => 'any',
				'fields'        => 'ids',
				'numberposts'   => 1,
				'meta_key'      => self::OPERATION_META,
				'meta_value'    => $operation_id,
				'no_found_rows' => true,
			)
		);
		$product = array() === $ids ? false : wc_get_product( (int) $ids[0] );
		return $product instanceof \WC_Product_Variable ? $product : null;
	}

	/** @return array<string, mixed> */
	private function persisted_resource( int $product_id ): array {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof \WC_Product_Variable ) {
			throw new RuntimeException( 'WooCommerce could not reload the variable product.' );
		}
		return $this->mapper->resource( $product );
	}
}
