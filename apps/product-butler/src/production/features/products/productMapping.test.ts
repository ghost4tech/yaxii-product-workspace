import { describe, expect, it } from "vitest";
import { mapProductRequest, ProductMappingError, type ProductSubmission } from "./productMapping";
import { mapServerFields } from "./productErrors";
import { productOperationCopy } from "../../core/i18n/productMessages";
import { EMPTY_PRODUCT_ENTRY } from "@/components/entry/productEntryModel";

const copy = productOperationCopy("en-US");

function submission(): ProductSubmission {
  return {
    attributes: [],
    combinations: [],
    images: [{ id: "wp-42", preview: "https://example.test/image.jpg", wpMediaId: 42 }],
    isVariable: false,
    saleEnd: new Date(2030, 0, 20),
    saleStart: new Date(2030, 0, 10),
    values: {
      ...EMPTY_PRODUCT_ENTRY,
      additionalCategoryIds: [8],
      backorders: "notify",
      catalogVisibility: "search",
      categoryId: "7",
      height: "3",
      length: "20",
      longDescription: "Long",
      manageStock: true,
      name: " Canvas tote ",
      productStatus: "draft",
      regularPrice: "19.99",
      salePrice: "14.99",
      shippingClassId: 4,
      shortDescription: "Short",
      sku: " TOTE-1 ",
      slug: " canvas-tote ",
      soldIndividually: true,
      stockQuantity: "3",
      stockStatus: "onbackorder",
      tagIds: [9, 10],
      taxClass: "reduced-rate",
      taxStatus: "shipping",
      weight: "0.4",
      width: "15",
    },
  };
}

describe("product request mapping", () => {
  it("maps only the approved simple-product DTO fields", () => {
    expect(mapProductRequest(submission(), copy)).toEqual({
      backorders: "notify",
      catalog_visibility: "search",
      category_ids: [7, 8],
      date_on_sale_from: "2030-01-10",
      date_on_sale_to: "2030-01-20",
      description: "Long",
      height: "3",
      image_ids: [42],
      length: "20",
      manage_stock: true,
      name: "Canvas tote",
      regular_price: "19.99",
      sale_price: "14.99",
      shipping_class_id: 4,
      short_description: "Short",
      sku: "TOTE-1",
      slug: "canvas-tote",
      sold_individually: true,
      status: "draft",
      stock_quantity: 3,
      stock_status: "onbackorder",
      tag_ids: [9, 10],
      tax_class: "reduced-rate",
      tax_status: "shipping",
      weight: "0.4",
      width: "15",
    });
  });

  it("blocks browser-only media instead of pretending to save it", () => {
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
