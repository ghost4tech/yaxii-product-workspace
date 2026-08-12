# Product Workspace Runtime Evidence

## Test setup

- App: Lovable React prototype in `apps/product-butler`
- Browser automation: `agent-browser`
- Runtime URL: `http://127.0.0.1:4173`
- Audit date: 2026-08-11
- Viewports: 375x812, 430x932, 768x1024, 1280x800, 1440 desktop, 1920x1080
- Themes/direction: light, dark, compact/comfortable, forced `dir="rtl"`
- Evidence: screenshots in `runtime-evidence/screenshots/`. Video capture was attempted, but the local browser driver had no FFmpeg support; no video claim is made.

## Reproducible issues

### PW-001 — Variable product attribute creation is a no-op

- Severity: Critical for the advertised variable-product workflow
- Reproduction: Entry → enable Variable product → click Add Attribute.
- Result: no attribute editor appears and no feedback is shown.
- Source cause: `VariationsEditor` buttons inside the product `<form>` omit `type="button"`; the shared button renders a native button, whose default form behavior is submit.
- Evidence: `issue-001-step-1.png`, `issue-001-result.png`, `entry-variable-desktop.png`.

### PW-002 — A clean offline install cannot save a product

- Severity: Critical
- Reproduction: open category picker before a connection exists, search any category, then attempt a valid-looking save.
- Result: categories are empty, the required category cannot be selected, and validation feedback is easy to miss. The prototype seeds products but not categories.
- Source: `productStore.categories` defaults to `[]`; categories arrive only through the unsafe direct Woo service.
- Evidence: `entry-category-popover.png`, `entry-validation-empty.png`.

### PW-003 — Queue “Edit” falsely claims an edit mode

- Severity: High
- Reproduction: open any row menu → Edit.
- Result: a toast says the product is being edited, but the form is not populated and no edit state exists.
- Source: `Entry.tsx` passes a toast-only callback to `ProductQueue.onEdit`.
- Evidence: `queue-actions-menu.png`, `queue-edit-filled-form.png`.

### PW-004 — Team actions report backend success without a backend

- Severity: High
- Reproduction: Pro preview → Team → invite a valid email, change a role, resend, or remove.
- Result: success toasts are shown with zero network requests; invite and role state disappear on reload.
- Source: all members live in component-local `useState`; “Invitation emailed” is unconditional copy.
- Evidence: `team-invite-popover.png`, `team-pro-desktop.png`.

### PW-005 — Woo credentials are sent from the browser and persisted client-side

- Severity: Critical security/architecture risk
- Reproduction: Connect Store → enter a URL and fake key/secret → submit.
- Result: the browser sends Basic Auth directly to the remote Woo REST API and suggests permissive CORS headers on failure. Successful credentials would be persisted in localStorage by `woo-product-store`.
- Source: `services/woocommerce.ts`, `WooCommerceSetup.tsx`, `productStore.ts`.
- Evidence: `connect-store-modal.png`, `connect-store-mobile-375-dark.png` plus captured request log.

### PW-006 — Settings is not mobile-usable

- Severity: High
- Reproduction: Settings at 375px or 430px.
- Result: the four-tab strip creates page-level horizontal overflow (about 506px content at 375px), and fixed-width controls crush labels into narrow word columns.
- Evidence: `settings-mobile-375.png`, `settings-mobile-430.png`.

### PW-007 — Premium entitlement is a persistent client-side switch

- Severity: High licensing risk
- Reproduction: select Pro or “Try Pro for this session,” then reload.
- Result: all gates remain unlocked because `tier: "pro"` is persisted in localStorage despite “this session” copy.
- Source: `tierStore.ts`, `UpgradeModal.tsx`, `AppShell.tsx`.
- Evidence: `bulk-csv-upgrade-modal.png`, `license-pro-session.png`.

### PW-008 — Pro controls are demonstrations, not operations

- Severity: Medium/High depending on claim
- Reproduction: click CSV, AI descriptions, analytics Filters/Export/View all, store Test connection.
- Result: toast-only or no-op behavior; no upload, generation, filtering, export, or health request occurs. Analytics period changes only one label while fixed “30 day” values remain.
- Evidence: `bulk-csv-pro-dialog.png`, `analytics-pro-desktop.png`, `stores-pro-desktop.png`.

### PW-009 — Image draft recovery is incomplete

- Severity: Medium
- Reproduction: add an image, confirm preview, reload.
- Result: the preview is lost; `File`/blob URL state is not durable. Object URLs are also not comprehensively revoked on replacement/unmount.
- Evidence: `image-upload-preview.png`.

### PW-010 — Queue retry can imply work without doing work

- Severity: High
- Reproduction: retry a failed mock row while disconnected.
- Result: status is changed to pending, but no request or failure feedback follows.
- Source: `Entry.tsx` changes status before checking `wooConfig?.connected`.

## Runtime positives

- Simple-entry hierarchy, progressive disclosure, queue search/status filters, delete/undo, draft text recovery, command menu, keyboard navigation, theme switching, and dark charts were demonstrably interactive.
- Entry has no page-level overflow at the tested mobile widths; dialogs and theme tokens generally render cleanly.
- These positives are frontend-local capabilities, not WooCommerce proof.
