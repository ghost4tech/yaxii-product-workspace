# Productivity and Operation Workflow

**Status:** Phase 3 Checkpoint B implemented; complete edit UX and browser acceptance pending

## Save & Next

The approved Lovable Save & Next control creates a product through the same-origin Yaxii endpoint
and uses the canonical server response as the source for the next draft. Product name, SKU,
descriptions, media, and sale dates reset. The currently wired repeat choices are category,
regular price, sale price, and stock quantity. Their values come from the saved product rather than
optimistic form state. The product-name input is focused after success. Additional approved repeat
choices become visible only when their corresponding Checkpoint C form fields are functional.

An uncertain response does not clear the draft or its idempotency identity. The client first asks
the operation resource to reconcile when the server marks reconciliation available. It never
blindly submits a new create request as a retry.

## WordPress-side preferences

Useful workflow defaults are stored per WordPress user in `ypw_workspace_preferences_v1`. The
allowlisted contract includes autofocus, repeat fields, default status and visibility, inventory,
backorders, sold-individually, tax defaults, queue grouping and page size, relative timestamps,
and queue-dismiss confirmation. Unsupported keys and invalid values are rejected server-side.

Theme, density, Focus Mode, and other device presentation preferences remain browser-local because
they do not define WooCommerce writes. The obsolete prototype variation preference is hidden from
Free production.

## Draft recovery

The current form draft uses session storage under `ypw.product-draft.v2`. Its envelope is schema
versioned, expires after seven days, and refuses payloads larger than 300 KB. It stores at most 20
existing WordPress media references. Raw `File` objects, blob URLs, credentials, variation data,
catalog data, and queue history are never persisted.

If storage is unavailable, corrupt, expired, or over quota, the live in-memory draft continues to
work and recovery remains best effort.

## Server-authoritative operation queue

The recent-product queue reads the durable operation ledger rather than a browser product array.
It provides server-side name/SKU search, state and publish-status filters, aggregate tab counts,
bounded pages of at most 50 rows, and a retained history capped at 200 terminal operations per
user. Processing and uncertain operations are not removed by retention pruning.

Each entry exposes the original normalized request, canonical product/result ID when available,
timestamps, errors, and explicit retry flags. Removing an entry only sets its operation dismissal
time; it does not trash the WooCommerce product. Active operations cannot be dismissed.

Manual retry is available only for a durable `ypw_product_write_failed` result with its original
request. The server checks for an existing product carrying the operation marker, revalidates the
stored request and current capabilities, then atomically claims the failed operation before one
write attempt. A completed or already-claimed operation returns a conflict instead of creating a
duplicate.

## Search and performance boundaries

Product, category, tag, shipping-class, and operation searches are server-side and paginated.
React supplies an `AbortSignal`; debounced category and queue searches cancel superseded requests.
The browser never mirrors the whole WooCommerce catalog. Only the current operation pages are held
in React Query, and no operation history is written to browser persistence.

## Evidence and remaining work

Unit tests cover preferences, complete create mapping, canonical Save & Next retention, retry
authorization, cancellation forwarding, and TTL/media draft recovery. LocalWP integration tests
cover persisted preferences, bounded/searchable queue results, aggregate filters, safe retry,
real product IDs, and queue dismissal without product trash.

Checkpoint C still must expose complete product search/open/edit/duplicate/trash in the Lovable
workspace and pass the authenticated browser, responsive, theme, Focus Mode, error, RTL, and data
verification matrix. Until that succeeds, Phase 3 is not complete.
