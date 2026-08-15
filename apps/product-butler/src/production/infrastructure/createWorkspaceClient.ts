import { WorkspaceClient } from "../application/WorkspaceClient";
import { DevelopmentWorkspaceRepository } from "./DevelopmentWorkspaceRepository";
import { UnavailableWorkspaceRepository } from "./UnavailableWorkspaceRepository";
import { WordPressWorkspaceRepository } from "./WordPressWorkspaceRepository";
import { parseHostConfig } from "./hostConfig";

export function createWorkspaceClient(hostValue: unknown): WorkspaceClient {
  const hostConfig = parseHostConfig(hostValue);

  if (hostConfig) {
    return new WorkspaceClient(new WordPressWorkspaceRepository(hostConfig));
  }

  if (import.meta.env.DEV) {
    return new WorkspaceClient(new DevelopmentWorkspaceRepository());
  }

  return new WorkspaceClient(new UnavailableWorkspaceRepository());
}
