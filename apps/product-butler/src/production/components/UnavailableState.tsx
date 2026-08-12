import { AlertTriangle, PackageX } from "lucide-react";
import type { WorkspaceAvailability } from "../domain/workspace";

interface UnavailableStateProps {
  availability: Exclude<WorkspaceAvailability, { kind: "ready" }>;
}

export function UnavailableState({ availability }: UnavailableStateProps) {
  const isWooUnavailable = availability.kind === "woocommerce-unavailable";

  return (
    <section className="ypw-boundary-card" aria-labelledby="ypw-unavailable-title">
      <span className="ypw-boundary-icon" aria-hidden="true">
        {isWooUnavailable ? <PackageX size={24} /> : <AlertTriangle size={24} />}
      </span>
      <p className="ypw-eyebrow">Yaxii Product Workspace</p>
      <h2 id="ypw-unavailable-title">Workspace unavailable</h2>
      <p>
        {isWooUnavailable
          ? "WooCommerce must be installed and active before the Product Workspace can be used. WordPress remains unaffected."
          : "The built frontend assets or WordPress bootstrap are unavailable. No product operation was attempted."}
      </p>
    </section>
  );
}
