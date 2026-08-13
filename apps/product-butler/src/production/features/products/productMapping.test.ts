import { describe, expect, it } from "vitest";
import { mapProductRequest, ProductMappingError, type ProductSubmission } from "./productMapping";
import { mapServerFields } from "./productErrors";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { DEFAULT_WORKSPACE_PREFERENCES } from "../../domain/products";

const copy = productOperationCopy("en-US");

function submission(): ProductSubmission {
  return {
    images: [{ id: "wp-42", preview: "https://example.test/image.jpg", wpMediaId: 42 }],
    isVariable: false,
    settings: { ...DEFAULT_WORKSPACE_PREFERENCES, default_product_status: "draft" },
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
      backorders: "no",
      catalog_visibility: "visible",
      category_ids: [7],
      date_on_sale_from: null,
      date_on_sale_to: null,
      description: "Long",
      height: "",
      image_ids: [42],
      length: "",
      manage_stock: true,
      name: "Canvas tote",
      regular_price: "19.99",
      sale_price: "14.99",
      shipping_class_id: 0,
      short_description: "Short",
      sku: "TOTE-1",
      slug: "",
      sold_individually: false,
      status: "draft",
      stock_quantity: 3,
      stock_status: "instock",
      tag_ids: [],
      tax_class: "",
      tax_status: "taxable",
      weight: "",
      width: "",
    });
  });

  it("blocks variable and browser-only media instead of pretending to save them", () => {
    const input = submission();
    input.isVariable = true;
    input.images = [{ id: "local", preview: "blob:local" }];

    expect(() => mapProductRequest(input, copy)).toThrow(ProductMappingError);
  });

  it("maps server field names back to the approved form", () => {
    expect(mapServerFields({ category_ids: ["Choose another category."], sku: ["Already used."] }))
      .toEqual({ categoryId: "Choose another category.", sku: "Already used." });
  });
});
