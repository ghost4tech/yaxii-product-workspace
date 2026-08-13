import { z } from "zod";

const canonicalProductSchema = z.object({
  catalog_visibility: z.string(),
  category_ids: z.array(z.number().int()),
  created_at: z.string().nullable(),
  id: z.number().int().positive(),
  image_ids: z.array(z.number().int()),
  manage_stock: z.boolean(),
  name: z.string(),
  regular_price: z.string(),
  sale_price: z.string(),
  sku: z.string(),
  status: z.string(),
  stock_quantity: z.number().int().nullable(),
  stock_status: z.string(),
});

export const operationResultSchema = z.object({
  errors: z.array(z.object({
    code: z.string(),
    fields: z.record(z.string(), z.array(z.string())),
    message: z.string(),
  })),
  operation_id: z.string().uuid(),
  product: canonicalProductSchema.nullable(),
  replayed: z.boolean(),
  retry: z.object({ can_reconcile: z.boolean(), safe_to_resubmit: z.boolean() }),
  state: z.enum(["succeeded", "failed", "processing", "uncertain"]),
  warnings: z.array(z.string()),
});

export const categoryPageSchema = z.object({
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
