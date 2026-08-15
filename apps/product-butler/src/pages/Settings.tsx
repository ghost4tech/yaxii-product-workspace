import { Keyboard, ListOrdered, PackageCheck, Palette } from "lucide-react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { EntryQueueSettings } from "@/components/settings/EntryQueueSettings";
import { ProductDefaultsSettings } from "@/components/settings/ProductDefaultsSettings";
import { SettingsReset } from "@/components/settings/SettingsReset";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { YaxiiEcosystem } from "@/components/settings/YaxiiEcosystem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { __ } from "@/production/core/i18n/wordpress";

const tabs = [
  { value: "appearance", label: __("Appearance", "yaxii-product-workspace"), icon: Palette },
  { value: "workspace", label: __("Workspace", "yaxii-product-workspace"), icon: Keyboard },
  { value: "queue", label: __("Entry & queue", "yaxii-product-workspace"), icon: ListOrdered },
  { value: "defaults", label: __("Product defaults", "yaxii-product-workspace"), icon: PackageCheck },
];

const Settings = () => (
  <div className="min-w-0 max-w-4xl space-y-6">
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight">{__("Settings", "yaxii-product-workspace")}</h1>
      <p className="text-sm text-muted-foreground">
        {__("Appearance, workflow behavior, and WooCommerce defaults. Changes save instantly.", "yaxii-product-workspace")}
      </p>
    </div>

    <Tabs defaultValue="appearance">
      <TabsList className="no-scrollbar flex h-auto w-full justify-start overflow-x-auto bg-muted/70 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <AppearanceSettings />
      <WorkspaceSettings />
      <EntryQueueSettings />
      <ProductDefaultsSettings />
    </Tabs>

    <YaxiiEcosystem />
    <SettingsReset />
  </div>
);

export default Settings;
