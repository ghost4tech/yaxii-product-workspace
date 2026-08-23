# Localization

Yaxii Product Workspace uses WordPress gettext with the text domain
`yaxii-product-workspace`. English is the source language. Arabic (`ar`) and French for France
(`fr_FR`) catalogs are maintained as development translation sources for contribution to
translate.wordpress.org.

## Runtime architecture

- PHP uses WordPress gettext functions with the final text domain.
- React/TypeScript calls the wrappers in
  `apps/product-butler/src/production/core/i18n/wordpress.ts`. They delegate to `wp.i18n` and retain
  English only as the source-language fallback.
- The production script declares `wp-i18n` as a dependency and calls
  `wp_set_script_translations()` without a custom path. WordPress therefore discovers the plugin's
  PHP and JavaScript catalogs in the standard `wp-content/languages/plugins` language-pack path.
- The Vite minifier preserves the wrapper names `__`, `_x`, and `_n` in the actual entry asset.
  This lets WordPress.org extract the React originals from the same hashed script path that runs in
  the browser and generate the correctly path-hashed JSON catalog. Identifier mangling and compact
  code generation remain enabled, while expression compression is disabled because it can fold
  separately extractable translated branches into a non-literal gettext argument.
- The text domain matches the WordPress.org slug. The plugin does not call
  `load_plugin_textdomain()` and has no plugin-owned language selector.
- The admin host and REST bootstrap both use the current user's WordPress locale. Direction is
  resolved in a temporary WordPress locale context, so a French user on an Arabic site receives
  `fr-FR/ltr`, while an Arabic user receives `ar/rtl`.

Do not add a plugin language selector. WordPress user/admin locale is the authority.

## Catalog files

- `languages/yaxii-product-workspace.pot`: canonical source template.
- `languages/yaxii-product-workspace-ar.po` and `.mo`: Arabic catalog.
- `languages/yaxii-product-workspace-fr_FR.po` and `.mo`: French catalog.
- `languages/yaxii-product-workspace-<locale>-<md5>.json`: WordPress-compatible JavaScript catalog
  for local development and runtime acceptance against the current built entry path.
- `languages/source/yaxii-product-workspace.js`: generated extraction-only JavaScript. It is never
  enqueued.
- `languages/source-map.json`: maps the extraction source to the current Vite entry asset.

## WordPress.org package scope

The release manifest ships only `languages/*.pot`. Maintained PO/MO files and locale-specific JSON
catalogs stay in the private development repository and are excluded from the WordPress.org ZIP.
WordPress.org language packs provide installed PHP and path-hashed JavaScript catalogs after the
translations are contributed, approved, and meet the language-pack threshold on
translate.wordpress.org. The development catalogs are import-ready sources; their presence in the
private repository does not mean WordPress.org distributes them. Until a pack exists for a user
locale, WordPress and the React application fall back cleanly to English.

## Reproducible update workflow

Run these commands from the plugin root. WP-CLI must provide `wp i18n`.

```powershell
npm --prefix apps/product-butler run i18n:source
wp i18n make-pot . languages/yaxii-product-workspace.pot --domain=yaxii-product-workspace --exclude=vendor,node_modules,assets/build,apps/product-butler/src,tests,docs
wp i18n update-po languages/yaxii-product-workspace.pot languages
wp i18n make-mo languages
npm --prefix apps/product-butler run build
npm --prefix apps/product-butler run i18n:map
wp i18n make-json languages languages --domain=yaxii-product-workspace --no-purge --pretty-print --use-map=languages/source-map.json
npm --prefix apps/product-butler run i18n:finalize
npm --prefix apps/product-butler run check:i18n
npm --prefix apps/product-butler run check:i18n-build
```

WP-CLI does not extract TypeScript/TSX directly. `i18n:source` walks the production import graph
from `src/main.tsx`, rejects common raw user-facing strings, and generates ordinary `wp.i18n`
calls for WP-CLI extraction. `check:i18n` fails if that generated source is stale or if catalogs,
placeholders, plural forms, MO files, or current JavaScript JSON artifacts are incomplete.
`i18n:finalize` removes obsolete generated hash catalogs and obsolete custom-path handle aliases.
`check:i18n-build` verifies that the minified runtime entry still exposes WordPress-extractable
gettext calls, exactly matches all 492 generated React messages, and that the release manifest
cannot include PO, MO, or locale JSON files.

