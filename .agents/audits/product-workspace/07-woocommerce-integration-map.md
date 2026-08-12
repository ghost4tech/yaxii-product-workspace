# WooCommerce integration map

## Integration principle

The React app will run inside the same WordPress installation it manages. It should call plugin-owned same-origin REST endpoints authenticated as the current WordPress user. PHP performs WooCommerce CRUD. The browser must not hold Woo consumer keys or call `wc/v3` directly.

Woo's product APIs support create/read/update/delete and batch operations, but this plugin should expose application-level resources suited to the workspace rather than mirror every Woo endpoint ([Woo products API](https://developer.woocommerce.com/docs/apis/rest-api/v3/products)). PHP should use `WC_Product`, `WC_Product_Simple`, `WC_Product_Variable`, `WC_Product_Variation`, `wc_get_product(s)` and setters/save rather than direct post/meta writes. Woo recommends `wc_get_products`/`WC_Product_Query` as the stable query boundary ([Woo query guidance](https://developer.woocommerce.com/docs/features/products/wc-get-products/)).

## Ownership map

### Native WooCommerce CRUD

- Simple/variable product identity, type, name, slug, description, short description.
- Publication status, featured flag, catalog visibility.
- Regular/sale prices and sale dates.
- SKU, manage stock, quantity, stock/backorder state, sold individually.
- Weight/dimensions/shipping class, tax status/class, virtual/downloadable fields when in scope.
- Product gallery attachment IDs.
- Product attributes and concrete variations.
- Duplicate/edit/trash operations through product CRUD/application services.

### WordPress/WooCommerce taxonomy

- Product categories (`product_cat`) and tags (`product_tag`).
- Global Woo attributes (`pa_*`) and their terms.
- Shipping classes where exposed.
- Product-local custom attributes remain product data, not global taxonomy terms.

### WordPress media

- Attachment search/select/upload, MIME/size permissions, alt text.
- Product/variation media references are attachment IDs.
- Prefer the WordPress media frame or a thin same-origin resource; never base64 entire catalogs.

### Yaxii plugin-owned data

- User preferences and product-entry defaults.
- Templates/presets and import mapping recipes.
- Idempotency records and operation/job results.
- Batch/import schedules, progress, retries and logs.
- Optional extended activity history/retention.
- Entitlement cache/status (server-owned), feature flags.
- Agency connections/store registry only in the future architecture.

### Browser-only state

- Unsaved form values, current step/tab, selected rows, open overlays.
- Local draft cache with version/TTL (excluding secrets and non-durable blob assumptions).
- Pending local file previews before upload.
- Query cache, optimistic display state that can be reconciled.
- Early theme preference cache.

### Future SaaS/API — only if justified

- License/subscription validation.
- AI generation provider proxy.
- Secure multi-store agency control plane, invitations/identity across sites, fleet monitoring.

No SaaS is required for local Free or Pro product CRUD/templates/batch jobs.

## Capability-by-capability flow

### Bootstrap current store

```text
Load workspace
→ GET /yaxii-product-workspace/v1/bootstrap
→ BootstrapService
→ WordPress current user + Woo settings/status + server entitlement adapter
→ BootstrapResource
```

Returns locale/direction, user/capabilities, currency/units/timezone, Woo availability/version, supported product features, REST nonce context and server-authoritative tier/flags. No secrets.

### Search/list products

```text
Queue/catalog query
→ GET /products?search=&status=&type=&cursor=&per_page=
→ ProductQueryService
→ WC_Product_Query / wc_get_products
→ ProductListResource + next cursor/total where cheap
```

Server-side filtering/paging; never load the full catalog. The v1 entry queue may instead list only plugin operations/recent products, clearly labeled.

### Read/edit product

```text
Open product for edit
→ GET /products/{id}
→ ProductReadService
→ wc_get_product + taxonomy/media adapters
→ ProductResource + editable actions/version

Save edit
→ PATCH /products/{id}
→ ProductUpdateService
→ existing WC_Product subtype setters + save
→ ProductResource + OperationResult
```

Use an `If-Match`/version token or `modified_gmt` comparison to prevent silent overwrites. PATCH field presence must be distinguished from clearing.

### Create simple product

```text
Save simple product
→ POST /products with Idempotency-Key
→ ProductCreationService
→ validate command → WC_Product_Simple setters/save → taxonomy/media assignment
→ ProductResource + OperationResult
```

One cohesive operation prevents the frontend from orchestrating half-created records. If taxonomy/media references fail validation, return field errors before writing where possible.

### Create variable product

```text
Save variable product with attributes/combinations
→ POST /products with discriminated variable command + Idempotency-Key
→ VariableProductCreationService
→ AttributeResolutionService
→ WC_Product_Variable save + WC_Product_Variation saves
→ ProductResource + per-variation OperationResult
```

The service validates combination uniqueness and a maximum combination count before writes. For large products, use a staged/batch operation; never have React issue one request per variation.

### Categories/tags

```text
Search terms
→ GET /taxonomies/{category|tag}/terms?search=&parent=&cursor=
→ TaxonomyQueryService
→ get_terms / Woo taxonomy registry
→ TaxonomyTermResource page

Create term (optional)
→ POST /taxonomies/{taxonomy}/terms
→ TaxonomyTermCreationService
→ wp_insert_term after taxonomy capability check
→ TaxonomyTermResource
```

Global attributes require a dedicated cohesive resource because attributes and terms are related but distinct.

### Attributes/terms

