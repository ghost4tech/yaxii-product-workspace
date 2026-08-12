# MVP and implementation roadmap

## Smallest release that still feels exceptional

The MVP should be an excellent **same-store product creation/editing workspace**, not a mini commerce platform. It wins by shortening repeated entry while making every write inspectable and safe.

## Free v1 must include

### Foundation

- WordPress plugin bootstrap, one isolated React root and plugin-screen-only assets.
- WooCommerce availability/version check and bounded unavailable state.
- Current WordPress user/capability, locale/direction, currency/units/timezone bootstrap.
- Same-origin REST client with nonce, typed errors, request IDs and cancellation.
- Server-authoritative operations using Woo CRUD and idempotency.

### Products

- Find/open existing products with server search/pagination.
- Create/edit/duplicate simple products.
- Basic variable product create/edit with global/custom attributes and explicit combinations.
- Fields:
  - name, optional slug, description, short description;
  - draft/publish intent, catalog visibility;
  - regular/sale price and schedule;
  - SKU, manage stock, quantity/status;
  - weight, dimensions, shipping class;
  - tax status/class;
  - categories and tags;
  - featured image/gallery through WordPress media;
  - product attributes and basic variation price/SKU/stock/image.

### Productivity

- Essentials/Extended composition retained.
- Save & next, clear, duplicate/prefill, autofocus and keyboard command menu.
- Explicit repeat-after-save fields (category/tax/shipping/selected values).
- Versioned browser draft recovery without credentials or raw catalog persistence.
- Recent operation queue with truthful state, search/filter, details, manual retry/reconcile and safe removal/undo semantics.
- Loading, empty, validation, conflict, partial-failure and offline/session-expired states.

### Quality

- Light/dark/system, compact density and reduced motion.
- Responsive simple-entry workflow; touch-visible actions.
- Settings layout fixed for 375/430.
- EN, FR and Arabic/RTL with locale-aware formatting.
- Strict TypeScript, no `any`, lint clean, reproducible install/build and meaningful tests.

## Pro v1 should include

Only add after Free core is stable:

1. **Templates/presets**
   - named, versioned, selective fields;
   - preview before apply;
   - missing taxonomy/attribute resolution;
   - user/store scope.
2. **Advanced variation productivity**
   - virtualized matrix when needed;
   - bulk price/stock/SKU/image fill;
   - SKU rules and collision preview;
   - include/exclude combinations and validation summary.
3. **Safe batch create/update**
   - mapping/plan, dry run/sample diff;
   - chunked durable execution, progress, resume/cancel boundary;
   - per-row result/failure export and saved mapping recipes.

If these cannot all meet the quality bar, ship Templates + Variation Matrix first and defer batch import. Do not fill Pro with mocked analytics/AI to increase feature count.

## Do NOT build yet

- Multi-store or central agency control plane.
- Team invitations/seats/custom role system.
- AI description provider.
- General automation builder.
- Scheduled jobs beyond what the first Pro batch engine demonstrably needs.
- Revenue/time-saved/team-productivity analytics.
- Store health/latency monitoring.
- Remote-image URL importer.
- Arbitrary custom meta/third-party product type compatibility.
- Realtime collaboration.
- Public SaaS API.
- A generic CSV importer clone without differentiated validation/recovery.

## Biggest differentiator

1. **Keyboard-first, queue-backed Save & next:** fast enough for repeated manual entry, with honest results and recovery.
2. **Best-in-class progression to variations/templates:** the same clean workspace scales from one simple product to repeated families and complex variable products without exposing a spreadsheet prematurely.

## Implementation sequence

Every phase below is independently reviewable and must end with no fake success paths in its scope.

### Phase 0 — Prototype extraction and contract lock

**Goal:** preserve the visual foundation while removing unsafe assumptions before backend work fans out.

- Freeze audited prototype/screenshots as reference.
- Decide plugin slug/REST namespace/browser routing and supported WP/Woo/PHP/Node versions.
- Define strict DTOs, error/operation result and simple-product command/resource.
- Create feature-oriented frontend skeleton; scope CSS root/portals; self-host/system fonts.
- Reconcile dependencies/lockfile; remove unused Lovable/shadcn/toast/theme/query residue or adopt intentionally.
- Introduce i18n/formatting/direction primitives from day one.
- Keep mock repositories as deterministic test/story fixtures only.

**Acceptance:** clean `npm ci`, strict typecheck/lint/tests/build; isolated shell renders in wp-admin EN/FR/AR light/dark without affecting another admin page; no Woo writes yet.

### Phase A — Foundation + simple-product create vertical slice

**Goal:** one real product can be created safely end to end.

