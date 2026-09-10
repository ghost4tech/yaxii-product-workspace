import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences, usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import { WorkspaceApiError } from "../application/WorkspaceApiError";
import { WorkspaceClient } from "../application/WorkspaceClient";
import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceSnapshot } from "../domain/workspace";
import { canonicalProduct, workspaceRepository, workspaceSnapshot } from "../test/workspaceFixtures";
import { WorkspaceApp } from "./WorkspaceApp";

function renderDeepLink(
  initialProductId: number,
  overrides: Partial<WorkspaceRepository>,
) {
  const scope = document.createElement("div");
  scope.id = "yaxii-product-workspace";
  const app = document.createElement("div");
  const portals = document.createElement("div");
  portals.id = "yaxii-product-workspace-portals";
  scope.append(app, portals);
  document.body.append(scope);
  const snapshot: WorkspaceSnapshot = {
    ...workspaceSnapshot,
    bootstrap: { ...workspaceSnapshot.bootstrap, initialProductId },
  };
  const repository = workspaceRepository({
    load: () => Promise.resolve(snapshot),
    ...overrides,
  });
  render(<WorkspaceApp client={new WorkspaceClient(repository)} scope={scope} />, { container: app });
}

beforeEach(() => {
  sessionStorage.clear();
  usePrefsStore.setState({
    commandOpen: false,
    prefs: defaultPreferences,
    shortcutsOpen: false,
  });
  useProductStore.getState().clearDraftFormData();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("Workspace product deep links", () => {
  it("opens a valid product through the canonical hydration path", async () => {
    const getProduct = vi.fn(() => Promise.resolve(canonicalProduct));
    renderDeepLink(canonicalProduct.id, {
      getProduct,
      listCategories: () => Promise.resolve({
        has_more: false,
        items: [{ count: 1, hasChildren: false, id: 7, name: "Accessories", parent: 0, slug: "accessories" }],
        page: 1,
        per_page: 20,
      }),
    });

    expect(await screen.findByRole("heading", { name: "Edit product" })).toBeVisible();
    expect(await screen.findByDisplayValue("Canvas tote")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open in WooCommerce" })).toHaveAttribute(
      "href",
      canonicalProduct.native_edit_url,
    );
    expect(getProduct).toHaveBeenCalledOnce();
    expect(getProduct).toHaveBeenCalledWith(canonicalProduct.id);
  });

  it("rejects an invalid ID before making an API request", async () => {
    const getProduct = vi.fn(() => Promise.resolve(canonicalProduct));
    renderDeepLink(0, { getProduct });

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid product ID/i);
    expect(getProduct).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Add new product" })).toBeVisible();
  });

  it.each([
    ["missing", new WorkspaceApiError("ypw_product_not_found", "The linked product no longer exists.", 404)],
    ["unsupported", new WorkspaceApiError("ypw_unsupported_product_type", "This product type is not supported.", 422)],
    ["forbidden", new WorkspaceApiError("ypw_product_forbidden", "You cannot edit this product.", 403)],
  ])("shows the bounded %s error after a direct refresh", async (_caseName, error) => {
    renderDeepLink(999, { getProduct: () => Promise.reject(error) });

    expect(await screen.findByRole("alert")).toHaveTextContent(error.message);
    expect(screen.getByRole("heading", { name: "Add new product" })).toBeVisible();
  });
});
