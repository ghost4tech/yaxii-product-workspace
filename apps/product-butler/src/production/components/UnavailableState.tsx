import { AlertTriangle, PackageX } from "lucide-react";
import type { Translate } from "../core/i18n/messages";
import type { WorkspaceAvailability } from "../domain/workspace";

interface UnavailableStateProps {
  availability: Exclude<WorkspaceAvailability, { kind: "ready" }>;
  t: Translate;
}

export function UnavailableState({ availability, t }: UnavailableStateProps) {
  const isWooUnavailable = availability.kind === "woocommerce-unavailable";

  return (
    <section className="ypw-boundary-card" aria-labelledby="ypw-unavailable-title">
      <span className="ypw-boundary-icon" aria-hidden="true">
        {isWooUnavailable ? <PackageX size={24} /> : <AlertTriangle size={24} />}
      </span>
      <p className="ypw-eyebrow">{t("brandName")}</p>
      <h2 id="ypw-unavailable-title">{t("unavailable")}</h2>
      <p>
        {isWooUnavailable ? t("unavailableWoo") : t("unavailableBootstrap")}
      </p>
    </section>
  );
}