- PHP bootstrap/container/admin page/asset loader.
- `/bootstrap`, taxonomy search, preferences and `POST /products` simple command.
- Capability, nonce, validation, media references and idempotency.
- `WC_Product_Simple` mapper/service/resource.
- React bootstrap/API adapter, simple form, real category/tag search, media selection, server-error mapping, operation result row.
- Browser draft cache and honest disconnected/session/error states.

**Acceptance:** authorized user creates Draft and permitted Published simple products; unauthorized/nonced/duplicate/SKU/media/term cases tested; repeated idempotency key creates once; EN/FR/AR at all required viewports.

This is the first implementation phase and should be the next task after approval.

### Phase B — Complete simple-product management

**Goal:** Free simple workflow is launch-complete.

- Product query/detail/PATCH/trash.
- Edit conflict/version handling.
- Complete pricing/inventory/shipping/tax/status/visibility fields.
- Duplicate/prefill selected product.
- Recent operations/real queue, reconcile/retry semantics.
- Preferences backend and high-value workflow settings.
- Mobile Settings/navigation/table fixes and accessibility pass.

**Acceptance:** create → edit → duplicate → retry/reconcile → trash lifecycle; representative large catalog uses paging; no secrets/catalog stored in browser; keyboard/touch/RTL coverage.

### Phase C — Basic variable products (Free)

**Goal:** credible native Woo variable creation/editing.

- Global/custom attribute and term resources.
- Correct attribute/combination frontend model.
- Guided mobile variation editor; desktop combination table.
- Cohesive variable create/update application services with prevalidation and partial result.
- SKU/combination uniqueness, maximum limits, parent synchronization and media assignment.

**Acceptance:** one- and multi-attribute products round-trip; distinct combination price/SKU/stock/image persists; partial failure is visible/recoverable; no N-request browser orchestration.

### Phase D — Free release hardening

**Goal:** WordPress.org-quality Free release candidate.

- Compatibility matrix and graceful extension/product-type handling.
- Security review, dependency remediation, performance/bundle budgets.
- Accessibility and localization review with native speakers/RTL checks.
- Data retention/uninstall/privacy documentation.
- Plugin Check/packaging, exact ZIP test, fresh-install/upgrade testing.
- Remove all demo plan switches, fake routes/data and unapproved commercial claims from production artifact.

**Acceptance:** exact release artifact passes automated/manual gates on supported versions; no unverified production activation/deployment implied.

### Phase E — Pro templates and advanced variation productivity

**Goal:** first natural paid value.

- Pro module/entitlement server boundary.
- Template storage/versioning/apply preview.
- Advanced variation matrix, bulk fill/rules and collision preview.
- Free remains functional when Pro module is absent/disabled.

**Acceptance:** entitlement enforced at UI and endpoint; templates/matrix improve a measured repeated workflow; compatibility/migration tests; no Free regression.

### Phase F — Pro batch engine

**Goal:** safe scale operations, not a cosmetic CSV screen.

- Import plan/mapping/dry run.
- Durable Action Scheduler jobs, chunking, locks, attempts, progress, cancellation and per-row results.
- Saved recipes and supported-field compatibility declarations.
- Minimal truthful operations report.

**Acceptance:** large representative imports resume after interruption, duplicate requests do not duplicate products, failures are exportable/actionable, caps/concurrency protect shared hosting.

### Phase G — Agency discovery gate

**Goal:** decide whether to build Agency based on evidence.

- Customer interviews/workflow evidence.
- Threat model, tenancy/identity/credential lifecycle.
- Local connector vs SaaS control-plane architecture decision.
- Pricing/support/version-compatibility analysis.

**Acceptance:** approved architecture and scope. Until then, multi-store/team/fleet features remain HOLD and out of production code.

## Review gates per phase

- Scope: no later-phase features smuggled into the current phase.
- Evidence: source + unit/integration/browser proof; screenshots alone insufficient.
- Security: capabilities, nonce, data validation, secret boundary, idempotency.
- Data: canonical DTO/resource round-trip and migration/version behavior.
- UX: success/error/loading/empty/partial states; no toast-only claims.
- Responsive/i18n: 375, 430, tablet, laptop, large desktop; EN/FR/AR; light/dark.
- Performance: bounded server queries and browser state; cancellation/concurrency.
- Packaging: reproducible dependency/build artifact; exact artifact tested.

## Success measures

- Median time and clicks to create a complete simple product compared with native workflow, measured with real users.
- Error/retry completion rate, duplicate-write rate (target zero), and recovery clarity.
- Time to create a representative 2-attribute variable product.
- Percentage of repeated products accelerated by repeat values/templates without correction.
- Mobile completion rate for simple products—not feature-count parity.
- Support burden per Pro batch/Agency store before expanding scope.
