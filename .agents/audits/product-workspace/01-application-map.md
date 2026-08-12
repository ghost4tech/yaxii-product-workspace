# Application map

## Route tree

```text
Standalone application shell
├── /                 Product entry workspace
│   ├── KPI strip
│   ├── Essentials / extended product form
│   ├── Image picker
│   ├── Variable-product editor (present, currently broken)
│   └── Searchable/filterable local queue
├── /analytics        Reports (Pro gate; static mock dashboard when unlocked)
├── /stores           Stores (Pro gate; browser-local mock store manager)
├── /team             Team (Pro gate; component-local demonstration)
├── /license          License activation (fake local pattern validation)
├── /settings         Appearance, workspace, queue and product defaults
└── *                 404 inside the application shell

Global overlays
├── WooCommerce connection dialog
├── Upgrade dialog
├── Keyboard shortcuts dialog
└── Command menu
```

Routing is `BrowserRouter` with six explicit `Route` components and a wildcard (`apps/product-butler/src/App.tsx:149`). The prototype assumes control of clean browser paths; a WordPress screen will need a deliberate routing strategy (hash/memory routing or rewrite-safe base handling).

## Global shell

**Purpose:** brand, current-plan/store context, global search/command access, connection status, and primary navigation.

- Components: `AppShell`, `WooCommerceSetup`, `UpgradeModal`, `ShortcutsModal`, `CommandMenu`, two toast systems.
- State: `tierStore`, `storesStore`, `productStore.wooConfig`, `prefsStore`.
- Actions: switch mock store, switch Free/Pro, open command menu, open store connection, navigate.
- Produced data: selected store and tier are persisted to localStorage; connection data would also be persisted.
- Responsive: brand copy hidden below `sm`; store selector/search hidden below `md`; connection state hidden below `lg`; nav becomes a horizontal strip. At 375px later tabs are off-screen and require horizontal scrolling.
- Dark mode: token inheritance is coherent, including overlays. The shell itself does not set language or direction.
- Navigation caveat: `Manage stores →` is a plain `<a href>` rather than router navigation, causing a full load.

## `/` — Product entry workspace

**Purpose:** rapidly enter products and observe their local/sync status.

- Main components: `StatsBar`, `ProductEntryForm`, `CategorySelect`, `ImageUpload`, `VariationsEditor`, `ProductQueue`.
- Entry path: Entry nav, `G E`, command menu, or configured landing route.
- Exit path: shell nav, `G` sequences, command menu, external “Open in WooCommerce” when a real ID/config exists.
- State consumed: products, draft, categories, recent categories, Woo config, product defaults, tier, UI preferences.
- Data produced: a browser-local `Product`; optionally direct remote Woo product/media/variation requests when `wooConfig.connected` is true.
- User actions:
  - name, variable toggle, regular/sale price, sale dates, category, SKU, stock, descriptions;
  - select, drag/reorder and remove images;
  - attempt attributes/options/variation fields;
  - save/clear, search queue, filter status, load more, edit/retry/open/delete/undo;
  - CSV and AI upgrade/demo actions.
- Modals/popovers: category command popover, date calendars, queue dropdown, delete confirmation (preference-controlled), upgrade dialog, command/shortcut dialogs.
- Loading: Save button “Saving…” and connection/upload toasts; image model contains progress fields, but real progress is not wired.
- Errors: inline Zod messages; queue error string; destructive sync toast. Empty invalid submission provides no form-level summary.
- Empty states: queue has useful empty/no-results states; category picker has “No category found,” but no disconnected explanation or create path.
- Premium: product-count limit, CSV and AI. The base creation form is not locked.
- Responsive:
  - 375/430: form then queue, KPIs 2x2, action wrapping; simple entry is usable but long.
  - 768: still stacked; large vertical journey.
  - 1280+: form/queue split; extended mode expands form to full width and sends queue below.
  - variable products are unusable at all sizes because Add Attribute is a runtime no-op.
- Dark mode: good token coverage. Uploaded bitmap previews are theme-neutral.

## `/analytics` — Reports

**Purpose claimed:** performance across stores and team.

- Free entry: a `ProLock` card and upgrade action.
- Pro components: range segment, KPI cards, Recharts throughput/category/hour charts, source/health bars, top-product table, team productivity.
- State: only the selected range is live component state. All data imports from `mockData.ts` and some values are inline constants.
- Actions: range changes a label; Filters, Export and View all have no handlers.
- Data consumed/produced: static/random fixtures; no query and no output.
- Loading/errors/empty states: none.
- Responsive: charts shrink; the page is readable but extremely long at 375px. Dense tables are not optimized for mobile.
- Dark mode: verified; chart CSS variables and tooltip surfaces remain legible (`analytics-dark-desktop.png`).
- Integrity issue: selecting 7/14/90 days does not recalculate KPIs/charts and several subtitles remain “last 30 days.”

