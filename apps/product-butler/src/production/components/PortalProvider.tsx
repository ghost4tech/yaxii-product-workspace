/* eslint-disable react-refresh/only-export-components -- provider and its required hook share one context. */
import { createContext, useContext, type ReactNode } from "react";

const PortalContext = createContext<HTMLElement | null>(null);

export function PortalProvider({
  children,
  container,
}: {
  children: ReactNode;
  container: HTMLElement;
}) {
  return <PortalContext.Provider value={container}>{children}</PortalContext.Provider>;
}

export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContext) ?? undefined;
}
