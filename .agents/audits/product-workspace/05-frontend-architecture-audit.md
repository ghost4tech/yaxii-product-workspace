# Frontend architecture audit

## Summary

**Recommendation: do not integrate a backend into the current component/state/service structure unchanged.** The project is a useful UI prototype with a coherent component library and several focused components, but the operational core is coupled to persisted mock state and a browser-direct Woo service. Use it as a selective frontend foundation after a boundary refactor.

Code-reviewed scope: all application routes, stores, product types, Woo service, entry/queue/image/variation components, shell/overlays, design CSS/config, build/test/lint configuration, and active UI primitives. Generated shadcn primitives were inventoried rather than line-reviewed as bespoke business logic.

## Technology inventory

| Area | Current implementation | Audit |
|---|---|---|
| Framework/build | Vite 5 + React 18.3 + SWC | Suitable for a compiled wp-admin SPA; remove Lovable dev tagger from release config. |
| Language | TypeScript 5, `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, JS allowed | Fails future standard despite a passing non-strict no-emit run. |
| Routing | React Router 6 `BrowserRouter` | Fine standalone; needs WordPress-safe base/hash/memory decision. |
| State | Four Zustand stores, three persisted | Overuses browser persistence as database/entitlement/credential truth. |
| Forms | React Hook Form + inline Zod | Strong base; schemas belong in feature/domain modules and need server-error mapping. |
| Query/data | TanStack Query provider only | No queries/mutations use it; remove until adapter integration or adopt it deliberately. |
| UI | shadcn-style Radix primitives + CVA | Good accessibility baseline; 27 of 48 UI TSX primitives are unused. |
| Styling | Tailwind 3 + CSS custom-property tokens | Strong visual base; global layers must be scoped for wp-admin. |
| Icons | Lucide | Appropriate and consistent. |
| Theme | Custom `PreferencesEffects`; `next-themes` also installed | Token-based and visually good, but duplicate ownership. |
| Charts | Recharts 2 | Works in dark mode; large cost for a wholly mocked/deferred screen. |
| Tests | Vitest/jsdom + Testing Library declarations | One 7-line placeholder test; no behavior coverage. |
| Mocks | Inline seeds + `mockData.ts` + local component arrays | Not behind interfaces; random dates/counts undermine deterministic QA. |
| Auth | None | Release blocker. |
| Localization | None | Release blocker for worldwide/Arabic goal. |

## Critical findings

### 1. Browser-direct credentials and Woo writes

`services/woocommerce.ts` builds Basic Auth from consumer key/secret and calls remote Woo and WordPress endpoints from the browser (`services/woocommerce.ts:35`, `:50`, `:110`, `:175`, `:250`). `productStore` persists `wooConfig`, including the secret, in `woo-product-store` (`productStore.ts:103`). The UI recommends wildcard CORS headers (`WooCommerceSetup.tsx:268`).

Impact: credential disclosure to any same-origin script/XSS/browser extension, insecure persistence, CORS fragility, no WordPress user/capability semantics, and a fundamentally wrong same-site plugin boundary.

Disposition: delete this production path. Components call a same-origin plugin client; PHP uses Woo CRUD under the current WP user. Agency remote connections need a separately designed credential/authorization boundary.

### 2. State layers represent incompatible stores as one truth

- `storesStore` has three persisted fake stores and an active store.
- `productStore` has one unrelated persisted `wooConfig`, one category list, one queue and one draft.
- Switching the active store does not scope queue/categories/config/product defaults.
- `tierStore` treats a browser value as entitlement.

Impact: cross-store data leakage/misrouting is inevitable if a backend is attached naively.

Disposition: introduce explicit `StoreContext`/site identity in DTOs and query keys. In local wp-admin v1 there is exactly one current store; omit multi-store state entirely.

### 3. Write semantics are not trustworthy

- `createProduct` returns `success: true` with an `error` when variation creation fails (`services/woocommerce.ts:371`).
- `createProductVariationsFromOptions` logs individual failures but always returns success (`:402-452`).
- Manual retry performs another create, not an idempotent retry/update (`Entry.tsx:228`).
- Local queue insertion happens before remote create, with no rollback/reconciliation.
- No abort signal, request ID, timeout, conflict version or partial-result type exists.

Disposition: model application operations explicitly and make server results authoritative.

### 4. Variable domain model is wrong for multi-attribute products

`ProductVariation` is actually an attribute definition, and each attribute option owns price/SKU/stock/image. The Cartesian combination generator takes only `current[0].optionData` for every combination (`services/woocommerce.ts:214-247`). A Size×Color product therefore cannot express a distinct price/SKU per concrete Size+Color combination.

Disposition: separate `ProductAttribute`/terms from `VariationCombination`; combinations own price/SKU/stock/image and reference chosen attribute values.

### 5. Fake success is embedded in presentation code

Team, store test, CSV, AI, licensing and parts of queue editing/retry show success with no operation. This is an LLM-prototype failure mode: UI completion is mistaken for domain completion.

Disposition: every mutation must return a typed result from a service. Demonstration fixtures stay in explicit dev adapters and display a “Demo data” badge.

## Important findings

### Oversized files and mixed responsibilities

Production/application files over the requested 300-line limit:

| File | Lines | Mixed responsibilities |
|---|---:|---|
| `src/services/woocommerce.ts` | 497 | auth/URLs, connection, pagination, media, product mapping, combination generation, writes, legacy API |
| `src/components/ProductEntryForm.tsx` | 486 | schema, form lifecycle, draft persistence, keyboard listener, sections, dates, images, variations |
| `src/components/ProductQueue.tsx` | 394 | query/filter, grouping/paging, rendering, status model, delete dialog, row actions |
| `src/pages/Settings.tsx` | 378 | four settings domains and layout primitives |
| `src/pages/Analytics.tsx` | 364 | all report sections/charts/tables |
| `src/components/WooCommerceSetup.tsx` | 324 | credential form, API orchestration, CORS guidance, connected state |
| `src/components/VariationsEditor.tsx` | 311 | attribute and option state, images, pricing, layout |

Generated `ui/sidebar.tsx` is 637 lines and unused; `ui/chart.tsx` is 303 and unused.

### Non-strict and unsafe TypeScript

- Root and app configs disable strict/null/implicit-any checks and allow JS.
- Three explicit `any` uses appear in variation combination types.
- Type assertions (`as never`, schema/form casts) hide domain mismatches.
- Date/File/object-URL values are persisted through JSON without a versioned serializer.

The no-emit check passes only under this permissive configuration.

### State and effects

- `ProductEntryForm` mirrors RHF state into local component state and Zustand on every watched change, then uses revision counters and disabled dependency linting to resynchronize external drafts.
- Multiple document-level keyboard listeners compete (`App`, form, queue).
- Store getters compute time-sensitive values from persisted Date strings with implicit reconstruction.
- All queue products are stored/persisted indefinitely in the browser.
- `Math.random()` and `Date.now()` at module/runtime load make analytics and queue fixtures nondeterministic.

### UI/dependency residue

- 48 shadcn UI TSX files exist; only 21 are imported outside the UI folder.
- Dead active-source candidates: custom `components/NavLink.tsx`, unused `App.css`, unused `recentEvents`, legacy `createProductVariations`, and UI scaffolding pulled only by other unused files.
- Both Radix toast and Sonner toaster are mounted.
- TanStack Query provider has no consumers.
- `next-themes` is present while custom code owns theme state.
- Large Radix/dependency set reflects generator scaffolding rather than demonstrated need.
- Vite emitted a >500 KB chunk warning; route-level lazy loading is absent.

### Build/tooling health

- `npm ci`: failed due manifest/lock disagreement (Testing Library packages missing from lock).
- `npm run build`: passed; ~1.146 MB minified JS / 328 KB gzip; 3,405 modules; chunk warning.
- `npx tsc -p tsconfig.app.json --noEmit`: passed under non-strict config.
- `npm run lint`: failed with 6 errors and 7 warnings: empty interfaces, 3 `any`, CommonJS `require` in Tailwind config, and Fast Refresh warnings.
- `npm run test`: one placeholder test passed; no application behavior was exercised.
- `npm audit`: 21 installed-tree advisories on audit date, including current direct/transitive build/runtime packages. Upgrade/remediation must be assessed before release; no automated fix was applied.

## Nits

- Product title metadata retains Lovable author/social image and should not ship.
- Encoding appeared correct in the browser, but PowerShell source display exposed mojibake under the local decoding path; establish UTF-8 tooling and test translated assets.
- Hardcoded `$` and English dates conflict with Woo store settings.
- Several router destinations use plain anchors.
- `compact` queue mode hides price but does not simplify status/actions for touch.
- Comments describe “auto-save” and “every shortcut live” more strongly than behavior supports.

## What is good

- CSS variables and semantic Tailwind tokens form a coherent design system.
- RHF + Zod is a sound form stack.
- Several components are sensibly focused: `CategorySelect`, `PreferencesEffects`, `ProLock`, `CommandMenu`, `StatsBar`.
- Zustand is acceptable for ephemeral UI/draft coordination when not used as the server database.
- The form/queue visual split and preference-driven workflow show real product thinking.
- Dark rendering, keyboard discovery and reduced-motion concepts are stronger than typical prototypes.
- No direct DOM innerHTML or obvious presentation-layer injection was found in the reviewed application code.

## Current data flow

```text
Component
  → direct Zustand read/write
  → persisted localStorage blobs
  → sometimes direct service fetch with consumer secret
  → remote Woo/WP endpoints

