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
  operations: [],
};

export class DevelopmentWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve(DEVELOPMENT_SNAPSHOT);
  }
}
