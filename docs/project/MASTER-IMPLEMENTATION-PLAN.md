# Yaxii Product Workspace — Master Implementation Plan

**Status:** Owner-approved master implementation plan

**Planning date:** 2026-08-12

**Immediate product target:** Yaxii Product Workspace Free v1

**Implementation status:** Product implementation not started; Phase 0 baseline established

This document converts the owner-level planning review into a repository-readable execution plan. It does not document shipped behavior and does not authorize a phase to begin without owner acceptance.

## Executive decision

Phase 0 establishes the outer repository as the canonical source without changing product behavior. The approved Lovable working tree is preserved under `apps/product-butler` as ordinary tracked files, including the intentional absence of four deleted files. Prototype provenance and execution state are recorded under `docs/project/`.

## Product authority

The engineering contract is defined by:

- [`CLAUDE.md`](../../CLAUDE.md)
- [`AGENTS.md`](../../AGENTS.md)

Product authority lives under `docs/product/`:

- [Product reference](../product/README.md)
- [Product strategy](../product/PRODUCT-STRATEGY.md)
- [Free v1 scope](../product/FREE-V1-SCOPE.md)
- [Feature tiers](../product/FEATURE-TIERS.md)
- [Roadmap](../product/ROADMAP.md)

These documents agree on the Free/Pro/Agency boundary. That boundary must not change during Free v1 implementation.

The owner-approved documentation structure is:

- `docs/product/` — product authority.
- `docs/project/` — plans, execution state, provenance, and checkpoints.
- `docs/architecture/` — implemented architecture and approved decisions.
- `docs/development/` — setup, build, and testing documentation.
- `docs/features/` — documentation for actually implemented features only.
- `docs/release/` — release evidence when release work begins.

## 1. Current repository state

### Outer repository

- `.git` exists.
- The current branch is `main`.
- `origin` is configured as `https://github.com/ghost4tech/yaxii-product-workspace.git`.
- The first commit is the Phase 0 canonical baseline.
- Project content, including `apps/product-butler`, is tracked by this repository as ordinary files.
- Baseline identity and closeout requirements are recorded in [Execution State](EXECUTION-STATE.md); the exact immutable SHA is reported after the single baseline commit is pushed.
- No production PHP plugin entrypoint exists.

### Flattened Lovable application

- Location: `apps/product-butler`
- Original branch: `main`, tracking its former `origin/main`.
- Original remote: `https://github.com/ghost4tech/product-butler.git`
- Source commit: `9626666001ef0b8713ae2aec632f78fd9301edec`
- The nested `.git` boundary is removed; no gitlink or submodule is used.
- The approved prototype intentionally excludes:
  - `.lovable/plan.md`
  - `public/favicon.ico`
  - `public/placeholder.svg`
  - `public/robots.txt`
- Do not restore these files unless a later owner decision changes the approved baseline.
- Exact pre-flatten and comparison evidence is in [Baseline Provenance](BASELINE-PROVENANCE.md).

The previous runtime audit targeted commit `199798e…`. Current HEAD is newer, so those screenshots and browser observations are historical evidence, not runtime acceptance for the current prototype.

### Application and dependency structure

The imported application is a standalone Lovable/Vite SPA using:

- React 18.3
- Vite 5
- TypeScript 5.8
- React Router
- Zustand persistence
- React Hook Form and Zod
- TanStack Query provider
- Tailwind and Radix/shadcn components
- Vitest and Testing Library
- Recharts
- Lovable development tagger

There is no WordPress bootstrap, plugin header, Composer project, PSR-4 source, PHP test suite, REST controller, WooCommerce application layer, CI configuration, PHPStan, PHPCS, PHPUnit, Playwright, or release packaging.

The WordPress project-triage detector therefore classifies the outer repository as `unknown`, not as a WordPress plugin.

### Dependency and build state

- `package.json` and `package-lock.json` are not synchronized; `npm ci` reports missing lockfile entries.
- Both `package-lock.json` and `bun.lockb` exist.
- npm is the owner-approved canonical package manager.
- `package-lock.json` is the authoritative dependency lockfile.
- Dual npm/Bun workflows must not be maintained.
- `bun.lockb` may remain in the Phase 0 preservation baseline; Phase 1 will decide and document its final disposition.
- No `packageManager` or Node engine is currently declared.
- `node_modules` and `dist` are ignored generated directories and are absent from the committed baseline.
- There is no explicit `typecheck` script.
- Strict TypeScript is disabled.
- A lockfile-only dependency audit on 2026-08-12 reported 21 advisories: 1 critical, 16 high, 3 moderate, and 1 low.
- Current local tools include Node 22.12, npm 11.15.0, Bun 1.3.11, PHP 8.4.3, Composer 2.8.5, and WP-CLI 2.12. These local versions do not automatically define the supported-product matrix.

