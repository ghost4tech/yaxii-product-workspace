import { Eraser, Save } from "lucide-react";
import { useState } from "react";
import type { Translate } from "../../core/i18n/messages";
import { EssentialsFields } from "./EssentialsFields";
import { ExtendedFields } from "./ExtendedFields";
import { useEntryDraft } from "./useEntryDraft";

type FormSection = "essentials" | "extended";

interface ProductEntryFormProps {
  productWritesAvailable: boolean;
  t: Translate;
}

export function ProductEntryForm({ productWritesAvailable, t }: ProductEntryFormProps) {
  const [section, setSection] = useState<FormSection>("essentials");
  const controller = useEntryDraft(t);

  return (
    <form className="ypw-entry-form" onSubmit={(event) => event.preventDefault()}>
      <div className="ypw-form-tabs" role="tablist" aria-label={t("productFields")}>
        <button
          aria-selected={section === "essentials"}
          onClick={() => setSection("essentials")}
          role="tab"
          type="button"
        >
          {t("essentials")}
        </button>
        <button
          aria-selected={section === "extended"}
          onClick={() => setSection("extended")}
          role="tab"
          type="button"
        >
          {t("extended")}
        </button>
      </div>

      <div className="ypw-form-section" role="tabpanel">
        {section === "essentials" ? (
          <EssentialsFields draft={controller.draft} t={t} update={controller.update} />
        ) : (
          <ExtendedFields draft={controller.draft} t={t} update={controller.update} />
        )}
      </div>

      <div aria-live="polite" className="ypw-draft-notice">
        {controller.notice || t("browserDraftHint")}
      </div>

      <footer className="ypw-form-actions">
        <button className="ypw-button ypw-button--quiet" onClick={controller.clear} type="button">
          <Eraser aria-hidden="true" size={16} /> {t("browserDraftClear")}
        </button>
        <button className="ypw-button ypw-button--secondary" onClick={controller.save} type="button">
          <Save aria-hidden="true" size={16} /> {t("browserDraftSave")}
        </button>
        <div className="ypw-save-next">
          <button className="ypw-button ypw-button--primary" disabled={!productWritesAvailable} type="submit">
            {t("saveAndNext")}
          </button>
          {!productWritesAvailable ? <span>{t("phase2Writes")}</span> : null}
        </div>
      </footer>
    </form>
  );
}
