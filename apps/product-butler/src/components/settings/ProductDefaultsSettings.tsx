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
import { __, _x } from "@/production/core/i18n/wordpress";

export function ProductDefaultsSettings() {
  const { bootstrap } = useWorkspaceRuntime();
  const { preferences, update } = useWorkspacePreferences();
  const setSetting = <Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) => update(key, value);

  return (
    <TabsContent value="defaults" className="mt-4 space-y-4">
      <SettingsPanel title={__("WooCommerce defaults", "yaxii-product-workspace")} description={__("Applied to every new product and variation.", "yaxii-product-workspace")}>
        <SettingRow title={__("Stock status", "yaxii-product-workspace")} description={__("Default availability for new items.", "yaxii-product-workspace")}>
          <Select
            value={preferences.default_stock_status}
            onValueChange={(value) =>
              setSetting("default_stock_status", value as WorkspacePreferences["default_stock_status"])
            }
          >
            <SelectTrigger aria-label={__("Stock status", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instock">{__("In stock", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="outofstock">{__("Out of stock", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="onbackorder">{__("On backorder", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Product status", "yaxii-product-workspace")} description={__("Publish state used for new products.", "yaxii-product-workspace")}>
          <Select
            value={preferences.default_product_status}
            onValueChange={(value) =>
              setSetting("default_product_status", value as WorkspacePreferences["default_product_status"])
            }
          >
            <SelectTrigger aria-label={__("Product status", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">{_x("Published", "Product status", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="draft">{_x("Draft", "Product status", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="pending">{_x("Pending review", "Product status", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Catalog visibility", "yaxii-product-workspace")} description={__("Where products appear in the storefront.", "yaxii-product-workspace")}>
          <Select
            value={preferences.default_catalog_visibility}
            onValueChange={(value) =>
              setSetting("default_catalog_visibility", value as WorkspacePreferences["default_catalog_visibility"])
            }
          >
            <SelectTrigger aria-label={__("Catalog visibility", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="visible">{__("Shop & search", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="catalog">{__("Shop only", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="search">{__("Search only", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="hidden">{__("Hidden", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Tax status", "yaxii-product-workspace")} description={__("Tax treatment for new products.", "yaxii-product-workspace")}>
          <Select
            value={preferences.default_tax_status}
            onValueChange={(value) =>
              setSetting("default_tax_status", value as WorkspacePreferences["default_tax_status"])
            }
          >
            <SelectTrigger aria-label={__("Tax status", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="taxable">{__("Taxable", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="shipping">{__("Shipping only", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="none">{__("None", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Stock management", "yaxii-product-workspace")} description={__("Track inventory levels by default.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Stock management", "yaxii-product-workspace")}
            checked={preferences.default_manage_stock}
            onCheckedChange={(value) => setSetting("default_manage_stock", value)}
          />
        </SettingRow>
        <SettingRow title={__("Backorders", "yaxii-product-workspace")} description={__("Default policy when tracked inventory reaches zero.", "yaxii-product-workspace")}>
          <Select
            value={preferences.default_backorders}
            onValueChange={(value) => setSetting("default_backorders", value as WorkspacePreferences["default_backorders"])}
          >
            <SelectTrigger aria-label={__("Backorders", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">{__("Do not allow", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="notify">{__("Allow, but notify customer", "yaxii-product-workspace")}</SelectItem>
              <SelectItem value="yes">{__("Allow", "yaxii-product-workspace")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={__("Sold individually", "yaxii-product-workspace")} description={__("Limit each order to one unit.", "yaxii-product-workspace")}>
          <Switch
            aria-label={__("Sold individually", "yaxii-product-workspace")}
            checked={preferences.default_sold_individually}
            onCheckedChange={(value) => setSetting("default_sold_individually", value)}
          />
        </SettingRow>
        <SettingRow title={__("Tax class", "yaxii-product-workspace")} description={__("WooCommerce tax class for new products.", "yaxii-product-workspace")} last>
          <Select value={preferences.default_tax_class || "standard"} onValueChange={(value) => setSetting("default_tax_class", value === "standard" ? "" : value)}>
            <SelectTrigger aria-label={__("Tax class", "yaxii-product-workspace")} className="h-9 w-full text-xs sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">{__("Standard", "yaxii-product-workspace")}</SelectItem>
              {bootstrap.woocommerce.taxClasses.filter((taxClass) => taxClass.slug).map((taxClass) => (
                <SelectItem key={taxClass.slug} value={taxClass.slug}><bdi dir="auto">{taxClass.name}</bdi></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