### Current tests

Only one placeholder test exists. It asserts that `true` is `true`.

There are no meaningful domain, component, REST, WooCommerce, browser, accessibility, localization, or failure-path tests.

### Current real, partial, and false behavior

Useful frontend-local behavior exists for draft persistence, queue filtering, delete/undo, duplicate-last prefill, image previews, preferences, keyboard shortcuts, density, theme, and reduced motion.

Unsafe, mocked, partial, or false behavior includes:

- Woo consumer key and secret accepted in the browser.
- Credentials persisted in Zustand/localStorage.
- Direct browser calls to `/wc/v3`.
- Wildcard CORS guidance.
- Client-controlled Free/Pro entitlement.
- Fake license activation.
- An unauthorized 50-products-per-month Free limitation.
- Random seeded queue and statistics.
- Edit implemented as a toast only.
- Locally saved items presented as products.
- Retry that can repeat product creation.
- Variable creation that reuses one option's data across multi-attribute combinations.
- Variation failures logged and then reported as success.
- Fake Analytics, Stores, Team, CSV, AI, sync, invitation, and store-health behavior.

### File-size and architecture findings

Maintained or production-looking files over the 300-line limit include:

- `services/woocommerce.ts`: 497 lines
- `ProductQueue.tsx`: 400 lines
- `Settings.tsx`: 385 lines
- `Analytics.tsx`: 364 lines
- `WooCommerceSetup.tsx`: 324 lines
- `VariationsEditor.tsx`: 311 lines
- `index.css`: 332 lines

Some generated-style UI primitives also exceed 300 lines and may remain isolated if they are genuinely treated as vendor-like code rather than maintained application logic.

### CSS, theme, localization, and RTL

- Tailwind has no prefix.
- CSS applies globally to `*`, `html`, `body`, and `:root`.
- Theme effects mutate `document.documentElement`.
- Portals are not scoped to a plugin-owned theme/direction boundary.
- External Google Fonts are loaded from the standalone HTML.
- English text is hardcoded.
- The document declares `lang="en"`.
- Currency defaults to `$`.
- Date formatting is mostly fixed English.
- No translation catalog or WordPress i18n integration exists.
- Some logical-direction utilities are present, but many physical left/right assumptions remain.
- Forced-RTL screenshots do not prove translated production RTL behavior.

### Installed skills

`skills-lock.json` records the five required Guard Skills and seven WordPress skills. The repository tracks matching `.agents/skills` and `.claude/skills` content so a clean clone does not depend on local Windows junction metadata.

## 2. Phase 0 baseline decisions

1. **Single repository:** `apps/product-butler` is ordinary tracked source, not Git mode `160000` or an embedded repository.
2. **Approved deletion state:** `.lovable/plan.md`, `public/favicon.ico`, `public/placeholder.svg`, and `public/robots.txt` remain absent.
3. **Authority paths:** product authority is under `docs/product/`; `docs/features/` is reserved for truthful shipped-feature documentation.
4. **Portable skills:** clean-clone verification covers both project skill layouts and the lockfile.
5. **Canonical package workflow:** npm and `package-lock.json` are authoritative. `bun.lockb` is preserved without establishing a Bun workflow.
6. **Runtime evidence boundary:** the browser audit predates the approved source commit and remains historical evidence, not current runtime acceptance.

## 3. Phase summary

| Phase | Branch | Major milestone | Main deliverable | Acceptance gate |
|---|---|---|---|---|
| 0 | `main` | Restorable canonical baseline | Flattened prototype, authority, skills, provenance, and approved master plan | Fresh clone contains ordinary prototype files, matches approved source, and has a clean pushed `main` |
| 1 | `phase/01-production-frontend-boundary` | Production-safe React workspace running inside wp-admin with isolated assets and no real WooCommerce writes | Strict frontend architecture plus thin admin host and scoped assets | Clean npm install/build/type/lint/tests; locale-aware and RTL-safe shell; no fake or credential UI in production |
| 2 | `phase/02-simple-product-vertical-slice` | First real safe Woo product write | Authenticated REST foundation and idempotent `WC_Product_Simple` create | Authorized Draft/Published creation persists once with truthful operation results |
| 3 | `phase/03-free-simple-product-workflow` | Complete Free simple-product lifecycle | Full fields, search/read/edit/duplicate/trash, preferences, queue, and recovery | Observable create → edit → duplicate → reconcile/retry → trash workflow |
| 4 | `phase/04-free-variable-products` | Correct basic variable CRUD | Global/custom attributes and explicit variation combinations | Multi-attribute products round-trip with no hidden partial failure |
| 5 | `phase/05-free-release-hardening` | WordPress.org-quality Free release candidate | Tested, reviewed, and packaged exact release ZIP | Exact artifact passes supported-matrix, security, accessibility, RTL, packaging, and fresh-install gates |

