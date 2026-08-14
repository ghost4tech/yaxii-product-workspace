import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { VariationsEditor } from "@/components/VariationsEditor";
import { WorkspaceClient } from "../../application/WorkspaceClient";
import { WorkspaceRuntimeProvider } from "../../app/WorkspaceRuntime";
import type { VariableAttribute, VariationCombination } from "../../domain/variableProducts";
import { workspaceRepository, workspaceSnapshot } from "../../test/workspaceFixtures";

function Harness() {
  const [attributes, setAttributes] = useState<VariableAttribute[]>([]);
  const [combinations, setCombinations] = useState<VariationCombination[]>([]);
  return <VariationsEditor attributes={attributes} combinations={combinations}
    onAttributesChange={setAttributes} onCombinationsChange={setCombinations} />;
}

function renderEditor() {
  const scope = document.createElement("div");
  document.body.append(scope);
  const client = new WorkspaceClient(workspaceRepository({
    listAttributes: () => Promise.resolve([]),
  }));
  render(
    <WorkspaceRuntimeProvider bootstrap={workspaceSnapshot.bootstrap} client={client} scope={scope}>
      <Harness />
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

    await user.click(screen.getByRole("button", { name: /add attribute/i }));
    fireEvent.change(screen.getByPlaceholderText(/attribute name/i), { target: { value: "Color" } });
    fireEvent.change(screen.getByPlaceholderText(/values separated/i), { target: { value: "Black, White" } });
    fireEvent.blur(screen.getByPlaceholderText(/values separated/i));
    await user.click(screen.getByRole("button", { name: /add attribute/i }));
    const names = screen.getAllByPlaceholderText(/attribute name/i);
    const options = screen.getAllByPlaceholderText(/values separated/i);
    fireEvent.change(names[1]!, { target: { value: "Size" } });
    fireEvent.change(options[1]!, { target: { value: "S, M, L" } });
    fireEvent.blur(options[1]!);

    expect(screen.getByText("6 projected combinations")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /generate combinations/i }));
    expect(screen.getAllByText("New variation")).toHaveLength(6);
    expect(screen.getByText("Color: Black / Size: S")).toBeVisible();
    expect(screen.getByText("Color: White / Size: L")).toBeVisible();

    const prices = screen.getAllByLabelText("Price *");
    const skus = screen.getAllByLabelText("SKU");
    fireEvent.change(prices[0]!, { target: { value: "21.50" } });
    fireEvent.change(skus[0]!, { target: { value: "BLACK-S" } });
    await user.click(screen.getByRole("button", { name: /generate combinations/i }));
    expect(screen.getAllByLabelText("Price *")[0]).toHaveValue(21.5);
    expect(screen.getAllByLabelText("SKU")[0]).toHaveValue("BLACK-S");
  });
});
