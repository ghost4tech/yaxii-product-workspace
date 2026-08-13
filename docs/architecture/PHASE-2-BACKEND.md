# Phase 2 Backend Boundary

## Runtime flow

`REST controller -> application service -> WooCommerce adapter`

`Plugin::create()` is the composition root. REST controllers parse HTTP concerns and shape
responses. `CreateProductService` owns capability policy, idempotency, reference validation order,
write orchestration, and reconciliation. `WooProductGateway` is the only product persistence
adapter and uses supported WooCommerce CRUD APIs.

## Routes

All routes use namespace `yaxii-product-workspace/v1`:

- `GET /bootstrap` returns current user, capability hints, locale/direction, bounded WooCommerce
  format/unit data, Phase 2 feature flags, and limits.
- `GET /categories?page=1&per_page=20&search=` returns at most 50 current-store product categories.
- `POST /products` accepts the allowlisted simple-product create contract and requires an
  `Idempotency-Key` UUID.
- `GET /operations/{operation_id}` returns only an operation belonging to the current site and user.

WordPress cookie authentication validates `X-WP-Nonce` before route permissions. Each route also
has an explicit `permission_callback`; product creation and operation access require the product
capability policy, and Publish is rechecked in the application service.

## Persistence

Activation and version checks manage one small operation table through `dbDelta()`. The unique
request-identity key provides atomic reservation. No WooCommerce consumer secret or raw idempotency
key is stored. Product identity and platform behavior remain owned by WooCommerce.

The application remains loadable when WooCommerce is missing. Bootstrap reports availability as
false, the frontend renders the bounded unavailable state, and no product class is instantiated.

## Error boundary

`ApiException` supplies stable public codes, HTTP statuses, and optional field messages. Controller
responses do not expose internal exceptions. `OperationResult` distinguishes failure from an
unknown outcome so a client never converts a timeout into success or blindly retries a create.
