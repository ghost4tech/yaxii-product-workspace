import type { OperationError } from "../../domain/products";
import type { ProductFieldErrors } from "./productMapping";

const FIELD_NAMES: Record<string, keyof ProductFieldErrors> = {
  _request: "root",
  backorders: "backorders",
  catalog_visibility: "catalogVisibility",
  category_ids: "categoryId",
  date_on_sale_from: "root",
  date_on_sale_to: "root",
  description: "longDescription",
  height: "height",
  image_ids: "root",
  length: "length",
  manage_stock: "manageStock",
  name: "name",
  regular_price: "regularPrice",
  sale_price: "salePrice",
  short_description: "shortDescription",
  sku: "sku",
  shipping_class_id: "shippingClassId",
  slug: "slug",
  sold_individually: "soldIndividually",
  status: "productStatus",
  stock_quantity: "stockQuantity",
  stock_status: "stockStatus",
  tag_ids: "tagIds",
  tax_class: "taxClass",
  tax_status: "taxStatus",
  weight: "weight",
  width: "width",
};

export function mapServerFields(fields: Record<string, string[]>): ProductFieldErrors {
  return Object.entries(fields).reduce<ProductFieldErrors>((result, [serverName, messages]) => {
    const fieldName = FIELD_NAMES[serverName] ?? "root";
    const message = messages.find((value) => typeof value === "string");
    if (message) result[fieldName] = message;
    return result;
  }, {});
}

export function operationErrorFields(errors: OperationError[]): ProductFieldErrors {
  return errors.reduce<ProductFieldErrors>(
    (result, error) => ({ ...result, ...mapServerFields(error.fields) }),
    {},
  );
}
