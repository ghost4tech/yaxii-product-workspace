# WordPress Admin Host

**Status:** Extended for the Phase 2 same-site application boundary

`yaxii-product-workspace.php` loads the Composer autoloader and starts the explicit `Plugin::create()`
composition root. The host:

- adds a `Product Workspace` admin menu;
- requires `edit_products` when WooCommerce is active and `manage_options` for the bounded
  dependency screen when it is not;
- reads the generated Vite manifest;
- enqueues the module and styles only on its own admin page;
- creates separate application and overlay portal roots;
- exposes the REST base URL, WordPress REST nonce, direction, locale, plugin version, frontend
  availability, and WooCommerce availability;
- renders translated fallback copy when assets or WooCommerce are unavailable;
- registers the bootstrap, category, product-create, and operation-reconciliation routes;
- manages the narrow idempotency-operation table on activation and schema-version changes;
- wires thin controllers to application services and WordPress/WooCommerce adapters.

Assets remain scoped to the plugin admin page. WooCommerce classes are checked before use, so an
inactive or missing dependency remains a bounded non-fatal state. The browser receives no store
credentials and the plugin makes no remote store request.
