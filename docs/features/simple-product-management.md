# Simple Product Management

**Status:** Phase 3 Checkpoint A backend implemented; Lovable UI integration pending

## Workflow

Authorized users can search and open existing simple products, update their complete supported
field set, start a new draft from a duplicate prefill, and move a product to the WooCommerce trash.
These capabilities are exposed through the same-origin Yaxii REST API. They are not yet presented as
a complete browser workflow until Phase 3 Checkpoint C connects them to the existing Lovable UI.

Product search and category, tag, and shipping-class lookups are server-side, paged, and bounded to
at most 50 results per request. Search results contain real WooCommerce IDs and canonical product
data; the browser does not receive or persist the entire catalog.

## Supported fields

The resource supports name, slug, both descriptions, product status, catalog visibility, regular
and sale price, sale schedule, SKU, stock management, quantity, stock status, backorders, sold
individually, weight, dimensions, shipping class, tax status, tax class, categories, tags, featured
image, and gallery.

WooCommerce owns every product field. The plugin maps validated request data to
`WC_Product_Simple` setters and reloads the saved object before returning it.

## Editing and conflicts

Opening a product returns a `version` hash of its canonical editable fields. Update sends that value
as `expected_version` with a complete product object. A stale version returns HTTP 409 and
`ypw_product_conflict`; no incoming product fields are written. A client must reload and let the
user decide how to proceed.

Complete updates distinguish an omitted field from an explicit clear. Unknown fields and partial
product objects are rejected rather than silently mutating a subset the client may not understand.

## Duplicate and trash

Duplicate is prefill-only. It copies safe field values, sets Draft status, appends “Copy” to the
name, and clears SKU and slug. It performs no WooCommerce product write and returns no product ID.

Trash requires both the product-level delete capability and the current version. It uses the
WooCommerce CRUD delete operation without force deletion, so the resulting WordPress product state
is `trash`. Removing a queue row is a separate operation and is not implemented by this endpoint.

## Security and validation

The server enforces authentication, REST nonce validation, route permission callbacks, product
object capabilities, publishing permission, term-assignment permission, and media access. It
allowlists and sanitizes fields, validates SKU uniqueness, configured tax class slugs, taxonomy
references, and image attachments, then writes through WooCommerce CRUD.

## Evidence and limits

Isolated unit coverage exercises stale versions and the publish, term, media, edit, and delete
capability decisions. LocalWP integration coverage exercises a complete field round trip, bounded
search, detail, persisted update, conflict without overwrite, duplicate without write, object-level
route denial, and versioned trash with fixture cleanup.

Save & Next, persistent preferences, browser draft recovery, the server-authoritative queue, and
the authenticated browser/visual acceptance matrix remain later Phase 3 checkpoint work. Variable
products remain excluded until Phase 4.
