/* eslint-disable react-refresh/only-export-components -- provider and its required hook share one context. */
import { createContext, useContext, type ReactNode } from "react";
import type { WorkspaceClient } from "../application/WorkspaceClient";
import type { WorkspaceBootstrap } from "../domain/workspace";
interface WorkspaceRuntimeValue {
  bootstrap: WorkspaceBootstrap;
  client: WorkspaceClient;
  scope: HTMLElement;
}

const WorkspaceRuntimeContext = createContext<WorkspaceRuntimeValue | null>(null);

export function WorkspaceRuntimeProvider({
  children,
  bootstrap,
  client,
  scope,
}: {
  children: ReactNode;
  bootstrap: WorkspaceBootstrap;
  client: WorkspaceClient;
  scope: HTMLElement;
}) {
  return (
    <WorkspaceRuntimeContext.Provider value={{ bootstrap, client, scope }}>
      {children}
    </WorkspaceRuntimeContext.Provider>
  );
}

export function useWorkspaceRuntime(): WorkspaceRuntimeValue {
  const value = useContext(WorkspaceRuntimeContext);
  if (!value) {
    throw new Error("Workspace runtime is unavailable.");
  }
  return value;
}
