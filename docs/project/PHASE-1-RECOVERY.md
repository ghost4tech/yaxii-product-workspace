# Phase 1 Lovable UI Recovery

**Recovery base:** `5f54942dc37a916ec518bd1a2326d801dcc22b81`

**Recovery branch:** `recovery/phase-01-lovable-ui`

**Acceptance:** ACCEPTED — owner-verified on the active LocalWP production page

**Owner-accepted implementation SHA:** `3e6550e10dba1000476f30f9812945f68f6b4a6b`

## Git decision

The rejected Phase 1 branch added a parallel production presentation across two large UI commits.
Reverting or selectively rewriting that presentation would leave an opaque history and a high risk
of retaining replacement UI. The recovery branch was therefore created from the exact clean Phase 0
baseline and pushed before implementation. The rejected branch is unchanged and must not be merged.

## Source-level regression inventory

Comparison of Phase 0 with rejected Phase 1 found these presentation regressions:

| Approved Lovable surface | Rejected Phase 1 regression |
|---|---|
| Global workspace shell | Replaced by new `ypw-*` markup and a separate visual system. |
| Header and navigation | Brand block, store/plan area, navigation geometry, search treatment, status, and responsive behavior were replaced. |
| Entry layout | Toolbar, KPI strip, panel hierarchy, expanded layout, and sticky/two-column behavior were replaced. |
| Product form | The complete Lovable form and field grouping were replaced by a smaller tabbed form. |
| Simple/variable states | Product-type control, images, variations, validation, price/stock behavior, and extended controls were absent or different. |
| Focus Mode | Lovable navigation/KPI/queue behavior and toolbar interaction were replaced by a different header-level mode. |
| Queue | Search, status filters, grouping, row states/actions, empty state, mobile sheet, undo, pagination, and footer treatment were replaced by a minimal operation card. |
| Preferences | The four Lovable settings panels, accents, workflow preferences, defaults, and reset controls were replaced by four generic cards. |
| Commands and shortcuts | Radix/cmdk interactions, action grouping, keyboard labels, focus behavior, and dialog styling were replaced. |
| Dialogs and overlays | Lovable Radix primitives and their motion/focus patterns were replaced by a custom dialog frame/toast implementation. |
| Responsive/mobile | Existing Lovable breakpoint behavior and the mobile queue sheet were replaced by a different responsive composition. |
| Typography and tokens | Approved Tailwind/Radix tokens and typography were replaced by custom production CSS. |
| Dark/density/motion | Existing preference effects and component states were replaced by a second preference system. |
| Interaction details | Hover/focus states, menu actions, transitions, validation feedback, draft affordances, and visual hierarchy diverged with the replacement components. |

This inventory is complete at the source/component level. The automated browser matrix below could
not run; the remaining visual gate was instead closed by explicit owner verification on the active
LocalWP production page.

## Recovery implementation

Production now imports the actual Lovable `App`, `AppShell`, `Entry`, form, queue, Settings, command
menu, shortcuts, Radix primitives, and original styling. Oversized maintained files were split by
extracting their existing markup and behavior into focused files, without introducing a parallel
screen implementation.

The WordPress-specific work is underneath or around that presentation: validated host bootstrap,
MemoryRouter, adapter boundary, plugin-root CSS, local fonts, scoped portals, safe storage, strict
TypeScript, build tooling, tests, and the thin admin mount.

## Intentional UI and behavior differences

| Difference from Phase 0 | Reason |
|---|---|
| Only Entry and Settings are navigable. | Analytics, Stores, Team, License, and commercial routes are deferred from Free. Source remains preserved. |
| Store connector, store picker, plan toggle, CSV, and AI actions are hidden. | They were unsafe, fake, or deferred. Their source remains quarantined outside the production graph. |
| Header status is `Offline`; toolbar says `Browser draft · no store writes`. | No WooCommerce write/read service exists in Phase 1. |
| The invented 50-product monthly meter is absent. | There is no approved Free limit or server authority for that claim. |
| Seeded products, fake stats, and fake queue results are absent. | Empty/no-operation states are truthful. |
| Save & next is disabled; Ctrl/Cmd+Enter saves the local draft. | Store mutation begins only after the Phase 2 server boundary exists. |
| Legacy credential/catalog stores are never read by production. | Keeps old prototype secrets and mock catalog state outside the production architecture. |
| Browser URL does not change with internal navigation. | `MemoryRouter` keeps wp-admin routing authoritative. |
| Fonts are bundled locally and all styles/portals/preferences are plugin-scoped. | Prevents remote-font dependence and wp-admin leakage. |
| Labels/dialog descriptions and inert variation buttons received accessibility fixes. | Corrects defects without changing the visual design. |
| Limited unavailable-state copy exists in EN/FR/AR. | Establishes translation/RTL infrastructure without redesigning or claiming complete translation. |

## Automated and server-host parity evidence

The component suite exercises the actual Lovable tree, including main form draft state, Focus Mode,
the mobile queue dialog interaction, empty queue, Settings, dark mode, compact density, command
dialog portal ownership, deferred-navigation absence, disabled writes, and RTL root attributes.

The build boundary confirms that generated assets contain no direct Woo credential client, `/wc/v3`,
wildcard CORS advice, old credential stores, deferred CSV/AI action labels, remote fonts, or unscoped
root selectors.

A disposable WordPress/PHP 8.3 runtime confirmed the admin page, app/portal mounts, HTTP 200 module
and CSS assets, correct WooCommerce-inactive fallback/bootstrap, and no assets on Dashboard.

## Required browser parity matrix

| Gate | Phase 0 vs WordPress production |
|---|---|
| Desktop | NOT RUN — browser backend unavailable |
| Laptop | NOT RUN — browser backend unavailable |
| Tablet | NOT RUN — browser backend unavailable |
| 430 px | NOT RUN — browser backend unavailable |
| 375 px | NOT RUN — browser backend unavailable |
| Light mode | NOT RUN — browser backend unavailable |
| Dark mode | NOT RUN — browser backend unavailable |
| Focus Mode | NOT RUN — browser backend unavailable |
| Comfortable/compact | NOT RUN — browser backend unavailable |
| Main form states | NOT RUN — browser backend unavailable |
| Queue states/sheet | NOT RUN — browser backend unavailable |
| Dialogs | NOT RUN — browser backend unavailable |
| Preferences | NOT RUN — browser backend unavailable |

The in-app browser controller reported `No browser is available` and listed no browser backends. No
CLI browser substitute was used because it would not validate the required signed-in/in-app runtime
surface. The automated matrix therefore remains accurately recorded as not run.

On 2026-08-12, the owner manually verified the refreshed production page on the active LocalWP site,
confirmed that the restored Lovable application was showing, and confirmed that the rejected
replacement UI was no longer being served. The owner visually accepted the restored Lovable UI.
This explicit owner verification closes the remaining Phase 1 parity gate without claiming that
browser automation ran.

## Phase boundary

No REST route, WooCommerce CRUD operation, idempotency store, media integration, or other Phase 2
work is present.
