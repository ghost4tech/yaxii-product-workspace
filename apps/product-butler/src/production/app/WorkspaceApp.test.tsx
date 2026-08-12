import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

describe("WorkspaceApp", () => {
  it("renders a bounded dependency state and applies host direction", async () => {
    const scope = document.createElement("div");
    render(<WorkspaceApp client={createClient(false)} scope={scope} />);

    expect(await screen.findByRole("heading", { name: "Workspace unavailable" })).toBeVisible();
    expect(screen.getByText(/WooCommerce must be installed and active/u)).toBeVisible();
    expect(scope.dir).toBe("rtl");
    expect(scope.lang).toBe("ar");
  });

  it("renders the ready boundary without claiming product writes", async () => {
    const scope = document.createElement("div");
    render(<WorkspaceApp client={createClient(true)} scope={scope} />);

    expect(await screen.findByRole("heading", { name: "Frontend host ready" })).toBeVisible();
    expect(screen.queryByText(/Product created/u)).not.toBeInTheDocument();
  });
});
