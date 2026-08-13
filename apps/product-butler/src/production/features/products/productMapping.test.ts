import { describe, expect, it } from "vitest";
import { defaultAppSettings } from "@/types/product";
import { mapProductRequest, ProductMappingError, type ProductSubmission } from "./productMapping";
import { mapServerFields } from "./productErrors";
import { productOperationCopy } from "../../core/i18n/productMessages";

const copy = productOperationCopy("en-US");

function submission(): ProductSubmission {
  return {
    images: [{ id: "wp-42", preview: "https://example.test/image.jpg", wpMediaId: 42 }],
    isVariable: false,
    settings: { ...defaultAppSettings, defaultProductStatus: "draft" },
    values: {
      categoryId: "7",
      longDescription: "Long",
      name: " Canvas tote ",
      regularPrice: "19.99",
      salePrice: "14.99",
      shortDescription: "Short",
      sku: " TOTE-1 ",
      stockQuantity: "3",
    },
  };
}

describe("product request mapping", () => {
  it("maps only the approved simple-product DTO fields", () => {
    expect(mapProductRequest(submission(), copy)).toEqual({
      catalog_visibility: "visible",
      category_ids: [7],
      description: "Long",
      image_ids: [42],
      manage_stock: true,
      name: "Canvas tote",
      regular_price: "19.99",
      sale_price: "14.99",
      short_description: "Short",
      sku: "TOTE-1",
      status: "draft",
      stock_quantity: 3,
      stock_status: "instock",
      tax_status: "taxable",
    });
  });

  it("blocks variable, scheduled, and browser-only media instead of pretending to save them", () => {
    const input = submission();
    input.isVariable = true;
    input.saleStart = new Date("2026-08-12T00:00:00Z");
    input.images = [{ id: "local", preview: "blob:local" }];

    expect(() => mapProductRequest(input, copy)).toThrow(ProductMappingError);
  });

  it("maps server field names back to the approved form", () => {
    expect(mapServerFields({ category_ids: ["Choose another category."], sku: ["Already used."] }))
      .toEqual({ categoryId: "Choose another category.", sku: "Already used." });
  });
});
