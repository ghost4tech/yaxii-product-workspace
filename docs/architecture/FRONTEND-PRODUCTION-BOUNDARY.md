# Frontend Production Boundary

**Status:** Implemented and owner-accepted in Phase 1 recovery

## Presentation authority

The approved Phase 0 Lovable tree under `apps/product-butler/src` is the presentation layer. The
production entrypoint imports that application directly. There is no second workspace shell, form,
queue, preferences screen, command menu, or visual token system for production.

The flow is:

`Lovable component → feature/controller hook → WorkspaceClient → WorkspaceRepository`

Phase 1 uses the repository only for the host bootstrap. Phase 2, not this branch, owns REST,
server-authoritative operations, and WooCommerce writes.

## Host adapters

- `WordPressWorkspaceRepository` consumes validated same-page bootstrap data.
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
credential/catalog stores.

## Deliberate Phase 1 limitations

- Save & next is visibly disabled because product writes do not exist yet.
- Ctrl/Cmd+Enter validates and saves the browser draft; it does not create a product.
- The queue and metrics show truthful empty/no-operation states.
- Category data is empty until a later same-site server resource exists.
- Full interface translation is deferred; locale normalization, EN/FR/AR unavailable copy,
  locale-aware formatters, direction, and RTL-safe root/portal infrastructure are present.