## 4. Detailed Free phase plan

### Phase 0 — Repository baseline and prototype preservation

#### Goal

Establish a clean, immutable, remotely restorable baseline containing the approved prototype, authority, skills, audit material, and approved execution plan.

#### Scope

- Resolve both Git roots while preserving the approved current Lovable working tree.
- Record the nested source remote, commit SHA, branch, and approved deletion state.
- Flatten the approved prototype into the outer repository as ordinary files.
- Preserve deferred prototype screens and source.
- Normalize product authority under `docs/product/`.
- Update repository documentation links to the normalized `docs/product/` paths.
- Add the accepted master plan and a baseline/provenance record.
- Verify skill configuration portability.
- Record npm as the canonical package manager and `package-lock.json` as authoritative without refactoring the application.
- Preserve `bun.lockb` in the baseline if needed, without defining a Bun workflow.
- Create the first outer `main` commit and push it.

#### Explicit exclusions

- No frontend refactor.
- No dependency upgrade or automated audit fix.
- No PHP plugin implementation.
- No routing, UI, REST, WooCommerce, test, or feature behavior changes.
- No deletion of deferred prototype screens.
- No Phase 1 work mixed into the baseline commit.

#### Dependencies

- Owner approval of this master plan, including the current Lovable working tree and its four deletions.

#### Architecture work

None. This phase locks provenance and repository truth only.

#### Expected files/modules

Existing project content plus `docs/product/`, this master plan, baseline provenance/checkpoint documentation, and portable Git/project configuration.

#### Tests required

- Compare approved prototype file hashes before and after flattening, excluding `.git`.
- Verify no `160000` gitlink under `apps/product-butler`.
- Verify a fresh clone contains the complete prototype and skills.
- Attempt the canonical `npm ci`; preserve and record the imported lockfile mismatch rather than changing dependencies in Phase 0.
- Use a one-off `npm install --package-lock=false` diagnostic tree only to run the existing test, build, and lint scripts while proving the lockfile remains unchanged.
- Re-run project triage and record that WordPress plugin detection remains absent until Phase 1.

#### Guard passes

Run `docs-guard` for new or moved planning/provenance documents. Other Guards are not applicable unless their corresponding source type changes.

#### Documentation

No feature document is required because no product behavior ships. Add the approved master plan and repository baseline/provenance/checkpoint documents.

#### Acceptance criteria

- `origin/main` exists with an exact reported SHA.
- A fresh clone reproduces the approved source.
- `apps/product-butler` files are normal tracked files.
- The four approved deletions remain preserved and are documented in provenance.
- npm and `package-lock.json` are documented as canonical; no Bun workflow is introduced.
- Product authority is discoverable at its canonical path.
- Repository documentation links resolve after the authority files move.
- `git status` is clean.
- No production behavior changed.

#### Failure conditions

- The prototype is committed as a gitlink.
- Any file present in the approved current prototype is lost.
- Junction-based skills are broken after cloning.
- Implementation work is mixed into the baseline.
- The baseline exists only locally.
- Any of the four approved deleted files is restored without later evidence that the application requires it.
- A parallel Bun workflow is introduced.

### Phase 1 — Production frontend boundary

#### Goal

Run the production-safe React workspace inside wp-admin with isolated assets and no real WooCommerce writes yet.

#### Scope

- Add only the thin WordPress plugin/admin host required to mount and enqueue the frontend.
- Enable strict TypeScript and remove maintained-source `any`.
- Establish feature-oriented frontend modules.
- Split maintained oversized production components/services.
- Add a typed application-client/repository boundary with deterministic test fixtures.
- Remove direct Woo credentials, CORS guidance, client entitlement, seeded catalog truth, and fake success paths from the production graph.
- Hide Analytics, Stores, Team, License, AI, CSV, and other deferred routes from production navigation while preserving source.
- Use wp-admin-safe routing that does not hijack the browser path.
- Scope CSS, variables, portals, theme, density, motion, and direction to the plugin root.
- Establish translation, direction, number, date, currency, and unit primitives without translating the complete Lovable application.
- Enforce npm and `package-lock.json` as the canonical dependency workflow, decide and document the final disposition of `bun.lockb`, and remediate the current advisory set.

