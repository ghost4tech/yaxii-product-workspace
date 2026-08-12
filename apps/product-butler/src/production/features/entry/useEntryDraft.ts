import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionDraftStorage } from "./draftStorage";
import { EMPTY_PRODUCT_DRAFT, type ProductDraft } from "./productDraft";

export function useEntryDraft() {
  const storage = useMemo(() => new SessionDraftStorage(), []);
  const restored = useMemo(() => storage.read(), [storage]);
  const [draft, setDraft] = useState<ProductDraft>(
    restored.kind === "loaded" ? restored.draft : EMPTY_PRODUCT_DRAFT,
  );
  const [notice, setNotice] = useState(
    restored.kind === "error" ? "A saved browser draft could not be restored." : "",
  );

  const update = useCallback(<Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const save = useCallback(() => {
    const result = storage.save(draft);
    setNotice(
      result.kind === "saved"
        ? "Browser draft saved for this session. No WooCommerce product was created."
        : "The browser draft could not be saved.",
    );
  }, [draft, storage]);

  const clear = useCallback(() => {
    storage.clear();
    setDraft(EMPTY_PRODUCT_DRAFT);
    setNotice("Browser draft cleared. No store data was changed.");
  }, [storage]);

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
