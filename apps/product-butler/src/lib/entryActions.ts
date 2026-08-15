import { toast } from '@/hooks/use-toast';
import type { WorkspaceClient } from '@/production/application/WorkspaceClient';
import { duplicatePrefillToDraft } from '@/production/features/products/duplicateDraft';
import { useProductStore } from '@/stores/productStore';
import { emptyProductFormData } from '@/types/product';
import { __, sprintf } from '@/production/core/i18n/wordpress';

/** Confirm that the current recovery draft is already stored. */
export function saveDraft() {
  const { draftFormData } = useProductStore.getState();
  if (!draftFormData.name && !draftFormData.regularPrice) {
    toast({ title: __('Nothing to save', "yaxii-product-workspace"), description: __('Start filling the form first.', "yaxii-product-workspace") });
    return;
  }
  toast({ title: __('Draft saved', "yaxii-product-workspace"), description: draftFormData.name || __('Untitled product', "yaxii-product-workspace") });
}

/** Prefill from the latest WooCommerce simple product without creating a new product. */
export async function duplicateLastProduct(client: WorkspaceClient) {
  const { applyDraft } = useProductStore.getState();
  try {
    const page = await client.searchProducts({ page: 1, perPage: 1 });
    const source = page.items[0];
    if (!source) {
      toast({ title: __('No products yet', "yaxii-product-workspace"), description: __('Add one first, then duplicate it.', "yaxii-product-workspace") });
      return;
    }
    const prefill = await client.duplicateProduct(source.id);
    applyDraft(duplicatePrefillToDraft(prefill, source.images));
    toast({
      title: __('Duplicated', "yaxii-product-workspace"),
      /* translators: %s: source product name. */
      description: sprintf(__("Prefilled from “%s”. No product was created.", "yaxii-product-workspace"), source.name),
    });
  } catch (error) {
    toast({
      title: __('Duplicate was not loaded', "yaxii-product-workspace"),
      description: error instanceof Error ? error.message : __('The product could not be loaded.', "yaxii-product-workspace"),
      variant: 'destructive',
    });
  }
}

export function clearDraft() {
  const { draftFormData, applyDraft } = useProductStore.getState();
  const hadContent = Object.values(draftFormData).some(
    (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value))
  );
  applyDraft(emptyProductFormData);
  if (hadContent) toast({ title: __('Draft cleared', "yaxii-product-workspace") });
}
