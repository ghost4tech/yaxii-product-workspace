import type { ProductEntryValues } from "@/components/entry/productEntryModel";
import type { ProductImage } from "@/types/product";
import type { CreateProductRequest } from "../../domain/products";
import type { VariableProductRequest } from "../../domain/products";
import type { VariableAttribute, VariationCombination } from "../../domain/variableProducts";
import { validateVariationPlan, VariablePlanError } from "../variableProducts/combinationGenerator";
import type { ProductOperationCopy } from "../../core/i18n/productMessages";

export type ProductFieldErrors = Partial<Record<keyof ProductEntryValues | "root", string>>;

export interface ProductSubmission {
  images: ProductImage[];
  isVariable: boolean;
  attributes: VariableAttribute[];
  combinations: VariationCombination[];
  saleEnd?: Date;
  saleStart?: Date;
  values: ProductEntryValues;
}

export class ProductMappingError extends Error {
  public constructor(public readonly fields: ProductFieldErrors) {
    super("The product contains fields that cannot be submitted safely.");
  }
}

function localDate(value?: Date): string | null {
  if (!value) return null;
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export function mapProductRequest(input: ProductSubmission, copy: ProductOperationCopy): CreateProductRequest {
  const { images, isVariable, saleEnd, saleStart, values } = input;
  const fields: ProductFieldErrors = {};
  if (!isVariable && !values.regularPrice.trim()) fields.regularPrice = "Price is required";
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
    backorders: values.backorders,
    catalog_visibility: values.catalogVisibility,
    category_ids: [...new Set([categoryId, ...values.additionalCategoryIds])],
    date_on_sale_from: localDate(saleStart),
    date_on_sale_to: localDate(saleEnd),
    description: values.longDescription?.trim() ?? "",
    height: values.height.trim(),
    image_ids: images.map((image) => image.wpMediaId as number),
    length: values.length.trim(),
    manage_stock: values.manageStock,
    name: values.name.trim(),
    regular_price: values.regularPrice?.trim() ?? "",
    sale_price: values.salePrice?.trim() || null,
    shipping_class_id: values.shippingClassId,
    short_description: values.shortDescription?.trim() ?? "",
    sku: values.sku?.trim() ?? "",
    slug: values.slug.trim(),
    sold_individually: values.soldIndividually,
    status: values.productStatus,
    stock_quantity: stockQuantity,
    stock_status: values.stockStatus,
    tag_ids: values.tagIds,
    tax_class: values.taxClass,
    tax_status: values.taxStatus,
    weight: values.weight.trim(),
    width: values.width.trim(),
  };
}

export function mapVariableProductRequest(input: ProductSubmission, copy: ProductOperationCopy): VariableProductRequest {
  try {
    validateVariationPlan(input.attributes, input.combinations);
  } catch (error) {
    if (error instanceof VariablePlanError) {
      throw new ProductMappingError({ root: Object.values(error.fields)[0] ?? copy.reviewFields });
    }
    throw error;
  }
  const product = mapProductRequest({ ...input, isVariable: true }, copy);
  return { attributes: input.attributes, combinations: input.combinations, product };
}
