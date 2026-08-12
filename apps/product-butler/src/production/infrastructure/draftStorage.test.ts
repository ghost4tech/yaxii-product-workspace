import { beforeEach, describe, expect, it } from "vitest";
import { emptyProductFormData } from "@/types/product";
import { useProductStore } from "@/stores/productStore";

describe("product draft persistence", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useProductStore.getState().clearDraftFormData();
  });

  it("persists draft fields without serializing browser files", () => {
    useProductStore.getState().setDraftFormData({
      ...emptyProductFormData,
      images: [
        {
          file: new File(["image"], "product.png", { type: "image/png" }),
          id: "image-1",
          preview: "blob:product-image",
          progress: 0,
          uploading: false,
        },
      ],
      name: "Canvas tote",
    });

    const persisted = JSON.parse(sessionStorage.getItem("ypw.product-draft.v1") ?? "{}") as {
      state?: { draftFormData?: { images?: unknown[]; name?: string } };
    };
    expect(persisted.state?.draftFormData?.name).toBe("Canvas tote");
    expect(persisted.state?.draftFormData?.images).toEqual([]);
  });
});
