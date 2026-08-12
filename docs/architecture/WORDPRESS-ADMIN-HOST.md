# WordPress Admin Host

**Implemented:** Phase 1, 2026-08-12

## Plugin bootstrap

`yaxii-product-workspace.php` makes the repository a WordPress plugin and registers one `AdminPage` host.
The host adds the Product Workspace admin page, renders one plugin-owned React root plus a portal container,
and reads the committed Vite manifest to locate hashed production assets.

The JavaScript module and its stylesheet are enqueued only when the current hook suffix exactly matches the
Product Workspace screen. Their versions use the built file modification time. The module-tag filter is
limited to the plugin script handle, so unrelated wp-admin scripts are not changed.

## Dependency behavior

The host checks `class_exists( 'WooCommerce' )` before selecting a capability or reporting availability. It
does not reference WooCommerce classes when the dependency is missing. With WooCommerce active, access
requires `manage_woocommerce`; without it, administrators with `manage_options` can see a bounded unavailable
message. No product CRUD, REST route, nonce, or WooCommerce application service exists in Phase 1.

## Styling isolation

All maintained selectors are rooted at `#yaxii-product-workspace`. Theme variables, controls, responsive
rules, dialogs, and toasts stay inside that root. The frontend does not style `html`, `body`, a global `*`,
or an unrelated wp-admin selector. It uses a system font stack and performs no remote font or stylesheet
request.

Authenticated runtime verification covered an Arabic/RTL WordPress admin with WooCommerce active and
inactive. The normal Dashboard contained neither the workspace root nor a workspace asset request.