#### Explicit exclusions

- No REST product writes.
- No WooCommerce CRUD.
- No real product queue.
- No Pro entitlement or licensing.
- No full simple-product management.
- No variable-product implementation.

#### Dependencies

Accepted and merged Phase 0 baseline.

#### Architecture work

Frontend flow:

`React component → feature controller/hook → application client → repository interface`

This phase adds only a thin PHP admin mount/asset loader. Phase 2 owns the PHP application and WooCommerce boundaries.

#### Expected files/modules

Plugin entry/admin host, frontend app shell, feature folders for Entry/Queue/Preferences, API contracts, deterministic fixtures, i18n/formatting, and scoped styles.

#### Tests required

- Strict TypeScript, ESLint, Vitest, production build, and dependency audit.
- Unit tests for DTO mapping, formatting, direction, and draft serialization.
- Component tests for shell, hidden navigation, themes, dialogs, keyboard handling, and error placeholders.
- wp-admin runtime tests proving assets load only on the workspace screen.
- Representative EN/FR/AR content, RTL, dark/light/system, reduced-motion, 375/430/tablet/laptop structural checks.
- Keyboard, focus, dialog labeling, and automated accessibility checks.

#### Guard passes

Run `clean-code-guard`, `wp-guard`, `test-guard`, and `docs-guard`. `woo-guard` is not applicable because no WooCommerce CRUD is introduced.

#### Documentation

Add `docs/features/workspace-shell.md`, plus development-command and frontend-boundary architecture documentation.

#### Acceptance criteria

- The canonical `npm ci` clean-install command succeeds from `package-lock.json`.
- Strict typecheck, lint, meaningful tests, and production build pass.
- The workspace renders in wp-admin without changing the admin URL into an SPA route.
- No workspace CSS or theme mutation affects another wp-admin page.
- Production bundle/navigation contains no Woo secret fields, `/wc/v3` client, wildcard CORS advice, plan toggle, mock catalog, or fake deferred screen.
- Representative EN/FR/AR content renders with correct direction and portal behavior.
- Maintained production files stay at or below 300 lines.

#### Failure conditions

- The standalone SPA remains the production architecture.
- Browser secrets or client entitlement remain reachable.
- Fake functionality is merely relabeled.
- Global wp-admin styling remains.
- Strict/build/test gates fail.
- Current critical/high dependency findings remain unreviewed.

### Phase 2 — WordPress/WooCommerce foundation and real simple-product creation

#### Goal

Allow an authorized user to safely create one real WooCommerce simple product and receive a server-authoritative result.

#### Scope

- PSR-4 Composer foundation and small composition root.
- WooCommerce availability/compatibility handling.
- Same-installation current-store boundary with no browser consumer keys, direct `/wc/v3`, “Connect WooCommerce” requirement, or wildcard CORS.
- Runtime guards and a bounded admin unavailable state when WooCommerce is missing or inactive; no Woo-dependent fatal boot.
- REST namespace and controllers for bootstrap, bounded term lookup, simple-product create, and operation lookup.
- WordPress cookie authentication, REST nonce, capability checks, schemas, validation, sanitization, and typed errors.
- WordPress media-frame/core-media integration using attachment IDs.
- `WC_Product_Simple` creation through supported setters and CRUD.
- Server-side SKU uniqueness and referenced term/media validation.
- Durable idempotency and minimal operation persistence.
- Real queue result for the create operation.
- Draft/publish intent with publication capability enforcement.

#### Explicit exclusions

- Product edit, update, or trash.
- Full Free field set.
- Automated retry.
- Variable products.
- Advanced queue reporting.
- Pro or Agency modules.

#### Dependencies

Accepted Phase 1 frontend boundary and canonical commands.

#### Architecture work

Backend flow:

`REST controller → CreateProduct application service → WooCommerce mapper/factory → WC_Product_Simple`

The controller parses and shapes HTTP only. Application services own orchestration. WordPress and WooCommerce adapters own platform calls.

#### Expected files/modules

Plugin bootstrap/container, admin assets, REST controllers/resources, product-create service/validator/mapper, capability policy, idempotency/operation store, and matching frontend client/hooks.

#### Tests required

