import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Category, ProductFormData, emptyProductFormData } from '@/types/product';
import { createDraftStorage, sanitizeDraft } from '@/production/infrastructure/draftStorage';

interface ProductStore {
  categories: Category[];
  mergeCategories: (categories: Category[]) => void;
  setCategories: (categories: Category[]) => void;
  recentCategoryIds: number[];
  addRecentCategory: (categoryId: number) => void;
  
  draftFormData: ProductFormData;
  setDraftFormData: (data: ProductFormData) => void;
  clearDraftFormData: () => void;
  /** Bumped whenever the draft is replaced externally (command menu, duplicate, clear) */
  draftRevision: number;
  applyDraft: (data: ProductFormData) => void;
  
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      categories: [],
      mergeCategories: (categories) => set((state) => {
        const merged = new Map(state.categories.map((category) => [category.id, category]));
        categories.forEach((category) => merged.set(category.id, { ...merged.get(category.id), ...category }));
        return { categories: [...merged.values()] };
      }),
      setCategories: (categories) => set({ categories }),
      recentCategoryIds: [],
      addRecentCategory: (categoryId) => set((state) => {
        const filtered = state.recentCategoryIds.filter((id) => id !== categoryId);
        return { recentCategoryIds: [categoryId, ...filtered].slice(0, 5) };
      }),
      
      draftFormData: emptyProductFormData,
      setDraftFormData: (data) => set({ draftFormData: data }),
      clearDraftFormData: () =>
        set((state) => ({
          draftFormData: emptyProductFormData,
          draftRevision: state.draftRevision + 1,
        })),
      draftRevision: 0,
      applyDraft: (data) =>
        set((state) => ({ draftFormData: data, draftRevision: state.draftRevision + 1 })),
      
    }),
    {
      name: 'ypw.product-draft.v2',
      storage: createJSONStorage(() => createDraftStorage(sessionStorage)),
      version: 2,
      partialize: (state) => ({
        draftFormData: sanitizeDraft(state.draftFormData),
        recentCategoryIds: state.recentCategoryIds,
      }),
    }
  )
);
