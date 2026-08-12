# Free, Pro and Agency feature map

## Product decision principles

1. Free must complete ordinary WooCommerce product creation; a lock cannot substitute for an incomplete core.
2. Monetize repetition, batch safety, advanced variation productivity and multi-site coordination.
3. A paid screen needs an enforceable backend capability and real data before it is advertised.
4. Existing WordPress security/capabilities are never premium.
5. “AI,” “analytics” and “automation” are not value by themselves; they must reduce a measured workflow cost.

## KEEP

- Minimal SaaS workspace shell and restrained visual language.
- Entry-first product positioning.
- Essentials vs Extended progressive disclosure.
- Desktop form + queue pairing and constrained large-screen width.
- Simple mobile stacking.
- Queue statuses, search, filters, empty states and undo pattern.
- Draft recovery, autofocus, repeat values, duplicate-last concept.
- Command menu and keyboard shortcut discoverability.
- Dark mode, compact density, reduced-motion and semantic color tokens.
- Recent category concept and image gallery ordering/main-image concept.
- Premium lock visual treatment for genuinely paid modules.

## IMPROVE

- Product entry: add complete essential Woo fields, server errors, safe default status and taxonomy onboarding.
- Edit/duplicate: real selected-product lifecycle and clear “prefill copy” semantics.
- Queue: operation-backed statuses, idempotent retry, server paging, touch-visible actions.
- Images: WP media library/upload, alt text, accessible reorder, durable draft representation.
- Variables: rebuild attributes/combinations/matrix; retain compact visual style.
- Mobile: redesign Settings/tables/navigation and define reduced mobile variation/bulk workflows.
- Preferences: retain high-value workflow choices, remove micro/dead controls, persist per WP user.
- Theme: keep tokens, scope under plugin root, consolidate theme/toast systems.
- Analytics: if built later, derive only from real events and let range/filter/export truly work.
- Premium: replace client gates with server entitlements; remove unverified price/limit/support promises.
- Internationalization: message catalogs, Intl formatting, WP locale/direction, logical CSS, EN/FR/AR tests.

## REMOVE

- Direct browser Woo API consumer-key form and wildcard CORS instructions.
- Persisted `wooConfig` secrets.
- Header/shortcut/command Free–Pro bypass in production.
- Fake license regex, renewal date, seat count and plan facts.
- Fake invite/resend/role persistence success.
- Fake store health/test/latency and “all systems normal.”
- Toast-only CSV/AI actions and dead analytics controls.
- Hardcoded “time saved,” revenue, auto-retry and throughput claims without event sources.
- Tabular numerals preference (make semantic numeric typography a default).
- Sound-on-save preference until user demand/accessibility rationale exists.
- Remote Google Fonts in wp-admin.
- Unused Lovable/shadcn starter residue and duplicate toasters/providers.
- The current option-centric multi-attribute pricing algorithm.

## FREE

### Product creation/editing

- Create and edit simple products.
- Create basic variable products with global or custom attributes and concrete combinations.
- Name, slug (optional/auto), description, short description.
- Draft/publish intent subject to capability; catalog visibility.
- Regular/sale price and schedule.
- SKU with uniqueness feedback.
- Manage stock, quantity/status; basic backorder/sold-individually if required by final field scope.
- Weight/dimensions/shipping class, tax status/class, physical/virtual flag.
- Categories, tags and basic attributes.
- Featured image/gallery and variation images through WP media.
- Duplicate/prefill and trash with clear semantics.

### Productivity/reliability

- Local versioned draft recovery.
- Autofocus, keyboard shortcuts/command menu, repeat selected fields after save.
- Recent terms, clear form, Save & next.
- Recent operation queue with search/status filters, truthful progress/errors, manual retry and undo where safe.
- Server-side product search/pagination for edit selection.
- Useful empty/loading/error/conflict states.

### Quality

