import { Monitor, Moon, Sun } from "lucide-react";
import { SettingRow, SettingsPanel } from "./SettingsPrimitives";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ACCENTS, type AccentName, usePrefsStore } from "@/stores/prefsStore";
import { TabsContent } from "@/components/ui/tabs";

const themes = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

export function AppearanceSettings() {
  const { prefs, setPref } = usePrefsStore();

  return (
    <TabsContent value="appearance" className="mt-4 space-y-4">
      <SettingsPanel title="Theme & density" description="How the workspace looks on this device.">
        <SettingRow title="Theme" description="Follow the system setting or lock one in.">
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
        <SettingRow title="Density" description="Compact fits noticeably more rows on screen.">
          <div className="seg">
            {(["comfortable", "compact"] as const).map((density) => (
              <button
                key={density}
                onClick={() => setPref("density", density)}
                data-active={prefs.density === density}
                className="seg-item capitalize"
                type="button"
              >
                {density}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow title="Accent colour" description="Used for primary buttons and active states.">
          <div className="flex items-center gap-2">
            {(Object.keys(ACCENTS) as AccentName[]).map((accent) => (
              <button
                key={accent}
                onClick={() => setPref("accent", accent)}
                title={ACCENTS[accent].label}
                aria-label={`${ACCENTS[accent].label} accent`}
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
          title="Reduce motion"
          description="Minimises animations and transitions across the app."
          last
        >
          <Switch
            checked={prefs.reduceMotion}
            onCheckedChange={(value) => setPref("reduceMotion", value)}
          />
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
