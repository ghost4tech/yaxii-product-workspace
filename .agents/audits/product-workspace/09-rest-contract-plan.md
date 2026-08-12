# REST contract plan

## Scope and conventions

Namespace: `yaxii-product-workspace/v1` (final public slug may change before code; choose once and keep stable).

This is a contract plan, not implementation. The first release should expose only the Foundation/Core group. Later groups are gated by product phase.

### Common conventions

- Same-origin cookie authentication plus `X-WP-Nonce` generated for `wp_rest`.
- JSON request/response, UTF-8.
- Snake_case on the wire; explicit DTO mappers to frontend camelCase models.
- Decimal prices as strings; IDs as integers; timestamps ISO 8601.
- Request ID returned in `X-Request-ID`; write result includes `operation_id`.
- Write requests use `Idempotency-Key` (UUID or documented opaque key).
- Pagination is cursor-based where stable ordering is available; otherwise `page/per_page` with a strict maximum. Never return the entire catalog by default.
- `fields`/`context` expansion only if a measured need appears; avoid a generic GraphQL-like mini-language.
- Every collection supports bounded `per_page` and cancellation naturally through HTTP/AbortController.

## Endpoint groups

### Foundation/Core v1

| Method | Route | Application operation | Notes |
|---|---|---|---|
| GET | `/bootstrap` | GetBootstrap | One initial store/user/config/entitlement resource. |
| GET | `/products` | QueryProducts | Paged search/filter for edit/queue lookup. |
| POST | `/products` | CreateProduct | Simple first; variable command added in its phase without breaking version. |
| GET | `/products/{id}` | GetProduct | Full editable resource. |
| PATCH | `/products/{id}` | UpdateProduct | Partial fields with version precondition. |
| DELETE | `/products/{id}` | TrashProduct | Trash by default; force deletion not exposed in v1. |
| GET | `/taxonomies/{taxonomy}/terms` | SearchTerms | Allowlisted category/tag/shipping class only. |
| POST | `/taxonomies/{taxonomy}/terms` | CreateTerm | Optional; capability-gated. |
| GET | `/attributes` | QueryAttributes | Global attributes with paged/expandable terms. |
| GET | `/preferences/me` | GetUserPreferences | Versioned preferences/defaults. |
| PUT | `/preferences/me` | SaveUserPreferences | Whole known preference resource; ignores/rejects unknown keys by policy. |
| GET | `/operations/{id}` | GetOperation | Reconcile uncertain writes/reload. |
| POST | `/operations/{id}/retry` | RetryOperation | Only server-classified retryable operations. |

Media can use the WordPress media frame/core `/wp/v2/media` in v1. Add a plugin wrapper only if the workspace needs cohesive validation/resources not supplied by core.

