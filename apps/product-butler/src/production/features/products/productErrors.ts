import type { OperationError } from "../../domain/products";
import type { ProductFieldErrors } from "./productMapping";

const FIELD_NAMES: Record<string, keyof ProductFieldErrors> = {
  _request: "root",
  category_ids: "categoryId",
  description: "longDescription",
  image_ids: "root",
  name: "name",
  regular_price: "regularPrice",
  sale_price: "salePrice",
  short_description: "shortDescription",
  sku: "sku",
  status: "root",
  stock_quantity: "stockQuantity",
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
