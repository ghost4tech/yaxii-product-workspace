import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import type { ProductImage } from "@/types/product";
import type { CreateProductRequest, WorkspacePreferences } from "../../domain/products";
import type { ProductOperationCopy } from "../../core/i18n/productMessages";

export type ProductFieldErrors = Partial<Record<keyof ProductEntryValues | "root", string>>;

export interface ProductSubmission {
  images: ProductImage[];
  isVariable: boolean;
  saleEnd?: Date;
  saleStart?: Date;
  settings: WorkspacePreferences;
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
	backorders: settings.default_backorders,
	catalog_visibility: settings.default_catalog_visibility,
    category_ids: [categoryId],
	date_on_sale_from: saleStart?.toISOString() ?? null,
	date_on_sale_to: saleEnd?.toISOString() ?? null,
    description: values.longDescription?.trim() ?? "",
	height: "",
    image_ids: images.map((image) => image.wpMediaId as number),
	length: "",
    manage_stock: settings.default_manage_stock || stockQuantity !== null,
    name: values.name.trim(),
    regular_price: values.regularPrice?.trim() ?? "",
    sale_price: values.salePrice?.trim() || null,
	shipping_class_id: 0,
    short_description: values.shortDescription?.trim() ?? "",
    sku: values.sku?.trim() ?? "",
	slug: "",
	sold_individually: settings.default_sold_individually,
	status: settings.default_product_status,
    stock_quantity: stockQuantity,
	stock_status: settings.default_stock_status,
	tag_ids: [],
	tax_class: settings.default_tax_class,
	tax_status: settings.default_tax_status,
	weight: "",
	width: "",
  };
}
