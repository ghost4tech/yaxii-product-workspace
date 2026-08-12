import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type AccentName = 'graphite' | 'emerald' | 'blue' | 'violet';

export const ACCENTS: Record<AccentName, { label: string; hsl: string; swatch: string }> = {
  graphite: { label: 'Graphite', hsl: '224 71% 6%', swatch: 'hsl(224 71% 6%)' },
  emerald: { label: 'Emerald', hsl: '158 64% 34%', swatch: 'hsl(158 64% 34%)' },
  blue: { label: 'Blue', hsl: '217 91% 45%', swatch: 'hsl(217 91% 45%)' },
  violet: { label: 'Violet', hsl: '262 72% 48%', swatch: 'hsl(262 72% 48%)' },
};

export interface Preferences {
  /* Appearance */
  theme: ThemeMode;
  density: Density;
  accent: AccentName;
  reduceMotion: boolean;
  monoNumbers: boolean;

  /* Workspace */
  defaultTab: '/' | '/settings';
  showKpiTrends: boolean;
  showKeyboardHints: boolean;
  stickyQueue: boolean;

  /* Focus mode */
  focusMode: boolean;
  focusModeShowQueue: boolean;

  /* Entry flow */
  autoFocusName: boolean;
  keepValuesAfterSave: boolean;
  confirmBeforeDelete: boolean;
  soundOnSave: boolean;

  /* Queue */
  queueGroupByDay: boolean;
  relativeTimestamps: boolean;
  queueRowsPerPage: number;
}

export const defaultPreferences: Preferences = {
  theme: 'light',
  density: 'comfortable',
  accent: 'graphite',
  reduceMotion: false,
  monoNumbers: true,

  defaultTab: '/',
  showKpiTrends: true,
  showKeyboardHints: true,
  stickyQueue: true,

  focusMode: false,
  focusModeShowQueue: true,

  autoFocusName: true,
  keepValuesAfterSave: false,
  confirmBeforeDelete: false,
  soundOnSave: false,

  queueGroupByDay: true,
  relativeTimestamps: true,
  queueRowsPerPage: 25,
};

interface PrefsStore {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetPrefs: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (value: boolean) => void;
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      prefs: defaultPreferences,
      setPref: (key, value) =>
        set((state) => ({ prefs: { ...state.prefs, [key]: value } })),
      resetPrefs: () => set({ prefs: defaultPreferences }),
      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),
      shortcutsOpen: false,
      setShortcutsOpen: (value) => set({ shortcutsOpen: value }),
    }),
    {
      name: 'ypw.preferences.v1',
      version: 1,
      partialize: (s) => ({ prefs: s.prefs }),
    }
  )
);
