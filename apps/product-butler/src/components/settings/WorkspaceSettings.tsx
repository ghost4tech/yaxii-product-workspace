import { SettingRow, SettingsPanel } from "./SettingsPrimitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { type Preferences, usePrefsStore } from "@/stores/prefsStore";

export function WorkspaceSettings() {
  const { prefs, setPref } = usePrefsStore();

  return (
    <TabsContent value="workspace" className="mt-4 space-y-4">
      <SettingsPanel title="Workspace behaviour" description="Navigation and on-screen guidance.">
        <SettingRow title="Landing tab" description="Where the app opens by default.">
          <Select
            value={prefs.defaultTab}
            onValueChange={(value) => setPref("defaultTab", value as Preferences["defaultTab"])}
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/">Entry workspace</SelectItem>
              <SelectItem value="/settings">Settings</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Inline keyboard hints" description="Show key badges on buttons and footers.">
          <Switch
            aria-label="Inline keyboard hints"
            checked={prefs.showKeyboardHints}
            onCheckedChange={(value) => setPref("showKeyboardHints", value)}
          />
        </SettingRow>
        <SettingRow title="Help tooltips"
          description="Inline “?” explanations on fields and controls. Turn off for a cleaner interface.">
          <Switch aria-label="Help tooltips" checked={prefs.showTooltips}
            onCheckedChange={(value) => setPref("showTooltips", value)} />
        </SettingRow>
        <SettingRow title="KPI trends" description="Show sparklines and deltas on the metric strip.">
          <Switch
            aria-label="KPI trends"
            checked={prefs.showKpiTrends}
            onCheckedChange={(value) => setPref("showKpiTrends", value)}
          />
        </SettingRow>
        <SettingRow
          title="Sticky queue panel"
          description="Keeps the queue in view while you scroll the form."
          last
        >
          <Switch
            aria-label="Sticky queue panel"
            checked={prefs.stickyQueue}
            onCheckedChange={(value) => setPref("stickyQueue", value)}
          />
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel
        title="Focus mode"
        description="Distraction-free product entry. Remembered between sessions."
      >
        <SettingRow title="Start in focus mode" description="Hide navigation and metrics when the workspace opens.">
          <Switch
            aria-label="Start in focus mode"
            checked={prefs.focusMode}
            onCheckedChange={(value) => setPref("focusMode", value)}
          />
        </SettingRow>
        <SettingRow
          title="Keep the queue in focus mode"
          description="Show recent products beside the form while focused."
          last
        >
          <Switch
            aria-label="Keep the queue in focus mode"
            checked={prefs.focusModeShowQueue}
            onCheckedChange={(value) => setPref("focusModeShowQueue", value)}
          />
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
