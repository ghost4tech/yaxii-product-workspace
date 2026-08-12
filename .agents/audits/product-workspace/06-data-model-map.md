# Data model map

## Current frontend types

The canonical source is `apps/product-butler/src/types/product.ts`. There are no separate API DTO files; `src/types/woocommerce.ts` and `analytics.ts` do not exist.

```ts
interface ProductFormData {
  name: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  saleScheduleStart?: Date;
  saleScheduleEnd?: Date;
  categoryId: string;
  stockQuantity: string;
  shortDescription: string;
  longDescription: string;
  images: ProductImage[];
  variations: ProductVariation[];
  isVariable?: boolean;
}

interface Product extends ProductFormData {
  id: string;
  status: 'draft' | 'pending' | 'synced' | 'error';
  errorMessage?: string;
  createdAt: Date;
  createdBy: string;
  wooCommerceId?: number;
}
```

The actual code spells the fields individually rather than using `extends`; the shape above makes the relationship clear.

```ts
interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  wpMediaId?: number;
}

interface ProductVariation {
  id: string;
  name: string;
  options: VariationOption[];
}

interface VariationOption {
  id: string;
  value: string;
  price: string;
  salePrice?: string;
  sku?: string;
  stockQuantity?: string;
  image?: ProductImage;
}
```

`ProductVariation` is misnamed: it models an attribute such as Color, while `VariationOption` models Red plus commercial fields. A Woo variation is a concrete combination (for example Size=M and Color=Red), not an individual option.

## Current field coverage

### Core product

| Field | Present? | Current representation | Woo mapping/issue |
|---|---:|---|---|
| ID | Partial | local UUID + optional `wooCommerceId` | Split client operation ID from server product ID. |
| Name | Yes | `string` | `WC_Product::set_name`. |
| Description | Yes | `longDescription` | Product description; sanitize/allowlist HTML server-side. |
| Short description | Yes | `shortDescription` | Short description. |
| Status | Defaults only | app setting `publish/draft/pending`; queue status uses different vocabulary | Separate publication status from operation/sync status. |
| Type | Partial | boolean `isVariable` | Use discriminated `simple | variable` type. |
| Slug | No | — | Add advanced field or server-generated returned value. |
| Visibility | Defaults only | `visible/catalog/search/hidden` | Add per-product optional override. |
| Featured | No | — | Future/advanced Free. |
| Virtual/downloadable | No | — | Product-scope decision; not modeled. |

### Pricing

| Field | Present? | Current representation | Issue |
|---|---:|---|---|
| Regular price | Yes | decimal string | Good transport shape; validate precision/range using Woo currency settings. |
| Sale price | Yes | decimal string | Must be less-than policy only if product rules require; Woo can validate. |
| Sale start/end | Yes | `Date` | Persisted JSON becomes string; timezone policy undefined. Use ISO DTO plus store timezone. |
| Currency | No | hardcoded `$` display | Bootstrap from Woo; prices remain currency-free decimal strings. |

### Inventory

| Field | Present? | Current representation | Issue |
|---|---:|---|---|
| SKU | Yes | string | No uniqueness/normalization check. |
| Manage stock | Global default | boolean in `AppSettings` | Needs per-product override/default resolution. |
| Stock quantity | Yes | numeric string | Disabled for variable parent; parse/negative/backorder semantics undefined. |
| Stock status | Global default | enum | Per-product/variation support needed. |
| Backorders/low stock/sold individually | No | — | Add only as required by MVP scope. |

### Shipping

No weight, length, width, height, shipping class, virtual flag or unit metadata is modeled. These are required for a credible physical simple-product workflow.

### Tax

Only global default `taxable | shipping | none` exists. Tax class is absent. The UI must consume store tax configuration and avoid inventing classes.

### Media

- Product gallery order is array order; first image is treated as main.
- `File` and blob `preview` are browser objects, not serializable domain data.
- `wpMediaId` anticipates an attachment ID but is not populated through a safe same-site media workflow.
- Alt text, caption, filename, MIME type, size, dimensions and source status are absent.
- Variation image is attached to the option, not a concrete combination.

Target split:

```ts
type DraftImage = { clientId: string; file: File; previewUrl: string };
type MediaResource = { id: number; url: string; alt: string; width?: number; height?: number };
type ProductMediaRef = { mediaId: number; position: number };
```

### Categories and tags

```ts
interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}
```

