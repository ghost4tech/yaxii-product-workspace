import { z } from "zod";

export const simpleProductFieldsSchema = z.object({
  backorders: z.enum(["no", "notify", "yes"]),
  catalog_visibility: z.enum(["visible", "catalog", "search", "hidden"]),
  category_ids: z.array(z.number().int().positive()),
  date_on_sale_from: z.string().nullable(),
  date_on_sale_to: z.string().nullable(),
  description: z.string(),
  height: z.string(),
  image_ids: z.array(z.number().int().positive()),
  length: z.string(),
  manage_stock: z.boolean(),
  name: z.string(),
  regular_price: z.string(),
  sale_price: z.string().nullable(),
  shipping_class_id: z.number().int().nonnegative(),
  short_description: z.string(),
  sku: z.string(),
  slug: z.string(),
  sold_individually: z.boolean(),
  status: z.enum(["draft", "publish", "pending"]),
  stock_quantity: z.number().int().nonnegative().nullable(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]),
  tag_ids: z.array(z.number().int().positive()),
  tax_class: z.string(),
  tax_status: z.enum(["taxable", "shipping", "none"]),
  weight: z.string(),
  width: z.string(),
});

const canonicalBaseSchema = simpleProductFieldsSchema.extend({
  created_at: z.string().nullable(),
  id: z.number().int().positive(),
  images: z.array(z.object({ alt: z.string(), id: z.number().int().positive(), url: z.string() })),
  modified_at: z.string().nullable(),
  version: z.string().length(64),
});

const globalAttributeSchema = z.object({
  attribute_id: z.number().int().positive(), key: z.string(), name: z.string(),
  option_ids: z.array(z.number().int().positive()), position: z.number().int().nonnegative(),
  source: z.literal("global"), taxonomy: z.string().startsWith("pa_"), variation: z.boolean(), visible: z.boolean(),
}).transform((item) => ({
  attributeId: item.attribute_id, key: item.key, name: item.name, optionIds: item.option_ids,
  position: item.position, source: item.source, taxonomy: item.taxonomy as `pa_${string}`,
  variation: item.variation, visible: item.visible,
}));
const customAttributeSchema = z.object({
  key: z.string(), name: z.string(), options: z.array(z.string()), position: z.number().int().nonnegative(),
  source: z.literal("custom"), variation: z.boolean(), visible: z.boolean(),
});
const selectionSchema = z.union([
  z.object({ attribute_key: z.string(), term_id: z.number().int().positive() })
    .transform((item) => ({ attributeKey: item.attribute_key, termId: item.term_id })),
  z.object({ attribute_key: z.string(), option: z.string() })
    .transform((item) => ({ attributeKey: item.attribute_key, option: item.option })),
]);
const combinationSchema = z.object({
  client_id: z.string().uuid(), enabled: z.boolean(), image_id: z.number().int().nonnegative(),
  manage_stock: z.boolean(), regular_price: z.string(), sale_price: z.string().nullable(),
  selections: z.array(selectionSchema), sku: z.string(), stock_quantity: z.number().int().nonnegative().nullable(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]), variation_id: z.number().int().nonnegative(),
}).transform((item) => ({
  clientId: item.client_id, enabled: item.enabled, imageId: item.image_id, manageStock: item.manage_stock,
  regularPrice: item.regular_price, salePrice: item.sale_price, selections: item.selections, sku: item.sku,
  stockQuantity: item.stock_quantity, stockStatus: item.stock_status, variationId: item.variation_id,
}));

const canonicalSimpleProductSchema = canonicalBaseSchema.extend({ type: z.literal("simple") });
export const canonicalVariableProductSchema = canonicalBaseSchema.extend({
  attributes: z.array(z.union([globalAttributeSchema, customAttributeSchema])),
  combinations: z.array(combinationSchema), projected_count: z.number().int().nonnegative(), type: z.literal("variable"),
});
export const canonicalProductSchema = z.discriminatedUnion("type", [canonicalSimpleProductSchema, canonicalVariableProductSchema]);
export const variableProductRequestSchema = z.object({
  attributes: z.array(z.union([globalAttributeSchema, customAttributeSchema])),
  combinations: z.array(combinationSchema), product: simpleProductFieldsSchema,
});
const combinationWriteResultSchema = z.object({
  client_id: z.string(), error: z.object({ code: z.string(), message: z.string() }).nullable(),
  fingerprint: z.string(), state: z.enum(["succeeded", "failed", "deleted"]), variation_id: z.number().int().nonnegative(),
});
export const variableUpdateResultSchema = z.object({
  combination_results: z.array(combinationWriteResultSchema), product: canonicalVariableProductSchema,
  state: z.enum(["succeeded", "partial"]),
});

const operationProductSchema = canonicalProductSchema.or(z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sku: z.string(),
  status: z.enum(["draft", "publish", "pending"]),
}).passthrough());

export const trashedProductSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal("trash"),
});

