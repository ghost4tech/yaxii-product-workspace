# Workspace Shell

**Status:** Approved Lovable presentation integrated through Phase 4.5 and localized in Phase 5A

## Purpose and observable behavior

The production wp-admin screen renders the approved Lovable application directly. There is no
replacement admin form. The Entry workspace retains Essentials and Extended sections, Focus Mode,
the operation queue, dialogs, keyboard flow, responsive composition, light/dark/system themes,
compact/comfortable density, preferences, and the existing visual hierarchy.

Phase 3 connects that presentation to real simple-product behavior:

- the product finder performs bounded server-side search and opens products for editing;
- create, edit, duplicate draft, Save & Next, conflict handling, reconciliation, safe retry, queue
  dismissal, and trash use same-origin Yaxii REST routes;
- server validation and operation failures remain visible rather than becoming fake success states;
- variable-product and deferred Free/Pro source remains preserved but hidden from production.

## State boundaries

React Query owns server data and invalidation. WordPress stores workflow defaults per user. The
browser stores only bounded presentation preferences and a versioned, TTL-aware session draft; it
does not store credentials, raw files, the WooCommerce catalog, or operation history.

The workspace status reflects the real same-site bootstrap and no longer displays a false offline
state. Frontend permission hints affect presentation only; REST controllers and application
services enforce the authoritative capabilities.

The pre-translation Phase 4.5 polish gives the workspace full ownership of its wp-admin content
surface. Page-specific WordPress gutters, wrapper spacing, bottom padding, and footer content are
removed without changing another admin screen. Branding and current-store terminology are
production-correct, while density remains a Settings preference rather than an Entry-toolbar
control. Queue filters retain their one-row Lovable presentation with touch, pointer-drag, and
keyboard overflow access.

## Runtime evidence and limits

Authenticated LocalWP QA covered create, search/open, edit/reload, duplicate, Save & Next, stale
conflict, validation and nonce errors, queue recovery, retry, dismissal, and trash. Visual checks
covered 1440px and 1280px desktop/laptop, 768px tablet, 430px and 375px mobile, light/dark,
compact/comfortable, Focus Mode, queue and confirmation/error dialogs, and structural RTL. A dark
mode heading contrast regression found during QA was fixed and rechecked.

Phase 5A completed WordPress-native French and Arabic catalogs across the production shell and
verified the actual authenticated user locale, `lang`, and `dir`. Arabic RTL and French/Arabic
layout resilience passed the same viewport, theme, density, Focus Mode, queue, dialog, editor, and
Settings surfaces. Detailed localization evidence is recorded in the Phase 5A checkpoint.