The current Vite manifest contains statically imported vendor/editor chunks and no dynamically
imported application chunks. All translated application calls remain in the entry catalog, which
WordPress injects before the module executes. The built-message equality gate fails if a future
split moves translated calls out of that loading contract without an explicit localization design.

## Adding strings

- Use `__()` for ordinary strings and `_x()` when an English word is ambiguous.
- Use `_n()` for real plurals; do not concatenate a number onto a singular noun.
- Format placeholders with `sprintf()` and keep numbered placeholders stable when translators may
  reorder them.
- Add a nearby `translators:` comment for placeholders or non-obvious context.
- Pass the literal `yaxii-product-workspace` domain so extraction remains deterministic.
- Keep brands, URLs, identifiers, SKU values, slugs, and user/catalog data outside gettext.
- Use `dir="auto"` for user-entered prose where direction is unknown and `dir="ltr"` or `<bdi>` for
  technical identifiers that must remain readable in RTL.
- Prefer logical CSS (`start`/`end`, `ms`/`me`, `ps`/`pe`). Mirror only meaningfully directional
  icons.

After adding a string, run the complete update workflow, translate both catalogs, and run the
frontend, PHP, integration, and authenticated browser gates.

## Locale rules and terminology

Arabic follows the [WordPress Arabic translation guide](https://ar.wordpress.org/team/handbook/translation-guidelines/)
and [Arabic glossary](https://translate.wordpress.org/locale/ar/default/glossary/). It uses modern
standard Arabic, Arabic punctuation in prose, WordPress interface conventions, and Latin digits
`0–9`.

French follows the [WordPress French recommendations](https://fr.wordpress.org/team/handbook/polyglots/recommandations/),
[French glossary](https://translate.wordpress.org/locale/fr/default/glossary/), and
[French typography rules](https://fr.wordpress.org/team/handbook/polyglots/les-regles-typographiques-utilisees-pour-la-traduction-de-wp-en-francais/).
It uses formal `vous`, infinitive action labels, sentence-style capitalization, curly apostrophes,
and required French spacing.

Project terminology used when no more specific official glossary entry exists:

| English concept | French (`fr_FR`) | Arabic (`ar`) |
| --- | --- | --- |
| Product Workspace | Espace de travail des produits | مساحة عمل المنتجات |
| Entry | Saisie | الإدخال |
| Queue | File d’attente | قائمة الانتظار |
| Variable product | Produit variable | منتج متغير |
| Variation | Variation | تنويع |
| Global attribute | Attribut global | سمة عامة |
| Custom attribute | Attribut personnalisé | سمة مخصصة |
| Focus Mode | Mode concentration | وضع التركيز |
| Duplicate prevention / idempotency | Prévention des doublons | منع التكرار |

Official WordPress glossary terms override this project table whenever they apply.

## Intentional non-translations

The following may legitimately remain unchanged: Yaxii product/brand names, WordPress,
WooCommerce, URLs, keyboard shortcuts, SKU, code, slugs, IDs, UUIDs, technical field values, and
user-created catalog data. Global attribute and term names are catalog data, so an English `Color`
or `Green` value remains unchanged unless the merchant changes it.

## RTL and layout verification

The plugin-owned root receives `lang` and `dir` from the authenticated REST bootstrap. Portals,
dialogs, sheets, toasts, TipTap, category trees, queues, variation rows, and mixed-direction values
inherit or explicitly preserve the appropriate direction. Arabic QA must change the real WordPress
user locale; setting `dir` manually is not valid evidence.

The Phase 5A checkpoint records the authenticated locale, direction, workflow, viewport, theme,
density, Focus Mode, console/network, WooCommerce-data, and cleanup evidence. This localization
checkpoint does not establish release or packaging readiness.

## WordPress technical references

- [Plugin internationalization](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/)
- [JavaScript internationalization](https://developer.wordpress.org/apis/internationalization/)
- [WP-CLI i18n commands](https://developer.wordpress.org/cli/commands/i18n/)
