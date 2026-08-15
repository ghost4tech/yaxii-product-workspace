<?php
/**
 * Bootstrap REST integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;

/**
 * Exercises the registered bootstrap route against the active WordPress site.
 */
final class BootstrapControllerTest extends TestCase {
	private int $original_user_id;

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		do_action( 'rest_api_init' );
	}

	protected function tearDown(): void {
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_authorized_user_receives_bounded_bootstrap_data(): void {

		$administrators = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		self::assertNotEmpty( $administrators );
		wp_set_current_user( (int) $administrators[0]->ID );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/bootstrap' )
		);

		self::assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		self::assertIsArray( $data );
		self::assertArrayHasKey( 'data', $data );
		self::assertArrayNotHasKey( 'nonce', $data['data'] );
		self::assertArrayNotHasKey( 'consumer_secret', $data['data'] );
	}

	public function test_bootstrap_uses_the_current_users_locale_and_direction(): void {

			$administrators = get_users(
				array(
					'role'   => 'administrator',
					'number' => 1,
				)
			);
		self::assertNotEmpty( $administrators );
			$user_id         = (int) $administrators[0]->ID;
			$original_locale = get_user_meta( $user_id, 'locale', true );

		try {
			update_user_meta( $user_id, 'locale', 'fr_FR' );
				wp_set_current_user( $user_id );
				$response = rest_get_server()->dispatch(
					new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/bootstrap' )
				);

				self::assertSame( 200, $response->get_status() );
			self::assertSame( 'fr_FR', $response->get_data()['data']['locale']['code'] );
			self::assertSame( 'ltr', $response->get_data()['data']['locale']['direction'] );
		} finally {
			if ( '' === $original_locale ) {
				delete_user_meta( $user_id, 'locale' );
			} else {
				update_user_meta( $user_id, 'locale', $original_locale );
			}
		}
	}
	public function test_unauthenticated_user_is_rejected(): void {
		wp_set_current_user( 0 );
		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'GET', '/yaxii-product-workspace/v1/bootstrap' )
		);

		self::assertSame( 401, $response->get_status() );
		self::assertSame( 'ypw_not_authenticated', $response->get_data()['code'] );
	}
}
