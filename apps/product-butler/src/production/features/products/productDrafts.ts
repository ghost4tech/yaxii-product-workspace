import { emptyProductFormData, type ProductFormData, type ProductImage } from "@/types/product";
import type {
  CanonicalProduct,
  ProductImageResource,
  SimpleProductFields,
  WorkspacePreferences,
} from "../../domain/products";

function imagesToDraft(images: ProductImageResource[]): ProductImage[] {
  return images.map((image) => ({ id: `wp-${image.id}`, preview: image.url, wpMediaId: image.id }));
}

export function preferencesDraft(preferences: WorkspacePreferences): ProductFormData {
  return {
    ...emptyProductFormData,
    backorders: preferences.default_backorders,
    catalogVisibility: preferences.default_catalog_visibility,
    manageStock: preferences.default_manage_stock,
    productStatus: preferences.default_product_status,
    soldIndividually: preferences.default_sold_individually,
    stockStatus: preferences.default_stock_status,
    taxClass: preferences.default_tax_class,
    taxStatus: preferences.default_tax_status,
  };
}

export function fieldsToDraft(
  fields: CanonicalProduct | SimpleProductFields,
  images: ProductImageResource[] = [],
): ProductFormData {
  return {
    additionalCategoryIds: fields.category_ids.slice(1),
    backorders: fields.backorders,
    catalogVisibility: fields.catalog_visibility,
    categoryId: String(fields.category_ids[0] ?? ""),
    height: fields.height,
    images: imagesToDraft(images).filter((image) => fields.image_ids.includes(image.wpMediaId ?? 0)),
    isVariable: "type" in fields && fields.type === "variable",
    length: fields.length,
    longDescription: fields.description,
    manageStock: fields.manage_stock,
    name: fields.name,
    productStatus: fields.status,
    regularPrice: fields.regular_price,
    salePrice: fields.sale_price ?? "",
    saleScheduleEnd: fields.date_on_sale_to ? new Date(fields.date_on_sale_to) : undefined,
    saleScheduleStart: fields.date_on_sale_from ? new Date(fields.date_on_sale_from) : undefined,
    shippingClassId: fields.shipping_class_id,
    shortDescription: fields.short_description,
    sku: fields.sku,
    slug: fields.slug,
    soldIndividually: fields.sold_individually,
    stockQuantity: fields.stock_quantity === null ? "" : String(fields.stock_quantity),
    stockStatus: fields.stock_status,
    tagIds: fields.tag_ids,
    taxClass: fields.tax_class,
    taxStatus: fields.tax_status,
    variations: [],
    variableAttributes: "type" in fields && fields.type === "variable" ? fields.attributes : [],
    variationCombinations: "type" in fields && fields.type === "variable" ? fields.combinations : [],
    weight: fields.weight,
    width: fields.width,
  };
}

export function nextDraft(product: CanonicalProduct, preferences: WorkspacePreferences): ProductFormData {
  const next = preferencesDraft(preferences);
  const repeat = preferences.repeat_fields;
  if (repeat.includes("category_ids")) {
    next.categoryId = String(product.category_ids[0] ?? "");
    next.additionalCategoryIds = product.category_ids.slice(1);
  }
  if (repeat.includes("regular_price")) next.regularPrice = product.regular_price;
  if (repeat.includes("sale_price")) next.salePrice = product.sale_price ?? "";
  if (repeat.includes("manage_stock")) next.manageStock = product.manage_stock;
  if (repeat.includes("stock_quantity")) next.stockQuantity = product.stock_quantity === null ? "" : String(product.stock_quantity);
  if (repeat.includes("stock_status")) next.stockStatus = product.stock_status;
  if (repeat.includes("backorders")) next.backorders = product.backorders;
  if (repeat.includes("sold_individually")) next.soldIndividually = product.sold_individually;
  if (repeat.includes("weight")) next.weight = product.weight;
  if (repeat.includes("dimensions")) [next.length, next.width, next.height] = [product.length, product.width, product.height];
  if (repeat.includes("shipping_class_id")) next.shippingClassId = product.shipping_class_id;
  if (repeat.includes("tax_status")) next.taxStatus = product.tax_status;
  if (repeat.includes("tax_class")) next.taxClass = product.tax_class;
  if (repeat.includes("catalog_visibility")) next.catalogVisibility = product.catalog_visibility;
  return next;
}
