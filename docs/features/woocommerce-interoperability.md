# WooCommerce Interoperability

**Status:** Implemented on the private 1.1.2 release branch; owner acceptance and publication are pending

## Purpose and workflow

Product Workspace can find, open, hydrate, and safely update compatible Simple and Variable
products regardless of whether WooCommerce, Product Workspace, or another legitimate workflow
created them. Plugin-owned creation metadata is not a compatibility requirement.

Find Product searches supported parent products by title and SKU. If a variation SKU matches, the
result is its Variable parent rather than the variation child. Results identify the product as
Simple or Variable before the user opens it.

WooCommerce's Products table adds **Edit with Yaxii Product Workspace** beside the existing row
actions. The native product editor adds a compact **Open in Product Workspace** action. While an
existing product is open in Product Workspace, **Open in WooCommerce** links to its canonical
native editor. None of these navigation actions mutates product data.

## Deep-link contract

The canonical editor URL is:

`wp-admin/admin.php?page=yaxii-product-workspace&product=<positive-product-id>`

The PHP host validates the query value and exposes only a normalized integer to React. React then
uses the existing authenticated `GET products/<id>` route and the normal product-hydration path.
Invalid IDs, missing products, unsupported product types, and denied access produce bounded error
states. Direct refresh is supported. A navigation-only GET does not require a nonce and never
performs a write; all REST access and mutations retain their existing nonce and capability rules.

## WooCommerce integration and compatibility

Native row/editor actions are limited to exact WooCommerce `simple` and `variable` product types
and users who can edit that specific product. Normal Edit, Quick Edit, Trash, View, and other row
actions remain unchanged. Unsupported or third-party product types do not receive the action and
return a clear unsupported state if directly requested. The integration remains non-fatal when
WooCommerce is unavailable.

Variable hydration preserves global attribute IDs, taxonomy names, term IDs, product-local custom
attributes, concrete variation IDs, SKUs, prices, stock, enabled state, and explicit variation
images. Variation getters use WooCommerce edit context so inherited parent stock/image values are
not mistaken for child-owned values. Updates reuse stable variation IDs and do not duplicate or
convert variations.

## Evidence and limits

Integration coverage creates native-style Simple products, global-attribute 2-by-3 Variable
products, and custom-attribute Variable products without Yaxii markers. It covers title and parent
or variation SKU search, hydration, update/no-duplicate behavior, unsupported types, missing
products, capabilities, canonical URLs, and preservation of existing row actions. Frontend tests
cover valid and invalid direct-entry states, refresh behavior, schema compatibility, and the native
editor link.

Authenticated LocalWP browser QA covers the native editor, both navigation directions, Find by
title and variation SKU, global and custom attributes, six concrete global variations, safe edits,
direct refresh, Arabic RTL, mobile widths, light/dark themes, and Pretty/Plain permalinks.

This Free integration intentionally supports only Simple and Variable products. It does not add
support for grouped, external, subscription, bundle, or other third-party product types.
