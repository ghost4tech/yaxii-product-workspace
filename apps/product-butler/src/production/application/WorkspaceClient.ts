import type { WorkspaceSnapshot } from "../domain/workspace";
import type { WorkspaceRepository } from "./WorkspaceRepository";

export class WorkspaceClient {
  public constructor(private readonly repository: WorkspaceRepository) {}

  public load(): Promise<WorkspaceSnapshot> {
    return this.repository.load();
  }
}
