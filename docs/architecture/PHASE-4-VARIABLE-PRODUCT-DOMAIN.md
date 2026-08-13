# Phase 4 Variable-Product Domain

**Status:** Checkpoint A domain contract implemented; WooCommerce persistence and production UI are not yet connected

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

## Current checkpoint boundary

Checkpoint A provides pure PHP and TypeScript domain contracts and tests. It does not register a
new REST route, expose variable products in production navigation, query WooCommerce attributes or
terms, or persist `WC_Product_Variable` / `WC_Product_Variation` objects. Those platform and UI
connections belong to Checkpoints B and C and must not be inferred from this document.
