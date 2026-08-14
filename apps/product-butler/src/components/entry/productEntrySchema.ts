import { z } from "zod";
import type { ProductEntryValues } from "./productEntryModel";

const optionalDecimal = z.string().refine(
  (value) => value.trim() === "" || /^\d+(?:\.\d+)?$/.test(value.trim()),
  "Enter a non-negative number",
);

export const productEntrySchema: z.ZodType<ProductEntryValues> = z.object({
  additionalCategoryIds: z.array(z.number().int().positive()),
  backorders: z.enum(["no", "notify", "yes"]),
  catalogVisibility: z.enum(["visible", "catalog", "search", "hidden"]),
  categoryId: z.string().min(1, "Category is required"),
  height: optionalDecimal,
  length: optionalDecimal,
  longDescription: z.string(),
  manageStock: z.boolean(),
  name: z.string().trim().min(1, "Product name is required"),
  productStatus: z.enum(["publish", "draft", "pending"]),
  regularPrice: optionalDecimal,
  salePrice: optionalDecimal,
  shippingClassId: z.number().int().nonnegative(),
  shortDescription: z.string(),
  sku: z.string(),
  slug: z.string(),
  soldIndividually: z.boolean(),
  stockQuantity: z.string().refine(
    (value) => value.trim() === "" || /^\d+$/.test(value.trim()),
    "Enter a whole stock quantity",
  ),
  stockStatus: z.enum(["instock", "outofstock", "onbackorder"]),
  tagIds: z.array(z.number().int().positive()),
  taxClass: z.string(),
  taxStatus: z.enum(["taxable", "shipping", "none"]),
  weight: optionalDecimal,
  width: optionalDecimal,
});