const operationFieldsSchema = z.union([
  z.record(z.string(), z.array(z.string())),
  z.tuple([]),
]).transform((fields) => Array.isArray(fields) ? {} : fields);

export const operationResultSchema = z.object({
  created_at: z.string().nullable().optional(),
  errors: z.array(z.object({
    code: z.string(),
    fields: operationFieldsSchema,
    message: z.string(),
  })),
  combination_results: z.array(combinationWriteResultSchema).default([]),
  input: z.union([simpleProductFieldsSchema, variableProductRequestSchema]).nullable().optional(),
  operation_id: z.string().uuid(),
  product: canonicalProductSchema.nullable(),
  replayed: z.boolean(),
  retry: z.object({
    can_reconcile: z.boolean(),
    can_retry: z.boolean(),
    safe_to_resubmit: z.literal(false),
  }),
  state: z.enum(["succeeded", "partial", "failed", "processing", "uncertain"]),
  updated_at: z.string().nullable().optional(),
  warnings: z.array(z.string()),
});

const operationHistoryResultSchema = operationResultSchema.extend({
  product: operationProductSchema.nullable(),
});

export const termPageSchema = z.object({
  has_more: z.boolean(),
  items: z.array(z.object({
    ancestors: z.array(z.object({
      count: z.number().int().nonnegative(),
      id: z.number().int().positive(),
      name: z.string(),
      parent: z.number().int().nonnegative(),
      slug: z.string(),
    })).optional(),
    count: z.number().int().nonnegative(),
    has_children: z.boolean().optional(),
    id: z.number().int().positive(),
    name: z.string(),
    parent: z.number().int().nonnegative(),
    slug: z.string(),
  }).transform((item) => ({
    ancestors: item.ancestors,
    count: item.count,
    hasChildren: item.has_children,
    id: item.id,
    name: item.name,
    parent: item.parent,
    slug: item.slug,
  }))),
  page: z.number().int().positive(),
  per_page: z.number().int().positive().max(50),
});

export const productPageSchema = z.object({
  has_more: z.boolean(),
  items: z.array(canonicalProductSchema),
  page: z.number().int().positive(),
  per_page: z.number().int().positive().max(50),
  total: z.number().int().nonnegative(),
});

export const operationPageSchema = z.object({
  counts: z.object({
    all: z.number().int().nonnegative(),
    draft: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    synced: z.number().int().nonnegative(),
  }),
  has_more: z.boolean(),
  items: z.array(operationHistoryResultSchema),
  page: z.number().int().positive(),
  per_page: z.number().int().positive().max(50),
  total: z.number().int().nonnegative(),
});

const operationMetricCountsSchema = z.object({
  eligible: z.number().int().nonnegative(),
  needs_attention: z.number().int().nonnegative(),
  operations: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
});

export const operationSummarySchema = z.object({
  buckets: z.array(operationMetricCountsSchema).length(7),
  current: operationMetricCountsSchema,
  previous: operationMetricCountsSchema,
  window: z.object({
    bucket_hours: z.literal(24),
    ends_at: z.string().datetime({ offset: true }),
    previous_starts_at: z.string().datetime({ offset: true }),
    starts_at: z.string().datetime({ offset: true }),
  }),
});

export const preferencesSchema = z.object({
  auto_focus_name: z.boolean(),
  confirm_queue_dismiss: z.boolean(),
  default_backorders: z.enum(["no", "notify", "yes"]),
  default_catalog_visibility: z.enum(["visible", "catalog", "search", "hidden"]),
  default_manage_stock: z.boolean(),
  default_product_status: z.enum(["draft", "publish", "pending"]),
  default_sold_individually: z.boolean(),
  default_stock_status: z.enum(["instock", "outofstock", "onbackorder"]),
  default_tax_class: z.string(),
  default_tax_status: z.enum(["taxable", "shipping", "none"]),
  queue_group_by_day: z.boolean(),
  queue_rows_per_page: z.union([z.literal(10), z.literal(25), z.literal(50)]),
  relative_timestamps: z.boolean(),
  repeat_fields: z.array(z.enum([
    "category_ids", "regular_price", "sale_price", "manage_stock", "stock_quantity",
    "stock_status", "backorders", "sold_individually", "weight", "dimensions",
    "shipping_class_id", "tax_status", "tax_class", "catalog_visibility",
  ])),
});

export const attributeCatalogSchema = z.array(z.object({
  id: z.number().int().positive(), name: z.string(), order_by: z.string(), taxonomy: z.string().startsWith("pa_"),
}));
export const attributeTermsSchema = z.array(z.object({
  id: z.number().int().positive(), name: z.string(), slug: z.string(),
}));

export const mediaResourceSchema = z.object({
  alt_text: z.string(),
  id: z.number().int().positive(),
  source_url: z.string().url(),
}).transform((item) => ({ alt: item.alt_text, id: item.id, url: item.source_url }));
