import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences, usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import { WorkspaceApp } from "../../app/WorkspaceApp";
import { WorkspaceClient } from "../../application/WorkspaceClient";
import type { WorkspaceRepository } from "../../application/WorkspaceRepository";
import { WorkspaceApiError } from "../../application/WorkspaceApiError";
import type { CreateProductRequest, OperationResult, VariableProductRequest } from "../../domain/products";
import { canonicalProduct, operationResult, workspaceRepository, workspaceSnapshot } from "../../test/workspaceFixtures";
import { DEFAULT_WORKSPACE_PREFERENCES } from "../../domain/products";

function succeeded(state: OperationResult["state"] = "succeeded"): OperationResult {
  return operationResult(state);
}

function repository(createProduct: WorkspaceRepository["createProduct"]): WorkspaceRepository {
  const operations: OperationResult[] = [];
  return workspaceRepository({
    createProduct: async (request, key) => {
      const result = await createProduct(request, key);
      operations.splice(0, operations.length, result);
      return result;
    },
    getOperation: () => Promise.resolve(succeeded()),
    listOperations: () => Promise.resolve({
      counts: {
        all: operations.length,
        draft: operations.filter((item) => item.product?.status === "draft").length,
        error: operations.filter((item) => item.state === "failed").length,
        pending: operations.filter((item) => item.state === "processing" || item.state === "uncertain").length,
        synced: operations.filter((item) => item.product?.status === "publish").length,
      },
      has_more: false, items: operations, page: 1, per_page: 25, total: operations.length,
    }),
    load: () => Promise.resolve(workspaceSnapshot),
    listCategories: () => Promise.resolve({
      has_more: false,
      items: [{ count: 0, id: 7, name: "Accessories", parent: 0, slug: "accessories" }],
      page: 1,
      per_page: 20,
    }),
  });
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

function replaceBrowserCrypto(cryptoSource: unknown): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: cryptoSource });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else Reflect.deleteProperty(globalThis, "crypto");
  };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/product name/i), "Canvas tote");
  await user.type(screen.getByLabelText(/^Price/i), "19.99");
  await user.type(screen.getByLabelText(/^SKU/i), "TOTE-1");
  await user.click(screen.getByRole("combobox", { name: /categories/i }));
  await user.click(await screen.findByText("Accessories"));
}

beforeEach(() => {
  sessionStorage.clear();
  usePrefsStore.setState({ commandOpen: false, prefs: defaultPreferences, shortcutsOpen: false });
  useProductStore.setState({
    categories: [],
    recentCategoryIds: [],
  });
  useProductStore.getState().clearDraftFormData();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("real product create flow", () => {
  it("submits with secure fallback UUIDs when randomUUID is unavailable", async () => {
    let nextByte = 1;
    const restoreCrypto = replaceBrowserCrypto({
      getRandomValues(bytes: Uint8Array) {
        bytes.fill(nextByte);
        nextByte += 1;
        return bytes;
      },
    });
    const create = vi.fn((...args: [CreateProductRequest, string]) => {
      void args;
      return Promise.resolve(succeeded());
    });

    try {
      const user = userEvent.setup();
      renderWorkspace(repository(create));
      await fillRequiredFields(user);
      await user.click(screen.getByRole("button", { name: /save & next/i }));

      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      expect(create.mock.calls[0]?.[1]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect((await screen.findAllByText("Published")).length).toBeGreaterThan(0);
    } finally {
      restoreCrypto();
    }
  });

  it("owner regression: reports unavailable secure randomness without sending a product request", async () => {
    const restoreCrypto = replaceBrowserCrypto(undefined);
    const create = vi.fn(() => Promise.resolve(succeeded()));

    try {
      const user = userEvent.setup();
      renderWorkspace(repository(create));
      await fillRequiredFields(user);
      await user.click(screen.getByRole("button", { name: /save & next/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Secure product identity could not be generated. Product creation was not attempted.",
      );
      expect(create).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/product name/i)).toHaveValue("Canvas tote");
      expect(screen.getByText("Queue is empty")).toBeVisible();
    } finally {
      restoreCrypto();
    }
  });

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

    expect((await screen.findAllByText("Published")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Canvas tote").length).toBeGreaterThan(0);
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
    expect((await screen.findAllByText("Published")).length).toBeGreaterThan(0);
  });

  it("retains only configured fields from the canonical server result", async () => {
    const result = succeeded();
    result.product = result.product ? { ...result.product, regular_price: "20.00" } : null;
    const repo = repository(() => Promise.resolve(result));
    repo.getPreferences = () => Promise.resolve({
      ...DEFAULT_WORKSPACE_PREFERENCES,
      repeat_fields: ["category_ids", "regular_price"],
    });
    const user = userEvent.setup();
    renderWorkspace(repo);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(screen.getByLabelText(/product name/i)).toHaveValue(""));
    expect(screen.getByLabelText(/^Price/i)).toHaveValue(20);
    expect(screen.getByRole("combobox", { name: /categories/i })).toHaveTextContent("Accessories");
    expect(screen.getByLabelText(/^SKU/i)).toHaveValue("");
  });

  it("creates a variable product through one cohesive repository call", async () => {
    const simpleCreate = vi.fn(() => Promise.resolve(succeeded()));
    const repo = repository(simpleCreate);
    const variableCreate = vi.fn((request: VariableProductRequest) => Promise.resolve({
      ...succeeded(),
      combination_results: request.combinations.map((combination, index) => ({
        client_id: combination.clientId, error: null, fingerprint: `color-${index}`,
        state: "succeeded" as const, variation_id: 900 + index,
      })),
      input: request,
      product: {
        ...canonicalProduct, attributes: request.attributes,
        combinations: request.combinations.map((combination, index) => ({ ...combination, variationId: 900 + index })),
        projected_count: request.combinations.length, type: "variable" as const,
      },
    }));
    repo.createVariableProduct = variableCreate;
    const user = userEvent.setup();
    renderWorkspace(repo);

    await user.click(await screen.findByRole("button", { name: "Variable" }));
    fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: "Variable tee" } });
    await user.click(screen.getByRole("combobox", { name: /categories/i }));
    await user.click(await screen.findByText("Accessories"));
    await user.click(screen.getByRole("button", { name: /custom attribute/i }));
    fireEvent.change(screen.getByPlaceholderText(/attribute name/i), { target: { value: "Color" } });
    await user.type(screen.getByPlaceholderText(/type options/i), "Black, White{Enter}");
    await user.click(screen.getByRole("button", { name: /generate combinations/i }));
    screen.getAllByPlaceholderText("Price").forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(20 + index) } });
    });
    await user.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => expect(variableCreate).toHaveBeenCalledTimes(1));
    expect(simpleCreate).not.toHaveBeenCalled();
    expect(variableCreate.mock.calls[0]?.[0].combinations).toHaveLength(2);
  });
});
