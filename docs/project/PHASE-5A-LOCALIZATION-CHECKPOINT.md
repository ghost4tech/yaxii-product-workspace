# Phase 5A Localization Checkpoint

**Status:** Acceptance correction implemented and authenticated QA passed; owner retest pending
**Branch:** `phase/05a-complete-localization`
**Base:** merged Phase 4.5 `main` at `5a05843c0e9b55d972a86f63aeb65a1858358204`
**Release state:** not release-ready; packaging and release hardening have not started

## Acceptance correction - 2026-08-15

### Why the owner saw English

The post-closeout cleanup had restored the original plugin directory as the active LocalWP plugin.
That directory was still the owner-edited `phase/04-5-lovable-v2-ui-integration` checkout at
`3e9426f675e6a0332c3ae6123e5f40750cda61f0`, not Phase 5A. Its manifest referenced
`main-BPmGM3zU.js` and `main-CS__jORd.css`, so the owner was testing the older non-localized build.

The clean Phase 5A worktree at `C:\wt-ypw-05a` was independently verified at
`335ea50348e30ac4de498bfa1b5864c6ffc084be`. Before any translation source was changed, that exact
checkout served its own built assets and loaded Arabic correctly in a fresh authenticated session.
This proves that WordPress gettext, `wp_set_script_translations()`, the script handle, MO file, and
Jed JSON mapping were already functional; the English report was caused by the wrong active
checkout, not broken translation code.

LocalWP now activates `yaxii-product-workspace-phase5a/yaxii-product-workspace.php`, a directory
junction to the clean Phase 5A worktree. The owner-edited `AGENTS.md`, `CLAUDE.md`, and untracked
prototype directory in the original checkout were not modified. The junction remains active for
owner acceptance.

### RTL corrections

- A Radix direction provider now follows the authenticated bootstrap direction. This removes the
  library-default `dir="ltr"` that previously made Settings tabs, rows, Selects, and nested controls
  lay out as LTR inside an otherwise RTL application.
- The plugin portal root receives the exact bootstrap `dir` and `lang`, so Select, category,
  dropdown, command, dialog, tooltip, and popover content inherits Arabic direction.
- Shared Select and dropdown primitives use logical padding, indicator placement, text alignment,
  shortcut placement, and directional submenu chevrons.
- Switch roots deliberately retain `dir="ltr"` for a stable physical state convention: unchecked
  is OFF-left and checked is ON-right. Both pointer and Space-key toggling were verified; surrounding
  labels and rows remain RTL.
- Explicit left/right help-tooltip placement is mapped through the current direction. Category
  expansion, Save and Next motion, dialog/popover text, and the unavailable-WooCommerce alert use
  logical direction rules.
- SKU, prices, quantities, product IDs, queue prices, KPI values, taxonomy identifiers, and keyboard
  shortcuts are isolated with `dir="ltr"`/`bdi` as appropriate. User/catalog labels retain
  `dir="auto"`. Arabic formatting continues to emit Latin digits.

### Corrected runtime evidence

The final correction build uses `main-Ce-a8jPu.js` and `main-KhsdlFmS.css`. HTTP responses were
byte-identical to the worktree files (SHA-256
`44437290E004DBC2094C5B9363291CCD8F69BACD6462FDA64F71D1C0D622D8E4` and
`10FDF7819764A34BBC342204BC7545F5B7A16BB2618DDD9BF18897B49AA85378`). The active plugin version
remains `0.2.0-alpha.1`.

Authenticated Arabic checks confirmed `lang="ar"`, `dir="rtl"`, bootstrap locale `ar`/`rtl`, an
Arabic WordPress user locale, the PHP MO translation `Product Workspace` ->
`مساحة عمل المنتجات`, and an inline Jed catalog attached to
`yaxii-product-workspace-app-js-translations`. Its current script handle loads
`main-Ce-a8jPu.js`, and contextual JavaScript gettext resolves `Entry` to `الإدخال`.

The Arabic interaction sweep covered Header/navigation, Entry, Extended, Focus Mode, Find Product,
hierarchical categories and selected chips, TipTap, product and variation media frames, simple
create/edit, variable custom/global controls, combination preview, variation rows and switches,
queue actions and mobile queue sheet, queue-filter keyboard scrolling/fades, dialogs, tooltips,
command menu, all Settings sections, and the Yaxii ecosystem section. The 1440, 1280, 768, 430,
and 375 viewports passed without measured document or plugin-root horizontal overflow across
light/dark and compact/comfortable states, including Focus Mode. French and English targeted
smokes remained LTR and overflow-free.

Simple product `1708` was created, updated to price `29`, and read back from WooCommerce. Variable
product `1709` was created with two concrete variations (`1710`, `1711`), Latin technical SKUs,
and bulk price `24.50`. All four exact QA IDs were force-deleted after verification.

## Delivered scope

- Replaced the former locale message maps with WordPress-native PHP and JavaScript gettext using
  `yaxii-product-workspace`.
- Added the canonical POT, complete Arabic and French PO/MO catalogs, and WordPress Jed JSON files
  for the current Vite production entry.
- Added deterministic production-graph extraction and catalog checks for raw UI text,
  completeness, placeholders, plurals, MO output, and current built-script JSON mapping.
- Localized the complete production workspace, REST/PHP messages, accessibility labels, editor,
  media flow, queue, KPI, Settings, dialogs, tooltips, error, empty, loading, and success states.
