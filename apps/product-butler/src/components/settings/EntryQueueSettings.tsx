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
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";
import type { RepeatField } from "@/production/domain/products";

const REPEAT_FIELDS: Array<{ label: string; value: RepeatField }> = [
  { label: "Category", value: "category_ids" },
  { label: "Regular price", value: "regular_price" },
  { label: "Sale price", value: "sale_price" },
  { label: "Inventory", value: "stock_quantity" },
];

export function EntryQueueSettings() {
  const { preferences, update } = useWorkspacePreferences();
  const toggleRepeat = (field: RepeatField, enabled: boolean) => {
    const values = enabled
      ? [...new Set([...preferences.repeat_fields, field])]
      : preferences.repeat_fields.filter((value) => value !== field);
    update("repeat_fields", values);
  };

  return (
    <TabsContent value="queue" className="mt-4 space-y-4">
      <SettingsPanel title="Entry flow" description="Optimised for fast, repetitive data entry.">
        <SettingRow title="Auto-focus product name" description="Cursor lands in the name field on load.">
          <Switch
            aria-label="Auto-focus product name"
            checked={preferences.auto_focus_name}
            onCheckedChange={(value) => update("auto_focus_name", value)}
          />
        </SettingRow>
        <SettingRow title="Repeat after Save & Next" description="Choose safe values to carry into the next product.">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
            {REPEAT_FIELDS.map((field) => (
              <label key={field.value} className="flex items-center gap-2 whitespace-nowrap">
                <Checkbox
                  checked={preferences.repeat_fields.includes(field.value)}
                  onCheckedChange={(checked) => toggleRepeat(field.value, checked === true)}
                />
                {field.label}
              </label>
            ))}
          </div>
        </SettingRow>
        <SettingRow title="Confirm before delete" description="Ask before removing a queued product." last>
          <Switch
            aria-label="Confirm before delete"
            checked={preferences.confirm_queue_dismiss}
            onCheckedChange={(value) => update("confirm_queue_dismiss", value)}
          />
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel title="Queue display" description="How queued products are grouped and listed.">
        <SettingRow title="Group by day" description="Adds date headers between queue rows.">
          <Switch
            aria-label="Group by day"
            checked={preferences.queue_group_by_day}
            onCheckedChange={(value) => update("queue_group_by_day", value)}
          />
        </SettingRow>
        <SettingRow title="Relative timestamps" description="“3 hours ago” instead of a fixed date.">
          <Switch
            aria-label="Relative timestamps"
            checked={preferences.relative_timestamps}
            onCheckedChange={(value) => update("relative_timestamps", value)}
          />
        </SettingRow>
        <SettingRow title="Rows per page" description="Longer lists load more rows before paging." last>
          <Select
            value={String(preferences.queue_rows_per_page)}
            onValueChange={(value) => update("queue_rows_per_page", Number(value) as 10 | 25 | 50)}
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((rows) => (
                <SelectItem key={rows} value={String(rows)}>{rows} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
