# Phase 3 Simple-Product Domain Boundary

**Status:** Checkpoint A implemented; production UI integration and Phase 3 runtime acceptance remain pending

## Purpose

Checkpoint A extends the Phase 2 create vertical slice into the server-side simple-product
management contract. It does not replace or redesign the approved Lovable presentation. The
frontend work in later Phase 3 checkpoints consumes these routes through the existing same-origin
repository boundary.

The supported product type is `simple`. Variable products and deferred Free/Pro functionality are
outside this contract.

## Application flow

`REST controller -> product application service -> WooProductGateway -> WooCommerce CRUD`

`ProductManagementService` owns workspace and object access, optimistic conflict checks, reference
policy, and mutation orchestration. `WooProductGateway` owns bounded product queries and native
WooCommerce persistence. `WooProductMapper` is the canonical field mapping in both directions.

No WooCommerce-owned product field is stored in custom plugin meta. The only product meta written
by the create workflow is the existing private operation marker used for idempotent reconciliation.

## REST routes

All routes use `yaxii-product-workspace/v1` and WordPress cookie authentication plus the REST nonce:

- `GET /products?page=&per_page=&search=&status=` returns editable simple products with a maximum
  page size of 50. Name search uses a bounded `WP_Query`; an exact SKU match is merged without
  skipping subsequent paged name matches.
- `POST /products` creates a simple product with the Phase 2 idempotency contract.
- `GET /products/{id}` returns the complete canonical editable resource.
- `PUT|PATCH /products/{id}` requires `expected_version` and a complete `product` object.
- `GET /products/{id}/duplicate` returns a draft prefill and performs no product write.
- `DELETE /products/{id}?expected_version=` moves the product to the WooCommerce trash.
- `GET /categories`, `GET /tags`, and `GET /shipping-classes` provide bounded, paged term lookup.

The collection and taxonomy routes cap `per_page` at 50. Product results are never mirrored into
browser persistence by this backend contract.

## Field contract

The complete simple-product resource covers:

- identity and content: name, slug, description, short description, status, catalog visibility;
- pricing: regular price, sale price, and local-store sale start/end dates;
- inventory: SKU, manage stock, quantity, stock status, backorders, sold individually;
- shipping and tax: weight, dimensions, shipping class, tax status, tax class;
- organization and media: category IDs, tag IDs, featured image, and gallery attachment IDs.

Create requests may omit optional fields and receive server defaults. Updates must send every
allowlisted field, using an empty or null value where the contract allows clearing. Unknown fields
are rejected. This prevents an omitted property from being mistaken for an intentional clear.

## Conflict and duplicate semantics

Every returned product includes `modified_at` and a `version` hash derived from the complete
canonical WooCommerce field set. Update and trash compare `expected_version` with a freshly loaded
resource and return HTTP 409 with `ypw_product_conflict` when stale. The newer values are not
overwritten.

Duplicate returns the source field values as a browser draft, changes the name to include “Copy,”
sets status to Draft, and clears both slug and SKU. It never returns a product ID or writes a new
WooCommerce product until the user explicitly saves.

## Validation and capabilities

Controllers have explicit permission callbacks. The application layer rechecks create, publish,
term-assignment, media, object-edit, and object-delete capabilities. SKU uniqueness, configured tax
classes, taxonomy references, and image attachments are validated before WooCommerce mutation.

Products are created and updated through `WC_Product_Simple` setters and `save()`. Trash uses the
WooCommerce CRUD delete operation without force deletion. Create and update responses are built
from a freshly reloaded product so returned versions and local sale dates match persisted state.

## Evidence and remaining work

PHP lint, WordPress Coding Standards, PHPStan, and isolated unit tests cover request and service
behavior. LocalWP integration tests exercise complete field round trips, bounded search, detail,
update, stale conflict, duplicate without write, object capability denial, and trash with fixture
cleanup.

Checkpoint A alone is not Phase 3 completion. Preferences, Save & Next, draft recovery, queue
lifecycle, frontend mapping, authenticated browser workflows, and the visual acceptance matrix are
implemented and assessed in later checkpoints.
