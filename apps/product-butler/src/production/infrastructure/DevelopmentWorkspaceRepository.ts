import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceSnapshot } from "../domain/workspace";

const DEVELOPMENT_SNAPSHOT: WorkspaceSnapshot = {
  availability: { kind: "ready" },
  bootstrap: {
    direction: "ltr",
    environment: "development",
    frontendAvailable: true,
    isWooCommerceAvailable: true,
    locale: "en-US",
    pluginVersion: "development",
    screenId: "standalone-development-host",
  },
  capabilities: { productWrites: false },
  operations: [
    {
      id: "fixture-001",
      name: "Ceramic desk lamp",
      source: "development-fixture",
      status: "completed",
      timestamp: "2026-08-12T09:30:00.000Z",
    },
    {
      id: "fixture-002",
      name: "Linen cushion cover",
      source: "development-fixture",
      status: "pending",
      timestamp: "2026-08-12T09:35:00.000Z",
    },
  ],
};

export class DevelopmentWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve(DEVELOPMENT_SNAPSHOT);
  }
}
