import type { ProductDraft } from "./productDraft";

interface EssentialsFieldsProps {
  draft: ProductDraft;
  update: <Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => void;
}

export function EssentialsFields({ draft, update }: EssentialsFieldsProps) {
  return (
    <div className="ypw-field-grid">
      <label className="ypw-field ypw-field--wide">
        <span>Product name</span>
        <input
          autoComplete="off"
          autoFocus
          onChange={(event) => update("name", event.target.value)}
          placeholder="e.g. Handmade ceramic lamp"
          value={draft.name}
        />
      </label>

      <label className="ypw-field">
        <span>SKU</span>
        <input
          autoComplete="off"
          onChange={(event) => update("sku", event.target.value)}
          placeholder="LAMP-001"
          value={draft.sku}
        />
      </label>

      <label className="ypw-field">
        <span>Status intent</span>
        <select
          onChange={(event) => update("status", event.target.value === "publish" ? "publish" : "draft")}
          value={draft.status}
        >
          <option value="draft">Draft</option>
          <option value="publish">Publish</option>
        </select>
      </label>

      <label className="ypw-field">
        <span>Regular price</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("regularPrice", event.target.value)}
          placeholder="0.00"
          value={draft.regularPrice}
        />
      </label>

      <label className="ypw-field">
        <span>Sale price</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("salePrice", event.target.value)}
          placeholder="Optional"
          value={draft.salePrice}
        />
      </label>

      <label className="ypw-field">
        <span>Stock quantity</span>
        <input
          inputMode="numeric"
          onChange={(event) => update("stockQuantity", event.target.value)}
          placeholder="0"
          value={draft.stockQuantity}
        />
      </label>

      <label className="ypw-field">
        <span>Category</span>
        <input
          onChange={(event) => update("category", event.target.value)}
          placeholder="Lookup arrives with the REST layer"
          value={draft.category}
        />
      </label>

      <label className="ypw-field ypw-field--wide">
        <span>Short description</span>
        <textarea
          onChange={(event) => update("shortDescription", event.target.value)}
          placeholder="A concise summary for the catalog."
          rows={3}
          value={draft.shortDescription}
        />
      </label>
    </div>
  );
}
