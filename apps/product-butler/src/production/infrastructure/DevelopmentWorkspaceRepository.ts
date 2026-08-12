import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceSnapshot } from "../domain/workspace";

export class DevelopmentWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({
      availability: { kind: "ready" },
      bootstrap: {
        direction: "ltr",
        environment: "development",
        frontendAvailable: true,
        isWooCommerceAvailable: true,
        locale: "en-US",
        pluginVersion: "development",
      },
    });
  }
}
