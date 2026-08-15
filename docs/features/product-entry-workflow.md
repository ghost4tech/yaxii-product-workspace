# Product Entry Workflow

**Status:** Shipped; localized for English, French, and Arabic (including right-to-left layout).

## Presentation authority

The category tree, rich descriptions, image workflow, edit banner, success state, contextual help,
and variable-product steps use the approved production presentation layer maintained in
`apps/product-butler`. Any design-reference or preview material used while developing this UI is
not imported into production — no preview categories, attributes, products, images, or simulated
success states ship in this package.

## Categories

The V2 selector writes multiple real `product_cat` term IDs through the existing product contract.
It loads bounded root pages, loads bounded direct children when branches expand, and performs
debounced cancellable search. Search resources include root-to-parent context. Selected IDs are
hydrated independently of the visible branch, so edit round-trips do not lose unloaded selections.
Fetched terms are cached for the current workspace session while every server fetch stays bounded;
recent choices remain a local UX preference.

The REST route requires an authenticated user with product-creation capability. WooCommerce and
WordPress remain authoritative for hierarchy, assignment validation, and saved product categories.

## Descriptions and media

Short and full descriptions use the V2 TipTap toolbar and compact or side-by-side presentation.
The browser sends editor HTML through the existing description fields. PHP applies `wp_kses_post`
before WooCommerce persistence, and canonical product reads hydrate the sanitized HTML back into the
editors.

Dropped editor and product images upload to the authenticated WordPress core media endpoint first.
Only attachment IDs and durable WordPress URLs enter product/editor state; blob URLs, base64 image
data, raw files, and credentials are excluded from persisted drafts and requests. Core media
permissions and site upload limits remain authoritative.

## Edit, success, and help

Queue edit uses the V2 editing banner, Cancel action, and Update Product state while retaining the
Phase 3 optimistic-version update contract. The V2 success overlay appears only after a canonical
server create/update result and dismisses promptly. It never converts processing, partial, uncertain,
or failed operations into a success display.

`HelpTip`, `Explain`, and the browser-local `showTooltips` preference are Free functionality. Hiding
tooltips changes guidance visibility only and does not alter validation or entitlements.

## Images and variations

The V2 empty dropzone, drag overlay, compact action, tighter gallery, reorder, Make main, and remove
interactions map to WordPress attachment IDs. Variation images use the same durable upload boundary.

The V2 Attributes -> Preview -> Variations workflow maps directly to Phase 4 global attribute IDs,
taxonomies, term IDs, custom options, and concrete combinations. Phase 4 limits, validation,
idempotency, partial recovery, and reconciliation remain server-authoritative. Free productivity is
limited to Set all price, basic Auto SKU, and missing-price guidance.

## Evidence and limits

Automated coverage includes bounded category URLs, selected-ID hydration, lazy hierarchy loading,
real global plus custom 2 x 3 generation, regeneration, Set all price, Auto SKU, core media upload,
durable rich-editor image insertion, description sanitization, and simple/variable lifecycle
regression.

Authenticated LocalWP QA proved multi-category and nested-category create/edit round-trip, category
search context, sanitized rich HTML and durable editor media, gallery ordering/main-image/removal,
cancel-safe editing, server-authoritative success UI, persisted tooltip preferences, and the complete
global Color by custom Size 2 x 3 variable workflow. Visual inspection covered 1440, 1280, 768,
430, and 375 pixels; light/dark, compact/comfortable, Focus Mode, queue, dialog, category tree,
TipTap, gallery, success states, and structural RTL. No measured viewport overflowed horizontally.
Phase 5A repeated the production workflows under the real French and Arabic WordPress user locales,
including categories, TipTap, media, success/error states, global/custom variations, queue, and
responsive layout. Detailed evidence and cleanup results are recorded in the Phase 4.5 closeout and
the Phase 5A localization checkpoint.
