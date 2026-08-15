import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageUpload } from "@/components/ImageUpload";
import type { ProductImage } from "@/types/product";
import { appendSelectedMedia } from "./productImages";

afterEach(cleanup);

describe("product gallery media selection", () => {
  it("keeps attachment ids unique across repeated picker selections", () => {
    const existing: ProductImage[] = [{ id: "wp-30", preview: "https://store.test/30.jpg", wpMediaId: 30 }];

    expect(appendSelectedMedia(existing, [
      { id: 30, url: "https://store.test/30.jpg" },
      { id: 28, url: "https://store.test/28.jpg" },
      { id: 28, url: "https://store.test/28.jpg" },
    ], 10)).toEqual([
      existing[0],
      { id: "wp-28", preview: "https://store.test/28.jpg", wpMediaId: 28 },
    ]);
  });

  it("never exceeds the configured gallery limit", () => {
    const existing: ProductImage[] = [{ id: "wp-30", preview: "https://store.test/30.jpg", wpMediaId: 30 }];

    expect(appendSelectedMedia(existing, [
      { id: 28, url: "https://store.test/28.jpg" },
      { id: 26, url: "https://store.test/26.jpg" },
    ], 2)).toHaveLength(2);
  });

  it("keeps successful attachments visible when a later upload fails", async () => {
    const upload = vi.fn((file: File) => file.name === "first.jpg"
      ? Promise.resolve({ id: "wp-81", preview: "https://store.test/first.jpg", wpMediaId: 81 })
      : Promise.reject(new Error("Second upload failed.")));
    function Harness() {
      const [images, setImages] = useState<ProductImage[]>([]);
      return createElement(ImageUpload, { images, onChange: setImages, onUpload: upload });
    }
    const { container } = render(createElement(Harness));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await userEvent.upload(input as HTMLInputElement, [
      new File(["first"], "first.jpg", { type: "image/jpeg" }),
      new File(["second"], "second.jpg", { type: "image/jpeg" }),
    ]);

    expect(await screen.findByAltText("Product image 1")).toHaveAttribute("src", "https://store.test/first.jpg");
    expect(await screen.findByRole("alert")).toHaveTextContent("Second upload failed. Uploaded images were kept.");
    expect(upload).toHaveBeenCalledTimes(2);
  });
});
