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
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";
import type { WorkspacePreferences } from "@/production/domain/products";

export function ProductDefaultsSettings() {
  const { bootstrap } = useWorkspaceRuntime();
  const { preferences, update } = useWorkspacePreferences();
  const setSetting = <Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) => update(key, value);

  return (
    <TabsContent value="defaults" className="mt-4 space-y-4">
      <SettingsPanel title="WooCommerce defaults" description="Applied to every new product and variation.">
        <SettingRow title="Stock status" description="Default availability for new items.">
          <Select
            value={preferences.default_stock_status}
            onValueChange={(value) =>
              setSetting("default_stock_status", value as WorkspacePreferences["default_stock_status"])
            }
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instock">In stock</SelectItem>
              <SelectItem value="outofstock">Out of stock</SelectItem>
              <SelectItem value="onbackorder">On backorder</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Product status" description="Publish state used when syncing.">
          <Select
            value={preferences.default_product_status}
            onValueChange={(value) =>
              setSetting("default_product_status", value as WorkspacePreferences["default_product_status"])
            }
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending review</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Catalog visibility" description="Where products appear in the storefront.">
          <Select
            value={preferences.default_catalog_visibility}
            onValueChange={(value) =>
              setSetting("default_catalog_visibility", value as WorkspacePreferences["default_catalog_visibility"])
            }
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="visible">Shop & search</SelectItem>
              <SelectItem value="catalog">Shop only</SelectItem>
              <SelectItem value="search">Search only</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Tax status" description="Tax treatment for new products.">
          <Select
            value={preferences.default_tax_status}
            onValueChange={(value) =>
              setSetting("default_tax_status", value as WorkspacePreferences["default_tax_status"])
            }
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="taxable">Taxable</SelectItem>
              <SelectItem value="shipping">Shipping only</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Stock management" description="Track inventory levels by default.">
          <Switch
            checked={preferences.default_manage_stock}
            onCheckedChange={(value) => setSetting("default_manage_stock", value)}
          />
        </SettingRow>
        <SettingRow title="Backorders" description="Default policy when tracked inventory reaches zero.">
          <Select
            value={preferences.default_backorders}
            onValueChange={(value) => setSetting("default_backorders", value as WorkspacePreferences["default_backorders"])}
          >
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Do not allow</SelectItem>
              <SelectItem value="notify">Allow, notify</SelectItem>
              <SelectItem value="yes">Allow</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Sold individually" description="Limit each order to one unit.">
          <Switch
            checked={preferences.default_sold_individually}
            onCheckedChange={(value) => setSetting("default_sold_individually", value)}
          />
        </SettingRow>
        <SettingRow title="Tax class" description="WooCommerce tax class for new products." last>
          <Select value={preferences.default_tax_class || "standard"} onValueChange={(value) => setSetting("default_tax_class", value === "standard" ? "" : value)}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              {bootstrap.woocommerce.taxClasses.filter((taxClass) => taxClass.slug).map((taxClass) => (
                <SelectItem key={taxClass.slug} value={taxClass.slug}>{taxClass.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
