import { toast } from '@/hooks/use-toast';
import type { WorkspaceClient } from '@/production/application/WorkspaceClient';
import { duplicatePrefillToDraft } from '@/production/features/products/duplicateDraft';
import { useProductStore } from '@/stores/productStore';
import { emptyProductFormData } from '@/types/product';

/** Confirm that the current recovery draft is already stored. */
export function saveDraft() {
  const { draftFormData } = useProductStore.getState();
  if (!draftFormData.name && !draftFormData.regularPrice) {
    toast({ title: 'Nothing to save', description: 'Start filling the form first.' });
    return;
  }
  toast({ title: 'Draft saved', description: draftFormData.name || 'Untitled product' });
}

/** Prefill from the latest WooCommerce simple product without creating a new product. */
export async function duplicateLastProduct(client: WorkspaceClient) {
  const { applyDraft } = useProductStore.getState();
  try {
    const page = await client.searchProducts({ page: 1, perPage: 1 });
    const source = page.items[0];
    if (!source) {
      toast({ title: 'No products yet', description: 'Add one first, then duplicate it.' });
      return;
    }
    const prefill = await client.duplicateProduct(source.id);
    applyDraft(duplicatePrefillToDraft(prefill, source.images));
    toast({
      title: 'Duplicated',
      description: `Prefilled from “${source.name}”. No product was created.`,
    });
  } catch (error) {
    toast({
      title: 'Duplicate was not loaded',
      description: error instanceof Error ? error.message : 'The product could not be loaded.',
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
  if (hadContent) toast({ title: 'Draft cleared' });
}
