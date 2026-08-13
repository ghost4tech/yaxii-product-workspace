<?php
/**
 * In-memory preference repository test double.
 *
 * @package YaxiiProductWorkspace
 */

namespace Yaxii\ProductWorkspace\Tests\Support;

use Yaxii\ProductWorkspace\Application\Preferences\PreferenceRepository;

final class FakePreferenceRepository implements PreferenceRepository {
	/** @var array<int, array<string, mixed>> */
	private array $preferences = array();

	public function get_for_user( int $user_id ): array {
		return $this->preferences[ $user_id ] ?? array();
	}

	public function save_for_user( int $user_id, array $preferences ): void {
		$this->preferences[ $user_id ] = $preferences;
	}
}
