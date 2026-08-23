# Yaxii Product Workspace 1.1.1 Hotfix Evidence

**Release date:** 2026-08-23

**Status:** Released and public-channel smoke-tested

## Scope and source

The hotfix corrects GET URL construction when WordPress supplies REST endpoints through the Plain
permalink `rest_route` query parameter. A shared frontend URL builder now extends the route and
adds filters, search terms, pagination, and repeated parameters without replacing or double-
encoding the existing query string.

- Hotfix implementation commit: `219bd7e841377724f3e4822330acba491132add1`
- Final private release-source commit: `7260b3a2abc43783c0e5a8ae8801894475a590ea`
- Public Free source (`dev`): `af3c9df501519d6918f8a74ee29906752f60cca8`
- Public release tree (`main`): `f33e2cc0d5127a2d8703af4219e52c59cb2b4882`
- Public Git tag: `v1.1.1`

Audited callers include recent operations and operation lookup, product search and product CRUD,
categories, tags, shipping classes, attributes and terms, preferences, bootstrap, and media.

## Automated gates

- Frontend full check: 25 files, 95 tests passed; typecheck, lint, line limit, build, boundary,
  dependency audit, and localization checks passed.
- React translation extraction: 492 of 492 messages.
- Translation catalogs: Arabic and French development catalogs complete; generated MO and
  path-hashed JSON validated.
- PHP unit tests: 37 tests, 98 assertions.
- MySQL-backed WordPress/WooCommerce integration tests: 42 tests, 496 assertions.
- Composer validation, PHP lint, PHPCS, PHPStan, readme, manifest, dependency, uninstall/privacy,
  prefix, license, source-boundary, and secret scans passed.
- Plugin Check: 0 errors and 6 reviewed query-performance warnings carried from 1.1.0.

The final private follow-up commit changed only the development language JSON path hash and source
map for the new compiled bundle. The release build re-ran the production build and both i18n gates
from that final commit.

## Artifact

- Filename: `yaxii-product-workspace-1.1.1.zip`
- SHA-256: `a33528cd30972d3ef24e27e86fb8b7251cbb76e5a0f1632f897cf30f153113a6`
- Runtime files: 111
- Reproducibility: byte-identical builds from two independent clean worktrees
- Catalog boundary: one POT; zero PO, MO, or development language JSON files

## Runtime QA

The exact release package passed authenticated MySQL-backed browser QA under both Plain and pretty
permalinks. Plain mode verified Queue, encoded product/category/tag/attribute searches, Settings,
simple create/edit, and a two-attribute 2 x 3 variable create/hydrate/regenerate/edit. Pretty mode
repeated the critical searches, Queue, Settings, and simple/variable create/edit flows. Browser
resources, console capture, and PHP debug logs contained no release-blocking failures.

English fallback, French local-language-pack simulation, and Arabic local-language-pack simulation
with rendered RTL direction passed. The runtime package itself remained free of bundled catalogs.

## Publication and public verification

- WordPress.org SVN revision: `3662113`
- SVN tag: `tags/1.1.1`
- `trunk`, `tags/1.1.1`, and the intended package: 111 files each with zero hash differences
- Historical `tags/1.1.0` last-changed revision: `3661858`
- WordPress.org public version and Stable tag: 1.1.1
- Tested up to: 7.1
- WordPress.org archive SHA-256:
  `2c80a9ab6e8d5c2cfcb21315b56307a1a5d34c2dcf8688fbbc867d44f1deddd9`
- WordPress.org archive versus intended runtime tree: zero file or content differences

A new WordPress 7.1/WooCommerce 10.9.4 site installed the public WordPress.org archive. Under Plain
permalinks it passed Queue, encoded product and category searches, simple create/edit, and a 2 x 3
variable create/hydrate/edit. After switching the same fresh installation to pretty permalinks,
Queue, encoded searches, simple edit, and variable edit passed again. No `rest_no_route`, REST 404,
failed resource, console event, PHP debug error, or missing compiled asset remained. The existing
directory icon, banner, and first screenshot returned HTTP 200.
