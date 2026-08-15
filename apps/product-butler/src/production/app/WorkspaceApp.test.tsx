import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultPreferences, usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import { WorkspaceClient } from "../application/WorkspaceClient";
import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { OperationPage } from "../domain/products";
import type { WorkspaceSnapshot } from "../domain/workspace";
import { canonicalProduct, operationResult, workspaceRepository, workspaceSnapshot } from "../test/workspaceFixtures";
import { installWordPressI18n } from "../test/wordpressI18n";
import { WorkspaceApp } from "./WorkspaceApp";

const snapshot: WorkspaceSnapshot = workspaceSnapshot;

function deferredRequest<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((requestResolve) => { resolve = requestResolve; });
  return { promise, resolve };
}

function renderWorkspace(
  workspace: WorkspaceSnapshot | Promise<WorkspaceSnapshot> = snapshot,
  overrides: Partial<WorkspaceRepository> = {},
) {
  const scope = document.createElement("div");
  scope.id = "yaxii-product-workspace";
  const app = document.createElement("div");
  const portals = document.createElement("div");
  portals.id = "yaxii-product-workspace-portals";
  scope.append(app, portals);
  document.body.append(scope);
  const repository = workspaceRepository({ load: () => Promise.resolve(workspace), ...overrides });
  render(<WorkspaceApp client={new WorkspaceClient(repository)} scope={scope} />, { container: app });
  return { portals, scope };
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

describe("WorkspaceApp", () => {
  it("shows a minimal loading screen until the workspace bootstrap resolves", async () => {
    const bootstrapRequest = deferredRequest<WorkspaceSnapshot>();
    renderWorkspace(bootstrapRequest.promise);

    expect(screen.getByRole("status", { name: "Loading Yaxii Product Workspace" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Product entry" })).not.toBeInTheDocument();

    act(() => bootstrapRequest.resolve(snapshot));
    expect(await screen.findByRole("heading", { name: "Product entry" })).toBeVisible();
  });

  it("renders the approved Lovable Entry surface and hides deferred product routes", async () => {
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "Product entry" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Add new product" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent products" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /analytics/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /connect store/i })).not.toBeInTheDocument();
    expect(screen.queryByText("0/50 this month")).not.toBeInTheDocument();
    expect(screen.queryByText("Comfortable", { exact: true })).not.toBeInTheDocument();
    const queue = within(screen.getByRole("region", { name: "Recent products" }));
    expect(queue.queryByText("Product", { exact: true })).not.toBeInTheDocument();
    expect(queue.queryByText("Status", { exact: true })).not.toBeInTheDocument();
    expect(queue.queryByText(/clear search/i)).not.toBeInTheDocument();
    expect(queue.queryByText("Store history", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Queue is empty")).toBeVisible();
    expect(screen.getByRole("button", { name: /save & next/i })).toBeEnabled();
  });

  it("opens keyboard shortcuts from the header", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await screen.findByRole("heading", { name: "Product entry" });

    const shortcutsButton = screen.getByRole("button", { name: "Keyboard shortcuts" });
    expect(shortcutsButton).not.toHaveTextContent("Keyboard shortcuts");
    await user.click(shortcutsButton);

    expect(screen.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  });

  it("keeps the queue in a skeleton state until its first page resolves", async () => {
    const queueRequest = deferredRequest<OperationPage>();
    renderWorkspace(snapshot, { listOperations: () => queueRequest.promise });
    await screen.findByRole("heading", { name: "Product entry" });

    expect(screen.getByRole("status", { name: "Loading recent products" })).toBeVisible();
    expect(screen.queryByText("Queue is empty")).not.toBeInTheDocument();

    act(() => queueRequest.resolve({
      counts: { all: 0, draft: 0, error: 0, pending: 0, synced: 0 },
      has_more: false,
      items: [],
      page: 1,
      per_page: 25,
      total: 0,
    }));
    expect(await screen.findByText("Queue is empty")).toBeVisible();
  });

  it("keeps the current draft while entering and leaving Focus Mode", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    const name = await screen.findByLabelText(/product name/i);

    await user.type(name, "Canvas tote");
    expect(screen.getByText(/Unsaved draft.*Canvas tote/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Focus" }));
    expect(screen.getByRole("button", { name: "Exit focus" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByText("Added today")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exit focus" }));
    expect(screen.getByDisplayValue("Canvas tote")).toBeVisible();
  });

  it("lets the user hide the KPI cards from Workspace settings", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    expect(await screen.findByText("Recent operations")).toBeVisible();

    await user.click(screen.getByRole("link", { name: "Settings" }));
    await user.click(await screen.findByRole("tab", { name: "Workspace" }));
    await user.click(screen.getByRole("switch", { name: "KPI cards" }));
    await user.click(screen.getByRole("link", { name: "Entry" }));

    expect(screen.queryByText("Recent operations")).not.toBeInTheDocument();
  });

  it("shows one unavailable marker per KPI instead of a duplicate trend marker", async () => {
    renderWorkspace(snapshot, { getOperationSummary: () => Promise.reject(new Error("Unavailable")) });

    await waitFor(() => expect(screen.getAllByText("unavailable")).toHaveLength(4));
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("opens the empty mobile queue in the plugin portal", async () => {
    const user = userEvent.setup();
    const { portals } = renderWorkspace();
    await screen.findByRole("heading", { name: "Product entry" });

    await user.click(screen.getByRole("button", { name: /^Queue 0$/i }));
    expect(portals.querySelector('[role="dialog"]')).not.toBeNull();
    expect(screen.getAllByText("Queue is empty")).toHaveLength(2);
  });

  it("applies dark theme and compact density to the plugin root", async () => {
    const user = userEvent.setup();
    const { scope } = renderWorkspace();
    await screen.findByRole("heading", { name: "Product entry" });

    await user.click(screen.getByRole("link", { name: "Settings" }));
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: /compact/i }));
    await waitFor(() => {
      expect(scope).toHaveClass("dark");
      expect(scope).toHaveAttribute("data-density", "compact");
    });
  });

  it("keeps Settings and portal controls RTL without reversing switch state", async () => {
    const user = userEvent.setup();
    const { portals } = renderWorkspace({
      ...snapshot,
      bootstrap: { ...snapshot.bootstrap, direction: "rtl", locale: "ar" },
    });
    await screen.findByRole("heading", { name: "Product entry" });

    await user.click(screen.getByRole("link", { name: "Settings" }));
    const appearance = await screen.findByRole("tab", { name: "Appearance" });
    expect(appearance.closest("[dir]"))?.toHaveAttribute("dir", "rtl");

    const reduceMotion = screen.getByRole("switch", { name: "Reduce motion" });
    expect(reduceMotion).toHaveAttribute("dir", "ltr");
    expect(reduceMotion).not.toBeChecked();
    await user.click(reduceMotion);
    expect(reduceMotion).toBeChecked();

    await user.click(screen.getByRole("tab", { name: "Workspace" }));
    await user.click(screen.getByRole("combobox", { name: "Landing tab" }));
    expect(portals).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("listbox").closest("[dir]"))?.toHaveAttribute("dir", "rtl");
  });

  it("keeps natural product text at the RTL start while technical fields stay LTR", async () => {
    const user = userEvent.setup();
    const history = operationResult();
    renderWorkspace({
      ...snapshot,
      bootstrap: { ...snapshot.bootstrap, direction: "rtl", locale: "ar" },
    }, {
      listOperations: () => Promise.resolve({
        counts: { all: 1, draft: 0, error: 0, pending: 0, synced: 1 },
        has_more: false, items: [history], page: 1, per_page: 25, total: 1,
      }),
      searchProducts: () => Promise.resolve({
        has_more: false, items: [canonicalProduct], page: 1, per_page: 20, total: 1,
      }),
    });

    const nameInput = await screen.findByLabelText(/Product name/);
    expect(nameInput).not.toHaveAttribute("dir", "auto");
    expect(nameInput.closest("[dir]"))?.toHaveAttribute("dir", "rtl");
    expect(screen.getByLabelText("SKU")).toHaveAttribute("dir", "ltr");

    const queue = within(screen.getByRole("region", { name: "Recent products" }));
    const queueName = await queue.findByText("Canvas tote");
    expect(queueName).toHaveClass("text-start");
    expect(queueName).not.toHaveAttribute("dir", "auto");

    await user.click(screen.getByRole("button", { name: "Extended" }));
    const queuePrice = await screen.findByText("$19.99");
    expect(queuePrice).toHaveAttribute("dir", "ltr");
    expect(queuePrice.parentElement).toHaveClass("text-start");

    await user.click(screen.getByRole("button", { name: "Find product" }));
    const finder = await screen.findByRole("dialog", { name: "Find a product" });
    const finderName = await within(finder).findByText("Canvas tote");
    expect(finderName).toHaveClass("text-start");
    expect(finderName).not.toHaveAttribute("dir", "auto");
  });

  it("keeps command dialogs in the plugin-owned portal", async () => {
    const user = userEvent.setup();
    const { portals, scope } = renderWorkspace();
    await screen.findByRole("heading", { name: "Product entry" });

    await user.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(screen.getByPlaceholderText(/search actions/i)).toBeVisible());
    expect(portals.querySelector('[role="dialog"]')).not.toBeNull();
    expect(scope.getAttribute("dir")).toBe("ltr");
    expect(scope.getAttribute("lang")).toBe("en-US");
  });

  it("renders a bounded unavailable state when WooCommerce is inactive", async () => {
    renderWorkspace({
      ...snapshot,
      availability: { kind: "woocommerce-unavailable" },
      bootstrap: { ...snapshot.bootstrap, isWooCommerceAvailable: false },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/WooCommerce must be installed/i);
    expect(screen.queryByRole("heading", { name: "Product entry" })).not.toBeInTheDocument();
  });

  it("applies RTL and representative Arabic unavailable content", async () => {
    const restoreI18n = installWordPressI18n({
      "Workspace unavailable": "مساحة العمل غير متاحة",
      "WooCommerce must be installed and active before this workspace can be used.":
        "يجب تثبيت WooCommerce وتنشيطه قبل استخدام مساحة العمل هذه.",
    });
    const { scope } = renderWorkspace({
      ...snapshot,
      availability: { kind: "woocommerce-unavailable" },
      bootstrap: {
        ...snapshot.bootstrap,
        direction: "rtl",
        isWooCommerceAvailable: false,
        locale: "ar_DZ",
      },
    });

    expect(await screen.findByRole("heading", { name: "مساحة العمل غير متاحة" })).toBeVisible();
    expect(scope).toHaveAttribute("dir", "rtl");
    expect(scope).toHaveAttribute("lang", "ar-DZ");
    restoreI18n();
  });
});