- Light/dark/system, compact/comfortable, reduced motion.
- Responsive simple-entry flow.
- EN/FR/AR, production RTL, locale-aware currency/dates/units.
- Existing WordPress user/capability integration.
- Link/hand-off to WooCommerce's built-in CSV importer/exporter rather than pretending the capability does not exist.

Free should not have a prototype-derived 50-manual-products hard stop. If economics later require metering a cloud service, meter the cloud service—not local Woo CRUD.

## PRO

### Pro v1 candidates

- Named product templates/presets with selective fields and preview.
- Advanced variation matrix:
  - bulk fill/copy across/down;
  - SKU generation patterns with collision preview;
  - bulk stock/price/sale/image assignment;
  - combination inclusion/exclusion and validation summary.
- Safe batch create/update:
  - mapping/validation plan;
  - dry run/sample diff;
  - controlled chunks, progress, resume/cancel boundaries;
  - per-row logs and exportable failures.
- Saved import mapping recipes and supported extension-field adapters.

### Pro after reliability evidence

- Scheduled execution of saved local batches/templates.
- Real operational reports: job volume, duration, failure reasons and retry outcomes.
- Notifications for terminal job results.

Do not put generic AI or dashboard analytics into Pro v1 solely because the prototype has buttons/cards.

## AGENCY

- Secure portfolio of client stores with explicit connection lifecycle.
- Cross-store template packs and controlled replication/migration.
- Store-scoped catalog/job status and failure triage.
- Agency roles, client approvals and store-level permissions.
- Invitations/seat lifecycle backed by real identity and email.
- Durable activity/audit history with retention/export.
- Fleet scheduling and per-store results.
- Optional central licensing/billing and compatibility reporting.

Agency requires a separate threat model and support commitment. It must not be simulated by placing multiple URLs and consumer keys in localStorage.

## FUTURE

- AI-assisted descriptions with explicit provider/cost/locale/review flow.
- Advanced catalog/business analytics after trustworthy data/event requirements.
- Saved catalog views/column sets and large-catalog bulk editor.
- Remote image ingestion with SSRF-safe job execution.
- Team realtime collaboration/conflict handling.
- General cross-store synchronization policies.
- Extension-specific product types/downloads/subscriptions/bundles adapters.
- Public/cloud API only when customer workflows cannot be met locally.

## Do not build

- Generic visual automation builder.
- Vanity dashboards using inferred or static numbers.
- A clone of WooCommerce core CSV upload without safer differentiated workflow.
- Mobile parity for dense matrix/bulk desktop operations; provide a deliberate reduced workflow.
- Arbitrary custom-meta editor/import in v1.
- “Unlimited everything” plans before technical and support boundaries are measured.

## Decision table

| Capability | Free | Pro | Agency | Future/HOLD |
|---|:---:|:---:|:---:|:---:|
| Complete simple CRUD | ✓ | | | |
| Basic variable CRUD | ✓ | | | |
| Advanced variation matrix | Basic only | ✓ | ✓ | |
| Media/taxonomies/shipping/tax | ✓ | | | |
| Draft/queue/manual retry | ✓ | | | |
| Templates/presets | | ✓ | shared packs | |
| Batch plan/dry run/resume/logs | | ✓ | cross-store | |
| Basic Woo core CSV hand-off | ✓ | | | |
| Scheduled local jobs | | later | ✓ | until queue proven |
| Multi-store | | | ✓ | architecture HOLD |
| Team/client roles | WP caps only | | ✓ | architecture HOLD |
| Operational reports | basic status | later | ✓ | until events exist |
| AI copy | | | | ✓ experiment |
| General automation builder | | | | Do not build |

## Positioning

**Primary:** “Create WooCommerce products faster without losing control.”

**Differentiators:**

1. A keyboard-first Save & next workspace with a trustworthy operation queue.
2. The smooth transition from manual entry to reusable presets and an exceptional variation matrix.

This is more defensible than “AI product manager” or “analytics dashboard,” and it follows the strongest parts of the actual prototype.
