export type Direction = "ltr" | "rtl";
export type HostEnvironment = "development" | "wordpress";

export interface WorkspaceBootstrap {
  direction: Direction;
  environment: HostEnvironment;
  frontendAvailable: boolean;
  isWooCommerceAvailable: boolean;
  locale: string;
  pluginVersion: string;
  screenId: string;
}

export type WorkspaceAvailability =
  | { kind: "ready" }
  | { kind: "frontend-unavailable" }
  | { kind: "woocommerce-unavailable" }
  | { kind: "host-unavailable" };

export interface WorkspaceSnapshot {
  availability: WorkspaceAvailability;
  bootstrap: WorkspaceBootstrap;
  capabilities: {
    productWrites: boolean;
  };
  operations: readonly WorkspaceOperation[];
}

export interface WorkspaceOperation {
  id: string;
  name: string;
  source: "development-fixture" | "server";
  status: "completed" | "failed" | "pending";
  timestamp: string;
}
