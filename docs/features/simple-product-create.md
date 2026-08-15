# Simple Product Create

**Status:** Implemented and runtime-tested in Phase 3

## Purpose and workflow

An authorized merchant creates a real WooCommerce simple product from the approved Lovable Entry
workspace. Save & Next submits the form through the same-site Yaxii REST boundary, uses the
canonical server result, updates the operation queue, prepares the next draft according to the
merchant's repeat preferences, and optionally returns focus to the product-name field.

The current field contract and lifecycle are documented in
[`simple-product-management.md`](simple-product-management.md). Variable products remain hidden
from the Free production navigation and are deferred to Phase 4.

## Application flow

`Lovable form -> useProductEntryController -> WorkspaceClient -> WordPressWorkspaceRepository -> POST /products -> ProductManagementService -> WooProductGateway -> WC_Product_Simple::save()`

The browser generates an idempotency key for the create intent. The server durably reserves the
normalized request identity before the write, marks the product with the private operation
identity, and returns the
canonical product resource after persistence. An uncertain response is reconciled by operation ID;
the browser does not blindly repeat a non-idempotent create.

## Security and validation

The route requires WordPress cookie authentication, a valid REST nonce, `edit_products`, and the
more specific publish, taxonomy, and media capabilities when the submitted values require them.
The server applies a strict field allowlist, validates references and configured values, checks SKU
uniqueness, and maps the request through WooCommerce CRUD setters.

## Error and recovery behavior

Validation errors return stable field paths for the existing inline error presentation. Known
write failures become failed queue entries only when the server can state that no product was
created. An ambiguous response retains the draft and exposes reconciliation. A retry is available
only when the server's durable operation state explicitly authorizes it.

## Evidence

Automated coverage exercises Draft and Published creates, validation, capabilities, idempotent
replay, uncertain reconciliation, and WooCommerce round trips. Authenticated LocalWP browser QA
created both statuses, tested duplicate SKU and nonce failures, and verified the resulting
WooCommerce data before removing all disposable fixtures.
