# WordPress Admin Host

**Status:** Implemented thin Phase 1 host

`yaxii-product-workspace.php` registers a small namespaced admin-page class. The host:

- adds a `Product Workspace` admin menu;
- requires `manage_woocommerce` when WooCommerce is active and `manage_options` for the bounded
  dependency screen when it is not;
- reads the generated Vite manifest;
- enqueues the module and styles only on its own admin page;
- creates separate application and overlay portal roots;
- exposes direction, locale, plugin version, frontend availability, and WooCommerce availability;
- renders translated fallback copy when assets or WooCommerce are unavailable;
- avoids loading WooCommerce classes or making WooCommerce calls.

There are no REST routes, product writes, direct metadata updates, database tables, activation side
effects, or remote requests in this phase.
