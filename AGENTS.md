# AGENTS.md — Yaxii Product Workspace Engineering Contract
## Mission
Build **Yaxii Product Workspace** as a premium-quality WooCommerce product-entry workspace.

The current product target is the **Free MVP**: a fast, safe, polished way for merchants and agencies to create and manage WooCommerce products. The Free codebase must be clean enough for a future Pro edition to extend it without rewriting or contaminating the core.

The product should feel premium because the workflow is excellent, not because the repository contains unnecessary systems.

## Scope rules
- Work on the Free MVP unless a task explicitly says otherwise.
- Do not implement future Pro or Agency features speculatively.
- Existing Lovable prototype files/screens must not be deleted without explicit owner approval.
- Deferred or non-Free prototype features may be hidden from production navigation while their source remains preserved.
- Do not treat mock UI, toasts, fake analytics, fake licensing, or local fixtures as implemented product behavior.
- Preserve good existing UX unless the requested task requires changing it.

## Required task routine
Before editing:
1. Inspect `git status`, current branch, relevant source, tests, and docs.
2. Understand the existing behavior before changing architecture.
3. Read/use applicable installed WordPress Agent Skills.
4. Define the smallest coherent implementation slice.
5. Avoid unrelated cleanup or later-phase work.

After editing:
1. Review the actual diff.
2. Run relevant automated and runtime checks.
3. Run the applicable Guard Skills.
4. Fix findings.
5. Update truthful feature documentation.
6. Re-run affected checks.
7. Report results and unresolved risks.

## Architecture
### WordPress / PHP
Use a modular monolith with clear boundaries.

Preferred flow:
`REST controller -> application service -> WordPress/WooCommerce adapter/API`

Rules:
- PSR-4 autoloading.
- Constructor dependency injection.
- Keep HTTP parsing/response shaping out of business logic.
- Use WooCommerce CRUD objects and supported APIs for products and variations.
- Prefer WordPress/WooCommerce core APIs over custom SQL, direct product meta manipulation, or duplicated platform behavior.
- Add repositories/interfaces only when they represent a real persistence/query boundary or materially improve testability.
- Do not build microservices or generic framework layers for this MVP.

### React / TypeScript

Preferred flow:

`Component -> feature hook/controller -> application client -> repository/API adapter -> WordPress REST`

Rules:

- React 18 and strict TypeScript.
- No `any` in maintained application code.
- Use feature-oriented modules.
- React Query owns server state/cache where applicable.
- React Hook Form/Zod are appropriate for form state and client validation.
- Global state is only for suitable ephemeral UI, preferences, selections, or bounded draft state.
- Never mirror the WooCommerce catalog into browser global state/localStorage.
- Components must not directly know WooCommerce REST credentials or backend implementation details.
- Business rules do not belong in giant JSX components.

### Same-site backend boundary

The local plugin architecture is:

`React -> same-origin Yaxii REST endpoint -> PHP application service -> WordPress/WooCommerce APIs`

Never use:

`React -> WooCommerce consumer secret -> wc/v3`

No WooCommerce consumer keys, license secrets, or other sensitive credentials may be stored in browser state or localStorage.

## Free / Pro separation

Free owns the core domain and must work independently.

Future paid capabilities should be optional modules such as templates/presets, advanced variation productivity, safe batch operations, AI services, and later Agency functionality.

Rules:

- Do not scatter client-side `isPro` conditionals through core business logic.
- UI visibility is not entitlement enforcement.
- Paid endpoints/features must eventually be enforced server-side.
- Core product CRUD, security, capabilities, and ordinary recovery are never premium-only infrastructure.
- Free must remain stable when Pro is absent or disabled.

## Code quality

Hard rules for maintained production source:

- Maximum **300 lines per file**.
- Target roughly **80–180 lines** for most maintained files.
- Split responsibilities before a file becomes large.
- Functions should normally remain small and cohesive; extract complex logic instead of nesting deeply.
- One clear responsibility per component/class/service.
- No god objects, giant hooks, or giant page components.
- No duplicated business logic.
- No fake abstractions or wrapper layers that add no value.
- No broad catch-and-return-success behavior.
- No fake success states.
- No dead new buttons or knowingly non-functional production controls.
- No speculative infrastructure for unapproved features.
- No dependency addition when native/existing capabilities solve the problem adequately.
- Keep comments for non-obvious decisions; do not narrate obvious code.

Generated/vendor-like files may exceed 300 lines only when isolated and not maintained as application logic.

Apply SOLID, DRY, KISS, and YAGNI pragmatically. **MVP simplicity beats architectural theatre.**

## WordPress and WooCommerce standards

Follow applicable installed WordPress Agent Skills and current official WordPress/WooCommerce practices.

At minimum:

- capability checks for every privileged operation;
- nonce/authentication for same-origin REST requests;
- server-side validation regardless of client validation;
- sanitize input at the correct boundary;
- escape output for its context;
- translation-ready user-facing strings;
- prepared/parameterized database access when direct queries are unavoidable;
- WooCommerce CRUD before direct product/order meta access;
- bounded queries and pagination;
- truthful compatibility declarations;
- WordPress Plugin Directory compliance for the Free release.

Do not bypass native security or lifecycle APIs merely because a direct implementation is shorter.

