import type { WorkspaceRepository } from "../application/WorkspaceRepository";
import type { WorkspaceBootstrap, WorkspaceSnapshot } from "../domain/workspace";

export class WordPressWorkspaceRepository implements WorkspaceRepository {
  public constructor(private readonly bootstrap: WorkspaceBootstrap) {}

  public load(): Promise<WorkspaceSnapshot> {
    const availability = !this.bootstrap.frontendAvailable
      ? { kind: "frontend-unavailable" as const }
      : !this.bootstrap.isWooCommerceAvailable
        ? { kind: "woocommerce-unavailable" as const }
        : { kind: "ready" as const };

    return Promise.resolve({ availability, bootstrap: this.bootstrap, operations: [] });
  }
}
