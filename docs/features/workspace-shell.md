# Workspace Shell

**Status:** Phase 1 accepted after owner verification on the active LocalWP production page

## Purpose and workflow

The production wp-admin screen presents the approved Lovable product-entry workspace. A user can
fill simple or variable draft fields, add local image previews, open extended fields, save or clear
the browser draft, inspect the truthful empty queue, enter Focus Mode, use the command/shortcut
dialogs, and change appearance and workflow preferences.

## Observable behavior

- Entry retains the Lovable toolbar, KPI strip, product form, sticky queue, mobile queue sheet, and
  Focus Mode behavior.
- Settings retains the Lovable Appearance, Workspace, Entry & queue, and Product defaults panels.
- Light/dark/system theme, comfortable/compact density, accents, reduced motion, and local
  preferences are scoped to this workspace.
- Deferred Free/Pro navigation and actions are absent from production.
- Product writes and retry/edit server operations are unavailable; the UI never reports them as
  successful.

## Backend and persistence

The WordPress page supplies a validated bootstrap snapshot through `WorkspaceClient` and a repository
adapter. There is no Phase 1 product endpoint. Workspace preferences use versioned local storage;
the current product draft and product-default preferences use versioned session storage. Browser
files, products, categories, Woo credentials, licenses, and server operations are not persisted.

## Security and capabilities

The admin screen is capability-gated by WordPress. The production bundle has no Woo consumer-key
form, direct `/wc/v3` client, or wildcard CORS guidance. The write control is unconditionally
disabled because this phase has no product-write client or endpoint.

## Error and recovery behavior

Missing host configuration, missing frontend assets, and inactive WooCommerce render bounded
unavailable states. Draft save/clear is local and truthful. Queue edit/retry paths cannot claim
success before their server implementation exists.

## Limitations

No real product, media, category, variation, queue, edit, retry, or delete server operation ships in
Phase 1. Complete UI translation and final Arabic visual polishing are later release work. Browser
automation was unavailable; the owner manually verified and visually accepted the restored Lovable
UI on the active LocalWP production page.

## Evidence

Strict TypeScript, lint, the maintained line limit, component tests, build, boundary scan, production
dependency audit, PHP lint, and isolated WordPress hosting checks cover this implementation. See
[Phase 1 Recovery](../project/PHASE-1-RECOVERY.md) for the parity ledger and owner acceptance.
