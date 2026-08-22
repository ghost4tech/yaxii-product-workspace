<?php
/**
 * Admin script localization integration tests.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Yaxii\ProductWorkspace\Admin\AdminPage;
use Yaxii\ProductWorkspace\Infrastructure\WordPress\UserLocaleContext;
use Yaxii\ProductWorkspace\Tests\Support\FakeCapabilityPolicy;

/**
 * Verifies the script handle uses WordPress.org language-pack discovery.
 */
final class AdminPageLocalizationTest extends TestCase {
	private const HANDLE = 'yaxii-product-workspace-app';
	private int $original_user_id;

	protected function setUp(): void {
		parent::setUp();
		$this->original_user_id = get_current_user_id();
		$administrators         = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
			)
		);
		self::assertNotEmpty( $administrators );
		wp_set_current_user( (int) $administrators[0]->ID );
	}

	protected function tearDown(): void {
		wp_dequeue_script( self::HANDLE );
		wp_deregister_script( self::HANDLE );
		wp_set_current_user( $this->original_user_id );
		parent::tearDown();
	}

	public function test_application_script_uses_wordpress_language_pack_lookup(): void {
		$page = new AdminPage(
			dirname( __DIR__, 2 ) . '/yaxii-product-workspace.php',
			new FakeCapabilityPolicy(),
			new UserLocaleContext()
		);
		$page->add_menu_page();
		$page->enqueue_assets( 'toplevel_page_yaxii-product-workspace' );

		$script = wp_scripts()->registered[ self::HANDLE ] ?? null;
		self::assertInstanceOf( \_WP_Dependency::class, $script );
		self::assertSame( 'yaxii-product-workspace', $script->textdomain );
		self::assertSame( '', $script->translations_path );
		self::assertContains( 'wp-i18n', $script->deps );
	}
}
