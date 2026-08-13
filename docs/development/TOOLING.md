# Development Tooling

**Updated:** 2026-08-12

## Package authority

npm is the canonical frontend package-manager workflow. The authoritative frontend lockfile is
`apps/product-butler/package-lock.json`. The Phase 0 `bun.lockb` remains preserved as source
provenance but does not define a supported Bun workflow. Composer owns the PHP development tools
through the root `composer.lock`.

The frontend declares Node `^20.19.0 || >=22.12.0` and npm `>=10`.

## Frontend commands

Run from `apps/product-butler`:

- `npm ci` — canonical clean install.
- `npm run typecheck` — strict application and tooling TypeScript.
- `npm run lint` — maintained production and tooling lint.
- `npm run check:lines` — active maintained-source 300-line limit.
- `npm test` — Vitest component, boundary, mapping, and locale tests.
- `npm run build` — production assets and Vite manifest under `assets/build`.
- `npm run check:boundary` — scans built assets for unsafe/deferred production boundaries and
  unscoped CSS.
- `npm run check` — authoritative frontend gate combining the preceding checks except install and
  dependency audit.
- `npm run audit:production` — production dependency audit.

`npm run dev` starts the standalone development adapter. It renders the Lovable application with no
store writes or seeded catalog data; it is not the production architecture.

## PHP commands

Run from the repository root:

- `composer install` — installs the locked PHP development toolchain and generates the PSR-4
  autoloader.
- `composer validate --strict` — validates Composer metadata and the lockfile.
- `composer run lint` — lints all maintained PHP source and test files.
- `composer run phpcs` — runs WordPress Coding Standards and PHP compatibility checks.
- `composer run phpstan` — runs the WordPress-aware PHPStan configuration.
- `composer test` — runs the isolated PHPUnit suite.
- `composer run test:integration` — boots the current WordPress installation and runs REST and
  WooCommerce integration tests.
- `composer run check` — runs Composer validation, PHP lint, PHPCS, PHPStan, and unit tests.

The integration bootstrap defaults to the WordPress root four directories above this plugin. Set
`YPW_WP_ROOT` to an explicit WordPress root when running from another layout. Integration tests
create uniquely named products and categories and remove them during teardown.

## Current verification

The final Phase 2 gates pass:

- PHP lint, PHPCS, PHPStan, 8 unit tests with 25 assertions, and 14 LocalWP integration tests with
  92 assertions;
- strict TypeScript, ESLint, the maintained-source line limit, 25 Vitest tests, production build,
  and the built-asset boundary scan;
- a production-only npm dependency audit with zero vulnerabilities;
- LocalWP REST dispatch that created and inspected real disposable Draft and Published products,
  proved idempotent replay used one product, rejected conflicting key reuse, and removed the
  fixtures;
- an inactive-WooCommerce check that reported the dependency unavailable and produced zero writes
  before WooCommerce was restored.

The authenticated browser matrix could not run because the browser service exposed no backend.
Desktop, tablet, 430 px, 375 px, light/dark, Focus Mode, and structural RTL parity therefore remain
an explicit owner acceptance item; source, tests, build, and REST runtime evidence do not replace it.
