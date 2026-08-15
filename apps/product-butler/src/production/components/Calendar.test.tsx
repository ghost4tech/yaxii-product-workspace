import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/ui/calendar";
import { WorkspaceRuntimeProvider } from "@/production/app/WorkspaceRuntime";
import { WorkspaceClient } from "@/production/application/WorkspaceClient";
import { workspaceRepository, workspaceSnapshot } from "@/production/test/workspaceFixtures";

describe("Calendar RTL navigation", () => {
  it("uses the arrows that react-day-picker assigns to previous and next months", () => {
    const scope = document.createElement("div");
    const bootstrap = { ...workspaceSnapshot.bootstrap, direction: "rtl" as const, locale: "ar" };
    const client = new WorkspaceClient(workspaceRepository());
    render(
      <WorkspaceRuntimeProvider bootstrap={bootstrap} client={client} scope={scope}>
        <Calendar defaultMonth={new Date(2026, 7, 1)} />
      </WorkspaceRuntimeProvider>,
    );

    const previousIcon = screen.getByRole("button", { name: "Go to previous month" }).querySelector("svg");
    const nextIcon = screen.getByRole("button", { name: "Go to next month" }).querySelector("svg");
    expect(previousIcon).toHaveClass("lucide-chevron-right");
    expect(nextIcon).toHaveClass("lucide-chevron-left");
  });
});
