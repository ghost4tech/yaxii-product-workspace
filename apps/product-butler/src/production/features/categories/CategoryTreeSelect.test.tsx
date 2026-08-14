import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryTreeSelect } from "@/components/CategoryTreeSelect";
import { useProductStore } from "@/stores/productStore";
import { WorkspaceClient } from "../../application/WorkspaceClient";
import type { CategoryQueryOptions } from "../../application/WorkspaceRepository";
import { WorkspaceRuntimeProvider } from "../../app/WorkspaceRuntime";
import { workspaceRepository, workspaceSnapshot } from "../../test/workspaceFixtures";

const root = { count: 4, hasChildren: true, id: 10, name: "Clothing", parent: 0, slug: "clothing" };
const child = { count: 3, hasChildren: true, id: 20, name: "Shirts", parent: 10, slug: "shirts" };
const grandchild = { count: 2, hasChildren: false, id: 30, name: "Graphic tees", parent: 20, slug: "graphic-tees" };

function Harness() {
  const [value, setValue] = useState(["30"]);
  return <><CategoryTreeSelect value={value} onChange={setValue} /><output>{value.join(",")}</output></>;
}

beforeEach(() => useProductStore.setState({ categories: [], recentCategoryIds: [] }));
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("hierarchical category selector", () => {
  it("hydrates selected ids and lazy-loads each expanded branch", async () => {
    const listCategories = vi.fn((options: CategoryQueryOptions) => {
      const items = options.include ? [{ ...grandchild, ancestors: [root, child] }]
        : options.parent === 0 ? [root] : options.parent === 10 ? [child]
          : options.parent === 20 ? [grandchild] : [];
      return Promise.resolve({ has_more: false, items, page: 1, per_page: options.perPage ?? 25 });
    });
    const client = new WorkspaceClient(workspaceRepository({ listCategories }));
    const scope = document.createElement("div");
    document.body.append(scope);
    render(<WorkspaceRuntimeProvider bootstrap={workspaceSnapshot.bootstrap} client={client} scope={scope}>
      <Harness />
    </WorkspaceRuntimeProvider>, { container: scope });

    expect(await screen.findByRole("combobox", { name: "Categories" })).toHaveTextContent("Graphic tees");
    expect(listCategories).toHaveBeenCalledWith(expect.objectContaining({ include: [30], perPage: 20 }));

    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox", { name: "Categories" }));
    await screen.findByText("Clothing");
    await user.click(screen.getByRole("button", { name: "Expand" }));
    await screen.findByText("Shirts");
    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect((await screen.findAllByText("Graphic tees")).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(listCategories).toHaveBeenCalledWith(expect.objectContaining({ parent: 10, perPage: 25 }));
      expect(listCategories).toHaveBeenCalledWith(expect.objectContaining({ parent: 20, perPage: 25 }));
    });
    expect(screen.getByRole("status")).toHaveTextContent("30");
  });
});