- PHP unit tests for validation, prices, status intent, idempotency conflicts, and result mapping.
- WooCommerce integration tests for real `WC_Product_Simple` persistence.
- REST tests for authentication, nonce, capabilities, schema, SKU/media/term failures, idempotency, and response shape.
- Frontend tests for request mapping, field errors, uncertain responses, and operation results.
- Authenticated browser tests for Draft and permitted Published creation with representative EN/FR/AR locale and direction coverage.
- Mobile, RTL, keyboard, and accessibility checks for the create path.
- Composer validation, PHP lint, PHPCS/WPCS, PHPStan, TypeScript, lint, tests, and build.

#### Guard passes

Run all five Guard Skills.

#### Documentation

Add `docs/features/simple-product-create.md` and `docs/features/operation-results.md`.

#### Acceptance criteria

- An authorized user creates a real Draft simple product visible in WooCommerce.
- A user with publish capability can publish; a user without it cannot.
- Repeating the same idempotency key and payload returns the original product/result.
- Reusing the key with a different payload returns a conflict.
- Invalid nonce/auth/capability requests fail without a write.
- Duplicate SKU and invalid term/media IDs return stable field-addressable errors.
- The UI does not show success until the server operation succeeds.
- No consumer key or secret exists in browser state or storage.

#### Failure conditions

- A retry can create a duplicate.
- A failed write appears successful.
- Controllers contain WooCommerce business logic.
- Capability or nonce enforcement is absent.
- Errors are unstructured strings only.
- Browser-local product state is treated as WooCommerce truth.

### Phase 3 — Complete Free simple-product workflow

#### Goal

Deliver the full launch-quality simple-product lifecycle and signature productivity workflow.

#### Scope

- Paged product search, compact list resources, and product detail.
- Version-aware update with conflict handling.
- Duplicate/prefill from any selected product.
- Trash with clear store-versus-queue semantics.
- All Free simple fields: name/slug, descriptions, status, visibility, pricing/schedule, inventory, backorders/sold-individually if retained, shipping, tax, categories, tags, and gallery.
- Per-user preferences/defaults.
- Save & Next, clear, autofocus, repeat selected values, duplicate previous, recent categories/terms, and command shortcuts.
- Versioned, bounded, TTL-based draft recovery without files, secrets, or catalog mirroring.
- Server-authoritative recent-operation queue with paging, search/filter, reconciliation, and manual safe retry.
- Translation-ready, locale-aware, RTL-safe workflows compatible with EN/FR/AR, plus mobile, accessibility, dark/system, density, and reduced motion.

#### Explicit exclusions

- Variable-product writes and attribute infrastructure.
- Pro templates.
- Advanced batching.
- AI, analytics, licensing, multi-store, and teams.
- Automatic background retry.

#### Dependencies

Accepted Phase 2 create slice and stable product/operation contracts.

#### Architecture work

Add product query/get/update/trash services, version preconditions, user-meta preference storage, operation reconciliation, and bounded React Query caching.

#### Expected files/modules

Product query/detail/update/trash, simple-product form sections, preferences, draft recovery, operation queue, and localization catalogs.

#### Tests required

- PHP unit tests for all field validation and update semantics.
- WooCommerce integration tests for complete simple-product round-trip.
- REST tests for pagination, object-level authorization, conflicts, duplicate prefill, trash, preference ownership, reconciliation, and retry.
- Frontend unit/component tests for every workflow and error state.
- Browser lifecycle tests covering create → edit → duplicate → retry/reconcile → trash.
- Representative large-catalog query evidence proving only bounded pages are loaded.
- Representative EN/FR/AR locale and RTL checks, plus 375/430/tablet/laptop, keyboard/touch, focus, accessibility, and theme checks.
- Full static/build/PHP quality suite.

#### Guard passes

Run all five Guard Skills.

#### Documentation

Add truthful feature documents for simple-product management, product fields, Save & Next, draft recovery, preferences, and the operation queue as behavior lands.

#### Acceptance criteria

- Every included field persists and returns canonically after reload.
- Edit detects stale versions instead of silently overwriting.
- Duplicate prefills without writing until the user submits.
- Trash changes the WooCommerce product state and is distinct from dismissing a queue row.
- Save & Next clears only documented fields and retains only selected repeat values.
- Timeout, session-expiry, and offline states remain visibly unresolved until reconciled.
- Product and term search use bounded server pagination and cancellation.
- Arabic has no blocking overflow, clipped actions, reversed semantics, or inaccessible portal.

#### Failure conditions