Mock screens
  → imported arrays / component-local seed
  → local mutation or toast
```

This is not a service/repository boundary. Mocks are mixed into production routes and stores.

## Target frontend flow

```text
Presentation component
  → feature hook / form controller
  → application client (use case)
  → repository interface
  → WordPress REST adapter
  → typed Result / DTO mapper
  → query cache + small ephemeral UI store
```

Example:

```text
ProductEntryForm
  → useCreateProduct()
  → ProductClient.create(command, idempotencyKey)
  → ProductRepository (interface)
  → WordPressProductRepository
  → POST plugin REST endpoint
  → ProductResource mapped to Product model
```

TanStack Query can own server state, cache keys, cancellation and invalidation. Zustand should be limited to unsaved draft/UI preferences/selection/overlay state. Never mirror the entire server catalog into Zustand.

## What can be kept

- Visual primitives and token names after scoping/accessibility review.
- `ProductEntryForm` field composition as a design reference, not its state/effect implementation.
- `CategorySelect` interaction, backed by paged remote lookup.
- `ImageUpload` gallery interaction, backed by WordPress media models and accessible reorder controls.
- Queue status/filter/empty-state design, backed by operation/job results.
- Preferences effects and command-menu concepts after centralization.
- `ProLock` visual pattern only; entitlement comes from bootstrap/server.
- Mock arrays as deterministic story/test fixtures behind `Mock*Repository` interfaces.

## What must be redesigned

- `woocommerce.ts` → remove; replace with same-origin adapters and DTO mappers.
- `productStore` → split draft UI state from server query state; never persist credentials/catalog.
- `storesStore` → omit from local v1; later Agency feature package.
- `tierStore` → read-only entitlement state from signed/authenticated bootstrap plus server enforcement.
- `ProductEntryForm` → feature folder with schema, sections, controller and draft adapter.
- `VariationsEditor` → separate attributes, terms, combinations, matrix and validation.
- `ProductQueue` → separate query controls, virtual/paged list, row actions and operation result model.
- Analytics/Stores/Team/License → dev fixtures or deferred feature packages, not production routes with fake success.

## Proposed feature-oriented structure

```text
src/
  app/
    App.tsx
    router.tsx
    bootstrap.ts
    providers.tsx
  shared/
    api/httpClient.ts
    api/result.ts
    i18n/
    formatting/
    ui/
    hooks/
  features/
    products/
      api/productDtos.ts
      api/productRepository.ts
      api/wordpressProductRepository.ts
      model/product.ts
      model/productSchema.ts
      hooks/useCreateProduct.ts
      hooks/useProduct.ts
      components/ProductEntryForm.tsx
      components/sections/
    variations/
      model/
      components/AttributeEditor.tsx
      components/VariationMatrix.tsx
    taxonomies/
    media/
    queue/
    preferences/
    templates/          # later Pro
    imports/            # later Pro
  dev-fixtures/         # excluded/disabled in production
