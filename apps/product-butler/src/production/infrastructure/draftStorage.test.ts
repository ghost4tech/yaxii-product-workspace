import { beforeEach, describe, expect, it } from "vitest";
import { emptyProductFormData } from "@/types/product";
import { useProductStore } from "@/stores/productStore";
import { createDraftStorage, DRAFT_TTL_MS } from "./draftStorage";

interface Envelope { payload: string; savedAt: number; schema: number }

describe("product draft persistence", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useProductStore.getState().clearDraftFormData();
  });

  it("keeps media-library references but never serializes raw browser files", () => {
    useProductStore.getState().setDraftFormData({
      ...emptyProductFormData,
      images: [
        { file: new File(["image"], "local.png"), id: "local", preview: "blob:local" },
        { id: "wp-42", preview: "https://store.test/image.jpg", wpMediaId: 42 },
      ],
      name: "Canvas tote",
    });

    const envelope = JSON.parse(sessionStorage.getItem("ypw.product-draft.v2") ?? "{}") as Envelope;
    const persisted = JSON.parse(envelope.payload) as {
      state?: { draftFormData?: { images?: Array<{ file?: unknown; wpMediaId?: number }>; name?: string } };
    };
    expect(envelope.schema).toBe(2);
    expect(persisted.state?.draftFormData?.name).toBe("Canvas tote");
    expect(persisted.state?.draftFormData?.images).toEqual([
      { id: "wp-42", preview: "https://store.test/image.jpg", wpMediaId: 42 },
    ]);
    expect(persisted.state?.draftFormData?.images?.[0]?.file).toBeUndefined();
  });

  it("expires a draft after the bounded recovery window", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => { values.delete(key); },
      setItem: (key: string, value: string) => { values.set(key, value); },
    } as Storage;
    const start = Date.now();
    createDraftStorage(storage, () => start).setItem("draft", "payload");

    expect(createDraftStorage(storage, () => start + DRAFT_TTL_MS + 1).getItem("draft")).toBeNull();
    expect(storage.getItem("draft")).toBeNull();
  });
});
