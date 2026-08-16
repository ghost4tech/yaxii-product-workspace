import { SettingRow, SettingsPanel } from "./SettingsPrimitives";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { type OptionalSection, type Preferences, usePrefsStore } from "@/stores/prefsStore";
import { __ } from "@/production/core/i18n/wordpress";

const OPTIONAL_SECTIONS: Array<{ label: string; value: OptionalSection }> = [
  { label: __("SKU field", "yaxii-product-workspace"), value: "sku" },
  { label: __("Tax details", "yaxii-product-workspace"), value: "tax" },
  { label: __("Shipping & dimensions", "yaxii-product-workspace"), value: "shipping" },
  { label: __("Advanced inventory options", "yaxii-product-workspace"), value: "advancedInventory" },
];

export function WorkspaceSettings() {
  const { prefs, setPref } = usePrefsStore();
  const toggleOptionalSection = (section: OptionalSection, hide: boolean) => {
    const value = hide
      ? [...new Set([...prefs.hiddenOptionalSections, section])]
      : prefs.hiddenOptionalSections.filter((item) => item !== section);
    setPref("hiddenOptionalSections", value);
  };

  return (
    <TabsContent value="workspace" className="mt-4 space-y-4">
      <SettingsPanel title={__("Workspace behavior", "yaxii-product-workspace")} description={__("Navigation and on-screen guidance.", "yaxii-product-workspace")}>
        <SettingRow title={__("Landing tab", "yaxii-product-workspace")} description={__("Where the app opens by default.", "yaxii-product-workspace")}>
          <Select
            value={prefs.defaultTab}
            onValueChange={(value) => setPref("defaultTab", value as Preferences["defaultTab"])}
          >
            <SelectTrigger aria-label={__("Landing tab", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/">{__("Entry workspace", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="/settings">{__("Settings", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Inline keyboard hints", "yaxii-product-workspace")} description={__("Show key badges on buttons and footers.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Inline keyboard hints", "yaxii-product-workspace")}
            checked={prefs.showKeyboardHints}
            onCheckedChange={(value) => setPref("showKeyboardHints", value)}
          />
        </SettingRow>
        <SettingRow title={__("Help tooltips", "yaxii-product-workspace")}
          description={__("Inline “?” explanations on fields and controls. Turn off for a cleaner interface.", "yaxii-product-workspace")}>
          <Switch aria-label={__("Help tooltips", "yaxii-product-workspace")} checked={prefs.showTooltips}
            onCheckedChange={(value) => setPref("showTooltips", value)} />
        </SettingRow>
        <SettingRow title={__("KPI cards", "yaxii-product-workspace")} description={__("Show the metric strip above the product workspace.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("KPI cards", "yaxii-product-workspace")}
            checked={prefs.showKpiCards}
            onCheckedChange={(value) => setPref("showKpiCards", value)}
          />
        </SettingRow>
        <SettingRow title={__("KPI trends", "yaxii-product-workspace")} description={__("Show sparklines and deltas on the metric strip.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("KPI trends", "yaxii-product-workspace")}
            checked={prefs.showKpiTrends}
            disabled={!prefs.showKpiCards}
            onCheckedChange={(value) => setPref("showKpiTrends", value)}
          />
        </SettingRow>
        <SettingRow
          title={__("Sticky queue panel", "yaxii-product-workspace")}
          description={__("Keeps the queue in view while you scroll the form.", "yaxii-product-workspace")}
          last
        >
          <Switch
            aria-label={__("Sticky queue panel", "yaxii-product-workspace")}
            checked={prefs.stickyQueue}
            onCheckedChange={(value) => setPref("stickyQueue", value)}
          />
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel
        title={__("Product entry", "yaxii-product-workspace")}
        description={__("How the entry form opens and which secondary sections show.", "yaxii-product-workspace")}
      >
        <SettingRow title={__("Default workspace mode", "yaxii-product-workspace")} description={__("Standard shows essentials only; Extended opens with every section visible.", "yaxii-product-workspace")}>
          <Select
            value={prefs.defaultWorkspaceMode}
            onValueChange={(value) => setPref("defaultWorkspaceMode", value as Preferences["defaultWorkspaceMode"])}
          >
            <SelectTrigger aria-label={__("Default workspace mode", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">{__("Standard", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="extended">{__("Extended", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          title={__("Optional sections", "yaxii-product-workspace")}
          description={__("Hide secondary sections you don't use. They stay available in WooCommerce.", "yaxii-product-workspace")}
          last
        >
          <div className="grid grid-cols-1 gap-x-3 gap-y-2 text-xs sm:grid-cols-2">
            {OPTIONAL_SECTIONS.map((section) => (
              <label key={section.value} className="flex items-center gap-2 whitespace-nowrap">
                <Checkbox
                  checked={!prefs.hiddenOptionalSections.includes(section.value)}
                  onCheckedChange={(checked) => toggleOptionalSection(section.value, checked !== true)}
                />
                {section.label}
              </label>
            ))}
          </div>
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel
        title={__("Focus mode", "yaxii-product-workspace")}
        description={__("Distraction-free product entry. Remembered between sessions.", "yaxii-product-workspace")}
      >
        <SettingRow title={__("Start in focus mode", "yaxii-product-workspace")} description={__("Hide navigation and metrics when the workspace opens.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Start in focus mode", "yaxii-product-workspace")}
            checked={prefs.focusMode}
            onCheckedChange={(value) => setPref("focusMode", value)}
          />
        </SettingRow>
        <SettingRow
          title={__("Keep the queue in focus mode", "yaxii-product-workspace")}
          description={__("Show recent products beside the form while focused.", "yaxii-product-workspace")}
          last
        >
          <Switch
            aria-label={__("Keep the queue in focus mode", "yaxii-product-workspace")}
            checked={prefs.focusModeShowQueue}
            onCheckedChange={(value) => setPref("focusModeShowQueue", value)}
          />
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