### Pro later

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/templates` | List/create template. |
| GET/PATCH/DELETE | `/templates/{id}` | Read/update/delete template. |
| POST | `/imports` | Upload/plan a controlled batch import. |
| GET | `/imports/{id}` | Plan/mapping/validation summary. |
| POST | `/imports/{id}/execute` | Start approved durable job. |
| GET | `/jobs/{id}` | Progress/results. |
| DELETE | `/jobs/{id}` | Request cancellation where safe. |
| GET | `/reports/operations` | Real operation/job aggregates. |

Do not add `/ai`, `/automations`, `/stores`, or `/team` until those products have requirements and threat models.

## Bootstrap resource

```json
{
  "api_version": 1,
  "asset_version": "...",
  "current_user": {
    "id": 7,
    "display_name": "...",
    "capabilities": {
      "create_products": true,
      "publish_products": false,
      "upload_media": true,
      "create_categories": false
    }
  },
  "site": {
    "id": 1,
    "name": "...",
    "admin_url": "...",
    "locale": "ar",
    "direction": "rtl",
    "timezone": "Africa/Algiers"
  },
  "woocommerce": {
    "available": true,
    "version": "...",
    "currency": "DZD",
    "currency_position": "right_space",
    "price_decimals": 2,
    "decimal_separator": ".",
    "thousand_separator": ",",
    "weight_unit": "kg",
    "dimension_unit": "cm",
    "taxes_enabled": true
  },
  "entitlements": {
    "edition": "free",
    "features": []
  },
  "limits": {
    "max_images_per_product": 10,
    "max_variation_combinations_sync": 50,
    "max_page_size": 100
  }
}
```

Capability booleans guide UI only. The server repeats checks for every operation.

## Product commands

### Simple create

```json
{
  "type": "simple",
  "name": "Linen Crew Tee",
  "slug": null,
  "status": "draft",
  "catalog_visibility": "visible",
  "description": "...",
  "short_description": "...",
  "sku": "LCT-001",
  "pricing": {
    "regular_price": "49.00",
    "sale_price": null,
    "sale_from": null,
    "sale_to": null
  },
  "inventory": {
    "manage_stock": true,
    "stock_quantity": 12,
    "stock_status": "instock"
  },
  "shipping": {
    "weight": "0.25",
    "length": "30",
    "width": "20",
    "height": "2",
    "shipping_class_id": null
  },
  "tax": {
    "status": "taxable",
    "class": ""
  },
  "category_ids": [12],
  "tag_ids": [31],
  "image_ids": [501, 502],
  "attributes": []
}
```

Rules:

- Omit sections not in scope only when defaults are explicitly resolved by the server and returned.
- `null` clears optional values on create/update where documented.
- The server returns validation paths such as `pricing.sale_to`.
- Do not send UI upload objects, queue status, created-by display text or preference defaults inside product commands.

### Variable create extension

```json
{
  "type": "variable",
  "name": "Tee",
  "status": "draft",
  "attributes": [
    {
      "key": "attribute:3",
      "source": "global",
      "attribute_id": 3,
      "option_ids": [17, 18],
      "visible": true,
      "for_variations": true
    },
    {
      "key": "custom:size",
      "source": "custom",
      "name": "Size",
      "options": ["S", "M"],
      "visible": true,
      "for_variations": true
    }
  ],
  "variations": [
    {
      "client_id": "...",
      "selections": [
        { "attribute_key": "attribute:3", "option_key": "term:17" },
        { "attribute_key": "custom:size", "option_key": "S" }
      ],
      "enabled": true,
      "regular_price": "49.00",
      "sku": "TEE-RED-S",
      "manage_stock": true,
      "stock_quantity": 4,
      "image_id": 501
    }
  ]
}
```

The server rejects duplicate/missing combinations, unknown attribute/term references, duplicate SKUs, excessive combination counts and empty prices where Woo requires them.

## Product resource

```json
{
  "id": 123,
  "version": "2026-08-11T14:03:22Z",
  "type": "simple",
  "name": "Linen Crew Tee",
  "slug": "linen-crew-tee",
  "status": "draft",
  "catalog_visibility": "visible",
  "permalink": "...",
  "edit_url": "...",
  "description": "...",
  "short_description": "...",
  "sku": "LCT-001",
  "pricing": { "regular_price": "49.00", "sale_price": null },
  "inventory": { "manage_stock": true, "stock_quantity": 12, "stock_status": "instock" },
  "shipping": {},
  "tax": {},
  "categories": [{ "id": 12, "name": "Apparel", "slug": "apparel" }],
  "tags": [],
  "images": [{ "id": 501, "url": "...", "alt": "...", "position": 0 }],
  "attributes": [],
  "variations": [],
  "actions": { "edit": true, "trash": true, "publish": false }
}
```

List resources should be smaller: ID, type, name, SKU, image thumbnail, status, price summary, stock summary, modified time and permitted actions.

## Operation result

```json
{
  "operation_id": "01...",
  "state": "succeeded",
  "idempotency_key": "...",
  "product": { "id": 123, "version": "..." },
  "warnings": []
}
```

Variable/large operations may return:

```json
{
  "operation_id": "01...",
  "state": "partial",
  "product_id": 123,
  "items": [
    { "client_id": "a", "state": "succeeded", "variation_id": 201 },
    { "client_id": "b", "state": "failed", "error": { "code": "duplicate_sku", "fields": { "sku": ["..."] } } }
  ],
  "retryable": true
}
```

Frontend queue statuses derive from operation results; they are not guessed before the server response.

## Error contract

```json
{
  "code": "product_validation_failed",
  "message": "Review the highlighted product fields.",
  "request_id": "...",
  "operation_id": null,
  "retryable": false,
  "fields": {
    "name": ["Product name is required."],
    "category_ids": ["One or more categories are unavailable."]
  }
}
```

- Messages are localized by the server or mapped from stable codes consistently; field paths remain stable.
- Never return stack traces, SQL, filesystem paths, consumer secrets, raw provider responses or unbounded HTML.
- React maps field errors into RHF and shows a form-level summary/focus target.

## Product list query

Supported v1 filters should be limited to actual UI needs:

```text
search
status
type
category_id
modified_after
order_by = modified|name|id
order = asc|desc
cursor/page
per_page <= server max
```

Search must be debounced and cancelable. SKU exact/prefix search can be optimized separately if measurement requires it. Do not accept arbitrary meta-query parameters.

## Taxonomy resources

```json
{
  "items": [
    { "id": 12, "taxonomy": "product_cat", "name": "Apparel", "slug": "apparel", "parent_id": null, "count": 42 }
  ],
  "page": { "next_cursor": null, "has_more": false }
}
```

Only allowlisted taxonomies are routable. Attribute resources explicitly identify the underlying taxonomy and term keys, avoiding display-name ambiguity.

## Preferences resource

```json
{
  "schema_version": 1,
  "appearance": { "theme": "system", "density": "compact", "reduce_motion": false },
  "workspace": { "landing": "entry", "keyboard_hints": true, "sticky_queue": true },
  "entry": { "autofocus_name": true, "confirm_delete": false, "repeat_fields": ["category_ids", "tax.class"] },
  "queue": { "group_by_day": true, "relative_timestamps": true, "page_size": 25 },
  "product_defaults": { "status": "draft", "catalog_visibility": "visible", "tax_status": "taxable", "stock_status": "instock" }
}
```

Unknown enum values fall back safely client-side; server migrates stored schemas. Currency/units/locale are not preferences here because Woo/WordPress bootstrap owns them.

## Caching and invalidation

- `bootstrap`: short session cache; invalidate on explicit refresh or version mismatch.
- product list: query-keyed by filters; invalidate/reconcile affected item after mutation.
- product detail: keyed by ID/version.
- taxonomy/attributes: cache with modest stale time; explicit refresh after term creation.
- preferences: optimistic update is acceptable with rollback on server failure.
- operations/jobs: poll with backoff only while non-terminal; visibility-aware and cancelable. Future SSE is unnecessary until polling proves inadequate.

## Versioning and compatibility

- Namespace v1 for breaking transport changes.
- Include DTO schema/feature flags in bootstrap.
- Add fields backward-compatibly; do not silently change enum meaning.
- Frontend and PHP assets ship as one plugin version, but REST contract tests still protect Pro module/version skew.
- Return a clear compatibility response when WooCommerce is missing/unsupported; React should render a bounded unavailable state.