```text
Load global attributes
→ GET /attributes?search=
→ AttributeQueryService
→ wc_get_attribute_taxonomies + term queries
→ AttributeResource[]

Resolve/create allowed terms
→ POST /attributes/{id}/terms (only when user chooses create)
→ AttributeTermService
→ wp_insert_term for resolved pa_* taxonomy
→ AttributeTermResource
```

Product-local attributes travel inside the product command and do not create global taxonomies.

### Media

Preferred local-admin path:

```text
Choose/upload image
→ WordPress media frame or POST /wp/v2/media with X-WP-Nonce
→ WordPress media controller
→ attachment APIs
→ MediaResource/attachment model

Assign image IDs
→ included in create/update product command
→ ProductMediaService
→ WC product image/gallery setters
→ ProductResource
```

If a plugin wrapper is needed for validation/DTO consistency, keep it thin. Remote-image ingestion, if later present, needs SSRF controls and an asynchronous job.

### Duplicate

Two distinct features:

```text
Prefill a new form from product
→ GET /products/{id}
→ frontend clone mapper clears IDs/SKU as configured
→ browser draft only

Server duplicate now (future/bulk)
→ POST /products/{id}/duplicate with Idempotency-Key
→ ProductDuplicationService
→ Woo product duplicate support / explicit CRUD clone policy
→ ProductResource
```

Free v1 can use prefill-first because it is inspectable before save.

### Delete/trash

```text
Trash product
→ DELETE /products/{id}?force=false
→ ProductDeletionService
→ current_user_can(edit/delete product) + Woo/WordPress trash behavior
→ deleted/trash ProductResource
```

Removing an unsaved/local queue item stays browser-only. The UI must never use one “Delete” label for both meanings.

### Retry

```text
Retry failed operation
→ POST /operations/{operationId}/retry with Idempotency-Key
→ OperationRetryService
→ verify retryable state + reuse original command/idempotency record
→ OperationResultResource
```

Do not call Create Product again from a row without reconciling whether the original succeeded.

### Preferences/defaults

```text
Load/save preferences
→ GET/PUT /preferences/me
→ UserPreferencesService
→ WordPress user meta or plugin preference storage
→ UserPreferencesResource
```

One resource is enough. Server validates keys; browser may cache theme for first paint.

### Templates/presets (Pro)

```text
Create/list/apply template
→ /templates collection/resource operations
→ TemplateService
→ plugin-owned persistence + taxonomy compatibility resolver
→ TemplateResource / ApplyTemplateResult
```

Applying to the form is normally read/transform only; applying to existing products is a batch job with preview.

### Bulk/import (Pro)

```text
Upload/define batch
→ POST /imports
→ ImportPlanningService
→ secure upload + parser + mapping/validation
→ ImportPlanResource (counts, warnings, sample diffs)

Execute approved plan
→ POST /imports/{id}/execute with Idempotency-Key
→ ImportExecutionService
→ durable Action Scheduler job + Woo CRUD batches
→ JobResource

Monitor/cancel
→ GET/DELETE /jobs/{id}
→ JobService
→ job store/queue
→ JobResource + per-item results
```

Reuse Woo core import where it meets the requirement; Yaxii should only own workflows that add defensible value.

### Analytics/history

```text
Operational report
→ GET /reports/operations?from=&to=&store=
→ OperationReportService
→ plugin event/job records
→ truthful aggregated ReportResource
```

Revenue/top-products analytics should use Woo Analytics/data stores only if the product decision requires it. “Time saved” must not be inferred without a defensible baseline.

### Multi-store/team (Agency/Future)

There is not enough implementation evidence to choose a remote authorization protocol or SaaS topology. Place behind a HOLD until threat model, tenancy, credential lifecycle, WordPress version/plugin compatibility, billing and support scope are specified. Do not extrapolate the prototype's URL/key form.

## Current-to-target mapping table

| Current React capability | Current source | Target backend category | Target operation |
|---|---|---|---|
| Entry save | `Entry` → direct `createProduct` | Native Woo CRUD | `POST /products` → `ProductCreationService`. |
| Form edit | Toast only | Native Woo CRUD | `GET/PATCH /products/{id}`. |
| Category select | persisted array | Taxonomy | paged term query/create. |
| Image upload | browser `File` → direct WP REST | WordPress media | media frame/core media endpoint + IDs in product command. |
| Variation editor | option-centric local state | Woo attributes/variations | attribute resources + cohesive variable creation/update. |
| Queue | persisted products | Browser recent state + plugin operations | query recent products/operations; cache in Query. |
| Retry | direct create again | Plugin operation data + Woo CRUD | retry original idempotent operation. |
| Preferences | localStorage | User-scoped plugin data | `GET/PUT /preferences/me`. |
| Product defaults | localStorage | User/plugin data | same preference resource, resolved server-side. |
| License/tier | localStorage | Plugin/SaaS entitlement | bootstrap + server authorization. |
| Templates | absent | Plugin-owned | template resources. |
| Analytics | fixtures | Plugin job/events (and optionally Woo analytics) | operational report endpoint. |
| Stores/team | fixtures/local | Future Agency | HOLD pending separate architecture. |

## Explicit uncertainty

- Exact support for third-party product types/extension fields is unknown and must be capability-discovered, not promised.
- Whether to reuse core media REST directly or wrap it depends on the final UI and validation contract.
- Whether product history needs a custom table depends on retention/query volume; user meta/options are unsuitable for high-volume events.
- Agency remote-store architecture cannot be safely inferred from this prototype.
