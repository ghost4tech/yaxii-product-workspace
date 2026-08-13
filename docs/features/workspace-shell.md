# Workspace Shell

**Status:** Phase 2 implementation complete; owner visual acceptance pending

## Purpose and workflow

The production wp-admin screen presents the approved Lovable product-entry workspace. An authorized
user can create a real simple WooCommerce product while retaining the approved Entry, Extended,
Focus Mode, queue, responsive, theme, density, dialog, and keyboard experience.

## Observable behavior

- Entry retains the Lovable toolbar, KPI strip, product form, sticky queue, mobile queue sheet, and
  Focus Mode behavior.
- Settings retains the Lovable Appearance, Workspace, Entry & queue, and Product defaults panels.
- Light/dark/system theme, comfortable/compact density, accents, reduced motion, and local
  preferences are scoped to this workspace.
- Deferred Free/Pro navigation and actions remain absent from production.
- Simple-product Save & next uses a real server operation. Queue success comes only from the
  canonical operation response.
- Variable-product create and queue edit/retry/delete server operations remain unavailable and do
  not report fake server success.

## Backend and persistence

The WordPress page supplies host configuration and the frontend loads the current bootstrap through
`WorkspaceClient` and `WordPressWorkspaceRepository`. The same-origin repository creates products,
reconciles operations, and loads bounded categories. Workspace preferences use versioned local
storage; the current draft and product defaults use versioned session storage. The queue represents
results for the current browser session and is not a browser catalog mirror.

## Security and capabilities

The admin screen and every REST route are capability-gated by WordPress. Product writes also require
cookie authentication, `X-WP-Nonce`, server validation, and a UUID idempotency key. Publish requires
`publish_products`. The production bundle has no Woo consumer-key form, direct `/wc/v3` client, or
wildcard CORS guidance.

## Error and recovery behavior

Missing host configuration, missing frontend assets, and inactive WooCommerce render bounded
unavailable states. Failed product creates preserve the draft and show field/form errors. Unknown
outcomes preserve both the draft and idempotency identity for reconciliation. Queue edit/retry paths
remain bounded unavailable actions.

## Limitations

Phase 2 creates only simple products. It does not persist variation data, sale schedules, pending
review status, or local browser files. Media selection uses existing WordPress attachment IDs;
category lookup is bounded. Complete UI translation and final Arabic visual polishing remain later
work.

## Evidence

See [Simple Product Create](simple-product-create.md), [Product Operation Results](operation-results.md),
and [Development Tooling](../development/TOOLING.md). The Phase 1 parity acceptance remains recorded
in [Phase 1 Recovery](../project/PHASE-1-RECOVERY.md); Phase 2 browser parity is still owner-pending.
