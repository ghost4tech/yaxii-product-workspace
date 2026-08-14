import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "@/components/RichTextEditor";

function Harness({ onUpload }: { onUpload: (file: File) => Promise<{ id: string; preview: string; wpMediaId: number }> }) {
  const [value, setValue] = useState("");
  return <>
    <RichTextEditor ariaLabel="Full description" value={value} onChange={setValue} onUploadImage={onUpload} />
    <output data-testid="html">{value}</output>
  </>;
}

afterEach(cleanup);

describe("Lovable rich text editor", () => {
  it("inserts only the durable WordPress URL returned by media upload", async () => {
    const upload = vi.fn(() => Promise.resolve({
      id: "wp-81", preview: "https://store.test/uploads/canvas.jpg", wpMediaId: 81,
    }));
    render(<Harness onUpload={upload} />);
    const file = new File(["image"], "canvas.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText("Full description image upload"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(upload).toHaveBeenCalledWith(file));
    await waitFor(() => expect(screen.getByTestId("html")).toHaveTextContent(
      '<img src="https://store.test/uploads/canvas.jpg" alt="canvas.jpg">',
    ));
    expect(screen.getByTestId("html")).not.toHaveTextContent(/blob:|data:image/i);
  });
});
