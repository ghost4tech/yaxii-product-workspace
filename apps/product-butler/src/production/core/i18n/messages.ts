import type { WorkspaceAvailability } from "../../domain/workspace";
import { __ } from "./wordpress";

type UnavailableKind = Exclude<WorkspaceAvailability["kind"], "ready">;

const unavailableMessages: Record<UnavailableKind, () => string> = {
  "frontend-unavailable": () =>
    __("The Product Workspace assets are unavailable. Rebuild the plugin frontend.", "yaxii-product-workspace"),
  "host-unavailable": () => __("The WordPress host configuration is unavailable.", "yaxii-product-workspace"),
  "woocommerce-unavailable": () =>
    __("WooCommerce must be installed and active before this workspace can be used.", "yaxii-product-workspace"),
};

export function availabilityCopy(
  kind: UnavailableKind,
  locale?: string,
): { title: string; message: string } {
  void locale;
  return { title: __("Workspace unavailable", "yaxii-product-workspace"), message: unavailableMessages[kind]() };
}
