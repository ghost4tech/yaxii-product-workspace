import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type AccentName = 'graphite' | 'emerald' | 'blue' | 'violet';

export const ACCENTS: Record<AccentName, { hsl: string; swatch: string }> = {
  graphite: { hsl: '224 71% 6%', swatch: 'hsl(224 71% 6%)' },
  emerald: { hsl: '158 64% 34%', swatch: 'hsl(158 64% 34%)' },
  blue: { hsl: '217 91% 45%', swatch: 'hsl(217 91% 45%)' },
  violet: { hsl: '262 72% 48%', swatch: 'hsl(262 72% 48%)' },
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
  showKpiCards: boolean;
  showKpiTrends: boolean;
  showKeyboardHints: boolean;
  showTooltips: boolean;
  stickyQueue: boolean;

  /* Focus mode */
  focusMode: boolean;
  focusModeShowQueue: boolean;

}

export const defaultPreferences: Preferences = {
  theme: 'light',
  density: 'comfortable',
  accent: 'graphite',
  reduceMotion: false,
  monoNumbers: true,

  defaultTab: '/',
  showKpiCards: true,
  showKpiTrends: true,
  showKeyboardHints: true,
  showTooltips: true,
  stickyQueue: true,

  focusMode: false,
  focusModeShowQueue: true,

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
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<PrefsStore>;
        return { ...current, ...saved, prefs: { ...current.prefs, ...saved.prefs } };
      },
      partialize: (s) => ({ prefs: s.prefs }),
    }
  )
);
