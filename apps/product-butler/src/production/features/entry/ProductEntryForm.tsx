import { Eraser, Save } from "lucide-react";
import { useState } from "react";
import { EssentialsFields } from "./EssentialsFields";
import { ExtendedFields } from "./ExtendedFields";
import { useEntryDraft } from "./useEntryDraft";

type FormSection = "essentials" | "extended";

interface ProductEntryFormProps {
  productWritesAvailable: boolean;
}

export function ProductEntryForm({ productWritesAvailable }: ProductEntryFormProps) {
  const [section, setSection] = useState<FormSection>("essentials");
  const controller = useEntryDraft();

  return (
    <form className="ypw-entry-form" onSubmit={(event) => event.preventDefault()}>
      <div className="ypw-form-tabs" role="tablist" aria-label="Product fields">
        <button
          aria-selected={section === "essentials"}
          onClick={() => setSection("essentials")}
          role="tab"
          type="button"
        >
          Essentials
        </button>
        <button
          aria-selected={section === "extended"}
          onClick={() => setSection("extended")}
          role="tab"
          type="button"
        >
          Extended
        </button>
      </div>

      <div className="ypw-form-section" role="tabpanel">
        {section === "essentials" ? (
          <EssentialsFields draft={controller.draft} update={controller.update} />
        ) : (
          <ExtendedFields draft={controller.draft} update={controller.update} />
        )}
      </div>

      <div aria-live="polite" className="ypw-draft-notice">
        {controller.notice || "Ctrl S saves a browser-session draft only."}
      </div>

      <footer className="ypw-form-actions">
        <button className="ypw-button ypw-button--quiet" onClick={controller.clear} type="button">
          <Eraser aria-hidden="true" size={16} /> Clear draft
        </button>
        <button className="ypw-button ypw-button--secondary" onClick={controller.save} type="button">
          <Save aria-hidden="true" size={16} /> Save browser draft
        </button>
        <div className="ypw-save-next">
          <button className="ypw-button ypw-button--primary" disabled={!productWritesAvailable} type="submit">
            Save &amp; Next
          </button>
          {!productWritesAvailable ? <span>Product writes begin in Phase 2.</span> : null}
        </div>
      </footer>
    </form>
  );
}
