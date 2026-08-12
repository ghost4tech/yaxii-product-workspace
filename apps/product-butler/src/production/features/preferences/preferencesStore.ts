import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Density = "comfortable" | "compact";
export type Theme = "dark" | "light" | "system";

export interface WorkspacePreferences {
  density: Density;
  focusMode: boolean;
  reduceMotion: boolean;
  theme: Theme;
}

interface PreferencesState {
  preferences: WorkspacePreferences;
  setDensity: (density: Density) => void;
  setFocusMode: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
}

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  density: "comfortable",
  focusMode: false,
  reduceMotion: false,
  theme: "system",
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      setDensity: (density) =>
        set((state) => ({ preferences: { ...state.preferences, density } })),
      setFocusMode: (focusMode) =>
        set((state) => ({ preferences: { ...state.preferences, focusMode } })),
      setReduceMotion: (reduceMotion) =>
        set((state) => ({ preferences: { ...state.preferences, reduceMotion } })),
      setTheme: (theme) => set((state) => ({ preferences: { ...state.preferences, theme } })),
    }),
    {
      name: "ypw.preferences.v1",
      partialize: (state) => ({ preferences: state.preferences }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
