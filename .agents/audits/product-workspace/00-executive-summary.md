# Executive summary

## Decision

Use this prototype as a **visual and interaction foundation**, not as a production frontend codebase and not as an integration layer. Its strongest asset is the focused product-entry workspace: clear essentials, progressive disclosure, a visible queue, useful keyboard affordances, coherent dark mode, and a credible compact SaaS aesthetic. The current application is nevertheless a demo with client-controlled entitlements, random fixtures, fake success messages, browser-stored Woo credentials, no authentication, no WordPress bootstrap, and no reliable variable-product workflow.

The correct path is selective reuse: keep the design tokens, shell concepts, entry/queue composition, preference ideas that improve throughput, and the best small components. Replace the data boundary, product state, licensing, connection model, editing lifecycle, variation model, and all mock operational screens before shipping.

## What it can actually do today

- Run as a standalone Vite/React SPA with six named routes plus a 404.
- Maintain a local simple-product draft for text/date fields, seed and persist a mock queue, search/filter that queue, delete/undo, and duplicate the latest item into the form.
- Preview/reorder/remove selected images within the current page lifetime.
- Apply browser-local theme, accent, density, motion, workflow, queue, and product-default preferences.
- Switch between Free and Pro demonstrations, browse static analytics/stores/team screens, and exercise command-menu/keyboard navigation.
- Attempt direct browser calls to a remote WooCommerce REST API. This is executable code, but it is not an acceptable WordPress-plugin architecture and was not validated against a real store.

It cannot currently provide trustworthy product editing, usable variable products, a complete product schema, real multi-store/team/analytics/CSV/AI/licensing, authenticated persistence, safe WooCommerce writes, or production-grade error recovery.

## Evidence basis and boundaries

- Source root: `apps/product-butler`, branch `main`, audited commit `199798ea5b958cc58b596f530066ca501761f51c`.
- Existing owner changes were preserved: four pre-existing deleted assets/files were not restored or modified.
- Runtime: development server plus interactive browser tests at 375, 430, 768, 1280, 1440, and 1920 widths; light/dark, compact, modal, lock, persistence, and forced RTL checks.
- Static checks: build passed; TypeScript no-emit passed under non-strict settings; lint failed with 6 errors/7 warnings; the single placeholder test passed.
- Build output: about 1.146 MB minified JS / 328 KB gzip and a Vite chunk-size warning.
- Install reproducibility: `npm ci` failed because the manifest and lockfile disagree on Testing Library packages. Audit execution used `npm install --package-lock=false`; tracked dependency files were not modified.
- Dependency audit on 2026-08-11 reported 21 advisories in the installed tree (1 critical, 16 high, 3 moderate, 1 low). This is a remediation gate, not proof that every advisory is exploitable in the shipped browser bundle.
- No live WooCommerce store, authenticated wp-admin, PHP runtime, database, email provider, license server, scheduler, or production environment was exercised. Those remain unverified.

## Top product conclusions

### Keep

- Fast-entry workspace with Essentials/Extended separation.
- Form-and-queue pairing on desktop and stacked simple-entry flow on mobile.
- Draft recovery, duplicate-last, keep-values-after-save, search/status filters, undo, command menu, keyboard workflow, dark mode, compact density, and semantic status tokens.

### Fix before any backend integration

- Define a canonical frontend domain model and strict DTO boundary.
- Replace localStorage product/credential/entitlement truth with authenticated WordPress REST services.
- Build real create/edit/retry/idempotency lifecycles and honest loading/error/partial-success states.
- Rebuild variable-product UX and data modeling around global/custom attributes plus explicit combinations.
- Add localization infrastructure and systematic logical-direction styling.
- Split oversized components/services, remove unused scaffolding, enable strict TypeScript, and add meaningful unit/integration/browser tests.

### Remove or defer

- Remove direct browser Woo API credentials/CORS guidance, fake license activation, Free/Pro preview in production, fake team email/sync-health success, and misleading analytics metrics.
- Defer AI, automations, generalized multi-store, team collaboration, and elaborate analytics until event and job data actually exist.
- Do not build a second generic CSV importer as a v1 differentiator; WooCommerce core already includes product CSV import/export. If later offered, monetize safer mapping, reusable recipes, validation, dry runs, resumability, and cross-store workflows rather than the basic upload itself ([WooCommerce core CSV documentation](https://woocommerce.com/document/product-csv-importer-exporter/)).

## Recommended packaging

- **Free v1:** exceptional simple-product create/edit/duplicate; complete essential Woo fields; media; categories/tags; inventory/shipping/tax; local draft recovery; queue with reliable statuses/retry; keyboard flow; mobile simple-entry; dark mode; Arabic/RTL; useful per-user preferences.
- **Pro v1:** reusable product templates/presets, controlled bulk creation/update with dry run and logs, advanced variation productivity (matrix, bulk fill, SKU generation rules), and scheduled draft/import jobs only if backed by a durable queue.
- **Agency:** multi-site connections, reusable cross-client template packs, store switching, migration/sync policies, client role controls, and portfolio audit logs—implemented as a separately secured architecture, not browser-stored keys.

## Best differentiation opportunity

Position around **the fastest safe manual-to-repetitive WooCommerce product workflow**: a keyboard-first entry queue for occasional merchants that grows into reusable presets and a high-quality variation matrix for power users. The differentiator is operational speed with reversible, inspectable writes—not generic dashboards, AI copy, or automation theater.

## First implementation phase

Build one production-quality simple-product vertical slice inside wp-admin: plugin-owned root and scoped assets; bootstrap/current-user/store config; strict TypeScript DTOs; `GET /bootstrap`, paged taxonomy lookup, `POST /products`, `GET/PATCH /products/{id}`; PHP capability/nonce/validation/idempotency enforcement; `WC_Product_Simple` CRUD; real media selection/upload; form errors; honest queue results; and unit/REST/browser tests in EN/FR/AR. Do not begin Pro work until this slice is reliable.
