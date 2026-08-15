# Basic Variable Products

**Status:** Phase 4 backend accepted; V2 presentation and Phase 5A French/Arabic localization browser-tested

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

The production React graph uses the actual approved Lovable V2 Attributes -> Preview -> Variations
presentation. It retains the numbered strip, Global/Custom badges, real global-term chips, custom
chip entry, combination preview, Generate/Regenerate, over-limit state, compact responsive rows,
advanced row expansion, and missing-price state. These components map to the Phase 4 domain model;
they do not use Lovable mock attributes or option-level commercial values. The browser sends the
parent, attributes, and all concrete combinations in one request and never writes one request per
variation. Existing product type remains locked while editing.

Free includes Set all price, basic Auto SKU, and the missing-price indicator. Formula pricing,
advanced SKU patterns, matrix editing, mass image mapping, and sophisticated bulk tools remain
outside this phase.

## Idempotency and recovery

Create uses the Phase 2-3 durable operation ledger with operation type
`variable_product_create`. Replaying an idempotency key with the same payload returns the original
parent and does not duplicate variations; a different payload returns a conflict.

Every variation result identifies its stable client combination ID, concrete fingerprint,
variation ID, and state. If one variation write fails, the operation is `partial`, the parent stays
Draft, successful variation IDs remain known, and the queue offers retry. Reconciliation locates
the existing parent by operation identity and variations by combination identity, then creates
only missing combinations. It does not recreate the parent or successful variations.

The production queue treats both `failed` and `partial` operations as errors, preserves the parent
WooCommerce ID, displays exact failed-combination fingerprints/messages, and offers retry only
when the server marks it safe.

## Security and evidence

Routes require authenticated WordPress REST access plus create/edit, publish, term-assignment, and
media capabilities as applicable. No WooCommerce REST credentials are sent to React.

The LocalWP integration suite covers two global colors by three custom sizes, independent
price/SKU/stock/image fields, create and hydrate, versioned edit, stale conflict, global attribute and
term lookup, invalid term, duplicate SKU, idempotent replay, controlled partial failure, queue
visibility, and safe retry. The existing simple-product integration suite remains green.

Frontend tests cover DTO serialization/hydration, exact combination generation, invalid commercial
values, concrete editor interaction, value preservation on regeneration, cohesive one-request
create orchestration, server field errors, partial queue detail, and simple-product regressions.

Phase 4 authenticated LocalWP QA covered one- and two-attribute create, exact six-combination persistence,
reopen/edit, independent image/price/SKU/stock/enabled fields, destructive validation,
idempotent replay, partial recovery, durable queue refresh, and storefront variation selection.
Phase 4 visual inspection covered 1440, 1280, 768, 430, and 375 pixels; light/dark;
compact/comfortable; Focus Mode; editor, queue, error detail, dialog; and structural RTL.

The active Yaxii COD theme had its variation engine disabled by store configuration. QA temporarily
enabled that existing setting to prove storefront selection and pricing, then restored it to
disabled. Product Workspace requires only valid WooCommerce variable-product data and does not own
the storefront theme's variation-handler configuration.

Phase 4.5 authenticated LocalWP QA used real global Color terms plus custom Size options to produce
exactly six combinations. Set all price, Auto SKU, per-row price/SKU/stock/image, reopen, edit,
storefront selection, and the 56-combination UI limit state passed. The theme variation engine was
temporarily enabled for storefront selection and restored to its original disabled value. Detailed
evidence is recorded in `docs/project/PHASE-4-5-CLOSEOUT.md`.

Phase 5A authenticated QA created a real Arabic variable product with a custom Arabic Size concept,
the existing global Color attribute, four concrete combinations, and bulk price `24.50`. French QA
then reopened the same product through Find Product and verified the translated global/custom
attribute editor and four variation rows. The complete localization evidence and cleanup are in
`docs/project/PHASE-5A-LOCALIZATION-CHECKPOINT.md`.
