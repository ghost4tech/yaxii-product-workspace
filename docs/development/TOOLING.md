# Development Tooling

**Updated:** 2026-08-22

## Package authority

npm is the canonical frontend package manager. Its lockfile is
`apps/product-butler/package-lock.json`; the preserved Phase 0 `bun.lockb` is source provenance, not
a supported Bun workflow. Composer owns PHP development tools through the root `composer.lock`.
The frontend declares Node `^20.19.0 || >=22.12.0` and npm `>=10`. PHP development and the release
runtime require PHP 8.1 or newer; Composer resolves against PHP 8.1.29.

## Frontend commands

Run from `apps/product-butler`:

- `npm ci` - clean install from the lockfile.
- `npm run typecheck` - strict application and tooling TypeScript.
- `npm run lint` - maintained production and tooling lint.
- `npm run check:lines` - maintained production 300-line limit.
- `npm test` - Vitest component, contract, mapping, and persistence tests.
- `npm run build` - production assets and manifest under `assets/build`.
- `npm run check:i18n-build` - verifies the minified entry retains WordPress-extractable gettext
  calls and the release translation boundary remains compliant.
- `npm run check:boundary` - scans built assets for forbidden production boundaries and unscoped
  CSS.
- `npm run check` - authoritative frontend gate, excluding install and dependency audit.
- `npm run audit:production` - production dependency audit.

`npm run dev` starts a standalone development adapter. It does not provide production store writes
or seeded catalog data and is not the WordPress architecture.

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

For the current `choufi-store` LocalWP runtime (`JoHLKltX2`), use its generated PHP configuration
so the database port resolves correctly:

```powershell
$ypwRun = Join-Path $env:APPDATA 'Local\run\JoHLKltX2'
$ypwPhp = Join-Path $env:APPDATA 'Local\lightning-services\php-8.3.23+0\bin\win64\php.exe'
& $ypwPhp -c (Join-Path $ypwRun 'conf\php') vendor/bin/phpunit -c phpunit.integration.xml.dist
```

LocalWP currently emits an optional `php_imagick.dll` startup warning. The verified test and media
paths remain operational; treat it as a failure only when the tested behavior requires Imagick.

## Deterministic release package

From a clean committed checkout, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/build-release.ps1
```

The script performs a clean frontend build, checks source and built localization output,
regenerates the third-party license inventory, stages only the allowlist in
`release-manifest.json`, validates that the staged package has one POT and no PO, MO, or locale
JSON catalogs, creates a production Composer autoloader, and writes a deterministic ZIP plus
SHA-256 evidence under `dist/`. Generated `assets/build` files are ignored as development output
and copied explicitly into the package so a release cannot silently omit the compiled application.

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
