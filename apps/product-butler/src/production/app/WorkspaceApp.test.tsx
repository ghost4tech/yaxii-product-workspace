import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultPreferences, usePrefsStore } from "@/stores/prefsStore";
import { useProductStore } from "@/stores/productStore";
import { WorkspaceClient } from "../application/WorkspaceClient";
import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceSnapshot } from "../domain/workspace";
import { WorkspaceApp } from "./WorkspaceApp";

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

function renderWorkspace(value = snapshot) {
  const scope = document.createElement("div");
  scope.id = "yaxii-product-workspace";
  const app = document.createElement("div");
  const portals = document.createElement("div");
  portals.id = "yaxii-product-workspace-portals";
  scope.append(app, portals);
  document.body.append(scope);
  const repository: WorkspaceRepository = {
    createProduct: () => Promise.reject(new Error("Not configured for this test.")),
    getOperation: () => Promise.reject(new Error("Not configured for this test.")),
    load: () => Promise.resolve(value),
    searchCategories: () => Promise.resolve({ has_more: false, items: [], page: 1, per_page: 20 }),
  };
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
  useProductStore.setState({ lastDeletedProduct: null, products: [] });
  useProductStore.getState().clearDraftFormData();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("WorkspaceApp", () => {
  it("renders the approved Lovable Entry surface and hides deferred product routes", async () => {
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "Product entry" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Add new product" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent products" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /analytics/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /connect store/i })).not.toBeInTheDocument();
    expect(screen.queryByText("0/50 this month")).not.toBeInTheDocument();
    expect(screen.getByText("Queue is empty")).toBeVisible();
    expect(screen.getByRole("button", { name: /save & next/i })).toBeEnabled();
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
  });
});