- Any required Free field is UI-only.
- Edit, trash, or retry remains toast-only.
- The queue derives success from optimistic local state.
- Draft recovery stores raw files or catalog data.
- Locale, translation, or RTL architecture is structurally incomplete.
- Mobile cannot complete simple-product entry.

### Phase 4 — Free basic variable products

#### Goal

Support correct native WooCommerce variable-product create/edit with explicit combinations.

#### Scope

- Global and custom attributes.
- Bounded attribute-term queries.
- Explicit normalized combination model.
- Basic variation enabled state, regular/sale price, SKU, stock, and image.
- Variable-product create/read/update through WooCommerce CRUD.
- Prevalidation for attributes, terms, combinations, SKU collisions, and maximum counts.
- One cohesive browser command, not one request per variation.
- Idempotent parent/variation mapping using stable client combination IDs.
- Per-combination result reporting and recovery after partial failure.
- Deliberate desktop and mobile workflows.

#### Explicit exclusions

- Spreadsheet-style advanced matrix.
- Bulk fill or rules.
- Mass image mapping.
- Advanced include/exclude logic.
- Very large synchronous combination sets.
- Templates, batches, AI, or Agency features.

#### Dependencies

Accepted complete simple-product workflow and operation infrastructure.

#### Architecture work

- Distinguish product attributes from concrete variation combinations.
- Validate the full plan before writes.
- Create/update `WC_Product_Variable` and `WC_Product_Variation` objects through supported APIs.
- Record parent and per-combination results because WooCommerce does not provide a simple cross-object transaction.
- Synchronize the parent through the supported WooCommerce lifecycle.

#### Expected files/modules

Attribute resources/adapters, combination validator, variable create/update services, WooCommerce mappers, variable editor, and partial-result UI.

#### Tests required

- PHP unit tests for Cartesian combination generation, duplicate selections, limits, SKU collision rules, and partial results.
- WooCommerce integration tests for one- and multi-attribute create/update/read.
- REST tests for malformed models, unknown terms, duplicate combinations, idempotent retry, limits, authorization, and partial failure.
- Frontend model/editor/component tests.
- Browser tests for one-by-many and multi-attribute products, mobile editor, RTL, media, errors, recovery, and edit round-trip.
- Performance evidence that the browser makes one cohesive variable operation and respects the synchronous cap.
- Full quality/static/build suite.

#### Guard passes

Run all five Guard Skills.

#### Documentation

Add truthful feature documents for variable products, attributes, and variation recovery.

#### Acceptance criteria

- A two-attribute product such as two colors × three sizes creates six distinct combinations.
- Each combination retains its own price, SKU, stock, enabled state, and image after reload.
- Global attribute IDs/term IDs and custom attribute text remain semantically distinct.
- Repeating an operation does not duplicate parent or variation objects.
- A simulated variation failure produces `partial`, identifies the exact combination, and offers safe reconciliation/retry.
- The UI rejects an excessive combination plan before any write.
- No per-variation browser request orchestration occurs.

#### Failure conditions

- Option-level data is copied across unrelated combinations.
- Parent success hides failed variations.
- Attributes are stored as arbitrary names when a selected global attribute was intended.
- SKU or combination collisions are silently changed.
- Mobile variable entry is unusable.
- Advanced Pro productivity leaks into Free.

### Phase 5 — Free release hardening

#### Goal

Produce an exact WordPress.org-quality Free release candidate that requires no Yaxii account, license, or external service.

#### Scope

- Supported WordPress/WooCommerce/PHP/Node compatibility matrix.
- Security, performance, dependency, accessibility, localization, RTL, privacy, and license reviews.
- Complete French/Arabic content and visual translation polishing, using Lovable where useful.
- PHPCS/WPCS, PHPStan, PHPUnit, REST, frontend, and browser suites.
- Plugin Check and WordPress.org guideline review.
- Activation, deactivation, migrations, uninstall, and retention behavior.
- Fresh-install and upgrade testing.
- Exact ZIP construction from a clean checkout.
- WordPress.org `readme.txt`, assets, licensing notices, and release documentation.
- Ensure deferred prototype source remains in the repository but is absent from production navigation and the release artifact where inappropriate.

#### Explicit exclusions

- New product features.
- Pro scaffolding beyond stable extension seams already justified.
- License activation.
- Telemetry or external calls without a separately approved privacy design.
- Production deployment or WordPress.org submission without owner authorization.

#### Dependencies

Accepted Phases 0 through 4.

#### Architecture work

