import type { WorkspaceSnapshot } from "../domain/workspace";

export interface WorkspaceRepository {
  load: () => Promise<WorkspaceSnapshot>;
}
