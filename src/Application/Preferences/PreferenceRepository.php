<?php
/**
 * Workspace preference persistence boundary.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Application\Preferences;

interface PreferenceRepository {
	/** @return array<string, mixed> */
	public function get_for_user( int $user_id ): array;

	/** @param array<string, mixed> $preferences Canonical preferences. */
	public function save_for_user( int $user_id, array $preferences ): void;
}
