import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkspaceClient } from "../application/WorkspaceClient";
import { WordPressWorkspaceRepository } from "../infrastructure/WordPressWorkspaceRepository";
import { WorkspaceApp } from "./WorkspaceApp";

function createClient(isWooCommerceAvailable: boolean) {
  return new WorkspaceClient(
    new WordPressWorkspaceRepository({
      direction: "rtl",
      environment: "wordpress",
      frontendAvailable: true,
      isWooCommerceAvailable,
      locale: "ar",
      pluginVersion: "0.1.0",
      screenId: "yaxii-product-workspace",
    }),
  );
}

function renderWorkspace(isWooCommerceAvailable: boolean) {
  const scope = document.createElement("div");
  scope.id = "yaxii-product-workspace";
  const mount = document.createElement("div");
  const portalRoot = document.createElement("div");
  portalRoot.id = "yaxii-product-workspace-portals";
  scope.append(mount, portalRoot);
  document.body.append(scope);
  render(<WorkspaceApp client={createClient(isWooCommerceAvailable)} scope={scope} />, {
    container: mount,
  });
  return scope;
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  localStorage.clear();
  sessionStorage.clear();
});

describe("WorkspaceApp", () => {
  it("renders a bounded dependency state and applies host direction", async () => {
    const scope = renderWorkspace(false);

    expect(await screen.findByRole("heading", { name: "Workspace unavailable" })).toBeVisible();
    expect(screen.getByText(/WooCommerce must be installed and active/u)).toBeVisible();
    expect(scope.dir).toBe("rtl");
    expect(scope.lang).toBe("ar");
  });

  it("preserves the entry workflow without exposing fake writes or deferred navigation", async () => {
    renderWorkspace(true);

    expect(await screen.findByRole("heading", { name: "Add a product" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save & Next" })).toBeDisabled();
    expect(screen.getByText("No server operations yet")).toBeVisible();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    expect(screen.queryByText("Stores")).not.toBeInTheDocument();
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.queryByText("License")).not.toBeInTheDocument();
    expect(screen.queryByText(/Product created/u)).not.toBeInTheDocument();
  });

  it("uses internal navigation and a plugin-owned keyboard dialog", async () => {
    renderWorkspace(true);
    await screen.findByRole("heading", { name: "Add a product" });

    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeVisible();
    expect(window.location.pathname).toBe("/");

    fireEvent.keyDown(window, { ctrlKey: true, key: "k" });
    expect(await screen.findByRole("dialog", { name: "Command menu" })).toBeVisible();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Command menu" })).not.toBeInTheDocument();
  });
});
