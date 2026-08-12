import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tier = 'free' | 'pro';

export type ProFeature =
  | 'multi_store'
  | 'analytics'
  | 'bulk_csv'
  | 'ai_descriptions'
  | 'team'
  | 'scheduled_sync';

export const FREE_LIMITS = {
  productsPerMonth: 50,
  storesMax: 1,
};

interface TierStore {
  tier: Tier;
  setTier: (tier: Tier) => void;
  licenseKey: string | null;
  licenseEmail: string | null;
  activateLicense: (key: string, email: string) => void;
  deactivateLicense: () => void;
  upgradeModalOpen: boolean;
  upgradeFeature: ProFeature | null;
  openUpgradeModal: (feature?: ProFeature) => void;
  closeUpgradeModal: () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
}

export const useTierStore = create<TierStore>()(
  persist(
    (set) => ({
      tier: 'free',
      setTier: (tier) => set({ tier }),
      licenseKey: null,
      licenseEmail: null,
      activateLicense: (key, email) =>
        set({ licenseKey: key, licenseEmail: email, tier: 'pro' }),
      deactivateLicense: () =>
        set({ licenseKey: null, licenseEmail: null, tier: 'free' }),
      upgradeModalOpen: false,
      upgradeFeature: null,
      openUpgradeModal: (feature) =>
        set({ upgradeModalOpen: true, upgradeFeature: feature ?? null }),
      closeUpgradeModal: () => set({ upgradeModalOpen: false }),
      shortcutsOpen: false,
      setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
    }),
    {
      name: 'woo-tier-store',
      partialize: (s) => ({
        tier: s.tier,
        licenseKey: s.licenseKey,
        licenseEmail: s.licenseEmail,
      }),
    }
  )
);

export const PRO_FEATURE_LABELS: Record<ProFeature, { title: string; desc: string }> = {
  multi_store: {
    title: 'Multi-store management',
    desc: 'Connect and switch between unlimited WooCommerce stores.',
  },
  analytics: {
    title: 'Advanced analytics',
    desc: 'Throughput charts, sync health, team activity & time saved.',
  },
  bulk_csv: {
    title: 'Bulk CSV import / export',
    desc: 'Queue thousands of products from a spreadsheet in one click.',
  },
  ai_descriptions: {
    title: 'AI product descriptions',
    desc: 'Generate short & long descriptions from product name and category.',
  },
  team: {
    title: 'Team members & roles',
    desc: 'Invite teammates with viewer or editor permissions.',
  },
  scheduled_sync: {
    title: 'Scheduled sync & auto-retry',
    desc: 'Batch syncs on a schedule and automatically retry failed items.',
  },
};
