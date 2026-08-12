# Yaxii Product Workspace — Roadmap

**Status:** Product authority

## Principle

Build the smallest complete Free product first. Do not mix Pro/Agency implementation into Free work unless the shared architecture is genuinely required now.

## Phase 0 — Baseline and prototype preservation

- Preserve latest approved Lovable source.
- Initialize/push clean Git baseline.
- Install project skills.
- Add `CLAUDE.md`, `AGENTS.md`, and this product reference set.
- Keep deferred prototype files; do not expose fake production behavior.

**Gate:** clean baseline commit exists and is restorable.

## Phase 1 — Production frontend boundary

- Strict TypeScript.
- Feature-oriented structure.
- Split oversized maintained files.
- Remove browser credential architecture.
- Add API/repository boundary.
- Scope CSS to plugin root.
- Make routing wp-admin safe.
- Add i18n/formatting/direction primitives.
- Use representative EN/FR/AR content to prove locale and RTL structure; do not translate the complete Lovable application in this phase.
- Keep deterministic mocks for tests/reference.
- Hide fake production navigation.

**Gate:** isolated workspace renders in wp-admin with clean build/type/lint/test gates.

## Phase 2 — WordPress/Woo foundation + simple create

- PHP bootstrap/container.
- Admin page/assets.
- `/bootstrap`.
- REST auth/nonce/capabilities.
- Taxonomy lookup.
- Media integration.
- `POST /products`.
- `WC_Product_Simple`.
- Typed errors/results.
- Idempotency.
- Real queue result.

**Gate:** authorized user creates real Draft/Published simple products safely.

## Phase 3 — Complete Free simple-product workflow

- Product search/read.
- Edit/update.
- Duplicate/prefill.
- Trash.
- Full Free fields.
- Preferences backend.
- Save & Next.
- Repeat values.
- Draft recovery.
- Operation queue/reconcile/retry.
- Mobile fixes.
- Accessibility.
- Locale-aware, translation-ready, RTL-safe workflows compatible with EN/FR/AR.

**Gate:** create → edit → duplicate → retry/reconcile → trash works reliably.

## Phase 4 — Basic variable products — Free

- Correct attribute model.
- Global/custom attributes.
- Terms.
- Explicit combinations.
- Basic combination price/SKU/stock/image.
- Variable create/update backend.
- Combination/SKU validation.
- Safe limits.
- Partial-result/recovery.
- Deliberate mobile workflow.

**Gate:** multi-attribute products round-trip correctly with no hidden partial failure.

## Phase 5 — Free release hardening

- Security/performance reviews.
- Dependency remediation.
- WPCS/PHPCS/PHPStan.
- PHPUnit/REST/frontend/browser tests.
- Plugin Check.
- Accessibility.
- Translation/RTL review.
- Complete French/Arabic content and visual translation polishing for the release, using Lovable where useful.
- Privacy/uninstall behavior.
- Fresh-install/upgrade testing.
- Exact release ZIP verification.
- WordPress.org assets/readme.
- Hide unimplemented Pro/Agency surfaces.

**Gate:** release works without Yaxii account/license/external API.

# Commercial roadmap after Free validation

## Phase 6 — Pro foundation + Templates

- Clean Free/Pro module boundary.
- Server-authoritative entitlement.
- Named templates/presets.
- Selective fields and preview.
- Versioning/compatibility.

**Validation:** repeated demand to save/reuse product structures.

## Phase 7 — Pro advanced variations

- Advanced matrix.
- Bulk price/stock/sale/image.
- SKU rules/collision preview.
- Include/exclude combinations.
- Search/filter/selection.
- Virtualization/limits.

**Validation:** measurable time saving and willingness to pay from variation-heavy users.

## Phase 8 — Pro batch engine

- Batch planning/mapping.
- Dry run/sample diff.
- Durable chunked jobs.
- Resume/cancel boundaries.
- Per-item results.
- Failure export.
- Saved recipes.
- Minimal truthful operational reporting.

**Validation:** repeated demand beyond Woo core import workflows.

## Phase 9 — Pro AI Product Assistant

Potential:

- descriptions;
- short descriptions;
- copy improvement;
- translation;
- feature extraction;
- tags/categories;
- SEO assistance;
- later image generation/enhancement.

Before build: define provider/cost, privacy disclosure, limits, review flow, multilingual quality, and entitlement policy.

## Phase 10 — Agency discovery gate

Research:

- store counts;
- cross-store workflows;
- roles/approvals;
- authorization/credential threat model;
- SaaS vs local connector;
- support burden;
- pricing.

Do not turn current mock Stores/Team screens into production before this gate.

## Phase 11 — Agency platform, only if validated

Potential:

- secure store portfolio;
- cross-store templates;
- product replication/migration;
- client approvals;
- scoped roles;
- fleet jobs;
- status/failure triage;
- durable audit history;
- compatibility monitoring.

# Validation after Free launch

Track useful signals:

- active installs;
- first product creation completion;
- repeat usage;
- products created;
- simple vs variable usage;
- Save & Next usage;
- repeat-values usage;
- error/retry rate;
- measured time/click improvement;
- reviews/support themes;
- demand for templates;
- demand for advanced variations;
- demand for batch workflows;
- agency/multi-store demand;
- Yaxii.dev referrals and opt-in leads.

Do not build Pro based on downloads alone.

## Long-term model

**Free maximizes distribution and Yaxii awareness.**

**Pro monetizes serious productivity.**

**Agency monetizes organizational complexity.**
