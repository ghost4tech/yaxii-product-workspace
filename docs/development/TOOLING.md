# Development Tooling

**Updated:** 2026-08-12

## Package authority

npm is the only canonical package-manager workflow. The authoritative lockfile is
`apps/product-butler/package-lock.json`. The Phase 0 `bun.lockb` remains preserved as source
provenance but does not define a supported Bun workflow.

The frontend declares Node `^20.19.0 || >=22.12.0` and npm `>=10`. Recovery verification used Node
22.12.0 and npm 11.15.0.

## Frontend commands

Run from `apps/product-butler`:

- `npm ci` — canonical clean install.
- `npm run typecheck` — strict application and tooling TypeScript.
- `npm run lint` — maintained production and tooling lint.
- `npm run check:lines` — active maintained-source 300-line limit.
- `npm test` — Vitest component, boundary, and locale tests.
- `npm run build` — production assets and Vite manifest under `assets/build`.
- `npm run check:boundary` — scans built assets for unsafe/deferred production boundaries and
  unscoped CSS.
- `npm run check` — authoritative frontend gate combining the preceding checks except install and
  dependency audit.
- `npm audit` — full development and production dependency audit.
- `npm run audit:production` — production dependency audit.

Both dependency audits reported zero vulnerabilities at the recovery checkpoint.

`npm run dev` starts the standalone development adapter. It renders the same Lovable application
with no store writes or seeded catalog data; it is not the production architecture.

## PHP checks

Run from the repository root:

- `php -l yaxii-product-workspace.php`
- `php -l includes/AdminPage.php`

There is no Composer, PHPUnit, PHPStan, PHPCS, packaging, REST, or WooCommerce write command in
Phase 1. Those capabilities must not be inferred from the thin admin host.

## Isolated WordPress smoke test

The recovery was mounted with Playground CLI 3.1.49 in a disposable site using PHP 8.3. The
generated admin page reported WordPress 7.0.4. The check proved:

- the plugin activates and appears in the plugin list;
- the `Product Workspace` admin page returns HTTP 200;
- the page contains the application and portal roots;
- the Vite JavaScript module and CSS return HTTP 200;
- the bootstrap reports WooCommerce unavailable when WooCommerce is absent, and the active frontend
  has no product-write client;
- Dashboard contains neither the plugin JavaScript nor its stylesheet.

This server-render and asset evidence does not prove visual parity. The required browser matrix is
tracked separately in [Phase 1 Recovery](../project/PHASE-1-RECOVERY.md).
