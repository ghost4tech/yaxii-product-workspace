# Product Operation Results

**Status:** Implemented and runtime-tested in Phase 3

## Resource and queue

Create operations are durable, per-user resources. The create response, single-operation endpoint,
and paged operation collection expose the same canonical identity and state. Current create results
include the full canonical product when known. Historical collection rows retain their stored
product snapshot; rows written before the full simple-product contract may contain only the stable
product ID, name, SKU, status, and then-current summary fields. A resource also includes the
operation ID, state, normalized request when stored, timestamps, structured errors, warnings, replay
status, and server-owned retry permissions.

The queue is read from the server rather than reconstructed from toasts or browser storage. Search,
state and publish-status filters, pagination, and counts are server-side. Pages are capped at 50
rows and terminal history at 200 rows per user; active operations are retained.

Schema version 4 backfills missing denormalized product ID/name/SKU/status columns from immutable
successful results in bounded 200-row pages. This makes pre-Phase-3 rows searchable and countable
without rewriting their result snapshot or touching the WooCommerce product.

## Lifecycle

- `processing` and `uncertain` operations may be reconciled read-only when the server allows it.
- `failed` operations expose manual Retry only for the narrow stored write-failure state that is
  safe to revalidate and claim.
- `succeeded` operations carry the real WooCommerce product ID and result.
- Dismiss removes an eligible row from the visible queue without modifying its WooCommerce product.

Reconciliation checks the private product operation marker before changing state. Retry also checks
for an existing product, revalidates the original request and current capabilities, and atomically
claims the operation. Once claimed or succeeded, another retry returns a conflict instead of
creating a duplicate.

## Security and evidence

All operation routes require the REST nonce, authentication, ownership, and applicable product
capabilities. Integration tests cover ownership, filters, bounded history, reconciliation, retry
authorization/state, second-retry rejection, and dismissal. Authenticated browser QA reconciled an
uncertain operation, performed one safe retry, confirmed its second retry was rejected, and showed
that queue dismissal left the WooCommerce product intact.
