import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConnectedStore {
  id: string;
  name: string;
  url: string;
  productCount: number;
  lastSync: string;
  status: 'online' | 'offline';
  color: string;
}

interface StoresStore {
  stores: ConnectedStore[];
  activeStoreId: string | null;
  setActiveStore: (id: string) => void;
  addStore: (store: ConnectedStore) => void;
  removeStore: (id: string) => void;
}

const seedStores: ConnectedStore[] = [
  {
    id: 'store-1',
    name: 'Primary Store',
    url: 'https://shop.example.com',
    productCount: 1284,
    lastSync: 'Just now',
    status: 'online',
    color: '#10b981',
  },
  {
    id: 'store-2',
    name: 'EU Warehouse',
    url: 'https://eu.example.com',
    productCount: 642,
    lastSync: '4 min ago',
    status: 'online',
    color: '#6366f1',
  },
  {
    id: 'store-3',
    name: 'Outlet · Clearance',
    url: 'https://outlet.example.com',
    productCount: 209,
    lastSync: '2 hours ago',
    status: 'offline',
    color: '#f59e0b',
  },
];

export const useStoresStore = create<StoresStore>()(
  persist(
    (set) => ({
      stores: seedStores,
      activeStoreId: 'store-1',
      setActiveStore: (id) => set({ activeStoreId: id }),
      addStore: (store) =>
        set((s) => ({ stores: [...s.stores, store], activeStoreId: store.id })),
      removeStore: (id) =>
        set((s) => ({ stores: s.stores.filter((x) => x.id !== id) })),
    }),
    { name: 'woo-stores-store' }
  )
);
