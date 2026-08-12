import { useState } from 'react';
import { useTierStore } from '@/stores/tierStore';
import { useStoresStore } from '@/stores/storesStore';
import { ProLock } from '@/components/ProLock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, ExternalLink, Trash2, Check, Search, MoreHorizontal,
  Globe, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Stores = () => {
  const { tier } = useTierStore();
  const { stores, activeStoreId, setActiveStore, removeStore, addStore } = useStoresStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', url: '' });

  if (tier !== 'pro') return <ProLock feature="multi_store" />;

  const filtered = stores.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.url.includes(search)
  );

  const totalProducts = stores.reduce((sum, s) => sum + s.productCount, 0);
  const online = stores.filter((s) => s.status === 'online').length;

  const handleAdd = () => {
    if (!form.name || !form.url) {
      toast({ title: 'Missing info', description: 'Name and URL are required.', variant: 'destructive' });
      return;
    }
    const id = `store-${Date.now()}`;
    addStore({
      id,
      name: form.name,
      url: form.url.startsWith('http') ? form.url : `https://${form.url}`,
      productCount: 0,
      lastSync: 'never',
      status: 'offline',
      color: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][stores.length % 5],
    });
    setForm({ name: '', url: '' });
    setOpen(false);
    toast({ title: 'Store added', description: 'Connect API credentials to bring it online.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Stores</h1>
          <p className="text-sm text-muted-foreground">
            {stores.length} connected · {online} online · {totalProducts.toLocaleString()} products total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Connect store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect a new store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Store name</Label>
                <Input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="EU Warehouse"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-url">Store URL</Label>
                <Input
                  id="s-url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://shop.example.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You'll be prompted for WooCommerce API credentials after adding the store.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add store</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stores…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3">Store</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Products</th>
              <th className="text-left px-5 py-3">Last sync</th>
              <th className="text-right px-5 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const active = s.id === activeStoreId;
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center text-white font-semibold text-xs"
                        style={{ background: s.color }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          {active && (
                            <span className="text-[10px] font-semibold bg-foreground text-background px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono"
                        >
                          {s.url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        s.status === 'online' ? 'text-success' : 'text-muted-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          s.status === 'online' ? 'bg-success' : 'bg-muted-foreground/50'
                        )}
                      />
                      {s.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono">{s.productCount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{s.lastSync}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {!active && (
                        <Button variant="outline" size="sm" onClick={() => setActiveStore(s.id)}>
                          Switch
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({ title: 'Sync triggered', description: s.name })}>
                            <ShieldCheck className="h-4 w-4 mr-2" /> Test connection
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={s.url} target="_blank" rel="noreferrer">
                              <Globe className="h-4 w-4 mr-2" /> Open storefront
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => removeStore(s.id)}
                            disabled={stores.length === 1}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove store
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No stores match "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Health summary */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold">Connection health</h3>
            <p className="text-xs text-muted-foreground">Last checked just now</p>
          </div>
          <span className="text-[11px] font-semibold text-success flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> All systems normal
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Online', value: online, color: 'text-success' },
            { label: 'Offline', value: stores.length - online, color: 'text-muted-foreground' },
            { label: 'Median latency', value: '286ms', color: 'text-foreground' },
            { label: 'Failed today', value: '0', color: 'text-foreground' },
          ].map((s) => (
            <div key={s.label} className="border border-border rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {s.label}
              </div>
              <div className={cn('text-lg font-semibold font-mono mt-0.5', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stores;
