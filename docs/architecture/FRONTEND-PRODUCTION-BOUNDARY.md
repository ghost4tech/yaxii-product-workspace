# Frontend Production Boundary

**Status:** Phase 3 integrated and runtime-tested

## Presentation authority

The approved Lovable tree under `apps/product-butler/src` remains the production presentation.
Phase 3 extends its state and data boundaries without creating a second workspace shell, form,
queue, preferences screen, or visual token system.

The maintained flow is:

`Lovable component -> feature controller/hook -> WorkspaceClient -> WordPressWorkspaceRepository -> same-origin Yaxii REST`

React never calls `/wc/v3`, never receives WooCommerce consumer credentials, and never owns the
catalog. The PHP application boundary performs WordPress/WooCommerce authorization and persistence.

## Data ownership

- React Query owns bounded product, taxonomy, preference, and operation server state.
- Feature controllers own form mapping, edit versions, Save & Next, duplicate drafts, and conflict
  presentation without putting WooCommerce rules into JSX.
- `WordPressWorkspaceRepository` supplies the REST nonce, maps stable contracts, and passes an
  `AbortSignal` to superseded searches.
- WordPress user meta owns approved workflow defaults.
- `sessionStorage` owns one bounded, versioned, expiring product draft.

Product and taxonomy searches are paged and capped server-side. The finder requests 20 products per
page, and current term lookup requests use one bounded page of 20 matching terms. Neither search
results nor operation history are copied into browser persistence.

## Operations and error truth

Create requests use server operation identity. The queue reloads the durable ledger, reconciles
ambiguous writes, and offers manual retry only when the server explicitly marks the operation safe.
Update and trash carry the canonical product version; a 409 conflict preserves the local draft and
offers reload-latest behavior.

Network, validation, authorization, conflict, and uncertain states have distinct mappings. A
request is not shown as successful merely because the browser submitted it.

## Routing, style, and deferred source

Production navigation exposes the Free simple-product workflow and settings required by it.
Deferred Lovable screens remain in source but are absent from the production route graph. Variable
products, templates, batches, AI, analytics, stores, team, licensing, and Agency features are not
connected.

Styles remain scoped below the plugin root, including theme and direction state for portals and
dialogs. Logical direction properties support structural RTL without a duplicated layout.

## Browser persistence limits

The recoverable draft envelope is capped at 300 KB, expires after seven days, and keeps at most 20
existing media attachment references. It excludes raw files, blob URLs, credentials, catalog data,
operations, and variable-product structures. Presentation preferences remain local and bounded;
workflow defaults are validated and saved WordPress-side.
