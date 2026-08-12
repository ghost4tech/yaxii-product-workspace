import { useEffect } from "react";
import type { WorkspacePreferences } from "./preferencesStore";

function applyPreferences(scope: HTMLElement, preferences: WorkspacePreferences, dark: boolean) {
  scope.dataset.density = preferences.density;
  scope.dataset.reduceMotion = String(preferences.reduceMotion);
  scope.dataset.theme = dark ? "dark" : "light";
}

export function useRootPreferences(scope: HTMLElement, preferences: WorkspacePreferences) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = preferences.theme === "dark" || (preferences.theme === "system" && media.matches);
      applyPreferences(scope, preferences, dark);
    };

    apply();
    if (preferences.theme !== "system") {
      return undefined;
    }

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences, scope]);
}
