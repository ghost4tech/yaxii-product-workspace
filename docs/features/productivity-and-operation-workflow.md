# Productivity and Operation Workflow

**Status:** Implemented and runtime-tested in Phase 3

## Save & Next

Save & Next uses the canonical server product to prepare the next entry. Name, SKU, slug,
descriptions, media, sale dates, tags, and product status reset to their configured defaults. Only
the merchant's configured repeat fields are retained; current choices cover categories, prices,
inventory, shipping values, tax values, and catalog visibility. Entering a stock quantity activates
stock management so the saved quantity can be repeated truthfully. The next name field receives
focus when autofocus is enabled.

An uncertain response does not clear the draft or create identity. It is reconciled through the
operation resource; a create is never blindly repeated.

## Duplicate drafts

A merchant can prefill a new draft from the previous saved product or a selected existing simple
product. The draft contains no source product ID, SKU, or slug and defaults to Draft status. No
WooCommerce write occurs until Save & Next is explicitly submitted.

## WordPress-side preferences

Useful workflow defaults are stored per WordPress user in `ypw_workspace_preferences_v1`:

- autofocus and repeat fields;
- default product status and catalog visibility;
- manage-stock, stock status, backorder, and sold-individually defaults;
- tax defaults;
- queue grouping, page size, relative timestamps, and dismissal confirmation.

Unsupported keys and invalid values are rejected server-side. Theme, density, accent, Focus Mode,
and other device presentation preferences remain bounded browser-local settings.

## Draft recovery

The live draft uses `sessionStorage` key `ypw.product-draft.v2`. Its envelope is versioned, expires
after seven days, and is capped at 300 KB. It retains at most 20 existing WordPress media
references. It never stores raw `File` objects, blob URLs, credentials, variations, catalog data,
or queue history. Corrupt, expired, unavailable, or over-quota storage fails open to the live
in-memory form without claiming recovery succeeded.

## Server-authoritative operation queue

The queue reads the durable per-user operation ledger. Search, state filters, publish-status
filters, counts, and pagination are server-side; requests are bounded to at most 50 rows and
terminal history is capped at 200 rows per user. Processing and uncertain rows are not pruned.

Each row carries the normalized request, canonical result and product ID when available,
timestamps, structured errors, and server retry flags. Pending entries marked `can_reconcile`
offer a Reconcile action that checks server and WooCommerce state without issuing a product create.
Manual Retry is offered only for a stored
`ypw_product_write_failed` request. The server first checks the operation marker for an existing
product, revalidates the original request and current permissions, and atomically claims the retry.
A second retry after success returns HTTP 409 and cannot create another product.

Queue removal only sets a dismissal timestamp. The confirmation explicitly states that the
WooCommerce product is not trashed, and active operations cannot be dismissed.

## Evidence and limits

Unit and integration tests cover preferences, reset/repeat behavior, bounded draft recovery,
queue queries, cancellation, safe retry, reconciliation, dismissal, and authorization. Browser QA
verified consecutive Save & Next entries, retained/reset values, a 711-byte credential-free draft
recovery envelope, safe manual retry with exactly one product, second-retry rejection, uncertain
operation reconciliation, and queue dismissal distinct from trash.

This ledger is the Free simple-product operation history, not a batch system or future paid job
engine. Batch operations, scheduling, AI, templates, and variable products remain excluded.
