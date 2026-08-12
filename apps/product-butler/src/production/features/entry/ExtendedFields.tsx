import type { Translate } from "../../core/i18n/messages";
import type { ProductDraft } from "./productDraft";

interface ExtendedFieldsProps {
  draft: ProductDraft;
  t: Translate;
  update: <Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => void;
}

export function ExtendedFields({ draft, t, update }: ExtendedFieldsProps) {
  return (
    <div className="ypw-field-grid">
      <label className="ypw-field ypw-field--wide">
        <span>{t("fullDescription")}</span>
        <textarea
          onChange={(event) => update("longDescription", event.target.value)}
          placeholder={t("fullDescriptionPlaceholder")}
          rows={8}
          value={draft.longDescription}
        />
      </label>
      <label className="ypw-field">
        <span>{t("weight")}</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("weight", event.target.value)}
          placeholder={t("weightPlaceholder")}
          value={draft.weight}
        />
      </label>
      <div className="ypw-field ypw-field--placeholder" aria-label={t("mediaUnavailable")}>
        <span>{t("media")}</span>
        <p>{t("mediaDescription")}</p>
      </div>
    </div>
  );
}