## `/stores` — Store manager

**Purpose claimed:** multi-store connection, switching and health.

- Free entry: `ProLock`.
- Pro components: summary/header, add-store dialog, search, store table, row menu, connection-health cards.
- State: seed stores and active store in persisted `woo-stores-store`; add/remove/switch are local.
- Actions:
  - search, add URL/name, switch active, remove, open storefront;
  - “Test connection” only shows a “Sync triggered” toast;
  - add-store copy promises a credential prompt that never follows.
- Data: three fake stores, fake counts, statuses, latency, failures and last-sync values.
- Modals: add-store dialog. This is separate and inconsistent with the global real-direct-API connection dialog.
- Empty state: search no-results row; no zero-store onboarding design.
- Loading/errors: no operation loading; minimal missing-field toast; URL is not schema-validated.
- Responsive: table is wider than the mobile card and horizontally scrolls. Products, last sync and actions are off-screen without a strong affordance.
- Dark mode: inherits tokens.

## `/team` — Team manager

**Purpose claimed:** invitation, roles and permission reference.

- Free entry: `ProLock`.
- Pro components: search, invite dialog, members table, role select, row menu, role-permission cards.
- State: `SEED` copied into component-local `useState`; no persistence or service.
- Actions: invite, change role, resend, remove. Every action is local/toast-only.
- Data produced: temporary UI rows only; reload resets everything.
- Errors: blank email quietly returns; native input type does not protect the click handler from arbitrary non-empty values; no authorization constraints beyond disabling owner removal in UI.
- Loading/empty states: none; no search-empty row.
- Responsive: wide table horizontally scrolls with roles/actions off-screen; permission cards stack.
- Dark mode: inherits tokens.

## `/license` — License

**Purpose claimed:** activate/manage a Pro license.

- State: key, email and tier persisted in `woo-tier-store`.
- Actions: fake 900ms verification, local regex acceptance, copy, deactivate, open upgrade.
- Data: no license server; hardcoded plan, renewal date, seats, store allowance and pricing claims.
- Loading/errors: local loading label and toasts; no network/retry/offline/expired/grace state.
- Premium integrity: any matching pattern unlocks Pro, and the header/command menu bypass license entirely.
- Responsive/dark: layout is responsive and token-based; content is not trustworthy.

## `/settings` — Preferences

**Purpose:** configure appearance, workspace, entry/queue behavior and product defaults.

- Components: Tabs, locally defined `Panel`/`Row`, selects, switches, segments.
- State: `woo-prefs-store` and the `appSettings` portion of `woo-product-store`.
- Actions: instant browser persistence and two reset buttons.
- Tabs:
  - Appearance: theme, density, accent, reduce motion, tabular numerals.
  - Workspace: landing tab, keyboard hints, KPI trends, sticky queue.
  - Entry & queue: autofocus, keep values, delete confirmation, sound, grouping, timestamps, rows per page.
  - Product defaults: stock/status/visibility/tax/manage stock/auto variations.
- Loading/errors/empty states: none, appropriate for local values but insufficient for future server persistence.
- Responsive: **failed** at 375 and 430. Fixed-width tab and control layouts cause global horizontal overflow and crushed label columns.
- Dark mode: controls inherit correctly.
- Dead controls: tabular numerals is not consumed; sound-on-save is not consumed.

## `*` — Not found

- Purpose: generic 404.
- State/data: reads path and logs to console.
- Navigation: “Return to Home” plain anchor, full reload.
- Layout issue: `min-h-screen` is nested below the persistent shell, creating an oversized page rather than a shell-aware empty state.

## Global keyboard paths

- `Ctrl/Cmd+K`: command menu.
- `Ctrl/Cmd+S`: confirmation-only draft save; persistence already occurs on every watched form change.
- `Ctrl/Cmd+D`: duplicate the latest queue product into the form.
- `Ctrl/Cmd+B`: client-side Free/Pro toggle.
- `Ctrl/Cmd+Z`: undo last delete when focus is not in a field.
- `Ctrl/Cmd+Enter`: submit form.
- `?`: shortcuts dialog when focus is not in a field.
- `Esc`: clear draft when focus is not in a field; queue also uses Escape to clear search, creating competing document listeners.
- `G` then `E/A/S/T/L/P`: navigation (the visible shortcuts panel omits some implemented destinations).

## Network map observed

- Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`). This external dependency is unsuitable as a default wp-admin asset/privacy assumption.
- Missing favicon request due to a pre-existing deleted file.
- Direct remote `GET /wp-json/wc/v3/system_status` with browser Basic Auth during connection testing.
- No requests for analytics, CSV, AI, team, store health, license, or preferences.
