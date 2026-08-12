import { beforeEach, describe, expect, it } from "vitest";
import { SessionDraftStorage } from "./draftStorage";
import { EMPTY_PRODUCT_DRAFT } from "./productDraft";

describe("SessionDraftStorage", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips a bounded versioned browser draft", () => {
    const storage = new SessionDraftStorage();
    const draft = { ...EMPTY_PRODUCT_DRAFT, name: "Desk lamp", sku: "LAMP-001" };

    expect(storage.save(draft)).toEqual({ kind: "saved" });
    expect(storage.read()).toEqual({ draft, kind: "loaded" });

    const serialized = sessionStorage.getItem("ypw.product-draft.v1") ?? "";
    expect(serialized).not.toContain("consumerKey");
    expect(serialized).not.toContain("consumerSecret");
  });

  it("rejects malformed persisted data instead of treating it as a product", () => {
    sessionStorage.setItem(
      "ypw.product-draft.v1",
      JSON.stringify({ draft: { name: "Incomplete" }, version: 1 }),
    );

    expect(new SessionDraftStorage().read()).toEqual({ kind: "error" });
  });
});