The form stores one `categoryId: string`, although Woo products can have multiple categories. Tags are absent. Hierarchy exists in the type but is not represented in UI. Category count is display metadata, not product-write data.

Target: `categoryIds: number[]`, `tagIds: number[]`, with paged taxonomy resources and capability-gated term creation.

### Attributes and variations

Current service payload creates custom product attributes with `id: 0`, name and string options. It cannot distinguish:

- global attribute taxonomy vs product-local attribute;
- term IDs/slugs vs display names;
- visible vs variation-only behavior per attribute;
- default attributes;
- enabled/disabled variation state;
- concrete multi-attribute combinations;
- variation weight/dimensions/tax class/downloads.

Recommended core model:

```ts
type ProductAttribute = {
  clientId: string;
  source: 'global' | 'custom';
  attributeId?: number;
  name: string;
  optionIds?: number[];
  options: Array<{ id?: number; slug?: string; name: string }>;
  visible: boolean;
  forVariations: boolean;
};

type VariationCombination = {
  clientId: string;
  id?: number;
  selections: Array<{ attributeKey: string; optionKey: string }>;
  enabled: boolean;
  regularPrice: string;
  salePrice?: string;
  sku?: string;
  manageStock?: boolean;
  stockQuantity?: number | null;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  imageId?: number;
};
```

### Custom application metadata

Current non-Woo fields:

- local UUID;
- queue/sync status and error string;
- created-by display string;
- client timestamps;
- UI upload state/progress;
- draft revision counter;
- recent category IDs;
- active mock store and display color;
- tier/license demonstration values.

These must not be written as product post meta by default. Most belong to browser state or plugin-owned operation/job records.

### Preferences

`Preferences` contains appearance/workspace/entry/queue settings. `AppSettings` contains creation defaults. They are currently combined with product/credentials in one persisted store. Target:

- user meta or plugin user-preference record for UI/workflow values;
- user/store policy resolution for creation defaults;
- browser-only cache for early theme and active ephemeral UI;
- explicit schema version and migration.

### Templates

No model exists. Future template should be plugin-owned, versioned and selective:

```text
Template
  id, name, owner/scope, version
  applicable product type
  field mask
  normalized product defaults
  taxonomy/attribute references
  created/updated metadata
```

Do not serialize the entire live form blindly; templates need compatibility and missing-term handling.

### Automation/jobs

No model exists. Fake analytics implies sync/retry events but has no source. Future job records need operation, actor, target site, input hash/version, per-item states, attempts, next-run time, error code/message, result IDs and timestamps.

### History

An unused `recentEvents` mock array has `time`, `actor`, `action`, `target`. It is not sufficient for audit/history because it has no stable IDs, event type, object ID, before/after summary, result, source job or real timestamp.

## Persistence and serialization defects

- Zustand persists `Date` values as strings but types them as `Date`.
- `File` does not serialize; blob URLs are session-bound.
- `emptyProductFormData` is reused by reference in reset operations; future mutation would be hazardous.
- Store schema has no version/migration/TTL.
- Random seeded products persist and then influence the Free product meter and KPIs.
- Credentials, product data, categories, defaults and draft share one localStorage blob.
- Queue status is overloaded as local draft and remote sync state.

## Target DTO separation

Do not expose PHP/Woo objects directly. Use explicit commands/resources:

```text
CreateProductCommand
UpdateProductCommand
ProductResource
ProductListItemResource
TaxonomyTermResource
MediaResource
OperationResultResource
UserPreferencesResource
BootstrapResource
```

Rules:

- IDs are numeric server IDs; client IDs/idempotency keys are separate strings.
- Prices travel as decimal strings.
- Dates travel as ISO 8601 with documented timezone semantics.
- Optional omitted field means “leave unchanged” on PATCH; explicit `null` means clear only where allowed.
- Product publication status and operation/job status are separate enums.
- Every enum is closed and versioned; unknown server values are handled safely.
- Resources include only fields the UI needs, plus capability/action metadata where useful.

## Fields that do not cleanly map to WooCommerce

- `status: draft|pending|synced|error` (mixed application state) → plugin operation/job state, not product status.
- `createdBy: string` → derive from WordPress user/event, not product payload.
- mock store color/status/count/latency → Agency connection metadata or computed resources.
- tier/license values → licensing subsystem.
- UI preferences and product defaults → user/plugin settings.
- templates, import recipes, saved workflows, operation logs → plugin-owned tables/options/user meta based on query/retention needs.
- draft images/upload progress/selection → browser-only state until uploaded.
