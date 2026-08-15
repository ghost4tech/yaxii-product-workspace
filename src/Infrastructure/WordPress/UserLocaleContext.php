<?php
/**
 * Resolves the current WordPress user's locale and writing direction.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\WordPress;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps the admin host and REST bootstrap aligned with the user's locale.
 */
final class UserLocaleContext {
	/**
	 * @return array{code: string, direction: string}
	 */
	public function current(): array {
		$locale    = get_user_locale();
		$switched  = switch_to_locale( $locale );
		$direction = is_rtl() ? 'rtl' : 'ltr';

		if ( $switched ) {
			restore_previous_locale();
		}

		return array(
			'code'      => $locale,
			'direction' => $direction,
		);
	}
}