- Made locale and direction follow the authenticated WordPress user rather than the site-global
  locale.
- Completed logical RTL, bidi isolation, Latin-digit Arabic formatting, directional-icon review,
  and French/Arabic layout resilience without redesigning Lovable V2.
- Added the maintained localization guide and terminology record.

## Independent language review

Arabic was reviewed a second time for WordPress glossary consistency, modern standard Arabic,
interface-action wording, hamza/spelling, Arabic punctuation, Latin digits, grammar, placeholders,
and six-form plurals. French was reviewed a second time for the official glossary, formal `vous`,
infinitive actions, sentence capitalization, accents, apostrophes, typography, natural syntax, and
two-form plurals.

Intentional unchanged content is limited to brands, WordPress/WooCommerce, URLs, shortcuts,
SKU/code/IDs/UUIDs, and user/catalog data. Browser QA observed `Color`, `Green`, `Beige`, and
`Clothing` as existing WooCommerce data, not source-string leakage.

## Authenticated LocalWP QA

The real site at `http://ysf-lite.local` was tested through a temporary administrator by changing
that user's actual WordPress locale and normally reloading the plugin. No manual `dir` simulation
was used.

Arabic (`ar`) evidence:

- `lang="ar"`, `dir="rtl"`, and computed RTL were verified after bootstrap.
- 1440, 1280, 768, 430, and 375 viewports passed with zero measured horizontal overflow.
- Light/dark, compact/comfortable, and Focus Mode passed.
- The visible Latin-only inventory was limited to Yaxii Product Workspace, WordPress,
  WooCommerce, SKU, keyboard shortcuts, and catalog data.
- No Arabic-Indic or Persian digits appeared in the plugin root.
- Simple create/update produced product 1595 with price `19.99`, category 16, and Arabic rich text.
- Variable create produced product 1596 with custom Arabic size options, global Color terms, four
  concrete variations (1597–1600), and bulk price `24.50`.
- Find Product, hierarchical categories, TipTap, translated WordPress media library, queue/KPI,
  tooltips, dialogs, command menu, shortcuts, Settings, ecosystem, success, and validation states
  were exercised.

French (`fr_FR`) evidence:

- `lang="fr-FR"`, `dir="ltr"`, and computed LTR were verified while the site-global locale
  remained Arabic. This found and fixed the original user-locale direction defect.
- 1440, 1280, 768, 430, and 375 viewports passed with zero measured horizontal overflow after a
  narrow Settings action row was made wrap-safe.
- Light/dark, compact/comfortable, and Focus Mode passed.
- Simple create/update produced product 1601 with price `29.90`, category 16, French rich text, and
  an existing media attachment selected through the translated WordPress media library.
- Find Product opened the real variable product and displayed its global/custom attributes and
  four variation rows in French.
- Queue/KPI, tooltips, dialogs, command menu, shortcuts, Settings, ecosystem, success, and
  validation states were exercised.

English (`en_US`) regression evidence:

- `lang="en-US"`, `dir="ltr"`, desktop and 375px edit views had zero measured overflow.
- Find Product opened a real WooCommerce product; browser console error inspection returned no
  Product Workspace errors.

Network and data evidence included HTTP 201 product and variable-product writes, HTTP 200 updates,
and direct authenticated REST reads of product type, attributes, terms, combinations, price,
description, category, and image IDs. Freemius emitted unrelated debug console noise. LocalWP CLI
emitted the pre-existing missing `php_imagick.dll` startup warning; media-library selection and
Product Workspace behavior still passed.

## Verification

- Frontend authoritative check: 119 production modules, 482 JavaScript messages, 616 POT entries,
  129 maintained production files within the line limit, 78 tests in 22 files, production build,
  and 24-asset boundary scan.
- Translation artifacts: two complete catalogs, French two-form plurals, Arabic six-form plurals,
  placeholder parity, MO files, hash JSON, stable handle JSON, and source-map validation passed.
- PHP: PHPCS, PHPStan, 32 unit tests with 90 assertions, and 38 LocalWP integration tests with 456
  assertions passed.
- Production dependency audit reported zero vulnerabilities.
- Clean Code, WordPress, WooCommerce, test, and documentation guards were run; actionable findings
  were fixed and affected checks rerun.

For the 2026-08-15 correction, the frontend authoritative check and production dependency audit
passed again. PHPStan and 32 unit tests with 90 assertions also passed. PHP lint passed for all 89
maintained PHP files. The aggregate Composer check is not green in this Windows worktree because
PHPCS reports the existing CRLF checkout line endings across untouched PHP and test files; those
unrelated files were not bulk-rewritten for this frontend RTL correction. WooCommerce application
behavior did not change, so the unrelated full integration suite was not rerun; authenticated
browser create/update/variable flows supplied the targeted live WooCommerce evidence.

## Cleanup and boundary

Temporary products 1595, 1596, variations 1597–1600, and product 1601 were force-deleted after
exact-ID verification. The temporary administrator was deleted.

Correction fixtures 1708-1711 and temporary administrators 69 and 70 were deleted after exact-ID
verification. Existing media and catalog data were not deleted. The Phase 5A junction deliberately
remains active so the owner tests the accepted branch rather than the older owner-edited checkout.

No Pro previews, new product features, telemetry, release ZIP, packaging, publication, deployment,
or final release hardening were added. Stop here for owner review.
