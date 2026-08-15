import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { VariationsEditor } from "@/components/VariationsEditor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceClient } from "../../application/WorkspaceClient";
import type { WorkspaceRepository } from "../../application/WorkspaceRepository";
import { WorkspaceRuntimeProvider } from "../../app/WorkspaceRuntime";
import type { VariableAttribute, VariationCombination } from "../../domain/variableProducts";
import { workspaceRepository, workspaceSnapshot } from "../../test/workspaceFixtures";

function Harness() {
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [combinations, setCombinations] = useState<VariationCombination[]>([]);
  return <VariationsEditor attributes={attributes} combinations={combinations}
    onAttributesChange={setAttributes} onCombinationsChange={setCombinations}
    onUploadImage={() => Promise.reject(new Error("Not used in this test."))} />;
}

function renderEditor(overrides: Partial<WorkspaceRepository> = {}) {
  const scope = document.createElement("div");
  document.body.append(scope);
  const client = new WorkspaceClient(workspaceRepository({
    listAttributes: () => Promise.resolve([]),
    ...overrides,
  }));
  render(
    <WorkspaceRuntimeProvider bootstrap={workspaceSnapshot.bootstrap} client={client} scope={scope}>
      <TooltipProvider><Harness /></TooltipProvider>
    </WorkspaceRuntimeProvider>,
    { container: scope },
  );
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("Lovable variable editor", () => {
  it("generates concrete combinations and preserves row values when regenerated", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: /custom attribute/i }));
    fireEvent.change(screen.getByPlaceholderText(/attribute name/i), { target: { value: "Color" } });
    const firstOptions = screen.getByPlaceholderText(/type options/i);
    await user.type(firstOptions, "Black, White{Enter}");
    await user.click(screen.getByRole("button", { name: /custom attribute/i }));
    const names = screen.getAllByPlaceholderText(/attribute name/i);
    const options = screen.getAllByPlaceholderText(/type options/i);
    fireEvent.change(names[1]!, { target: { value: "Size" } });
    await user.type(options[1]!, "S, M, L{Enter}");

    expect(screen.getByText(/2 Color/)).toBeVisible();
    expect(screen.getByText("6 variations")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /generate combinations/i }));
    expect(screen.getAllByPlaceholderText("Price")).toHaveLength(6);
    expect(screen.getByText(/variations missing a price/i)).toBeVisible();

    const prices = screen.getAllByPlaceholderText("Price");
    const skus = screen.getAllByPlaceholderText("SKU");
    fireEvent.change(prices[0]!, { target: { value: "21.50" } });
    fireEvent.change(skus[0]!, { target: { value: "BLACK-S" } });
    await user.click(screen.getByRole("button", { name: /regenerate combinations/i }));
    expect(screen.getAllByPlaceholderText("Price")[0]).toHaveValue(21.5);
    expect(screen.getAllByPlaceholderText("SKU")[0]).toHaveValue("BLACK-S");

    fireEvent.change(screen.getByPlaceholderText("Set all"), { target: { value: "24.00" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));
    screen.getAllByPlaceholderText("Price").forEach((input) => expect(input).toHaveValue(24));
    expect(screen.queryByText(/missing a price/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /auto sku/i }));
    expect(screen.getAllByPlaceholderText("SKU")[5]).toHaveValue("SKU-WHITE-L");
  });

  it("uses real global terms with a custom attribute for a 2 by 3 plan", async () => {
    const user = userEvent.setup();
    renderEditor({
      listAttributes: () => Promise.resolve([{
        id: 7, name: "Color", orderBy: "menu_order", taxonomy: "pa_color" as const,
      }]),
      listAttributeTerms: () => Promise.resolve([
        { id: 101, name: "Black", slug: "black" },
        { id: 102, name: "White", slug: "white" },
      ]),
    });

    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Color" }));
    await user.click(await screen.findByRole("button", { name: "Black" }));
    await user.click(screen.getByRole("button", { name: "White" }));
    await user.click(screen.getByRole("button", { name: /custom attribute/i }));
    fireEvent.change(screen.getByPlaceholderText(/attribute name/i), { target: { value: "Size" } });
    await user.type(screen.getByPlaceholderText(/type options/i), "S, M, L{Enter}");

    expect(screen.getByText(/2 Color/)).toBeVisible();
    expect(screen.getByText("6 variations")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /generate combinations/i }));
    expect(screen.getAllByPlaceholderText("Price")).toHaveLength(6);
  });
});
