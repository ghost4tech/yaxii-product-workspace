/* eslint-disable react-refresh/only-export-components -- provider and its required hook share one context. */
import { createContext, useContext, type ReactNode } from "react";
interface WorkspaceRuntimeValue {
  scope: HTMLElement;
}

const WorkspaceRuntimeContext = createContext<WorkspaceRuntimeValue | null>(null);

export function WorkspaceRuntimeProvider({
  children,
  scope,
}: {
  children: ReactNode;
  scope: HTMLElement;
}) {
  return (
    <WorkspaceRuntimeContext.Provider value={{ scope }}>
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
