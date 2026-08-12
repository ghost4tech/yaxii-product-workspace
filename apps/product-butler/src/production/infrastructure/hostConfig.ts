import type { Direction, WorkspaceBootstrap } from "../domain/workspace";

declare global {
  interface Window {
    yaxiiProductWorkspaceConfig?: unknown;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDirection(value: unknown): value is Direction {
  return value === "ltr" || value === "rtl";
}

export function parseHostConfig(value: unknown): WorkspaceBootstrap | null {
  if (!isRecord(value)) {
    return null;
  }

  const requiredStrings = ["locale", "pluginVersion", "screenId"] as const;
  if (requiredStrings.some((key) => typeof value[key] !== "string")) {
    return null;
  }

  if (
    value.environment !== "wordpress" ||
    !isDirection(value.direction) ||
    typeof value.frontendAvailable !== "boolean" ||
    typeof value.isWooCommerceAvailable !== "boolean"
  ) {
    return null;
  }

  return {
    direction: value.direction,
    environment: value.environment,
    frontendAvailable: value.frontendAvailable,
    isWooCommerceAvailable: value.isWooCommerceAvailable,
    locale: String(value.locale),
    pluginVersion: String(value.pluginVersion),
    screenId: String(value.screenId),
  };
}
