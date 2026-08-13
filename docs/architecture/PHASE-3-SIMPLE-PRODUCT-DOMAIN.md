# Phase 3 Simple-Product Domain Boundary

**Status:** Implemented and runtime-tested in Phase 3

## Purpose and flow

Phase 3 extends the Phase 2 create slice into the complete Free simple-product management contract
without replacing the approved Lovable presentation. The supported product type is `simple`.
Variable products and deferred Free/Pro functionality remain outside this contract.

`REST controller -> application service -> WooProductGateway -> WooCommerce CRUD`

`ProductManagementService` owns workspace and object access, optimistic conflict checks, reference
policy, and mutation orchestration. `WooProductGateway` owns bounded product queries and native
WooCommerce persistence. `WooProductMapper` is the canonical field mapping in both directions.
WooCommerce-owned fields are not stored in custom plugin meta; create writes only the existing
private operation marker used for idempotent reconciliation.

## REST routes

All routes use `yaxii-product-workspace/v1`, WordPress cookie authentication, and the REST nonce:

- `GET /products?page=&per_page=&search=&status=` returns paged editable simple products, capped at
  50 rows. Exact SKU lookup is merged with bounded name search without loading the catalog.
- `POST /products` creates through the operation/idempotency contract.
- `GET /products/{id}` returns the complete canonical editable resource.
- `PUT|PATCH /products/{id}` requires `expected_version` and a complete `product` object.
- `GET /products/{id}/duplicate` returns an unsaved safe draft prefill.
- `DELETE /products/{id}?expected_version=` moves the product to WooCommerce trash.
- `GET /categories`, `GET /tags`, and `GET /shipping-classes` provide bounded paged term lookup.

## Field and mutation contract

The resource covers name, slug, descriptions, status, catalog visibility, regular/sale price and
schedule, SKU, stock management and quantity, stock status, backorders, sold individually, weight,
dimensions, shipping class, tax status/class, categories, tags, featured image, and gallery.

Create may omit optional fields and receive server defaults. Update sends every allowlisted field,
using empty or null values where clearing is supported. Unknown or incomplete update objects are
rejected so omission cannot be mistaken for an intentional clear. Products are persisted through
`WC_Product_Simple` setters and `save()`; trash uses WooCommerce CRUD delete without force deletion.

## Conflict, duplicate, and authorization

Each product has `modified_at` and a version hash derived from its canonical editable fields.
Update and trash compare `expected_version` to a freshly loaded product and return HTTP 409 with
`ypw_product_conflict` before any stale mutation.

Duplicate changes the name to include `Copy`, sets Draft status, and clears slug and SKU. It returns
no product ID and writes nothing until the merchant saves. Controllers have explicit permission
callbacks; the application layer rechecks create, publish, taxonomy, media, object-edit, and
object-delete capabilities. SKU uniqueness, configured tax classes, taxonomy references, and image
attachments are validated before mutation.

## Evidence

PHP lint, WordPress Coding Standards, PHPStan, PHPUnit, and LocalWP integration tests cover complete
field round trips, bounded search, detail, update, stale conflict, duplicate without write, object
capabilities, references, and versioned trash. Frontend tests cover mapping, hydration,
cancellation, conflict, duplicate, and queue contracts.

Authenticated LocalWP browser QA exercised the full lifecycle against real WooCommerce data,
including stale conflict and trash state. Disposable products and QA operation rows were removed
after verification.
