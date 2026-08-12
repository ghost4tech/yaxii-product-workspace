import type { ProductDraft } from "./productDraft";

interface ExtendedFieldsProps {
  draft: ProductDraft;
  update: <Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => void;
}

export function ExtendedFields({ draft, update }: ExtendedFieldsProps) {
  return (
    <div className="ypw-field-grid">
      <label className="ypw-field ypw-field--wide">
        <span>Full description</span>
        <textarea
          onChange={(event) => update("longDescription", event.target.value)}
          placeholder="Product details, materials, care, and benefits."
          rows={8}
          value={draft.longDescription}
        />
      </label>
      <label className="ypw-field">
        <span>Weight</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("weight", event.target.value)}
          placeholder="Store unit"
          value={draft.weight}
        />
      </label>
      <div className="ypw-field ypw-field--placeholder" aria-label="Media integration unavailable">
        <span>Media</span>
        <p>WordPress media selection is introduced with the server product flow.</p>
      </div>
    </div>
  );
}
