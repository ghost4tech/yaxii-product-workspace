# Development Tooling

**Baseline date:** 2026-08-12

## Package manager authority

npm is the only canonical package-manager workflow. The authoritative lockfile is
`apps/product-butler/package-lock.json`.

`apps/product-butler/bun.lockb` is preserved unchanged as part of the approved imported prototype. It
does not establish Bun as a supported workflow. Its final disposition is deferred to Phase 1.

## Current prototype commands

Run these from `apps/product-butler`:

- Canonical clean install target: `npm ci`
- Development server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm run test`

`npm ci` currently fails because the imported `package-lock.json` is missing entries required by
`package.json`. Phase 0 preserves that approved dependency state. A one-off
`npm install --package-lock=false` was used only to create a diagnostic tree; it is not a supported
second workflow and left `package-lock.json` unchanged.

With that diagnostic tree, the placeholder test and production build pass. Lint reports 8 errors and
7 warnings in imported source. The build also reports an existing chunk larger than 500 kB. There is
no separate typecheck, PHP quality, WordPress runtime, or packaging command in Phase 0.

Supported runtime/tool versions remain undecided. The Phase 0 checks used Node 22.12.0 and npm 11.15.0;
those observations are evidence, not compatibility policy.
