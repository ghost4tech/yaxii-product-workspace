# Basic Variable Products

**Status:** Backend and REST implemented and LocalWP-tested in Phase 4 Checkpoint B; Lovable UI integration pending

## Implemented workflow

The Free backend can create, reopen, and edit normal WooCommerce variable products. A request
contains reusable parent product fields, product attributes, and every concrete variation
combination. Multiple attributes are supported: two Color values and three Size values create six
distinct variations, not five option rows.

Global attributes use real WooCommerce attribute IDs, `pa_*` taxonomies, and term IDs. Custom
attributes use a product-local name and option strings and do not create taxonomies. Visibility,
variation use, and position are persisted on the parent.

Each concrete variation independently owns enabled status, regular and optional sale price, SKU,
stock management and quantity, stock status, and image attachment ID. Commercial fields never
belong to an individual attribute option.

## Validation and limits

PHP treats the browser payload as untrusted. Before writes it validates the complete Cartesian
plan, attribute and term ownership, duplicate combinations, SKU uniqueness, prices, stock values,
image attachments, product type, variation ownership, and optimistic version. Free synchronous
limits are five attributes, 20 options per attribute, and 50 concrete combinations.

Create is one same-origin browser operation. The server writes the parent, attributes, and bounded
variation set and then runs WooCommerce variable-product synchronization. Update can add, retain,
change, or remove concrete variations through the same cohesive server operation.

## Idempotency and recovery

Create uses the Phase 2-3 durable operation ledger with operation type
`variable_product_create`. Replaying an idempotency key with the same payload returns the original
parent and does not duplicate variations; a different payload returns a conflict.

Every variation result identifies its stable client combination ID, concrete fingerprint,
variation ID, and state. If one variation write fails, the operation is `partial`, the parent stays
Draft, successful variation IDs remain known, and the queue offers retry. Reconciliation locates
the existing parent by operation identity and variations by combination identity, then creates
only missing combinations. It does not recreate the parent or successful variations.

## Security and evidence

Routes require authenticated WordPress REST access plus create/edit, publish, term-assignment, and
media capabilities as applicable. No WooCommerce REST credentials are sent to React.

The LocalWP integration suite covers two global colors by three custom sizes, independent
price/SKU/stock/image fields, create and hydrate, versioned edit, stale conflict, global attribute and
term lookup, invalid term, duplicate SKU, idempotent replay, controlled partial failure, queue
visibility, and safe retry. The existing simple-product integration suite remains green.

Checkpoint B does not claim production UI or browser acceptance. The approved Lovable editor,
responsive behavior, theme/density/Focus Mode, structural RTL, and storefront browser acceptance
remain pending Checkpoint C.
