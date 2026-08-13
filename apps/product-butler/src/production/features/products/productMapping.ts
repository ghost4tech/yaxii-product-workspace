import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import type { AppSettings, ProductImage } from "@/types/product";
import type { CreateProductRequest } from "../../domain/products";
import type { ProductOperationCopy } from "../../core/i18n/productMessages";

export type ProductFieldErrors = Partial<Record<keyof ProductEntryValues | "root", string>>;

export interface ProductSubmission {
  images: ProductImage[];
  isVariable: boolean;
  saleEnd?: Date;
  saleStart?: Date;
  settings: AppSettings;
  values: ProductEntryValues;
}

export class ProductMappingError extends Error {
  public constructor(public readonly fields: ProductFieldErrors) {
    super("The product contains fields outside the Phase 2 simple-product slice.");
  }
}

export function mapProductRequest(input: ProductSubmission, copy: ProductOperationCopy): CreateProductRequest {
  const { images, isVariable, saleEnd, saleStart, settings, values } = input;
  const fields: ProductFieldErrors = {};
  if (isVariable) fields.root = copy.variableUnsupported;
  if (saleStart || saleEnd) fields.root = copy.saleScheduleUnsupported;
  if (settings.defaultProductStatus === "pending") {
    fields.root = copy.pendingStatusUnsupported;
  }

  const categoryId = Number(values.categoryId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) fields.categoryId = copy.chooseCategory;

  const localImages = images.filter((image) => image.wpMediaId === undefined);
  if (localImages.length > 0) {
    fields.root = copy.localMediaUnsupported;
  }

  const stockValue = values.stockQuantity?.trim() ?? "";
  const stockQuantity = stockValue === "" ? null : Number(stockValue);
  if (stockQuantity !== null && (!Number.isInteger(stockQuantity) || stockQuantity < 0)) {
    fields.stockQuantity = copy.stockInvalid;
  }

  if (Object.keys(fields).length > 0) throw new ProductMappingError(fields);
  return {
    catalog_visibility: settings.defaultCatalogVisibility,
    category_ids: [categoryId],
    description: values.longDescription?.trim() ?? "",
    image_ids: images.map((image) => image.wpMediaId as number),
    manage_stock: settings.enableManageStock || stockQuantity !== null,
    name: values.name.trim(),
    regular_price: values.regularPrice?.trim() ?? "",
    sale_price: values.salePrice?.trim() || null,
    short_description: values.shortDescription?.trim() ?? "",
    sku: values.sku?.trim() ?? "",
    status: settings.defaultProductStatus === "publish" ? "publish" : "draft",
    stock_quantity: stockQuantity,
    stock_status: settings.defaultStockStatus,
    tax_status: settings.defaultTaxStatus,
  };
}
