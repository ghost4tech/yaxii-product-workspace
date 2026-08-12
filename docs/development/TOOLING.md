# Development Tooling

**Updated:** Phase 1, 2026-08-12

## Package manager authority

npm is the only canonical package-manager workflow. The authoritative lockfile is
`apps/product-butler/package-lock.json`.

`apps/product-butler/bun.lockb` remains a preserved imported-prototype artifact. It is not authoritative and
does not establish Bun as an install, build, test, or release workflow. `packageManager`, CI-style install
evidence, scripts, and this document all designate npm.

## Canonical frontend commands

Run these from `apps/product-butler`:

- Clean install: `npm ci`
- Development server: `npm run dev`
- Strict TypeScript: `npm run typecheck`
- Lint: `npm run lint`
- Maintained-file limit: `npm run check:lines`
- Tests: `npm test`
- Production build: `npm run build`
- Built-boundary scan: `npm run check:boundary`
- Full frontend gate: `npm run check`
- Production dependency audit: `npm run audit:production`

`npm run build` writes the WordPress-ready manifest and hashed assets to `assets/build`. The committed build
is required for the plugin host to mount the React app.

Phase 1 reconciled `package.json` and `package-lock.json`; a clean `npm ci` succeeds. Maintained production
source is under `src/production`. Preserved Lovable prototype source outside that path is not part of the
WordPress production entrypoint or the maintained lint/typecheck boundary.

The package declares Node `^20.19.0 || >=22.12.0`, npm `>=10`, and npm 11.15.0 as its package-manager
version. Phase 1 acceptance used Node 22.12.0 and npm 11.15.0.

## PHP and WordPress checks

There is no Composer or PHP test-suite command yet. Use `php -l yaxii-product-workspace.php` and
`php -l includes/AdminPage.php` for the Phase 1 PHP surface. Repository triage is available through the
installed `wp-project-triage` skill. Runtime acceptance additionally requires activation and screen checks
inside a real WordPress installation; those are environment operations rather than package scripts.
