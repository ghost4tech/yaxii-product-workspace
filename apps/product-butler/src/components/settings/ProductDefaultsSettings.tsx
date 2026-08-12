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
import { useProductStore } from "@/stores/productStore";
import type { AppSettings } from "@/types/product";

export function ProductDefaultsSettings() {
  const { appSettings, setAppSettings } = useProductStore();
  const setSetting = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setAppSettings({ [key]: value } as Pick<AppSettings, Key>);
  };

  return (
    <TabsContent value="defaults" className="mt-4 space-y-4">
      <SettingsPanel title="WooCommerce defaults" description="Applied to every new product and variation.">
        <SettingRow title="Stock status" description="Default availability for new items.">
          <Select
            value={appSettings.defaultStockStatus}
            onValueChange={(value) =>
              setSetting("defaultStockStatus", value as AppSettings["defaultStockStatus"])
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
            value={appSettings.defaultProductStatus}
            onValueChange={(value) =>
              setSetting("defaultProductStatus", value as AppSettings["defaultProductStatus"])
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
            value={appSettings.defaultCatalogVisibility}
            onValueChange={(value) =>
              setSetting("defaultCatalogVisibility", value as AppSettings["defaultCatalogVisibility"])
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
            value={appSettings.defaultTaxStatus}
            onValueChange={(value) =>
              setSetting("defaultTaxStatus", value as AppSettings["defaultTaxStatus"])
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
            checked={appSettings.enableManageStock}
            onCheckedChange={(value) => setSetting("enableManageStock", value)}
          />
        </SettingRow>
        <SettingRow
          title="Auto-generate variations"
          description="Create WooCommerce variations from attributes automatically."
          last
        >
          <Switch
            checked={appSettings.autoGenerateVariations}
            onCheckedChange={(value) => setSetting("autoGenerateVariations", value)}
          />
        </SettingRow>
      </SettingsPanel>
    </TabsContent>
  );
}