Hardening only. Any large architectural rewrite indicates an earlier phase was not accepted correctly.

#### Expected files/modules

Release/build configuration, CI, compatibility metadata, uninstall/migration handling, WordPress.org readme/assets, test matrix, and packaging verification.

#### Tests required

- Entire automated suite.
- Supported WordPress/WooCommerce/PHP matrix.
- Fresh install, activation, deactivation, upgrade, uninstall, and WooCommerce-unavailable states.
- Plugin Check, PHPCS/WPCS, PHPStan, Composer checks, dependency/license review, and bundle analysis.
- Authentication, capability, nonce, idempotency, and write-safety regression suite.
- Performance measurements for assets, paged queries, searches, and variable operations.
- Automated and manual accessibility checks.
- EN/FR/AR native-language review, RTL, light/dark/system, and reduced motion.
- 375, 430, tablet, laptop, and large-desktop runtime tests.
- Exact ZIP install and checksum/content verification from a clean clone.

#### Guard passes

Run all five Guard Skills, plus `wp-performance` and `wp-plugin-directory-guidelines` as specialist release reviews.

#### Documentation

Finalize all feature documents and add installation, compatibility, privacy/data-retention, uninstall, troubleshooting, accessibility/localization, packaging, and release-evidence documentation.

#### Acceptance criteria

- The exact ZIP installs and activates without notices or fatals on every supported matrix target.
- No production route exposes fake Analytics, Stores, Team, License, AI, CSV, health, or plan-switching behavior.
- No Yaxii account, license, consumer key, or external API is needed.
- Assets load only on Yaxii screens.
- All required checks pass, or a narrowly documented non-runtime advisory exception is explicitly owner-accepted.
- No unreviewed critical/high dependency finding remains.
- WordPress.org compliance and bundled-license review pass.
- Arabic/RTL and mobile simple-entry have no blocking defect.
- The remote phase branch and exact commit SHA are reported.

#### Failure conditions

- The release can only be reproduced from a developer's existing environment.
- The ZIP differs from the tested artifact.
- A fake or deferred surface remains visible.
- A security, accessibility, RTL, dependency, or compliance blocker remains.
- Release behavior depends on Pro, an account, or an external service.
- Work exists only locally.

## 5. Phase dependencies

The Free phases are strictly sequential:

`Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5`

Each phase begins only after the prior phase branch has:

1. Been pushed.
2. Produced evidence and an exact SHA.
3. Received owner acceptance.
4. Been merged to `main`.
5. Had the remote `main` merge verified.

Commercial work begins only after Free validation:

- Phase 6: Pro foundation and templates.
- Phase 7: Pro advanced variation workspace.
- Phase 8: Pro batch engine.
- Phase 9: Pro AI only after provider, cost, privacy, multilingual quality, and review-flow approval.
- Phase 10: Agency discovery and threat-model gate.
- Phase 11: Agency platform only if Phase 10 validates it.

## 6. Git workflow

### Phase 0 baseline exception

Phase 0 uses `main`. `git init` is not required because the outer `.git` already exists.

Recommended baseline commit message:

`chore: establish approved project baseline`

Before staging, verify both Git roots and record that the current approved Lovable working tree intentionally excludes the four deleted files. Do not restore them or pause for another owner confirmation. Stage explicit paths only. Never use a broad add that could accidentally record a nested repository.

The baseline commit must never be rewritten or force-pushed.

### Implementation branches

- `phase/01-production-frontend-boundary`
- `phase/02-simple-product-vertical-slice`
- `phase/03-free-simple-product-workflow`
- `phase/04-free-variable-products`
- `phase/05-free-release-hardening`

### Starting a phase

1. Verify clean status and the canonical repository root.
2. Switch to `main`.
3. Pull and verify remote `main`.
4. Create the phase branch.
5. Push it before substantial implementation.
6. Record the starting SHA.

### Finishing a phase

1. Run authoritative static, automated, and runtime checks.
2. Inspect the complete branch diff.
3. Run applicable Guard Skills.
4. Fix actionable findings.
5. Update truthful feature documentation.
6. Run `docs-guard`.
7. Re-run affected checks.
8. Verify expected Git status.
9. Create scoped checkpoint commit or commits.
10. Push the branch.
11. Confirm the remote branch contains the reported SHA.
12. Stop for owner acceptance.

Do not automatically merge an implementation phase. After approval, merge to `main`, push, verify the remote merge SHA, and only then start the next fresh chat.

## 7. Fresh-chat and documentation strategy

Owner-approved persistent documentation structure:

