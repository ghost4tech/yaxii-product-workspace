# Pre-Translation Workspace Polish

**Status:** Implemented and runtime-tested on the Phase 4.5 line

## Workspace refinement

The Product Workspace wp-admin screen now owns the available content surface while preserving the
approved Lovable V2 composition. A page-specific body class and stylesheet remove the WordPress
content gutter, wrapper margin, footer, and excess bottom spacing only for this plugin screen. The
normal WordPress admin bar and sidebar continue to determine the available viewport, including the
core collapsed-sidebar behavior.

The Entry toolbar retains Find product, Extended, and Focus. Density remains available in Settings
and the command menu, but no longer occupies the Entry toolbar or panel heading. Branding now reads **Yaxii Product
Workspace** with **Create products faster.** A compact icon button in the header opens the existing
**Keyboard shortcuts** dialog directly, successful queue rows are presented as **Published**, and
current-store save feedback avoids remote-sync copy.
Internal operation state keys remain unchanged.

Queue status filters remain a single horizontal row. The native overflow area hides its visual
scrollbar, keeps touch scrolling, supports mouse and pen drag with grab feedback, and handles
Arrow Left, Arrow Right, Home, and End when keyboard-focused. A subtle edge mask appears only when
the row overflows. Pointer capture starts only after a six-pixel drag threshold, so ordinary clicks
and small movements activate filters. Independent logical start/end fades show only where more
content exists and mirror under RTL.

Initial bootstrap uses a centered Product Workspace loading surface rather than a notice panel.
The operation queue renders row-shaped skeletons until its first bounded page resolves, so the
empty state never appears before the actual queue response. Redundant column labels and footer
hints are omitted, while bounded pagination remains available when more history exists.

## Operational pulse

`GET /yaxii-product-workspace/v1/operations/summary` returns a per-site, per-user summary from the
existing operation ledger. The query is bounded by the ledger's `user_updated` index and covers two
adjacent rolling UTC windows:

- current: `[request time - 7 days, request time)`;
- comparison: `[request time - 14 days, request time - 7 days)`;
- graph: seven 24-hour buckets for the current window.

The four existing Lovable KPI cards use these definitions:

- **Recent operations:** every ledger operation updated in the current window, including rows later
  dismissed from the visible queue;
- **Published:** operations whose result is `succeeded` and whose saved product status is `publish`;
- **Success rate:** `succeeded / (succeeded + failed + partial)`; processing and uncertain states
  are excluded because they are not final outcomes;
- **Needs attention:** undismissed failed, partial, or uncertain operations.

Count trends are the current total minus the comparison total. Success-rate trend is the percentage
point difference. Trends remain neutral when the comparison period has no relevant history. Each
sparkline uses the same current-window buckets; no client fixtures, random values, time-saved
claims, revenue claims, or analytics service are involved.

## CSS isolation and ecosystem

Form resets for text and numeric inputs, selects, buttons, switches, tabs, segmented controls,
TipTap, dropdowns, dialogs, the command menu, category tree, and variation controls remain scoped
to the plugin root or its owned portal boundary. The admin-shell stylesheet is enqueued only for
the Product Workspace hook. A root-scoped `:focus-visible` reset replaces WordPress admin blue
shadows with the Product Workspace ring without disabling keyboard focus. No generic WordPress
`.button` styling is used by the application. Search fields and TipTap description canvases use a
quieter focused background without an extra border or ring; other interactive controls retain the
full workspace focus treatment.

Settings contains a compact **Explore the Yaxii ecosystem** section listing Yaxii Smart Form, Yaxii
COD Theme, and Yaxii Shipping Manager. Its bundled Yaxii Dev SVG, restrained accent surface, and
product tiles separate discovery from normal setting rows without turning Settings into a
marketplace. Rendering the section performs no external request. The only external action is the
deliberate **Explore all Yaxii products** link to `https://yaxii.dev/`, opened with `noreferrer`.

Find Product accepts the canonical simple/variable discriminated union returned by the same-origin
product collection route. The WooCommerce gateway maps each supported product through its matching
mapper and excludes private products, whose status is outside the editor contract. Strict frontend
validation remains in place, pagination stays bounded, superseded searches remain cancelable, and
selecting a result loads the existing edit workflow.

Variation image controls disable repeat activation and expose a spinner overlay plus `aria-busy`
while WordPress media work is pending. A successful upload resolves to the durable attachment;
errors remain visible and retryable. Image removal is revealed on hover for fine pointers, remains
keyboard-focusable, and stays visible on touch/coarse-pointer devices.

## Security, limits, and evidence

The summary route requires authentication and the existing product-management capability. It
accepts no user-controlled query range. Existing create, edit, retry, reconciliation, queue,
preference, and WooCommerce write behavior is unchanged.

Automated coverage includes UTC window boundaries, real database aggregation, dismissed attention
semantics, authentication/capability failures, frontend contract parsing, KPI calculations,
neutral-history behavior, production boundary scanning, and all existing product workflows.
Authenticated LocalWP QA covered 1440, 1280, 768, 430, and 375 pixels, light and dark appearance,
Focus Mode, category/variation/editor controls, queue pointer and keyboard scrolling, Settings,
footer and shell isolation, console errors, network failures, and an unrelated wp-admin page.
The final acceptance pass additionally covered strict mixed-product search/open/edit, queue pill
clicks and logical LTR/RTL fades, scoped keyboard focus, variation-image pending/success/failure,
hover/focus/touch removal access, and the ecosystem section at desktop and 430 pixels.

Translation and Phase 5 release hardening are intentionally outside this checkpoint.
