=== Yaxii Product Workspace ===
Contributors: ghost4tech
Tags: woocommerce, products, inventory, product management, admin
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 8.1
Requires Plugins: woocommerce
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A focused WooCommerce workspace for creating and managing simple and variable products.

== Description ==

Yaxii Product Workspace gives WooCommerce merchants a dedicated, responsive product-entry screen inside WordPress administration.

Free features include:

* Create, edit, duplicate, search, and trash simple products.
* Create and edit variable products with bounded variation combinations.
* Manage product categories, tags, attributes, images, pricing, inventory, shipping, tax, and rich descriptions.
* Review server-backed operation history and safely retry eligible failed writes.
* Choose light, dark, or system theme and compact or comfortable density.
* Use the workspace in English, French, or Arabic, including right-to-left Arabic layouts.

The plugin uses same-site WordPress REST endpoints and WooCommerce APIs. It does not store WooCommerce API credentials in the browser and does not contact an external service.

Development source and build tools are maintained publicly on the `dev` branch at https://github.com/ghost4tech/yaxii-product-workspace/tree/dev. A clean clone of that branch can reproduce the distributed assets without Lovable, Claude, Codex, or any private service; see `docs/development/TOOLING.md` on that branch for exact build steps.

== Installation ==

1. Install and activate WooCommerce.
2. Upload the Yaxii Product Workspace ZIP through Plugins > Add New > Upload Plugin, or install it from the WordPress.org Plugin Directory.
3. Activate Yaxii Product Workspace.
4. Open Product Workspace from the WordPress administration menu.

Users need the applicable WooCommerce product, taxonomy, upload, and publishing capabilities for the actions they perform.

== Frequently Asked Questions ==

= What happens if WooCommerce is inactive? =

The plugin remains non-fatal and shows an availability notice. Product operations remain unavailable until WooCommerce is active.

= Does the plugin send data to Yaxii or another external service? =

No. Version 1.0.0 has no telemetry, tracking, license call, external API, or remote executable-code request.

= Where are unfinished drafts stored? =

The current product draft is stored in bounded browser session storage for the active browser tab. Workspace preferences are stored in WordPress user metadata.

= What is removed on uninstall? =

Uninstall removes the plugin operation ledger, schema option, workspace user preferences, and internal Yaxii product-operation markers. WooCommerce products, variations, categories, tags, attributes, and media are retained.

= Does the plugin include paid or trial functionality? =

No. This package contains the complete Free 1.0.0 product. It contains no implemented premium feature hidden behind a payment, license, trial, or quota.

== Screenshots ==

1. The focused product-entry workspace in light mode.
2. Variable-product attributes and variation controls.
3. The server-backed operation queue and filters.
4. Workspace preferences in dark mode.
5. The Arabic right-to-left workspace.

== Privacy ==

The plugin stores a site-local operation ledger for safe product writes and operation history, plus workspace preferences in WordPress user metadata. It adds internal operation markers to products and variations created through the workspace. The browser keeps a bounded draft in session storage.

No telemetry or tracking is performed, and no plugin data is sent to Yaxii or another external service. Deactivation retains data. Uninstall removes plugin-owned storage and markers but never deletes WooCommerce products, variations, terms, or media.

== Changelog ==

= 1.0.0 =

* Initial public Free release.
* Added secure simple and variable WooCommerce product workflows.
* Added product search, editing, duplication, categories, media, rich descriptions, operation history, and preferences.
* Added complete French and Arabic localization with right-to-left support.
