# Simple Product Management

**Status:** Implemented and runtime-tested in Phase 3

## Merchant workflow

The approved Lovable Entry workspace now supports the normal simple-product lifecycle without
opening WooCommerce's native Add Product editor: create, find/open, edit, duplicate into an unsaved
draft, Save & Next, reconcile or safely retry an operation, and move a product to trash.

The product finder searches WooCommerce on the server in pages of 20. Product, category, tag, and
shipping-class searches are debounced and cancel superseded requests. Tax classes come from the
bounded workspace bootstrap rather than a catalog load. No catalog mirror is loaded or persisted
in the browser.

## Supported fields

The Essentials and Extended panels persist the WooCommerce-owned simple-product fields:

- name, slug, description, short description, status, and catalog visibility;
- regular price, sale price, and local-store sale start/end dates;
- SKU, manage stock, quantity, stock status, backorders, and sold individually;
- weight, length, width, height, shipping class, tax status, and tax class;
- categories, tags, featured image, and gallery attachment IDs.

The server maps validated values to `WC_Product_Simple` setters. It does not create custom product
meta for fields WooCommerce owns. Variable products remain excluded until Phase 4.

## Editing and conflict protection

Opening a product returns its canonical editable resource and a `version` hash. An update sends the
version as `expected_version` with the complete allowlisted product object. A stale request returns
HTTP 409 and `ypw_product_conflict` before any incoming field is written. The Lovable dialog lets
the merchant keep the local draft or reload the latest server values.

Complete updates make clearing explicit because every allowlisted field must be present. Unknown
fields and partial update objects are rejected instead of silently mutating an unsupported subset.

## Duplicate and trash

Duplicate is read-only until Save. The server supplies safe prefill values, appends `(Copy)` to the
name, sets Draft status, and clears SKU and slug. It returns no new product ID and performs no
WooCommerce write.

Trash requires object-level delete capability and the current version. It calls WooCommerce CRUD
without force deletion and returns a narrow `{id, status: "trash"}` result. Queue dismissal is a
separate operation and explicitly does not trash the WooCommerce product.

## Security and validation

Every route requires WordPress cookie authentication, a valid REST nonce, a permission callback,
and application-layer capability checks. Publishing, term assignment, media use, object edit, and
object delete are independently enforced. The server validates SKU uniqueness, configured tax
classes, taxonomy references, image attachments, field types, and the field allowlist before a
WooCommerce mutation.

## Evidence and limits

The PHP and REST suites cover create/read/query/update, complete field round trips, stale conflict,
duplicate without write, object capabilities, references, and versioned trash. Frontend tests
cover full mapping, hydration contracts, cancellation, duplicate drafts, and field errors.

Authenticated LocalWP QA created Draft and Published products, edited and reloaded name, price,
stock, category, image, description, and weight, simulated a stale edit, duplicated without an
early write, searched/opened products, and trashed a disposable product. All QA products and
operation rows were removed afterward.

French and Arabic copy is not complete. The production root and portals retain locale direction,
logical spacing, and structural RTL support without a duplicated layout.
