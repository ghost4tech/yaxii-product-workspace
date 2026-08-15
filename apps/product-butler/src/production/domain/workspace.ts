export type Direction = "ltr" | "rtl";
export type HostEnvironment = "development" | "wordpress";

export interface WorkspaceHostConfig {
  direction: Direction;
  environment: HostEnvironment;
  frontendAvailable: boolean;
  isWooCommerceAvailable: boolean;
  locale: string;
  mediaRestUrl: string;
  nonce: string;
  pluginVersion: string;
  restUrl: string;
}

export interface WorkspaceBootstrap {
  capabilities: {
    createProducts: boolean;
    publishProducts: boolean;
    uploadMedia: boolean;
  };
  direction: Direction;
  environment: HostEnvironment;
  features: {
    categoryLookup: boolean;
    mediaSelection: boolean;
    operationLookup: boolean;
    operationQueue: boolean;
    preferences: boolean;
    productManagement: boolean;
    shippingClassLookup: boolean;
    simpleProductCreate: boolean;
    tagLookup: boolean;
    variableProductCreate: boolean;
  };
  frontendAvailable: boolean;
  isWooCommerceAvailable: boolean;
  locale: string;
  pluginVersion: string;
  user: { displayName: string; id: number };
  woocommerce: {
    currency: string;
    currencySymbol: string;
    dimensionUnit: string;
    taxClasses: Array<{ name: string; slug: string }>;
    version: string | null;
    weightUnit: string;
  };
}

export type WorkspaceAvailability =
  | { kind: "ready" }
  | { kind: "frontend-unavailable" }
  | { kind: "woocommerce-unavailable" }
  | { kind: "host-unavailable" };

export interface WorkspaceSnapshot {
  availability: WorkspaceAvailability;
  bootstrap: WorkspaceBootstrap;
}
