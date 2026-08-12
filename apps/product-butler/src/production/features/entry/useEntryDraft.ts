import { useCallback, useEffect, useMemo, useState } from "react";
import type { Translate } from "../../core/i18n/messages";
import { SessionDraftStorage } from "./draftStorage";
import { EMPTY_PRODUCT_DRAFT, type ProductDraft } from "./productDraft";

export function useEntryDraft(t: Translate) {
  const storage = useMemo(() => new SessionDraftStorage(), []);
  const restored = useMemo(() => storage.read(), [storage]);
  const [draft, setDraft] = useState<ProductDraft>(
    restored.kind === "loaded" ? restored.draft : EMPTY_PRODUCT_DRAFT,
  );
  const [notice, setNotice] = useState(
    restored.kind === "error" ? t("browserDraftRestoreError") : "",
  );

  const update = useCallback(<Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const save = useCallback(() => {
    const result = storage.save(draft);
    setNotice(
      result.kind === "saved"
        ? t("browserDraftSaved")
        : t("browserDraftSaveError"),
    );
  }, [draft, storage, t]);

  const clear = useCallback(() => {
    storage.clear();
    setDraft(EMPTY_PRODUCT_DRAFT);
    setNotice(t("browserDraftCleared"));
  }, [storage, t]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  return { clear, draft, notice, save, update };
}
