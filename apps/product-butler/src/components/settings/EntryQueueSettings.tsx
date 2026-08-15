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
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

const REPEAT_FIELDS: Array<{ label: string; value: RepeatField }> = [
  { label: __("Category", "yaxii-product-workspace"), value: "category_ids" },
  { label: __("Regular price", "yaxii-product-workspace"), value: "regular_price" },
  { label: __("Sale price", "yaxii-product-workspace"), value: "sale_price" },
  { label: __("Inventory", "yaxii-product-workspace"), value: "stock_quantity" },
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
      <SettingsPanel title={__("Entry flow", "yaxii-product-workspace")} description={__("Optimized for fast, repetitive data entry.", "yaxii-product-workspace")}>
        <SettingRow title={__("Auto-focus product name", "yaxii-product-workspace")} description={__("The cursor moves to the name field when the workspace loads.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Auto-focus product name", "yaxii-product-workspace")}
            checked={preferences.auto_focus_name}
            onCheckedChange={(value) => update("auto_focus_name", value)}
          />
        </SettingRow>
        <SettingRow title={__("Repeat after Save & Next", "yaxii-product-workspace")} description={__("Choose safe values to carry into the next product.", "yaxii-product-workspace")}>
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
        <SettingRow title={__("Confirm before delete", "yaxii-product-workspace")} description={__("Ask before removing a queued product.", "yaxii-product-workspace")} last>
          <Switch
            aria-label={__("Confirm before delete", "yaxii-product-workspace")}
            checked={preferences.confirm_queue_dismiss}
            onCheckedChange={(value) => update("confirm_queue_dismiss", value)}
          />
        </SettingRow>
      </SettingsPanel>

      <SettingsPanel title={__("Queue display", "yaxii-product-workspace")} description={__("How queued products are grouped and listed.", "yaxii-product-workspace")}>
        <SettingRow title={__("Group by day", "yaxii-product-workspace")} description={__("Adds date headers between queue rows.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Group by day", "yaxii-product-workspace")}
            checked={preferences.queue_group_by_day}
            onCheckedChange={(value) => update("queue_group_by_day", value)}
          />
        </SettingRow>
        <SettingRow title={__("Relative timestamps", "yaxii-product-workspace")} description={__("“3 hours ago” instead of a fixed date.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Relative timestamps", "yaxii-product-workspace")}
            checked={preferences.relative_timestamps}
            onCheckedChange={(value) => update("relative_timestamps", value)}
          />
        </SettingRow>
        <SettingRow title={__("Rows per page", "yaxii-product-workspace")} description={__("Longer lists load more rows before paging.", "yaxii-product-workspace")} last>
          <Select
            value={String(preferences.queue_rows_per_page)}
            onValueChange={(value) => update("queue_rows_per_page", Number(value) as 10 | 25 | 50)}
          >
            <SelectTrigger aria-label={__("Rows per page", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((rows) => (
                <SelectItem key={rows} value={String(rows)}>{
                  /* translators: %s: row count. */ sprintf(_n("%s row", "%s rows", rows, "yaxii-product-workspace"), rows)
                }</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
