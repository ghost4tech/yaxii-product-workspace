import { Monitor, Moon, Sun } from "lucide-react";
import { SettingRow, SettingsPanel } from "./SettingsPrimitives";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ACCENTS, type AccentName, usePrefsStore } from "@/stores/prefsStore";
import { TabsContent } from "@/components/ui/tabs";
import { __, sprintf } from "@/production/core/i18n/wordpress";

const themes = [
  { value: "light" as const, label: __("Light", "yaxii-product-workspace"), icon: Sun },
  { value: "dark" as const, label: __("Dark", "yaxii-product-workspace"), icon: Moon },
  { value: "system" as const, label: __("System", "yaxii-product-workspace"), icon: Monitor },
];

const accentLabels: Record<AccentName, string> = {
  blue: __("Blue", "yaxii-product-workspace"), emerald: __("Emerald", "yaxii-product-workspace"), graphite: __("Graphite", "yaxii-product-workspace"), violet: __("Violet", "yaxii-product-workspace"),
};

export function AppearanceSettings() {
  const { prefs, setPref } = usePrefsStore();

  return (
    <TabsContent value="appearance" className="mt-4 space-y-4">
      <SettingsPanel title={__("Theme & density", "yaxii-product-workspace")} description={__("How the workspace looks on this device.", "yaxii-product-workspace")}>
        <SettingRow title={__("Theme", "yaxii-product-workspace")} description={__("Follow the system setting or select one.", "yaxii-product-workspace")}>
          <div className="seg">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setPref("theme", theme.value)}
                data-active={prefs.theme === theme.value}
                className="seg-item"
                type="button"
              >
                <theme.icon className="h-3.5 w-3.5" />
                {theme.label}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow title={__("Density", "yaxii-product-workspace")} description={__("Compact fits noticeably more rows on screen.", "yaxii-product-workspace")}>
          <div className="seg">
            {(["comfortable", "compact"] as const).map((density) => (
              <button
                key={density}
                onClick={() => setPref("density", density)}
                data-active={prefs.density === density}
                className="seg-item capitalize"
                type="button"
              >
                {density === "comfortable" ? __("Comfortable", "yaxii-product-workspace") : __("Compact", "yaxii-product-workspace")}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow title={__("Accent color", "yaxii-product-workspace")} description={__("Used for primary buttons and active states.", "yaxii-product-workspace")}>
          <div className="flex items-center gap-2">
            {(Object.keys(ACCENTS) as AccentName[]).map((accent) => (
              <button
                key={accent}
                onClick={() => setPref("accent", accent)}
                title={accentLabels[accent]}
                aria-label={/* translators: %s: color name. */ sprintf(__("%s accent", "yaxii-product-workspace"), accentLabels[accent])}
                className={cn(
                  "h-7 w-7 rounded-md border transition",
                  prefs.accent === accent
                    ? "border-foreground ring-2 ring-ring/20"
                    : "border-border hover:border-foreground/40",
                )}
                style={{ background: ACCENTS[accent].swatch }}
                type="button"
              />
            ))}
          </div>
        </SettingRow>
        <SettingRow
          title={__("Reduce motion", "yaxii-product-workspace")}
          description={__("Minimizes animations and transitions across the app.", "yaxii-product-workspace")}
          last
        >
          <Switch
            aria-label={__("Reduce motion", "yaxii-product-workspace")}
            checked={prefs.reduceMotion}
            onCheckedChange={(value) => setPref("reduceMotion", value)}
          />
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
