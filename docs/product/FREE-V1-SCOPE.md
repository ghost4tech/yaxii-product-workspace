# Yaxii Product Workspace — Free v1 Scope

**Status:** Product authority

## Authority

This file defines the intended scope of the first public Free release.

## Release objective

Ship a WordPress.org-quality WooCommerce product-entry workspace that is meaningfully faster and more pleasant than the normal WooCommerce Add Product workflow.

The Free release must feel complete, not like a trial.

## Included in Free v1

### Product creation and management

- Create/edit simple products.
- Duplicate/prefill products.
- Trash products with clear semantics.
- Create/edit **basic variable products**.
- Global/custom attributes.
- Concrete variation combinations.
- Basic variation price, SKU, stock, enabled state, and image.

### Product fields

- Name and optional/automatic slug.
- Rich HTML description and short description with WordPress-sanitized persistence.
- Draft/publish intent.
- Catalog visibility.
- Regular/sale price and sale schedule.
- SKU.
- Manage stock, quantity, status.
- Basic backorder/sold-individually controls if kept in final UI.
- Weight/dimensions.
- Shipping class.
- Tax status/class.
- Hierarchical multi-category selection and tags.
- Featured image/gallery.
- Basic attributes and variation images.

### Productivity

- Modern Entry workspace.
- Focus Mode.
- Comfortable/Compact density.
- Essentials / Extended.
- Save & Next.
- Clear/reset.
- Autofocus product name.
- Repeat selected values after save.
- Duplicate previous product.
- Product defaults.
- Recent categories/terms.
- Contextual help tooltips with a global show/hide preference.
- Basic Set all price and Auto SKU for generated variations.
- Command menu/keyboard shortcuts.
- Searchable recent-operation/product queue.
- Truthful success/pending/partial/error states.
- Manual safe retry/reconciliation.
- Versioned local draft recovery.

### Experience

- Premium minimal design.
- Light/Dark/System.
- Reduced motion.
- Responsive simple-product entry.
- Touch-visible actions.
- EN / FR / AR.
- Production RTL.
- Locale-aware currency, dates, numbers, and units.
- WordPress user/capability integration.

### Platform foundation

- Plugin-owned wp-admin React root.
- Assets only on plugin screens.
- Same-origin WordPress REST API.
- WordPress cookie auth + REST nonce.
- Server-side capabilities and validation.
- WooCommerce CRUD persistence.
- Idempotent writes where duplicate submission is possible.
- Server-authoritative operation results.
- Paged product/taxonomy queries.
- WordPress media integration.
- No Woo consumer secrets in the browser.

## Hidden/deferred from Free v1

Keep source/reference if useful, but hide from production unless approved:

- Analytics.
- Multi-store.
- Team/invitations.
- License/fake plan switching.
- AI descriptions/images.
- General automation.
- Scheduled sync.
- Store health/latency.
- Fake sync/retry metrics.
- Generic CSV importer clone.
- Advanced batch jobs.
- Pro templates/presets.
- Advanced variation matrix/bulk tooling.
- Cross-store workflows.

## Free / Pro variation boundary

Free must support normal WooCommerce variable products correctly.

Pro can later add:

- spreadsheet-style matrix editing;
- bulk fill;
- advanced SKU rules;
- mass image mapping;
- large combination tools;
- advanced include/exclude filters.

Basic Set all price, basic Auto SKU, and missing-price indicators remain Free. Advanced formulas,
SKU patterns, matrix editing, and mass image mapping remain Pro candidates.

## Release blockers

Free v1 is not ready if:

- create/edit/duplicate remains fake/toast-only;
- variable writes are semantically incorrect;
- browser stores Woo secrets;
- retry can duplicate products;
- partial variation failure is reported as success;
- write routes lack proper capability checks;
- mobile Entry has blocking overflow;
- Arabic/RTL is structurally broken;
- fake Analytics/Team/Stores/License is visible as production functionality;
- build/tests are not reproducible;
- WordPress.org compliance fails.

## Success

A merchant can install Free and create real WooCommerce products faster without needing a Yaxii account, license, external API, or paid subscription.
