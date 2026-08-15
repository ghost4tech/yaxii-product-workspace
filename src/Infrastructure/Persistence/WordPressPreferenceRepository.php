<?php
/**
 * WordPress user-meta preference adapter.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Infrastructure\Persistence;

use RuntimeException;
use Yaxii\ProductWorkspace\Application\Preferences\PreferenceRepository;

defined( 'ABSPATH' ) || exit;

final class WordPressPreferenceRepository implements PreferenceRepository {
	private const META_KEY = 'ypw_workspace_preferences_v1';

	public function get_for_user( int $user_id ): array {
		$value = get_user_meta( $user_id, self::META_KEY, true );
		return is_array( $value ) ? $value : array();
	}

	public function save_for_user( int $user_id, array $preferences ): void {
		$result = update_user_meta( $user_id, self::META_KEY, $preferences );
		if ( false === $result && $preferences !== $this->get_for_user( $user_id ) ) {
			throw new RuntimeException( 'Unable to persist workspace preferences.' );
		}
	}
}
