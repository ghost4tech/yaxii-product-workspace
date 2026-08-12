# Feature inventory

## Classification

- **A — Functional:** works meaningfully in the frontend with current local state/services.
- **B — UI-complete but mocked:** interaction is designed, but business behavior/data is simulated.
- **C — Partial:** useful pieces exist, but the workflow is incomplete or unreliable.
- **D — Decorative/dead:** visible control or data does not perform the claimed action.
- **E — Concept only:** mentioned/locked but no real workflow is designed.

“Functional” below means frontend-local only unless explicitly stated. It does not imply WordPress/WooCommerce completion.

## Product entry and catalog

| Feature | Status | Evidence and boundary | Recommendation |
|---|---:|---|---|
| Simple product form | C | Name, price, category, images and extended fields exist, but an empty category store blocks save on a clean run. | Keep; make the v1 vertical slice complete. |
| Product name | A | Required Zod validation and draft persistence. | Free. |
| Regular/sale price | A | Inputs and sale dates work locally; no price-domain/currency validation. | Free; validate server-side. |
| SKU | A | Local field only; no uniqueness check. | Free. |
| Stock quantity | A | Local field and Woo payload mapping; product-level manage-stock policy is only a global default. | Free; expose clear stock semantics. |
| Short/long descriptions | A | Local plain textareas. | Free; add editor/sanitization policy later. |
| Product status/visibility/tax defaults | C | Browser-wide defaults map to the direct service, but are not visible per product. | Free per-product fields plus useful user defaults. |
| Categories | C | Search/recent UI is good, but list starts empty, refresh is not passed, and there is no creation/hierarchy rendering. | Free; paged server lookup and optional capability-gated create. |
| Tags | E | Absent. | Free v1. |
| Slug | E | Model/service reads no editable slug. | Free advanced field. |
| Featured/virtual/downloadable | E | Absent. | Virtual may be Free v1; downloadable/grouped/external can follow demand. |
| Shipping weight/dimensions/class | E | Absent. | Free v1 for physical products. |
| Tax class | E | Only tax status default exists. | Free advanced field. |
| Product attributes for simple products | E | Only the broken variable editor exists. | Free basic attributes. |
| Variable product toggle | C | Toggles UI and disables parent fields, but cannot add an attribute at runtime. | Free; core Woo capability must not be a paid lock. |
| Attribute option editor | C | Source contains name/options/price/SKU/stock/image UI; Add Attribute no-ops due form button behavior. | Rebuild and test. |
| Variation matrix/combinations | C | Service computes a Cartesian product, but UI models price on attribute options rather than explicit combinations. Multi-attribute prices become semantically wrong. | Pro productivity layer; basic variation creation remains Free. |
| Variation images | C | Option image UI exists in unreachable/broken workflow; object URLs are ephemeral. | Free basic, Pro bulk assignment. |
| Images/gallery | C | Select, preview, reorder and remove work; no size/type feedback, media library, alt text, upload progress, durable draft, or robust cleanup. | Free with WP media adapter. |
| Product save | C | Saves browser-local draft products; direct Woo create path is unsafe and unverified. | Free, server-owned. |
| Product edit | D | Menu only displays “Editing …” toast. | Free; mandatory before launch. |
| Product duplicate | C | Duplicates latest queue item via command/shortcut, not arbitrary selected row; drops images and schedule. | Free row action plus shortcut. |
| Product delete/undo | A | Immediate or confirmed local delete; single undo slot. | Free; distinguish local queue removal from trashing a Woo product. |
| Open in WooCommerce | C | Conditional external link derived from persisted store URL and Woo ID. | Keep only for validated same-site admin URL. |

## Queue, productivity and preferences

