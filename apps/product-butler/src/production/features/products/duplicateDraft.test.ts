import { describe, expect, it } from "vitest";
import { simpleProductFields } from "../../test/workspaceFixtures";
import { duplicatePrefillToDraft } from "./duplicateDraft";

describe("duplicate draft mapping", () => {
  it("hydrates a browser draft from a no-write server prefill", () => {
    const draft = duplicatePrefillToDraft(
      {
        ...simpleProductFields,
        image_ids: [42],
        name: "Canvas tote Copy",
        sku: "",
        slug: "",
        status: "draft",
      },
      [{ alt: "Canvas", id: 42, url: "https://store.test/canvas.jpg" }],
    );

    expect(draft).toMatchObject({
      categoryId: "7",
      name: "Canvas tote Copy",
      sku: "",
      variations: [],
    });
    expect(draft.images).toEqual([
      { id: "wp-42", preview: "https://store.test/canvas.jpg", wpMediaId: 42 },
    ]);
  });
});
