# Product Operation Results

**Status:** Implemented for Phase 2 simple-product creation

## Resource

`POST /wp-json/yaxii-product-workspace/v1/products` returns a stable operation resource under
`data`. `GET /wp-json/yaxii-product-workspace/v1/operations/{operation_id}` returns the same resource
for its owning site and user.

The resource contains:

- `operation_id`: server UUID;
- `state`: `succeeded`, `failed`, `processing`, or `uncertain`;
- `product`: canonical WooCommerce summary when known;
- `warnings` and structured `errors`;
- `replayed`: whether the result came from an existing operation;
- `retry.can_reconcile` and `retry.safe_to_resubmit`.

The response also currently contains `http_status`, which records the operation's response status.

## Idempotency contract

Every create request requires an `Idempotency-Key` UUID. The server stores an HMAC of the key rather
than the raw key. Request identity is unique across site, user, operation type, and key, and the
normalized allowlisted payload is bound by SHA-256.

- Same key and same payload returns or reconciles the original result.
- Same key and different payload returns `ypw_idempotency_conflict` with HTTP 409.
- A processing operation is reconciled against a bounded WooCommerce lookup using the private
  `_ypw_operation_id` marker saved through the product CRUD object.
- If the product is known but the operation result cannot be persisted, the response is
  `uncertain`; it is never reported as success.

The mechanism is a narrow product-create ledger in the `{$wpdb->prefix}ypw_operations` table. It is
not a general queue or the future paid job engine.

## Failure semantics

Pre-write authentication, authorization, request validation, SKU, taxonomy, and media failures
produce zero product writes. Validation failures expose field-addressable messages. WooCommerce
write failures produce a durable failed operation when possible. A missing browser response is
treated as unknown: the draft remains and the unchanged request retains its key for safe replay.

Queue status is derived from the server operation. Only `succeeded` with a canonical product can
become Draft or Synced. `failed` becomes Failed, while `processing` and `uncertain` remain Pending.
