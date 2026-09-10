# Yaxii Product Workspace 1.1.2 Implementation Evidence

**Date:** 2026-09-10

**Private branch:** `release/1.1.2-woocommerce-interoperability`

**Baseline:** `b041e5d904c804b5acb1bcac4a641411e02467af`

**Release state:** Implementation checkpoint only; owner acceptance and every publication action
remain pending.

## Root cause and correction

Exact variation-SKU lookup could return `WC_Product_Variation`. Because that class inherits from
`WC_Product_Simple`, the gateway accepted the child as a supported Simple product and serialized a
`variation` type that the frontend contract correctly rejected. Native variations also expose the
string sentinel `parent` from view-context stock getters and can inherit a parent image in view
context, while Product Workspace requires explicit child-owned edit values.

The shared WooCommerce gateway now accepts only exact `simple` and `variable` types, resolves a
matched variation SKU to its parent, and sends all compatible products through the same canonical
mapper regardless of plugin-owned metadata. Variation hydration uses edit-context getters and
normalizes stock management to a boolean. Stable WooCommerce attribute, term, and variation IDs are
preserved, so edits update the six existing children rather than converting or duplicating them.

## Interoperability entry points

- Canonical link: `wp-admin/admin.php?page=yaxii-product-workspace&product=<positive-product-id>`.
- WooCommerce Products rows add **Edit with Yaxii Product Workspace** only for editable Simple and
  Variable products and retain all existing actions.
- The native product editor has a compact **Open in Product Workspace** secondary action.
- Product Workspace has a compact **Open in WooCommerce** action while editing an existing product.
- Find Product identifies results as Simple or Variable.
- Invalid, missing, unsupported, and forbidden direct-entry states are bounded; navigation GETs do
  not mutate and do not require a nonce.

## Automated evidence

- Frontend authoritative gate: typecheck, lint, 136-file line limit, 638-entry localization
  validation, 26 Vitest files / 100 tests, production build, 498/498 built-message validation, and
  26-asset prototype boundary check passed.
- Composer gate: strict validation, PHP lint for 98 maintained files, PHPCS, PHPStan, and 37 unit
  tests / 98 assertions passed.
- Local WordPress/WooCommerce integration: 52 tests / 652 assertions passed at 34 MB.
- Plugin Check: zero errors. Six pre-existing performance cautions remain in bounded product and
  variation queries: two `meta_key`, two `meta_value`, one `post__not_in`, and one `tax_query`.
- Security: npm audit reported 0 vulnerabilities across 547 dependencies; Composer reported no
  advisories or abandoned packages. TipTap and affected transitive tooling packages were updated to
  patched versions after the initial audit identified advisories.
- Source/compliance scans found no custom text-domain loader, external updater, telemetry code,
  trialware mechanism, WooCommerce consumer credentials, 1.1.2 tag, or public release branch. The
  curated release manifest includes the POT source catalog but excludes PO/MO runtime packs.
- Gitleaks was unavailable in the local toolchain; a redacted fallback scan for private-key
  headers, common provider tokens, and assigned credential-like values found zero matching files.

The PHPStan 1.12 age notice, Local's missing optional Imagick DLL warning, Vite's existing large
editor chunk notice, npm deprecation notices for dev-only transitive packages, and Plugin Check's
six query cautions were reviewed as existing non-blockers. No warning was hidden.

## Real WooCommerce browser matrix

Authenticated QA ran on LocalWP `http://ysf-lite.local` with WordPress 7.1, WooCommerce 10.9.4,
and PHP 8.3.23.

- Native Simple product: title, slug, regular/sale price, SKU, taxonomy, images, stock, shipping,
  tax, and descriptions hydrated through the integration path. Find by title/SKU, open, update,
  save, and native-editor reopen passed.
- Native global Variable product: real global Color and Size attributes produced six concrete
  variations with distinct price, SKU, stock, enabled state, and an explicit image. Parent and
  child-SKU search, hydration, save, native reopen, ID preservation, and no-duplicate checks passed.
- Native custom-attribute Variable product: Material with Cotton/Wool, both concrete variations,
  edit/save, and no-duplicate checks passed.
- Existing Workspace-created Simple and Variable coverage remained green in the regression suites.
- Pretty permalinks: Find, Queue, category search, direct refresh, all navigation directions, and
  native Variable edit passed.
- Plain permalinks: query-form REST/media URLs, Find by variation SKU, Queue, category search,
  direct link, native Variable edit/save, and absence of `rest_no_route` passed. Pretty permalinks
  were restored afterward.
- Presentation: desktop light/dark, 430 px and 375 px, Arabic RTL, keyboard focus, visible focus,
  and non-hover access to the new action passed visual/runtime inspection without redesigning the
  approved interface.

The QA products, variation children, two temporary attribute terms, and temporary administrator
were deleted after verification. Companion plugins temporarily disabled to remove unrelated local
debug noise were reactivated, and the original permalink structure was restored.

## Guard review

- `clean-code-guard`: tightened the exact simple-product mutation boundary and removed two
  hydration-triggered render loops; final review found no blocker.
- `wp-guard`: added scalar validation, unslashing, sanitization, capability checks, and contextual
  URL/HTML escaping to native entry points; final review found no blocker.
- `woo-guard`: fixed the variation subclass trap, parent SKU resolution, edit-context child fields,
  type boundaries, stable identities, and no-duplicate updates; final review found no blocker.
- `test-guard`: added behavior-first WordPress/WooCommerce integration fixtures plus direct-entry
  interaction coverage; final review found no blocker.
- `docs-guard`: verified this evidence and feature documentation against the executed gates and
  retained the unpublished release boundary.

## Release boundary and proposed changelog

The code version and release manifest intentionally remain `1.1.1`. No tag, WordPress.org SVN
change, public `dev`/`main` update, or public export was made.

Proposed 1.1.2 changelog:

> Improved compatibility with existing WooCommerce Simple and Variable products, including native
> variation attributes and SKU search, plus faster navigation between WooCommerce and Product
> Workspace.
