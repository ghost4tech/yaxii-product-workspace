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
import { usePrefsStore } from "@/stores/prefsStore";

export function EntryQueueSettings() {
  const { prefs, setPref } = usePrefsStore();

  return (
    <TabsContent value="queue" className="mt-4 space-y-4">
      <SettingsPanel title="Entry flow" description="Optimised for fast, repetitive data entry.">
        <SettingRow title="Auto-focus product name" description="Cursor lands in the name field on load.">
          <Switch
            checked={prefs.autoFocusName}
            onCheckedChange={(value) => setPref("autoFocusName", value)}
          />
        </SettingRow>
        <SettingRow title="Keep values after save" description="Retain category, price and stock for the next product.">
          <Switch
            checked={prefs.keepValuesAfterSave}
            onCheckedChange={(value) => setPref("keepValuesAfterSave", value)}
          />
        </SettingRow>
        <SettingRow title="Confirm before delete" description="Ask before removing a queued product." last>
          <Switch
            checked={prefs.confirmBeforeDelete}
            onCheckedChange={(value) => setPref("confirmBeforeDelete", value)}
          />
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel title="Queue display" description="How queued products are grouped and listed.">
        <SettingRow title="Group by day" description="Adds date headers between queue rows.">
          <Switch
            checked={prefs.queueGroupByDay}
            onCheckedChange={(value) => setPref("queueGroupByDay", value)}
          />
        </SettingRow>
        <SettingRow title="Relative timestamps" description="“3 hours ago” instead of a fixed date.">
          <Switch
            checked={prefs.relativeTimestamps}
            onCheckedChange={(value) => setPref("relativeTimestamps", value)}
          />
        </SettingRow>
        <SettingRow title="Rows per page" description="Longer lists load more rows before paging." last>
          <Select
            value={String(prefs.queueRowsPerPage)}
            onValueChange={(value) => setPref("queueRowsPerPage", Number(value))}
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((rows) => (
                <SelectItem key={rows} value={String(rows)}>{rows} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
