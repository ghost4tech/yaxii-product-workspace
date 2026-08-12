import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Product, Category, ProductFormData, emptyProductFormData, AppSettings, defaultAppSettings } from '@/types/product';

interface ProductStore {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  recentCategoryIds: number[];
  addRecentCategory: (categoryId: number) => void;
  
  appSettings: AppSettings;
  setAppSettings: (settings: Partial<AppSettings>) => void;
  resetAppSettings: () => void;
  
  draftFormData: ProductFormData;
  setDraftFormData: (data: ProductFormData) => void;
  clearDraftFormData: () => void;
  /** Bumped whenever the draft is replaced externally (command menu, duplicate, clear) */
  draftRevision: number;
  applyDraft: (data: ProductFormData) => void;
  
  getProductsAddedToday: () => number;
  getProductsAddedThisWeek: () => number;
  
  lastDeletedProduct: Product | null;
  setLastDeletedProduct: (product: Product | null) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => set((state) => ({ 
        products: [product, ...state.products] 
      })),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => 
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      })),
      
      categories: [],
      setCategories: (categories) => set({ categories }),
      recentCategoryIds: [],
      addRecentCategory: (categoryId) => set((state) => {
        const filtered = state.recentCategoryIds.filter((id) => id !== categoryId);
        return { recentCategoryIds: [categoryId, ...filtered].slice(0, 5) };
      }),
      
      appSettings: defaultAppSettings,
      setAppSettings: (settings) => set((state) => ({
        appSettings: { ...state.appSettings, ...settings },
      })),
      resetAppSettings: () => set({ appSettings: defaultAppSettings }),
      
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
      
      getProductsAddedToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().products.filter((p) => new Date(p.createdAt) >= today).length;
      },
      getProductsAddedThisWeek: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return get().products.filter((p) => new Date(p.createdAt) >= weekAgo).length;
      },
      
      lastDeletedProduct: null,
      setLastDeletedProduct: (product) => set({ lastDeletedProduct: product }),
    }),
    {
      name: 'ypw.product-draft.v1',
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      partialize: (state) => ({
        appSettings: state.appSettings,
        draftFormData: { ...state.draftFormData, images: [] },
      }),
    }
  )
);
