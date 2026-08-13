# Frontend Production Boundary

**Status:** Phase 2 data integration implemented; owner visual acceptance pending

## Presentation authority

The approved Phase 0 Lovable tree under `apps/product-butler/src` remains the presentation layer.
The production entrypoint imports that application directly. There is no second workspace shell,
form, queue, preferences screen, command menu, or visual token system for production.

The Phase 2 flow is:

`Lovable component -> useProductCreate -> WorkspaceClient -> WordPressWorkspaceRepository -> Yaxii REST`

## Host adapters

- `WordPressWorkspaceRepository` consumes validated host data, loads the server bootstrap, performs
  same-origin product creates and operation reconciliation, and requests bounded category pages.
- `DevelopmentWorkspaceRepository` supports the local Vite presentation with no mock products and
  no writes.
- `UnavailableWorkspaceRepository` fails closed when a production host is missing.

The browser never receives WooCommerce consumer credentials and the active graph does not call
`/wc/v3`. The old Lovable connector and service files remain preserved but are excluded from strict
production compilation, linting, routing, and bundling. A built-asset scan rejects credential keys,
direct Woo routes, wildcard CORS text, old credential-store keys, and deferred CSV/AI actions.

## Routing and deferred source

The application uses `MemoryRouter`, so Entry and Settings navigation does not replace the wp-admin
URL. Free production exposes only those two routes. Analytics, Stores, Team, License, plan controls,
Connect WooCommerce, CSV, and AI remain preserved as deferred source and have no production route or
action.

## Scoped presentation

- Vite/PostCSS prefixes maintained application selectors with `#yaxii-product-workspace`.
- Theme, density, accent, reduced-motion, language, and direction attributes are applied to the
  plugin root, not `html` or `body`.
- Radix dialogs, sheets, popovers, selects, and menus use the plugin-owned portal node.
- Inter and JetBrains Mono are bundled locally; production does not load Google Fonts.
- New directional changes use logical start/end properties and utilities.

## Browser persistence

Only the current form draft, local product-default preferences, and workspace preferences persist.
The draft is versioned and bounded to `sessionStorage`; browser `File` objects are excluded. It
contains no catalog or credentials. The production application never reads the legacy prototype
credential/catalog stores. An idempotency identity is retained only for an unresolved unchanged
create payload and is cleared after a canonical success.

## Deliberate Phase 2 limitations

- Save & next and Ctrl/Cmd+Enter create only supported simple products when the server capability and
  feature flags allow it.
- The queue and metrics derive new product states from server operation results; they do not infer
  success from the request completing locally.
- Category data comes from bounded same-origin search. Images must be existing WordPress media
  attachment IDs selected through the native media library.
- Variable creation, sale schedules, pending review, and queue edit/retry/delete server actions stay
  disabled or truthfully unavailable.
- Full interface translation is deferred; locale normalization, EN/FR/AR unavailable copy,
  centralized operation copy, locale-aware formatters, direction, and RTL-safe root/portal
  infrastructure are present.
