import { act, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VariationRow } from "@/components/variations/VariationRow";
import type { ProductImage } from "@/types/product";
import { describe, expect, it, vi } from "vitest";
import type { VariationCombination } from "../../domain/variableProducts";

const combination: VariationCombination = {
  clientId: "11111111-1111-4111-8111-111111111111",
  enabled: true,
  imageId: 0,
  manageStock: false,
  regularPrice: "19.99",
  salePrice: null,
  selections: [{ attributeKey: "custom:color", option: "Blue" }],
  sku: "BLUE-1",
  stockQuantity: null,
  stockStatus: "instock",
  variationId: 0,
};

function renderRow(properties: Partial<React.ComponentProps<typeof VariationRow>> = {}) {
  const defaults: React.ComponentProps<typeof VariationRow> = {
    combination,
    currency: "$",
    index: 0,
    labels: ["Blue"],
    onChange: vi.fn(),
    onImage: vi.fn(),
    onUploadImage: vi.fn(),
  };
  return render(<TooltipProvider><VariationRow {...defaults} {...properties} /></TooltipProvider>);
}

describe("VariationRow image state", () => {
  it("blocks repeated picks while upload is pending and resolves to the durable image", async () => {
    let resolveUpload: (image: ProductImage) => void = () => undefined;
    const onImage = vi.fn();
    const onUploadImage = vi.fn(() => new Promise<ProductImage>((resolve) => { resolveUpload = resolve; }));
    const view = renderRow({ onImage, onUploadImage });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(["image"], "variation.png", { type: "image/png" });
    if (!input) throw new Error("Expected the variation image input.");

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("button", { name: "Add variation image" })).toBeDisabled();
    expect(screen.getByText("Uploading variation image")).toBeInTheDocument();

    const uploaded = { id: "wp-42", preview: "https://store.test/variation.png", wpMediaId: 42 };
    await act(async () => {
      resolveUpload(uploaded);
      await Promise.resolve();
    });
    expect(onImage).toHaveBeenCalledWith(uploaded);
    expect(screen.getByRole("button", { name: "Add variation image" })).toBeEnabled();
  });

  it("shows a retryable failure after an upload error", async () => {
    const onUploadImage = vi.fn().mockRejectedValueOnce(new Error("failed"));
    const view = renderRow({ onUploadImage });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Expected the variation image input.");
    fireEvent.change(input, { target: { files: [new File(["bad"], "bad.png", { type: "image/png" })] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Image upload failed. Try again.");
    expect(screen.getByRole("button", { name: "Add variation image" })).toBeEnabled();
  });

  it("keeps image removal available to keyboard users", () => {
    const onImage = vi.fn();
    renderRow({ image: { id: "wp-42", preview: "https://store.test/variation.png", wpMediaId: 42 }, onImage });
    const remove = screen.getByRole("button", { name: "Remove variation image" });
    remove.focus();
    expect(remove).toHaveFocus();
    fireEvent.click(remove);
    expect(onImage).toHaveBeenCalledWith(null);
  });
});
