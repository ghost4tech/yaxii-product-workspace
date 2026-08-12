import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category, WooCommerceConfig, ProductFormData, emptyProductFormData, AppSettings, defaultAppSettings } from '@/types/product';

interface ProductStore {
  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  recentCategoryIds: number[];
  addRecentCategory: (categoryId: number) => void;
  
  // WooCommerce Config
  wooConfig: WooCommerceConfig | null;
  setWooConfig: (config: WooCommerceConfig | null) => void;
  
  // App Settings
  appSettings: AppSettings;
  setAppSettings: (settings: Partial<AppSettings>) => void;
  resetAppSettings: () => void;
  
  // Draft form data (auto-save)
  draftFormData: ProductFormData;
  setDraftFormData: (data: ProductFormData) => void;
  clearDraftFormData: () => void;
  /** Bumped whenever the draft is replaced externally (command menu, duplicate, clear) */
  draftRevision: number;
  applyDraft: (data: ProductFormData) => void;
  
  // Stats
  getProductsAddedToday: () => number;
  getProductsAddedThisWeek: () => number;
  
  // Undo
  lastDeletedProduct: Product | null;
  setLastDeletedProduct: (product: Product | null) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      // Products
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
      
      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      recentCategoryIds: [],
      addRecentCategory: (categoryId) => set((state) => {
        const filtered = state.recentCategoryIds.filter((id) => id !== categoryId);
        return { recentCategoryIds: [categoryId, ...filtered].slice(0, 5) };
      }),
      
      // WooCommerce Config
      wooConfig: null,
      setWooConfig: (config) => set({ wooConfig: config }),
      
      // App Settings
      appSettings: defaultAppSettings,
      setAppSettings: (settings) => set((state) => ({
        appSettings: { ...state.appSettings, ...settings },
      })),
      resetAppSettings: () => set({ appSettings: defaultAppSettings }),
      
      // Draft form data
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
      
      // Stats
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
      
      // Undo
      lastDeletedProduct: null,
      setLastDeletedProduct: (product) => set({ lastDeletedProduct: product }),
    }),
    {
      name: 'woo-product-store',
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        recentCategoryIds: state.recentCategoryIds,
        wooConfig: state.wooConfig,
        appSettings: state.appSettings,
        draftFormData: state.draftFormData,
      }),
    }
  )
);
