# UX, mobile, dark mode, preferences and RTL audit

## Overall UX judgment

The prototype is visually more disciplined than a typical generated dashboard. Its best decisions are product-entry-specific: the Essentials/Extended hierarchy, queue proximity, restrained status styling, discoverable shortcuts, autofocus, repeat-value preference, and fast reset/next-product framing. Those are worth preserving.

It is not yet an operational product. Several attractive screens create false confidence: edit is toast-only, variable entry is blocked, analytics cannot be interrogated, store health is invented, and team actions falsely report success. Real product-entry speed depends on completing category, variation, duplication/edit, and error-recovery paths—not adding more cards.

## Persona evaluation

### Merchant — occasional product entry

**Good**

- Clear primary form, low initial information density, understandable Save & next framing.
- Required fields are visually labeled; extended fields remain available.
- Simple entry stacks cleanly on phones.
- Dark mode and basic preferences reduce friction.

**Friction/risks**

- Requiring category blocks the whole flow when no category data exists. WooCommerce itself can create a basic product with name and price, so the prototype is stricter without a safe onboarding path ([WooCommerce product management](https://woocommerce.com/document/managing-products/)).
- Published status is a hidden global default; a novice could unintentionally publish incomplete products.
- Shipping, tax class, tags and visibility are absent, so “saved” does not mean product-ready.
- Validation lacks a form-level summary and the category control does not explain why it is empty.
- Direct Woo key/CORS setup is inappropriate for an in-site plugin.

**Verdict:** promising interaction foundation for simple products; not a complete merchant workflow.

### Power user — many products weekly

**Good**

- Keyboard menu/shortcuts, autofocus, keep-values, duplicate-last, compact density, sticky queue, search/filter, and undo directly target repetition.
- Form and queue can be monitored side-by-side at desktop widths.

**Friction/risks**

- Duplicate works only on the latest product and is hidden in the command menu/shortcut.
- Edit does not exist; retry is not idempotent; no row selection, bulk fill, template, preset, SKU rule, saved view, or server-side job.
- Extended mode expands the form to full width and moves the queue below, breaking the “work + monitor” loop.
- Variable products cannot be entered, and the current option-centric data model cannot price multi-attribute combinations correctly.
- Queue “pagination” loads from a fully resident browser array; large catalogs would degrade quickly.
- No conflict/revision strategy for autosaved drafts.

**Verdict:** the right product instinct, but the workflows that create power-user value are mostly missing.

### Agency — multiple client stores

**Good**

- A persistent store switcher and consistent workspace shell are a reasonable visual concept.
- Store health, roles and cross-store reports identify real agency concerns at a conceptual level.

**Friction/risks**

- Stores are unrelated browser-local rows; the active mock store does not scope the product queue or Woo config.
- No tenant isolation, credential vault, delegated authorization, client capability model, audit trail, connection lifecycle, or conflict policy exists.
- Team roles are presentation-only and not mapped to WordPress users/capabilities.
- “Unlimited stores” is not a safe architecture or support commitment.

**Verdict:** Agency is a future product line, not a nearly complete Pro feature.

## Operational speed audit

| Workflow | Current speed | Operational reality | Decision |
|---|---|---|---|
| Simple product essentials | Fast-looking | Blocked until category exists; incomplete field set. | Preserve layout, fix data/onboarding. |
| Repeated similar products | Good concept | Keep-values and duplicate-last help, but hidden/inexact and no templates. | Free repeat-values; Pro explicit presets/templates. |
| Edit a queued product | One click visually | No edit occurs. | Must build in Free. |
| Recover a failed sync | One menu action | Can mark pending without a request; a retry may create duplicates. | Must redesign around job/idempotency state. |
| Variable product | Compact initially | Add Attribute no-ops; data model is wrong for combinations. | Rebuild before claiming support. |
| Image entry | Attractive gallery | No media library, alt text, durable draft, validation or true progress. | Integrate WP media; keep gallery concept. |
| Bulk CSV | One button | No workflow. Core Woo already has an importer/exporter. | Do not monetize the existence of an upload button. |
| Multi-store switch | One click | Does not actually isolate data/connections. | Future Agency architecture. |

## Feedback, prevention and accessibility

- Positive: toast feedback, status tones, empty queue copy, focus-visible styles, labels, reduced-motion toggle, keyboard command discovery.
- Critical: fake success for email, store health, license, CSV/AI and some retry states.
- Critical: product/variation write path lacks idempotency and rollback semantics.
- Important: buttons inside `VariationsEditor` need explicit intent; nested form default behavior breaks the workflow.
- Important: invalid form submission needs an error summary/focus management, particularly on mobile when the failing field is off-screen.
- Important: icon-only row actions are hidden until hover; touch devices do not have hover. They were still focusable, but discoverability is weak.
- Important: color is generally paired with text/icon, which is good; contrast should still receive automated/manual WCAG testing.
- Important: drag-only image ordering needs keyboard controls.
- Important: date formatting is hardcoded and not locale-aware.

## Mobile audit

### Breakpoint results

| Viewport | Entry | Navigation | Tables/analytics | Verdict |
|---|---|---|---|---|
| 375x812 | No page overflow; 2x2 KPIs; long form → queue; action row tight. | Horizontal nav; later destinations off-screen. Header loses store/search/tier/status context. | Settings overflows globally; stores/team tables hide key columns; analytics is very long. | Simple entry usable, application not comprehensively mobile-ready. |
| 430x932 | Slightly more breathing room; same structure. | Same horizontal navigation issue. | Settings still overflows/crushes labels. | Same conclusion. |
| 768x1024 | Entry and queue remain stacked, producing roughly a two-screen-plus journey. | Full labels fit better. | Tables remain dense. | Usable tablet input, weak monitoring productivity. |
| 1280x800 | Two-column entry/queue; good default composition. | Full shell. | Tables/charts fit. | Strongest operational layout. |
| 1440 desktop | Balanced shell and cards. | Full shell. | Analytics/dark verified. | Strong visual target. |
| 1920x1080 | Content remains constrained at `max-w-7xl`; no excessive stretching. | Full shell. | Large whitespace is acceptable. | Good. |

### Mobile-specific findings

- Navigation transformation is only overflow, not prioritization. Entry and Settings should remain direct; Pro/secondary destinations can move behind a More menu on narrow screens.
- Entry simple flow is genuinely usable, not merely responsive-looking. It still needs a sticky/safely reachable Save action for long extended forms and a form-error summary.
- Variable management is not usable on any size; a real matrix should not be squeezed into phone tables. On mobile, use a guided attribute → combination → per-variation editor, and explicitly omit desktop-only bulk matrix operations when necessary.
- Store/team tables need cards or a deliberate compact primary-column view with row details/actions—not invisible horizontal overflow.
- Bulk selection and matrix editing should be desktop/tablet features with a reduced mobile workflow, not forced parity.
- Dialogs fit 375px and respected dark mode in testing.
- Image grid touch targets are acceptable in size, but remove/reorder controls rely on hover/drag and need touch/keyboard alternatives.
- Settings is a release blocker: `TabsList` and fixed 110/170px controls combine with non-wrapping flex rows to create page overflow and unreadable label columns.

Evidence: `runtime-evidence/screenshots/entry-mobile-375.png`, `entry-mobile-430.png`, `entry-tablet-768.png`, `entry-laptop-1280.png`, `entry-large-1920.png`, `settings-mobile-375.png`, `settings-mobile-430.png`, `stores-mobile-375.png`, `team-mobile-375.png`, `analytics-mobile-375.png`.

## Dark mode and design system

### What is good

- Tailwind is configured with `darkMode: ['class']`.
- `index.css` defines semantic HSL variables for background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring, brand, success/warning/info, chart colors and tile colors.
- Components predominantly consume semantic tokens rather than literal light colors.
- Runtime checks showed dialogs, dropdowns, toasts, forms, queue, and Recharts tooltips/charts remain legible in dark mode.
- Density and reduced motion are document attributes, allowing cross-component behavior.
- Typography, radius and restrained shadow tokens support the desired premium/minimal direction.

### Gaps

- Store/avatar colors and some seed visualization colors are hardcoded hex values.
- Accent switching mutates `--primary`, `--ring` and `--brand` together; this can erase semantic distinction and needs contrast testing in both themes.
- Dark mode is implemented by custom `PreferencesEffects`, while `next-themes` is also installed and Sonner imports theme behavior; this is redundant ownership.
- Two toast systems are mounted, increasing inconsistency and bundle weight.
- Google Fonts are remotely loaded and the fallback differs from a controlled WordPress asset strategy.
- `App.css` is unused Vite starter residue.
- WordPress admin styles would target generic elements/classes (`button`, `table`, headings, `.notice`) unless the compiled application is isolated/scoped. Current global `body` and `*` rules are unacceptable to load across wp-admin.

### Tokens worth keeping

- Surface/background/foreground/card/popover.
- Semantic border/input/ring.
- Success/warning/destructive/info.
- Chart palette, after contrast tests.
- Radius scale and soft/card shadows.
- `label-eyebrow`, `section-label`, `data-row`, `kbd`, `num-kpi`, density and reduced-motion concepts.

Use a plugin root such as `.yaxii-product-workspace` and scope the reset/base layer to it. Prefer self-hosted/system fonts. Asset loading must be limited to plugin screens.

## Preferences audit

The current source of truth is localStorage through Zustand. Recommended scope assumes the future app runs inside one store's wp-admin.

| Preference | Current control/default | Current persistence | Recommended scope | Backend needed? | Value/decision |
|---|---|---|---|---|---|
| Theme | Light/Dark/System; Light | Browser | WP user | Yes, with local early-read to prevent flash | High; keep. |
| Density | Comfortable/Compact; Comfortable | Browser | WP user | Yes | High for queue; keep. |
| Accent | 4 swatches; Graphite | Browser | WP user or remove | Optional | Low/medium; one restrained brand theme may be simpler. |
| Reduce motion | Switch; off | Browser | WP user + OS fallback | Optional | Accessibility value; keep. |
| Tabular numerals | Switch; on | Browser | None | No | Dead and overly granular; make it a token default, remove control. |
| Landing tab | Select; Entry | Browser | WP user | Yes | Medium; keep only when destinations are available. |
| Keyboard hints | Switch; on | Browser | WP user | Yes | Useful; keep. |
| KPI trends | Switch; on | Browser | WP user | Optional | Low before truthful data; defer control. |
| Sticky queue | Switch; on | Browser | WP user | Yes | High on desktop; keep. |
| Autofocus name | Switch; on | Browser | WP user | Yes | High for power users; keep. |
| Keep values after save | Switch; off | Browser | WP user | Yes | High; improve with explicit retained-field checklist/preset. |
| Confirm before delete | Switch; off | Browser | WP user | Yes | Keep if “delete” semantics are clear. |
| Sound on save | Switch; off | Browser | None | No | Dead/low value; remove. |
| Group queue by day | Switch; on | Browser | WP user | Yes | Medium; keep if queue remains central. |
| Relative timestamps | Switch; on | Browser | WP user | Yes | Medium; keep. |
| Rows per page | 10/25/50/100; 25 | Browser | WP user | Yes | Keep, but server controls limits/cursors. |
| Default stock status | Select; In stock | Browser | WP user creation default | Yes | Keep; never override product silently on edit. |
| Default product status | Select; Published | Browser | WP user/store policy | Yes | Keep but safer default Draft for first run; store may enforce policy. |
| Catalog visibility | Select; visible | Browser | WP user creation default | Yes | Keep. |
| Stock management | Switch; off | Browser | WP user creation default | Yes | Keep. |
| Tax status | Select; taxable | Browser | WP user/store context | Yes | Keep; inherit store norms where possible. |
| Auto-generate variations | Switch; on | Browser | WP user | Yes | Replace with explicit combination preview; default should not hide a large write. |

No language, currency, units, notification, table-column or product-type preference exists. Locale/currency/units should come from WordPress/WooCommerce bootstrap; do not duplicate them as arbitrary browser settings. Language is a WP user/site locale concern, with an optional in-app override only if justified.

## Internationalization and RTL

### Current strategy

- `index.html` hardcodes `lang="en"`.
- No i18n library, translation catalogs, message IDs, locale formatter layer, or `dir` management exists.
- Nearly all visible strings are hardcoded in JSX, stores and mock data.
- `date-fns` formatting and `toLocaleDateString('en', ...)` hardcode English.
- Currency is rendered as `$` in JSX and mock data.

### RTL stress-test result

Forced `dir="rtl"` showed that flex/grid primitives mirror much of the overall composition, and no body overflow appeared on Entry. This is incidental browser behavior, not readiness. English remained everywhere; mixed punctuation/SKU/time strings became awkward; table alignment, icons, absolute controls and paddings retained physical direction.

Physical classes occur throughout active code: `ml/mr`, `pl/pr`, `left/right`, `text-left/right`, `border-l/r`, and absolute top-left/top-right image/dialog controls. Radix/shadcn primitives also contain physical positioning. Chevrons, arrows, next/previous controls and slide animations are not direction-aware.

### Classification

**Poor** overall RTL readiness. The layout skeleton is salvageable, but absence of localization architecture alone prevents “mostly ready.”

### Required architecture

- WordPress supplies locale and direction in bootstrap; set `lang` and `dir` on the plugin root (and portal container), not by duplicating whole layouts.
- Use one message catalog abstraction compatible with WordPress translations (`@wordpress/i18n` is the natural in-admin choice) and extract every visible/error/ARIA string.
- Centralize `Intl.NumberFormat`, `Intl.DateTimeFormat`, currency and unit formatting using Woo store configuration.
- Migrate active styles to logical utilities/properties: `ms/me`, `ps/pe`, `start/end`, logical borders, `text-start/end`.
- Make directional icons explicit: neutral icons stay; back/next/chevrons and motion paths flip under RTL.
- Verify Radix portals inherit the root direction and tokens.
- Test EN/FR/AR at every supported viewport, including long French labels and Arabic mixed with SKU/URLs/numbers.
- Add automated RTL lint/search gates and browser visual/interaction tests; forced `dir` screenshots are not translation acceptance.

Evidence: `entry-forced-rtl-desktop.png`, `entry-forced-rtl-mobile-375.png`.
