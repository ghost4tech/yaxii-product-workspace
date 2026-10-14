# Free Source and Package Boundary

## Required Free production code

The release contains the PHP bootstrap and `src/`, scoped admin shell CSS,
compiled production assets and manifest, WordPress translation artifacts,
production Composer autoloader, license/readme files, and uninstall routine.
This is the complete Free runtime; it has no license or entitlement dependency.

## Required human-readable Free build source

The public repository is the development source. Required inputs are
`apps/product-butler/src`, its production import graph, Vite/configuration and
tooling files, WordPress external bridges, `package.json` and
`package-lock.json`, PHP source, Composer files, PO/POT catalogs, and the release
scripts/configuration. `docs/development/TOOLING.md` records exact commands.
Lovable and private Pro source are not required.

## Development and reference only

The repository intentionally preserves the approved Lovable/reference material,
legacy source modules, mocks, development adapters, tests, docs, agent files,
screenshots, and QA utilities. `apps/product-butler-v2` is not tracked on this
release branch. The production import-graph scanner proves deferred Stores,
Analytics, Team, License, mock-store, AI, and prototype modules do not enter the
compiled application. These sources remain in Git where required by owner
provenance but are excluded from the ZIP.

## Future Pro or Agency implementation

No Pro/Agency implementation, preview, entitlement, fake commercial limit,
license flow, AI service, template/automation system, multi-store screen,
advanced catalog manager, or analytics screen ships in the Free artifact.
The release is not using CSS, navigation hiding, or client checks to conceal
implemented paid functionality.

## Enforced release boundary

`release-manifest.json` is an allowlist consumed by `tools/build-release.ps1`.
It excludes Git/GitHub metadata, `.agents`, `.claude`, owner instructions,
development docs/reports, tests, tooling, `node_modules`, development Composer
packages, source/reference apps, fixtures, mocks, caches, logs, `.env` files,
source maps, screenshots, credentials, and unpublished product tiers. The build
is reproducible from a clean public checkout.
