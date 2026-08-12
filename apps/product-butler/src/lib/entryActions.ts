import { useProductStore } from '@/stores/productStore';
import { emptyProductFormData, ProductFormData } from '@/types/product';
import { toast } from '@/hooks/use-toast';

/** Save the in-progress draft (already persisted) — surfaces confirmation. */
export function saveDraft() {
  const { draftFormData } = useProductStore.getState();
  if (!draftFormData.name && !draftFormData.regularPrice) {
    toast({ title: 'Nothing to save', description: 'Start filling the form first.' });
    return;
  }
  toast({
    title: 'Draft saved',
    description: draftFormData.name || 'Untitled product',
  });
}

/** Load the most recent product back into the entry form. */
export function duplicateLastProduct() {
  const { products, applyDraft } = useProductStore.getState();
  const last = products[0];
  if (!last) {
    toast({ title: 'No products yet', description: 'Add one first, then duplicate it.' });
    return;
  }
  const data: ProductFormData = {
    name: `${last.name} (copy)`,
    sku: '',
    regularPrice: last.regularPrice,
    salePrice: last.salePrice,
    categoryId: last.categoryId,
    stockQuantity: last.stockQuantity,
    shortDescription: last.shortDescription,
    longDescription: last.longDescription,
    images: [],
    variations: last.variations,
    isVariable: last.isVariable,
  };
  applyDraft(data);
  toast({ title: 'Duplicated', description: `Prefilled from “${last.name}”.` });
}

export function clearDraft() {
  const { draftFormData, applyDraft } = useProductStore.getState();
  const hadContent = Object.values(draftFormData).some(
    (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))
  );
  applyDraft(emptyProductFormData);
  if (hadContent) toast({ title: 'Draft cleared' });
}
