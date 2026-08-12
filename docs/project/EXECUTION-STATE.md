# Execution State

**Updated:** 2026-08-12

**Current phase:** Phase 1 Lovable UI recovery

**Acceptance state:** HOLD — browser visual-parity matrix not yet executed

## Canonical repository

- Repository: `https://github.com/ghost4tech/yaxii-product-workspace.git`
- Recovery branch: `recovery/phase-01-lovable-ui`
- Recovery base: Phase 0 commit `5f54942dc37a916ec518bd1a2326d801dcc22b81`
- Rejected branch: `phase/01-production-frontend-boundary` (not merged)
- Package manager: npm
- Authoritative lockfile: `apps/product-butler/package-lock.json`
- Preserved non-canonical lockfile: `apps/product-butler/bun.lockb`

## Implemented recovery state

- The production entrypoint mounts the actual Phase 0 Lovable application rather than a parallel
  presentation layer.
- Entry, Focus Mode, queue, Settings, command menu, shortcuts, forms, dialogs, theme, density, and
  responsive component source come from the approved Lovable tree.
- Deferred Lovable screens and actions remain in source but are excluded from Free production
  routing and the active bundle.
- React uses a same-site WordPress bootstrap through an application-client/repository boundary.
- Product writes remain unavailable; the Phase 1 UI stores only a bounded browser draft and
  preferences.
- CSS, theme attributes, direction, and overlay portals are scoped to the plugin root.
- The thin PHP host guards WooCommerce availability and loads built assets only on the plugin page.

## Evidence state

Passing automated evidence and exact commands are documented in
[Development Tooling](../development/TOOLING.md). The source comparison, intentional differences,
and parity gate are documented in [Phase 1 Recovery](PHASE-1-RECOVERY.md).

The current automated suite covers the real Lovable Entry surface, hidden deferred navigation,
truthful empty queue, disabled store write, draft entry, Focus Mode, queue sheet, Settings,
light/dark preference behavior, density, plugin-owned dialog portals, host validation, localized
unavailable states, and RTL root attributes.

An isolated WordPress Playground smoke test verified activation, the admin mount, built asset
responses, the WooCommerce-inactive state, and absence of plugin assets on Dashboard.

## HOLD

The required desktop, laptop, tablet, 430 px, and 375 px visual comparison could not be run because
the in-app browser service reported that no browser backend was available. Source/build/component
evidence is not a substitute for screenshot and interaction parity. Phase 1 therefore remains on
HOLD until that matrix is run against both the Phase 0 application and the WordPress-hosted build.

Phase 2 has not started and is not authorized by this recovery branch.
