import { useEffect } from "react";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { ACCENTS, usePrefsStore } from "@/stores/prefsStore";

export function PreferencesEffects() {
  const { scope } = useWorkspaceRuntime();
  const { accent, density, reduceMotion, theme } = usePrefsStore((state) => state.prefs);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      scope.classList.toggle("dark", dark);
    };

    applyTheme();
    if (theme === "system") {
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
    return undefined;
  }, [scope, theme]);

  useEffect(() => {
    scope.setAttribute("data-density", density);
    scope.setAttribute("data-reduce-motion", String(reduceMotion));
  }, [density, reduceMotion, scope]);

  useEffect(() => {
    if (accent === "graphite") {
      scope.style.removeProperty("--primary");
      scope.style.removeProperty("--ring");
      scope.style.removeProperty("--brand");
      return;
    }
    scope.style.setProperty("--primary", ACCENTS[accent].hsl);
    scope.style.setProperty("--ring", ACCENTS[accent].hsl);
    scope.style.setProperty("--brand", ACCENTS[accent].hsl);
  }, [accent, scope]);

  return null;
}
