import type { Translate } from "../../core/i18n/messages";
import type { ProductDraft } from "./productDraft";

interface EssentialsFieldsProps {
  draft: ProductDraft;
  t: Translate;
  update: <Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => void;
}

export function EssentialsFields({ draft, t, update }: EssentialsFieldsProps) {
  return (
    <div className="ypw-field-grid">
      <label className="ypw-field ypw-field--wide">
        <span>{t("productName")}</span>
        <input
          autoComplete="off"
          autoFocus
          onChange={(event) => update("name", event.target.value)}
          placeholder={t("productNamePlaceholder")}
          value={draft.name}
        />
      </label>

      <label className="ypw-field">
        <span>{t("sku")}</span>
        <input
          autoComplete="off"
          onChange={(event) => update("sku", event.target.value)}
          placeholder="LAMP-001"
          value={draft.sku}
        />
      </label>

      <label className="ypw-field">
        <span>{t("statusIntent")}</span>
        <select
          onChange={(event) => update("status", event.target.value === "publish" ? "publish" : "draft")}
          value={draft.status}
        >
          <option value="draft">{t("draft")}</option>
          <option value="publish">{t("publish")}</option>
        </select>
      </label>

      <label className="ypw-field">
        <span>{t("regularPrice")}</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("regularPrice", event.target.value)}
          placeholder="0.00"
          value={draft.regularPrice}
        />
      </label>

      <label className="ypw-field">
        <span>{t("salePrice")}</span>
        <input
          inputMode="decimal"
          onChange={(event) => update("salePrice", event.target.value)}
          placeholder={t("optional")}
          value={draft.salePrice}
        />
      </label>

      <label className="ypw-field">
        <span>{t("stockQuantity")}</span>
        <input
          inputMode="numeric"
          onChange={(event) => update("stockQuantity", event.target.value)}
          placeholder="0"
          value={draft.stockQuantity}
        />
      </label>

      <label className="ypw-field">
        <span>{t("category")}</span>
        <input
          onChange={(event) => update("category", event.target.value)}
          placeholder={t("categoryPlaceholder")}
          value={draft.category}
        />
      </label>

      <label className="ypw-field ypw-field--wide">
        <span>{t("shortDescription")}</span>
        <textarea
          onChange={(event) => update("shortDescription", event.target.value)}
          placeholder={t("shortDescriptionPlaceholder")}
          rows={3}
          value={draft.shortDescription}
        />
      </label>
    </div>
  );
}
