# Yaxii Product Workspace 1.1.2 Release Evidence

**Release date:** 2026-09-10

**Status:** Released and public-download smoke-tested

## Source and public refs

- Approved implementation: `f1dd985b609f36a29c4840e1b7d39c3162a57cc3`
- Final private release source: `b24e42bca50715c35e0bffeeec53be3c4aa4fb32`
- Public Free source (`dev`): `ecdfcec840a0adac9ca85cd48bdce7d4734ebca6`
- Public release tree (`main`): `c0dce6cb567e717abbad1ee1cbf672a52378ba78`
- Public annotated tag: `v1.1.2`
- Tag object: `6b96710a8b87f75f1c78c19fd5ad019ff826b84c`
- Tag target: `c0dce6cb567e717abbad1ee1cbf672a52378ba78`

The public branches are curated exports with public-only ancestry. No private release branch or
internal ancestry was merged into public `dev` or `main`. A fresh clone of public `dev` reproduced
the final release package exactly.

## Automated gates

- Frontend authoritative gate: typecheck, lint, 136-file production line limit, 638-entry
  localization validation, 26 Vitest files / 100 tests, production build, 498/498 built-message
  validation, and 26-asset source boundary passed.
- Production npm audit: zero vulnerabilities.
- Composer gate: strict validation, PHP lint for 98 files, PHPCS, PHPStan, and 37 unit tests / 98
  assertions passed.
- MySQL-backed WordPress/WooCommerce integration: 52 tests / 652 assertions passed.
- Composer security audit: no advisories.
- Plugin Check on the final candidate: zero errors and six unchanged bounded query-performance
  warnings: two `meta_key`, two `meta_value`, one `tax_query`, and one `post__not_in`.
- Final package compliance and secret scans passed. The package contains one POT and no PO, MO,
  locale JSON, private documentation, tests, frontend source, prototype applications, credentials,
  updater, telemetry, or custom `load_plugin_textdomain()` call.

## Reproducible artifact

- Filename: `yaxii-product-workspace-1.1.2.zip`
- SHA-256: `1576a2131764c27c3791c2e9cd17f8714d2c1d5f7d6c40de13736b396b97dc62`
- Size: 993,830 bytes
- Runtime files: 112
- Reproducibility: byte-identical output from two independent clean private worktrees and a fresh
  public `dev` clone.
- Exact-ZIP QA: install, activation, Simple create/edit, native global/custom Variable edit,
  variation-SKU lookup, stable variation IDs, Queue, categories, both navigation directions,
  Settings, assets, and Plain/pretty REST paths passed with no browser or runtime PHP errors.

## Interoperability and presentation QA

The version-bumped source and exact package were exercised on WordPress 7.1 with WooCommerce
10.9.4. Native Simple, native global-attribute Variable, native custom-attribute Variable, and
Workspace-created Simple flows passed. Variation-SKU search resolved the Variable parent; existing
variation IDs remained stable after edits and no duplicate variations were created.

Pretty permalinks passed Workspace, Find Product, Queue, product/category searches, native
Simple/Variable open and edit, global/custom attributes, row action, native-editor action, reverse
navigation, deep links, and Settings. Plain permalinks repeated the critical flows using preserved
`rest_route` query URLs without REST 404 or `rest_no_route`. The original pretty permalink setting
was restored.

English and Arabic RTL checks passed on desktop, 430 px, and 375 px in light/dark modes with
keyboard focus. The new actions remained readable and did not depend on hover. No release UI was
redesigned.

## WordPress.org publication and verification

- SVN revision: `3690446`
- `trunk` and `tags/1.1.2`: 112 files, byte-equal before commit
- Historical tags `1.0.0`, `1.1.0`, and `1.1.1`: untouched
- Directory icon, banner, and screenshot assets: unchanged
- Public version / Stable tag: 1.1.2
- Tested up to: 7.1
- Public changelog: 1.1.2 present
- Official WordPress.org ZIP SHA-256:
  `58c0a9334284c146c7a6ec68e563c9a8395759d1629c979412b3af6bb419fcf5`
- Official ZIP versus `tags/1.1.2`: 112 matching paths and zero content differences

A new WordPress 7.1 site with WooCommerce 11.1.0 installed the archive downloaded from
WordPress.org. Pretty mode passed activation, Workspace, real Simple creation and edit, native
global/custom Variable edit, variation-SKU parent search, Queue, categories, Settings, row action,
and both deep-link directions. Plain mode repeated Queue, product and variation-SKU search,
category search, native Variable hydration, deep links, and Settings through query-form REST URLs.
The browser recorded 247 requests with zero 4xx/5xx responses and no pending request; the clean
runtime replay created no PHP debug log. Persisted product assertions confirmed stable variation
IDs `12`, `13`, `15`, and `16`, edited values, the SKU-to-parent result, and the new Simple product.

## Translation source

The POT and maintained Arabic/French development PO sources are complete. Production distribution
continues through WordPress.org language packs; no runtime catalog is bundled.

Ten source-string changes require Stable-project follow-up on translate.wordpress.org: nine new
strings and one changed string.

1. `Edit with Yaxii Product Workspace`
2. `Open in Product Workspace`
3. `This WooCommerce product type is not supported. Open a Simple or Variable product.`
4. `Loading linked product…`
5. `Open in WooCommerce`
6. `Simple` (context: `Product type`)
7. `The linked product could not be opened.`
8. `The Product Workspace link contains an invalid product ID.`
9. `Variable` (context: `Product type`)
10. Changed from `The requested simple product was not found.` to
    `The requested product was not found.`

## Reviewed non-blockers

- Six unchanged Plugin Check query-performance warnings described above.
- Vite's existing approximately 570 kB editor chunk notice.
- PHPStan 1.12 age notice.
- Local's optional missing Imagick DLL startup notice.
- Development-only npm transitive deprecation notices.

All guard reviews passed after the release hardening fixes. No unresolved release blocker remains.
