import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences, usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import { defaultAppSettings } from "@/types/product";
import { WorkspaceApp } from "../../app/WorkspaceApp";
import { WorkspaceClient } from "../../application/WorkspaceClient";
import type { WorkspaceRepository } from "../../application/WorkspaceRepository";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { CreateProductRequest, OperationResult } from "../../domain/products";
import type { WorkspaceSnapshot } from "../../domain/workspace";

const snapshot: WorkspaceSnapshot = {
  availability: { kind: "ready" },
  bootstrap: {
    capabilities: { createProducts: true, publishProducts: true, uploadMedia: true },
    direction: "ltr",
    environment: "wordpress",
    features: {
      categoryLookup: true,
      mediaSelection: true,
      operationLookup: true,
      simpleProductCreate: true,
      variableProductCreate: false,
    },
    frontendAvailable: true,
    isWooCommerceAvailable: true,
    locale: "en-US",
    pluginVersion: "test",
    user: { displayName: "Admin", id: 1 },
    woocommerce: {
      currency: "USD",
      currencySymbol: "$",
      dimensionUnit: "cm",
      version: "10.9.4",
      weightUnit: "kg",
    },
  },
};

function succeeded(state: OperationResult["state"] = "succeeded"): OperationResult {
  return {
    errors: [],
    operation_id: "11111111-1111-4111-8111-111111111111",
    product: state === "succeeded" ? {
      catalog_visibility: "visible",
      category_ids: [7],
      created_at: "2026-08-12T12:00:00+00:00",
      id: 321,
      image_ids: [],
      manage_stock: false,
      name: "Canvas tote",
      regular_price: "19.99",
      sale_price: "",
      sku: "TOTE-1",
      status: "publish",
      stock_quantity: null,
      stock_status: "instock",
    } : null,
    replayed: false,
    retry: { can_reconcile: state !== "succeeded", safe_to_resubmit: state !== "succeeded" },
    state,
    warnings: [],
  };
}

function repository(createProduct: WorkspaceRepository["createProduct"]): WorkspaceRepository {
  return {
    createProduct,
    getOperation: () => Promise.resolve(succeeded()),
    load: () => Promise.resolve(snapshot),
    searchCategories: () => Promise.resolve({
      has_more: false,
      items: [{ count: 0, id: 7, name: "Accessories", parent: 0, slug: "accessories" }],
      page: 1,
      per_page: 20,
    }),
  };
}

function renderWorkspace(repo: WorkspaceRepository) {
  const scope = document.createElement("div");
  const app = document.createElement("div");
  const portals = document.createElement("div");
  portals.id = "yaxii-product-workspace-portals";
  scope.append(app, portals);
  document.body.append(scope);
  render(<WorkspaceApp client={new WorkspaceClient(repo)} scope={scope} />, { container: app });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/product name/i), "Canvas tote");
  await user.type(screen.getByLabelText(/^Price/i), "19.99");
  await user.type(screen.getByLabelText(/^SKU/i), "TOTE-1");
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByText("Accessories"));
}

beforeEach(() => {
  sessionStorage.clear();
  usePrefsStore.setState({ commandOpen: false, prefs: defaultPreferences, shortcutsOpen: false });
  useProductStore.setState({
    appSettings: defaultAppSettings,
    categories: [],
    products: [],
    recentCategoryIds: [],
  });
  useProductStore.getState().clearDraftFormData();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("real product create flow", () => {
  it("prevents double submit, shows saving, and queues only the server result", async () => {
    let resolveCreate!: (value: OperationResult) => void;
    const create = vi.fn((...args: [CreateProductRequest, string]) => {
      void args;
      return new Promise<OperationResult>((resolve) => { resolveCreate = resolve; });
    });
    const user = userEvent.setup();
    renderWorkspace(repository(create));
    await fillRequiredFields(user);

    await user.dblClick(screen.getByRole("button", { name: /save & next/i }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    resolveCreate(succeeded());

    expect((await screen.findAllByText("Synced")).length).toBeGreaterThan(0);
    expect(screen.getByText("Canvas tote")).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText(/product name/i)).toHaveValue(""));
  });

  it("preserves the form and maps a server field error", async () => {
    const failed: OperationResult = {
      ...succeeded("failed"),
      errors: [{ code: "ypw_duplicate_sku", fields: { sku: ["This SKU is already used."] }, message: "Review fields." }],
    };
    const user = userEvent.setup();
    renderWorkspace(repository(() => Promise.resolve(failed)));
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /save & next/i }));

    expect(await screen.findByText("This SKU is already used.")).toBeVisible();
    expect(screen.getByLabelText(/product name/i)).toHaveValue("Canvas tote");
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
  });

  it("keeps the draft and idempotency identity when the response is uncertain", async () => {
    const create = vi.fn((...args: [CreateProductRequest, string]) => {
      void args;
      return Promise.reject(new WorkspaceApiError("ypw_network_error", "No response.", 0, {}, true));
    });
    const user = userEvent.setup();
    renderWorkspace(repository(create));
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /save & next/i }));
    await user.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(create.mock.calls[0]?.[1]).toBe(create.mock.calls[1]?.[1]);
    expect(screen.getByLabelText(/product name/i)).toHaveValue("Canvas tote");
    expect(screen.getByText("Queue is empty")).toBeVisible();
  });

  it("reconciles a pending operation and supports the Save & Next keyboard shortcut", async () => {
    const repo = repository(() => Promise.resolve(succeeded("processing")));
    const reconcile = vi.spyOn(repo, "getOperation");
    const create = vi.spyOn(repo, "createProduct");
    const user = userEvent.setup();
    renderWorkspace(repo);
    await fillRequiredFields(user);
    await user.keyboard("{Control>}{Enter}{/Control}");

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(reconcile).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
    expect((await screen.findAllByText("Synced")).length).toBeGreaterThan(0);
  });
});
