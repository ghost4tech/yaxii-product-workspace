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

export const canonicalProductSchema = simpleProductFieldsSchema.extend({
  created_at: z.string().nullable(),
  id: z.number().int().positive(),
  images: z.array(z.object({ alt: z.string(), id: z.number().int().positive(), url: z.string() })),
  modified_at: z.string().nullable(),
  type: z.literal("simple"),
  version: z.string().length(64),
});

const operationProductSchema = canonicalProductSchema.partial().extend({
  id: z.number().int().positive(),
  name: z.string(),
  sku: z.string(),
  status: z.enum(["draft", "publish", "pending"]),
});

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
  input: simpleProductFieldsSchema.nullable().optional(),
  operation_id: z.string().uuid(),
  product: canonicalProductSchema.nullable(),
  replayed: z.boolean(),
  retry: z.object({
    can_reconcile: z.boolean(),
    can_retry: z.boolean(),
    safe_to_resubmit: z.literal(false),
  }),
  state: z.enum(["succeeded", "failed", "processing", "uncertain"]),
  updated_at: z.string().nullable().optional(),
  warnings: z.array(z.string()),
});

const operationHistoryResultSchema = operationResultSchema.extend({
  product: operationProductSchema.nullable(),
});

export const termPageSchema = z.object({
  has_more: z.boolean(),
  items: z.array(z.object({
    count: z.number().int().nonnegative(),
    id: z.number().int().positive(),
    name: z.string(),
    parent: z.number().int().nonnegative(),
    slug: z.string(),
  })),
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
