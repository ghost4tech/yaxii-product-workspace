import { describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE_PREFERENCES } from "../../domain/products";
import { canonicalProduct } from "../../test/workspaceFixtures";
import { fieldsToDraft, nextDraft, preferencesDraft } from "./productDrafts";

describe("simple product drafts", () => {
  it("hydrates all maintained simple fields and WordPress media references", () => {
    const draft = fieldsToDraft({
      ...canonicalProduct,
      category_ids: [7, 8],
      date_on_sale_from: "2030-01-10",
      image_ids: [42],
      shipping_class_id: 4,
      tag_ids: [9],
      weight: "0.4",
    }, [{ alt: "Canvas", id: 42, url: "https://store.test/canvas.jpg" }]);

    expect(draft).toMatchObject({
      additionalCategoryIds: [8], categoryId: "7", name: "Canvas tote",
      saleScheduleStart: new Date("2030-01-10"), shippingClassId: 4,
      tagIds: [9], variations: [], weight: "0.4",
    });
    expect(draft.images[0]?.wpMediaId).toBe(42);
  });

  it("uses server preferences for a new draft", () => {
    expect(preferencesDraft({
      ...DEFAULT_WORKSPACE_PREFERENCES,
      default_catalog_visibility: "hidden",
      default_product_status: "draft",
      default_tax_status: "none",
    })).toMatchObject({ catalogVisibility: "hidden", productStatus: "draft", taxStatus: "none" });
  });

  it("retains only explicitly configured Save & Next fields", () => {
    const next = nextDraft({
      ...canonicalProduct,
      category_ids: [7, 8],
      manage_stock: true,
      stock_quantity: 12,
      weight: "0.4",
    }, {
      ...DEFAULT_WORKSPACE_PREFERENCES,
      repeat_fields: ["category_ids", "manage_stock", "stock_quantity", "weight"],
    });

    expect(next).toMatchObject({
      additionalCategoryIds: [8], categoryId: "7", manageStock: true,
      name: "", regularPrice: "", sku: "", stockQuantity: "12", weight: "0.4",
    });
  });
});