```

Target 80–180 lines for most files; hard review gate at 300 production lines. Generated primitives can be exceptions only when vendor-like and isolated.

## WordPress admin isolation

- Render one plugin-owned root, e.g. `<div id="yaxii-product-workspace-root" class="yaxii-product-workspace">`.
- Enqueue versioned JS/CSS only on the plugin's own screen hook; never globally.
- Scope Tailwind preflight/base and component CSS beneath the root. Do not apply `body` or global `*` rules across wp-admin.
- Use a root-owned portal container or scoped portal class so dialogs/toasts retain theme/direction and do not inherit hostile admin styles.
- Bootstrap immutable data before render: REST URL/root, `wp_rest` nonce, current user summary/capabilities, locale/direction, currency/price format, weight/dimension units, timezone, Woo version/status, feature flags/entitlements and asset version.
- Same-origin requests send `X-WP-Nonce`; the PHP endpoint still checks capabilities. WordPress documents cookie authentication plus REST nonce for logged-in in-site requests ([authentication handbook](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)).
- Use WordPress/Woo media frame where practical or a same-origin upload endpoint requiring `upload_files`; no remote consumer keys.
- Self-host or use system fonts; remove Google Fonts from wp-admin.
- Treat WordPress notices/admin bar viewport as real layout inputs. Test with common admin color schemes and RTL admin enabled.
- Do not expose or require global CSS overrides, and do not modify unrelated admin screens.

## Testing target

- Unit: schemas, DTO mapping, price/stock/date normalization, variation combination rules, reducers/state machines.
- Component: every field section, server-error mapping, keyboard focus, mobile action reachability, RTL direction.
- Contract: frontend DTO fixtures against PHP REST resources.
- REST/PHP integration: capability matrix, nonce/auth failures, idempotency, partial variation failure, media/taxonomy permissions.
- Browser: create/edit/duplicate/retry at required breakpoints in EN/FR/AR, light/dark, keyboard/touch, no fake success.
- Build gates: reproducible `npm ci`, strict `tsc`, zero lint errors, meaningful tests, bundle budget, dependency advisory review.

## Self-check coverage

- Reviewed changed/generated production code: no production code was changed; audit is read-only.
- SOLID/DRY/KISS/YAGNI: assessed at state, service, component and dependency boundaries.
- Security: direct credentials, entitlement trust, authorization boundary and write semantics reviewed.
- LLM failure modes: fake success, decorative completeness, random fixtures, overbuilt premium screens and false abstraction identified.
- Remaining uncertainty: no live Woo/WordPress runtime or authenticated server path exists to validate; this is explicitly outside current evidence.