## Write safety

Product create/update operations must be designed to avoid duplicate or silent partial writes.

Where applicable:

- use idempotency keys/operation identity;
- validate referenced media/taxonomy/product data before writes;
- check SKU uniqueness server-side;
- keep product publication state separate from operation status;
- report partial variation failures explicitly;
- never retry a non-idempotent create blindly;
- return structured, stable errors the frontend can map to fields/actions.

A successful-looking UI is not proof of a successful WooCommerce write.

## Performance

- Enqueue plugin assets only on Yaxii Product Workspace screens.
- Do not globally override wp-admin CSS.
- Never load the entire product catalog to power a list or search.
- Use server-side pagination/filtering and bounded page sizes.
- Debounce/cancel superseded search requests where useful.
- Avoid one browser request per variation.
- Keep browser persistence bounded, versioned, and free of secrets.
- Lazy-load heavy/deferred screens when it materially improves the core bundle.
- Avoid optimization complexity until there is a measured need.

## UI, accessibility, i18n, and RTL

Preserve the premium modern workspace direction from the approved Lovable prototype.

New UI must support:

- light/dark/system themes where the product exposes them;
- compact/comfortable density where relevant;
- keyboard and touch use;
- accessible labels, focus states, dialogs, and error feedback;
- responsive simple-product entry;
- English, French, and Arabic architecture;
- RTL without duplicated layouts.

For new styling, prefer logical direction utilities/properties such as `start/end`, `ms/me`, and `ps/pe` rather than introducing new physical `left/right`, `ml/mr`, or `pl/pr` assumptions.

Scope application styles beneath the plugin-owned root and ensure portals/toasts/dialogs retain theme and direction without leaking styles into wp-admin.

## Testing

A feature is complete only when its important behavior and failure modes have credible evidence.

Use the relevant layers for the change:

- PHP unit tests for isolated validators/value logic;
- WordPress/WooCommerce integration tests for platform behavior;
- REST tests for authentication, capabilities, schemas, idempotency, and resources;
- TypeScript unit tests for mapping/domain logic;
- React component tests for interaction/error states;
- browser/runtime tests for critical user workflows, responsiveness, RTL, dark mode, and integration;
- regression tests for bugs that reached meaningful environments.

For write operations, cover relevant cases such as success, validation failure, unauthorized access, duplicate/idempotent request, platform failure, partial failure, and reconciliation/retry behavior.

Do not create tests that only assert mocks, implementation details, or meaningless coverage.

## Mandatory guard review

Use these installed guards after relevant changes:

- `clean-code-guard` — maintained production code.
- `wp-guard` — WordPress code.
- `woo-guard` — WooCommerce code.
- `test-guard` — tests.
- `docs-guard` — documentation.

Treat them as second-pass quality gates. Fix actionable findings before declaring completion unless the remaining debt is explicitly reported and accepted.

## WordPress Agent Skills

Use the installed skill that matches the task instead of guessing conventions. Expected project-relevant skills include:

- `wp-project-triage`
- `wp-plugin-development`
- `wp-rest-api`
- `wp-performance`
- `wp-phpstan`
- `wp-playground`
- `wp-plugin-directory-guidelines`

Do not invoke unrelated skills merely because they are installed.

## Documentation

Every meaningful shipped feature should have accurate documentation under `docs/` (for example `docs/features/<feature>.md`) once the documentation structure exists.

Feature docs should capture only implemented behavior:

- purpose and user workflow;
- important UI behavior;
- backend/API flow;
- data/persistence involved;
- WordPress/WooCommerce integration;
- capabilities/security rules;
- error/recovery behavior;
- important limitations;
- tests/evidence covering it;
- Free/Pro status when relevant.

Documentation should be reusable later for public docs, onboarding, support, changelogs, and release notes.

Never document planned or mocked behavior as shipped behavior. Run `docs-guard` on documentation changes.

## Git workflow

Repository remote:

`https://github.com/ghost4tech/yaxii-product-workspace.git`

If this imported local project is not yet initialized:

1. initialize Git with `main`;
2. add the remote as `origin`;
3. verify the baseline files before committing;
4. create and push a clean baseline commit on `main`;
5. create a dedicated task/feature branch before feature implementation.

After baseline:

- do not implement features directly on `main`;
- do not force-push unless explicitly instructed;
- do not delete or reset unrelated owner work;
- inspect `git status` before and after work;
- keep commits scoped and descriptive;
- use tested checkpoint commits for substantial implementation phases;
- merge only after review/acceptance.

## Repository commands

Do not invent canonical commands that the repository does not yet define.

During the foundation/setup task, discover and establish the real install, lint, typecheck, test, build, PHP quality, and packaging commands. Once stable, document those commands here so future agents do not need to rediscover them.

## Definition of done

A task is not done because code was written or a build happened to pass.

Before completion:

- requested behavior is implemented without unapproved scope growth;
- relevant tests/static checks pass, or failures are explicitly reported;
- relevant guard skills have been run;
- docs match behavior where the change requires documentation;
- no fake success/dead control was introduced;
- no unrelated owner work was lost;
- the final report states what changed, evidence run, remaining risks, branch, and commit state.

Priority order:

**correct -> secure -> tested -> maintainable -> performant -> extensible**
