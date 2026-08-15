# Development Tooling

**Updated:** 2026-08-15

## Package authority

npm is the canonical frontend package manager. Its lockfile is
`apps/product-butler/package-lock.json`; the preserved Phase 0 `bun.lockb` is source provenance, not
a supported Bun workflow. Composer owns PHP development tools through the root `composer.lock`.
The frontend declares Node `^20.19.0 || >=22.12.0` and npm `>=10`. The release
checkout was built with Node 22.12.0 and npm 11.15.0. PHP development and the
release runtime require PHP 8.1 or newer; the locked Composer platform is PHP
8.1.29 and the release checkout used Composer 2.8.5.

## Frontend commands

Run from `apps/product-butler`:

- `npm ci` - clean install from the lockfile.
- `npm run typecheck` - strict application and tooling TypeScript.
- `npm run lint` - maintained production and tooling lint.
- `npm run check:lines` - maintained production 300-line limit.
- `npm test` - Vitest component, contract, mapping, and persistence tests.
- `npm run build` - production assets and manifest under `assets/build`.
- `npm run check:boundary` - scans built assets for forbidden production boundaries and unscoped
  CSS.
- `npm run check` - authoritative frontend gate, excluding install and dependency audit.
- `npm run audit:production` - production dependency audit.

`npm run dev` starts a standalone development adapter. It does not provide production store writes
or seeded catalog data and is not the WordPress architecture.

## Localization build

From the repository root, after `npm ci`, run the following exact sequence. It
does not require Lovable or another private service.

```powershell
npm --prefix apps/product-butler run i18n:source
wp i18n make-pot . languages/yaxii-product-workspace.pot --domain=yaxii-product-workspace --exclude=vendor,node_modules,assets/build,apps/product-butler/src,tests,docs
# Update the maintained PO translations before compiling when source messages changed.
wp i18n make-mo languages
npm --prefix apps/product-butler run build
npm --prefix apps/product-butler run i18n:map
wp i18n make-json languages languages --domain=yaxii-product-workspace --no-purge --pretty-print --use-map=languages/source-map.json
npm --prefix apps/product-butler run i18n:finalize
npm --prefix apps/product-butler run check:i18n
```

## PHP commands

Run from the repository root:

- `composer install` - locked tool install and PSR-4 autoloader.
- `composer validate --strict` - Composer metadata and lockfile validation.
- `composer run lint` - maintained PHP source and test lint.
- `composer run phpcs` - WordPress Coding Standards and PHP compatibility.
- `composer run phpstan` - WordPress-aware static analysis.
- `composer test` - isolated PHPUnit suite.
- `composer run test:integration` - WordPress/WooCommerce REST integration suite.
- `composer run check` - Composer validation, PHP lint, PHPCS, PHPStan, and unit tests.

The integration bootstrap defaults to the WordPress root four directories above the plugin. Set
`YPW_WP_ROOT` when using another layout. Tests create unique products, terms, media, tax classes,
users, and operations and remove them during teardown. Failure to boot WordPress is a failed run.

When using a local WordPress environment manager (e.g. LocalWP) whose bundled
PHP does not resolve the database port from the system `php.ini`, run PHPUnit
with that environment's own PHP binary and generated configuration file
instead of a system-wide PHP install. Consult your environment manager's
documentation for the binary and config paths. An optional missing-Imagick
startup warning is a local PHP extension notice, not a test failure; treat it
as a failure only when the tested behavior requires Imagick.

## Deterministic release package

From a clean committed checkout, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/build-release.ps1
```

The script performs a clean npm install, rebuilds and verifies committed
frontend/localization/license artifacts, stages the allowlist from
`release-manifest.json`, runs `composer dump-autoload --no-dev
--classmap-authoritative --no-scripts` inside the staged plugin, and writes the
deterministic ZIP plus its SHA-256/file manifest under `dist/`. Development PHP
dependencies are installed with `composer install`; only Composer's generated
production autoloader is packaged.

`-UseCommittedAssets` is a constrained-runner fallback. It packages the exact
tracked production assets without invoking Node, records that command in the
artifact manifest, and must be used only after the same commit's asset hashes
have passed the normal build/localization/boundary gates in a capable runner.

## Phase 3 verification

- `npm ci` installed 462 packages; the production audit reported zero vulnerabilities.
- `npm run check` passed typecheck, lint, 98 maintained production files at or below 300 lines,
  43 Vitest tests in 12 files, the production build, and a clean scan of 23 built assets.
- `composer check` passed validation, lint for 56 maintained PHP files, PHPCS, PHPStan, and 19 unit
  tests with 52 assertions.
- the LocalWP integration suite passed 25 tests with 286 assertions.
- authenticated browser QA exercised the complete simple-product lifecycle, console/network state,
  persisted WooCommerce data, failure/recovery paths, and the required responsive/theme/density/RTL
  visual matrix. Disposable products, QA operations, and the temporary QA user were removed.