| Feature | Status | Evidence and boundary | Recommendation |
|---|---:|---|---|
| Queue with status display | A | Browser-local persisted list with random seeded products. | Keep; backend results must become authoritative. |
| Queue search/status filters | A | Name/SKU search and status counts work locally. | Free. |
| Queue pagination | C | “Load more” slices an already-loaded array; no server pagination. | Free UI backed by server pagination/virtualization. |
| Retry failed sync | C | Row action exists; when disconnected it changes status to pending without doing work. Direct retry can duplicate products. | Keep only after idempotent job semantics. |
| Empty/no-results states | A | Queue states are clear; other screens lack useful empties. | Keep and extend. |
| Draft autosave/recovery | C | Text/form state persists continuously; image `File`/blob URLs do not. | Free; browser draft with schema version/TTL and server conflict policy. |
| “Save draft” command | D | Only shows confirmation; the watched draft was already saved. | Rename to “Draft saved locally” state or remove redundant action. |
| Keep values after save | C | Retains some fields and clears others, but exact contract is implicit. | Free; high productivity value, make retained fields explicit. |
| Keyboard shortcuts | C | Most work; competing global listeners and inaccurate “every shortcut is live” claim. | Free; centralize and test. |
| Command menu | A | Navigation, theme/density, duplicate/clear and tier preview work locally. | Keep; remove production tier bypass. |
| KPI strip | C | Computed from mock/local queue; “success rate” denominator includes drafts/pending and may mislead. | Free only for truthful local queue status; defer business analytics. |
| Compact density | A | Persisted; materially affects queue row spacing but not every data surface. | Free. |
| Theme/accent/reduced motion | A | Document-root effects work. | Free, user-scoped. |
| Tabular numerals preference | D | Stored and displayed but never changes document behavior. | Remove control; make tabular numerals a design-system default where appropriate. |
| Sound on save preference | D | Stored but never read. | Remove unless validated user demand and accessible implementation. |
| Default landing tab | A | Redirects only on initial mount; can send Free users to a locked page. | Improve; user-scoped and entitlement-aware. |
| Sticky queue/KPI trends/hints/grouping/timestamps/row count | A/C | Most are consumed; rows are still client-side only. | Keep the high-value subset; simplify wording. |
| Product defaults | C | Persisted locally and consumed only by direct Woo create service. | Keep as per-user defaults after backend integration. |

## Premium/demo areas

| Feature | Status | Evidence and boundary | Recommendation |
|---|---:|---|---|
| Free 50-product monthly limit | B | Count is computed from local mock queue and easy to bypass. | Do not ship as currently designed; core local creation should remain excellent. |
| Free/Pro plan preview | A | Client toggle works and persists. | Development-only; remove from production bundles. |
| Upgrade modal | B | Polished comparison/price copy, but both CTAs locally unlock Pro. | Retain visual pattern only after commercial decisions and server entitlement. |
| License activation | B | Local regex and timeout accept fake keys; hardcoded renewal/seats. | Replace completely or omit until licensing exists. |
| Advanced analytics | B/D | Rich static dashboard; range is superficial and controls dead. | Future/Pro after event data exists; remove fake metrics now. |
| Multi-store table/switching | B | Local seed/store persistence; no credentials or real catalog separation. | Agency/Future. |
| Add/remove store | B | Adds a local offline row; promised credential step is missing. | Agency/Future with secure connector design. |
| Connection health/test | D | Static health and toast-only test. | Remove until measured. |
| Team list/roles/invite | B | UI-complete local demonstration with false email success. | Agency/Future, not Pro v1. |
| Role permission reference | E | Copy only; no enforcement/auth. | Future; derive from real capabilities. |
| CSV import/export | E/D | Locked concept in Free; Pro button only shows a demo toast. | Basic import/export is not a strong lock because Woo core includes it; Pro may add recipes/dry-run/resume. |
| AI descriptions | E/D | Locked concept; Pro action is a toast. | Future experiment, not v1. |
| Scheduled sync/auto-retry | E | Upgrade copy and fake analytics values only. | Future only after durable jobs/logging. |
| Unlimited products/stores/priority support | E | Commercial copy, no enforcement/service. | Product decision later; do not treat as implemented. |
| Activity history | E | `recentEvents` fixture exists but is unused. | Free recent write results; Pro/Agency extended audit retention later. |
| Templates/presets | E | Not present despite strong fit. | Pro v1 candidate after core CRUD. |
| Bulk actions | E | No selection/bulk editor; only CSV copy. | Pro after safe server batching. |
| Saved views/table columns | E | Not present. | Future based on catalog-management scope. |
| Multi-user collaboration | E | Team UI only; no realtime/conflict model. | Agency/Future. |
| Import/export logs | E | Not present. | Required before any paid import offering. |

## Functional-status totals

The exact total depends on whether each preference is counted separately, but the qualitative distribution is decisive: the app has a solid cluster of **A** frontend-local interaction primitives, a larger set of **C** core workflows, and nearly every “premium” capability is **B**, **D**, or **E**. Premium screen volume must not be mistaken for product maturity.

## Features not present

No product list/catalog browser, arbitrary product selection/edit lifecycle, templates, presets, tags, shipping fields, tax class, grouped/external/downloadable products, product-level visibility/status controls, bulk selection/editor, saved views, import mapping, export file generation, automation builder, AI provider, collaboration service, authentication, audit log, notifications service, multi-store data adapter, or real analytics pipeline exists.
