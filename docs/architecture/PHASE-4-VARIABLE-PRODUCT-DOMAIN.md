# Phase 4 Variable-Product Domain

**Status:** Checkpoints A-C implemented and authenticated browser-tested; owner acceptance pending

## Model boundary

Phase 4 separates product attributes from concrete variation combinations. Attribute options do not
own prices, SKUs, stock, or images. Each concrete combination owns those commercial fields.

Global attributes retain their real WooCommerce attribute ID, `pa_*` taxonomy, and selected term
IDs. Custom attributes retain a product-local name and option strings and do not imply taxonomy
creation. Both kinds have a stable key, visibility flag, variation-use flag, and position.

A concrete combination contains exactly one selection for every attribute marked for variations.
Its stable client UUID is separate from its WooCommerce variation ID. Its own fields are enabled
state, regular and sale price, SKU, stock-management state, quantity, stock status, and image
attachment ID.

## Generation and limits

`CombinationGenerator` and the frontend `generateVariationCombinations` function calculate the
Cartesian product in attribute-position order. Two colors and three sizes project and generate six
rows. Regeneration retains the client identity and commercial values of unchanged selection sets.

The synchronous Free boundary is defined by `VariableProductLimits` in PHP and
`VARIABLE_PRODUCT_LIMITS` in TypeScript:

- at most 5 attributes;
- at most 20 selected options per attribute;
- at most 50 concrete combinations.

The projected count is checked before rows are accepted. The validators reject duplicate
attributes, duplicate options, duplicate combination selections, incomplete selection sets,
unknown attribute or option references, duplicate client identities, and unsupported fields.

## WooCommerce and REST boundary

The same-origin `/variable-products` route accepts the parent, complete attribute list, and every
concrete combination in one request. PHP validates the complete plan before mutation, then uses
`WC_Product_Variable`, `WC_Product_Attribute`, and `WC_Product_Variation` CRUD. The browser never
orchestrates one request per variation and never receives WooCommerce credentials.

Global attribute resources are bounded under `/attributes` and `/attributes/{id}/terms`. The
server verifies each submitted attribute ID against its `pa_*` taxonomy and verifies every term
inside that taxonomy. Custom attributes remain product-local.

The adapter stores only two private recovery identities: the original operation ID on the parent
and the stable client combination ID on each variation. WooCommerce-owned prices, stock, SKUs,
images, statuses, attributes, and term relationships remain in WooCommerce CRUD storage.

## Production UI boundary

Checkpoint C wires the approved Lovable editor to the same-site routes without changing the
presentation contract. The production flow supports type selection, global and custom attribute
configuration, projected count, concrete combination generation, per-combination editing,
single-request create, canonical hydration, and versioned edit. The responsive card editor avoids
a desktop spreadsheet matrix and retains the existing theme, density, Focus Mode, queue, dialog,
and structural RTL behavior.

The queue maps `partial` and `failed` into its error filter, retains successful product and
variation IDs, shows exact failed-combination fingerprints, and exposes retry only when the server
marks it safe. Phase 4 contains no bulk fill, mass editing, presets, templates, import, AI, or other
advanced Pro matrix capability.
