import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceSnapshot } from "../domain/workspace";

export class UnavailableWorkspaceRepository implements WorkspaceRepository {
  public load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({
      availability: { kind: "host-unavailable" },
      bootstrap: {
        direction: "ltr",
        environment: "wordpress",
        frontendAvailable: false,
        isWooCommerceAvailable: false,
        locale: "en-US",
        pluginVersion: "unknown",
        screenId: "unknown",
      },
      operations: [],
    });
  }
}
