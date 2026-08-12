# Product Entry Workspace Shell

**Status:** Free MVP frontend foundation implemented in Phase 1

## User workflow

Administrators open Product Workspace in wp-admin and use the Entry screen to prepare a simple-product draft.
Essentials and Extended tabs organize the form. The layout preserves the Form + Queue composition, Focus
Mode, and Save & Next presentation from the approved prototype.

The form currently saves only a versioned browser-session draft through the visible Save browser draft
action or `Ctrl+S`. It can restore and clear that draft. It does not create or update a WooCommerce product.
The disabled Save & Next control states this limitation instead of reporting fake success.

## Workspace behavior

- The production queue is empty and explains that server operations arrive with the Phase 2 REST write layer.
- Standalone development uses deterministic, visibly labelled fixtures.
- Preferences cover light, dark, and system themes; comfortable and compact density; Focus Mode; and reduced
  motion.
- `Ctrl+K` opens a keyboard-accessible command dialog. Escape closes dialogs, initial focus moves into command
  search, focus is trapped while open, and focus returns to the opener.
- At tablet and phone widths the queue becomes an on-demand dialog and form fields/actions reflow without
  horizontal overflow.

## Data and security

The browser draft uses `sessionStorage` key `ypw.product-draft.v1`. UI preferences use the bounded
`localStorage` key `ypw.preferences.v1`. Neither contains WooCommerce credentials, licenses, entitlements, or
a catalog copy. There is no server persistence or WooCommerce integration in this phase.

## Limitations and evidence

Full French/Arabic copy, product writes, taxonomy lookup, media, variations, reconciliation, and operation
retry are not implemented. Phase 1 automated coverage verifies host bootstrap parsing, bounded unavailable
behavior, hidden deferred navigation, unchanged browser URLs, command interaction, draft persistence and
malformed-draft recovery, and locale utilities. Browser verification covered desktop, laptop, tablet, 430 px,
and 375 px layouts plus themes, density, Focus Mode, reduced motion, keyboard operation, portals, and
structural RTL.
