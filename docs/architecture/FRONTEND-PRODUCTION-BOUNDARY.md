# Frontend Production Boundary

**Implemented:** Phase 1, 2026-08-12

## Runtime flow

The Phase 1 production frontend uses this boundary:

`Component -> feature controller/hook -> WorkspaceClient -> WorkspaceRepository -> adapter`

WordPress selects the production adapter through a bootstrap object printed before the versioned module
script. The adapter currently exposes only host metadata and an empty operation queue. It does not call
WooCommerce or mutate products. Phase 2 can add same-origin Yaxii REST operations behind the repository
without teaching components about WordPress transport details.

The standalone Vite development server selects a deterministic fixture adapter. Its two queue entries are
explicitly labelled as fixtures and are never compiled into store truth. An unavailable adapter provides a
bounded error state when WordPress bootstrap data is absent or invalid.

## State ownership

- React Query owns the repository snapshot and is ready for later server state.
- Zustand owns only theme, density, Focus Mode, and reduced-motion preferences.
- A versioned product-entry draft is stored in `sessionStorage`; it is local to the browser session and
  contains no credentials or catalog mirror.
- Saving the browser draft and clearing it are real local actions. `Save & Next` remains disabled and states
  that product writes begin in Phase 2.

## Removed production assumptions

The maintained production execution graph contains no WooCommerce consumer key or secret, browser-direct
`/wc/v3` request, CORS setup, store connection form, plan switch, license activation, random catalog source,
or successful-looking product mutation. Analytics, Stores, Team, License, AI, CSV, and other deferred
Pro/Agency surfaces are absent from production navigation and command actions. Their imported prototype
source remains preserved outside `src/production` for reference.

## Routing

Entry and Preferences use bounded React state. Navigation neither reads nor changes the wp-admin browser
path, and hidden prototype routes are not production routes. This is intentionally simpler than a URL router
for the current two-section workspace.

## Localization boundary

WordPress supplies locale and direction in the bootstrap data. The plugin root receives `lang` and `dir`,
and portal content mounts inside that same root. Maintained UI messages pass through a central translator,
while number and date formatting use locale-aware `Intl` utilities. English remains the working copy in
Phase 1; full French and Arabic translation is deferred.
