import React from 'react';
import {
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Palette,
  Keyboard,
  ListOrdered,
  PackageCheck,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore, ACCENTS, AccentName, Preferences } from '@/stores/prefsStore';
import { AppSettings as AppSettingsType } from '@/types/product';
import { cn } from '@/lib/utils';

const Row: React.FC<{
  title: string;
  desc: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ title, desc, children, last }) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 px-4 sm:px-5 py-3.5',
      !last && 'border-b border-border'
    )}
  >
    <div className="min-w-0">
      <Label className="text-[13px] font-medium">{title}</Label>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
    </div>
    <div className="sm:shrink-0 sm:pt-0.5 min-w-0">{children}</div>
  </div>
);

const Panel: React.FC<{ title: string; desc: string; children: React.ReactNode }> = ({
  title,
  desc,
  children,
}) => (
  <section className="panel overflow-hidden">
    <header className="px-4 sm:px-5 py-3.5 border-b border-border bg-muted/25">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </header>
    <div>{children}</div>
  </section>
);

const Settings = () => {
  const { prefs, setPref, resetPrefs } = usePrefsStore();
  const { appSettings, setAppSettings, resetAppSettings } = useProductStore();

  const setSetting = <K extends keyof AppSettingsType>(key: K, value: AppSettingsType[K]) =>
    setAppSettings({ [key]: value } as Partial<AppSettingsType>);

  const toggle = (key: keyof Preferences) => (v: boolean) => setPref(key, v as never);

  const themes: { value: Preferences['theme']; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-4xl min-w-0">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance, workflow behaviour and WooCommerce defaults. Changes save instantly.
        </p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/70 flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="appearance" className="text-xs gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="workspace" className="text-xs gap-1.5">
            <Keyboard className="h-3.5 w-3.5" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs gap-1.5">
            <ListOrdered className="h-3.5 w-3.5" /> Entry & queue
          </TabsTrigger>
          <TabsTrigger value="defaults" className="text-xs gap-1.5">
            <PackageCheck className="h-3.5 w-3.5" /> Product defaults
          </TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Panel title="Theme & density" desc="How the workspace looks on this device.">
            <Row title="Theme" desc="Follow the system setting or lock one in.">
              <div className="seg">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPref('theme', t.value)}
                    data-active={prefs.theme === t.value}
                    className="seg-item"
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Density" desc="Compact fits noticeably more rows on screen.">
              <div className="seg">
                {(['comfortable', 'compact'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setPref('density', d)}
                    data-active={prefs.density === d}
                    className="seg-item capitalize"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Accent colour" desc="Used for primary buttons and active states.">
              <div className="flex items-center gap-2">
                {(Object.keys(ACCENTS) as AccentName[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setPref('accent', a)}
                    title={ACCENTS[a].label}
                    className={cn(
                      'w-7 h-7 rounded-md border transition',
                      prefs.accent === a
                        ? 'border-foreground ring-2 ring-ring/20'
                        : 'border-border hover:border-foreground/40'
                    )}
                    style={{ background: ACCENTS[a].swatch }}
                  />
                ))}
              </div>
            </Row>
            <Row
              title="Reduce motion"
              desc="Minimises animations and transitions across the app."
              last
            >
              <Switch checked={prefs.reduceMotion} onCheckedChange={toggle('reduceMotion')} />
            </Row>
          </Panel>
        </TabsContent>

        {/* Workspace */}
        <TabsContent value="workspace" className="mt-4 space-y-4">
          <Panel title="Workspace behaviour" desc="Navigation and on-screen guidance.">
            <Row title="Landing tab" desc="Where the app opens by default.">
              <Select
                value={prefs.defaultTab}
                onValueChange={(v) => setPref('defaultTab', v as Preferences['defaultTab'])}
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/">Entry workspace</SelectItem>
                  <SelectItem value="/analytics">Analytics</SelectItem>
                  <SelectItem value="/stores">Stores</SelectItem>
                  <SelectItem value="/license">License</SelectItem>
                  <SelectItem value="/settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title="Inline keyboard hints" desc="Show key badges on buttons and footers.">
              <Switch
                checked={prefs.showKeyboardHints}
                onCheckedChange={toggle('showKeyboardHints')}
              />
            </Row>
            <Row title="KPI trends" desc="Show sparklines and deltas on the metric strip.">
              <Switch checked={prefs.showKpiTrends} onCheckedChange={toggle('showKpiTrends')} />
            </Row>
            <Row
              title="Sticky queue panel"
              desc="Keeps the queue in view while you scroll the form."
              last
            >
              <Switch checked={prefs.stickyQueue} onCheckedChange={toggle('stickyQueue')} />
            </Row>
          </Panel>

          <Panel title="Focus mode" desc="Distraction-free product entry. Remembered between sessions.">
            <Row title="Start in focus mode" desc="Hide navigation and metrics when the workspace opens.">
              <Switch checked={prefs.focusMode} onCheckedChange={toggle('focusMode')} />
            </Row>
            <Row
              title="Keep the queue in focus mode"
              desc="Show recent products beside the form while focused."
              last
            >
              <Switch
                checked={prefs.focusModeShowQueue}
                onCheckedChange={toggle('focusModeShowQueue')}
              />
            </Row>
          </Panel>
        </TabsContent>

        {/* Entry & queue */}
        <TabsContent value="queue" className="mt-4 space-y-4">
          <Panel title="Entry flow" desc="Optimised for fast, repetitive data entry.">
            <Row title="Auto-focus product name" desc="Cursor lands in the name field on load.">
              <Switch checked={prefs.autoFocusName} onCheckedChange={toggle('autoFocusName')} />
            </Row>
            <Row
              title="Keep values after save"
              desc="Retain category, price and stock for the next product."
            >
              <Switch
                checked={prefs.keepValuesAfterSave}
                onCheckedChange={toggle('keepValuesAfterSave')}
              />
            </Row>
            <Row title="Confirm before delete" desc="Ask before removing a queued product." last>
              <Switch
                checked={prefs.confirmBeforeDelete}
                onCheckedChange={toggle('confirmBeforeDelete')}
              />
            </Row>
          </Panel>

          <Panel title="Queue display" desc="How queued products are grouped and listed.">
            <Row title="Group by day" desc="Adds date headers between queue rows.">
              <Switch checked={prefs.queueGroupByDay} onCheckedChange={toggle('queueGroupByDay')} />
            </Row>
            <Row title="Relative timestamps" desc="“3 hours ago” instead of a fixed date.">
              <Switch
                checked={prefs.relativeTimestamps}
                onCheckedChange={toggle('relativeTimestamps')}
              />
            </Row>
            <Row title="Rows per page" desc="Longer lists load more rows before paging." last>
              <Select
                value={String(prefs.queueRowsPerPage)}
                onValueChange={(v) => setPref('queueRowsPerPage', Number(v))}
              >
                <SelectTrigger className="w-full sm:w-[110px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </Panel>
        </TabsContent>

        {/* Product defaults */}
        <TabsContent value="defaults" className="mt-4 space-y-4">
          <Panel title="WooCommerce defaults" desc="Applied to every new product and variation.">
            <Row title="Stock status" desc="Default availability for new items.">
              <Select
                value={appSettings.defaultStockStatus}
                onValueChange={(v) =>
                  setSetting('defaultStockStatus', v as AppSettingsType['defaultStockStatus'])
                }
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instock">In stock</SelectItem>
                  <SelectItem value="outofstock">Out of stock</SelectItem>
                  <SelectItem value="onbackorder">On backorder</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title="Product status" desc="Publish state used when syncing.">
              <Select
                value={appSettings.defaultProductStatus}
                onValueChange={(v) =>
                  setSetting('defaultProductStatus', v as AppSettingsType['defaultProductStatus'])
                }
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending review</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title="Catalog visibility" desc="Where products appear in the storefront.">
              <Select
                value={appSettings.defaultCatalogVisibility}
                onValueChange={(v) =>
                  setSetting(
                    'defaultCatalogVisibility',
                    v as AppSettingsType['defaultCatalogVisibility']
                  )
                }
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Shop & search</SelectItem>
                  <SelectItem value="catalog">Shop only</SelectItem>
                  <SelectItem value="search">Search only</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title="Tax status" desc="Tax treatment for new products.">
              <Select
                value={appSettings.defaultTaxStatus}
                onValueChange={(v) =>
                  setSetting('defaultTaxStatus', v as AppSettingsType['defaultTaxStatus'])
                }
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="taxable">Taxable</SelectItem>
                  <SelectItem value="shipping">Shipping only</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title="Stock management" desc="Track inventory levels by default.">
              <Switch
                checked={appSettings.enableManageStock}
                onCheckedChange={(v) => setSetting('enableManageStock', v)}
              />
            </Row>
            <Row
              title="Auto-generate variations"
              desc="Create WooCommerce variations from attributes automatically."
              last
            >
              <Switch
                checked={appSettings.autoGenerateVariations}
                onCheckedChange={(v) => setSetting('autoGenerateVariations', v)}
              />
            </Row>
          </Panel>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 panel px-4 sm:px-5 py-4">
        <div>
          <p className="text-[13px] font-medium">Reset to defaults</p>
          <p className="text-xs text-muted-foreground">
            Restores preferences and product defaults. Your products stay untouched.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetPrefs}>
            <RotateCcw className="h-3.5 w-3.5 me-1.5" /> Preferences
          </Button>
          <Button variant="outline" size="sm" onClick={resetAppSettings}>
            <RotateCcw className="h-3.5 w-3.5 me-1.5" /> Product defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