- `docs/product/` — owner-approved product authority.
- `docs/project/` — master plan, baseline provenance, compatibility decisions, and accepted-phase status.
- `docs/architecture/` — implemented boundaries and contracts.
- `docs/development/` — canonical commands and local/CI setup.
- `docs/features/` — only implemented feature behavior.
- `docs/release/` — packaging and release evidence.

Each accepted phase should update `docs/project/EXECUTION-STATE.md` with:

- last accepted phase;
- merge SHA on `main`;
- supported commands and versions;
- relevant feature documents;
- unresolved risks and HOLDs;
- next authorized phase.

A fresh chat should need only the repository. It must not depend on hidden conversation state.

## 8. Guard strategy

- Phase 0: `docs-guard`; other Guards only if their source type changes.
- Phase 1: `clean-code-guard`, `wp-guard`, `test-guard`, and `docs-guard`.
- Phases 2 through 5: all five Guard Skills.
- Phase 5 additionally uses `wp-performance` and `wp-plugin-directory-guidelines`.

Guards run after the first complete diff and relevant tests. Actionable findings are fixed, and affected checks are rerun. Guards are quality gates, not substitutes for tests.

## 9. Highest engineering risks

1. Accidental gitlink or source loss during nested-repository flattening — Phase 0.
2. Browser credentials, direct `/wc/v3`, and wildcard CORS — remove in Phase 1.
3. Client-controlled entitlement and fake commercial limits — remove from Free production in Phase 1.
4. Duplicate creates and uncertain retries — durable idempotency in Phase 2.
5. Hidden partial variation failures — explicit operation/item results in Phase 4.
6. Browser catalog/localStorage treated as truth — server resources and bounded draft-only persistence in Phases 2 and 3.
7. Incorrect variable model — explicit combination schema and WooCommerce round-trip tests in Phase 4.
8. Oversized, non-strict frontend — Phase 1.
9. Global CSS and document-root mutation — Phase 1.
10. Weak localization, RTL, mobile, and accessibility — primitives in Phase 1, structural workflow acceptance in Phase 3, and complete content/visual polishing plus final audit in Phase 5.
11. Dependency and build reproducibility — canonicalize in Phase 1 and re-audit in Phase 5.
12. Minimal test coverage — meaningful tests begin in Phase 1 and expand with every vertical slice.
13. Fake screens being mistaken for product behavior — hide in Phase 1 and exclude from the release artifact in Phase 5.
14. Unbounded searches, catalog state, and bundle size — bounded server queries, cancellation, route exclusion/lazy loading, and measured budgets.

## 10. Explicitly outside Free v1

The following stay out of Free production:

- Analytics dashboards and vanity metrics.
- Multi-store and cross-store workflows.
- Team invitations, seats, custom roles, and agency identity.
- License activation, fake plans, client-side entitlement, or monthly creation caps.
- AI text, translation, category, or image generation.
- General automation and scheduled sync.
- Store health, latency, connection, or fake retry metrics.
- Generic CSV importer clone.
- Advanced batch create/update.
- Templates and presets.
- Advanced variation matrix, bulk fill, SKU rules, and mass image mapping.
- Durable Pro job engine.
- Agency fleet jobs, approvals, centralized audit history, or credential storage.
- Arbitrary custom-meta and third-party product-type support.
- Public SaaS API or remote-image importer.

Deferred Lovable source remains preserved but hidden from the Free production experience.

## 11. Roadmap adjustments

No additional phase is needed, and no paid capability should move into Free.

Three refinements are required:

1. **Move the thin wp-admin host into Phase 1.** Otherwise Phase 1 cannot truthfully satisfy its “renders in wp-admin with isolated assets” gate. Phase 2 still owns the real PHP application, REST, operation, and WooCommerce foundations.
2. **Resolve dependencies in Phase 1, not only Phase 5.** npm and `package-lock.json` are canonical. Phase 1 must enforce that workflow, decide the final disposition of the preserved `bun.lockb`, and remediate the current advisory state. Phase 5 re-audits rather than discovering the problem late.
3. **Start PHPStan and PHPCS when PHP arrives in Phase 2.** Phase 5 runs the complete release audit but should not be the first time maintained PHP receives static analysis.

The Phase 6 through 11 commercial roadmap otherwise remains unchanged.

## 12. Phase 0 closeout boundary

Phase 0 ends after the canonical baseline is committed to `main`, pushed to `origin`, and verified remotely.
Do not create the Phase 1 branch or begin product implementation until the owner accepts the Phase 0 result.
