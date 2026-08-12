import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  LayoutGrid,
  BarChart3,
  Store,
  Users,
  KeyRound,
  SlidersHorizontal,
  Sparkles,
  Lock,
  Search,
} from 'lucide-react';
import { useTierStore } from '@/stores/tierStore';
import { useStoresStore } from '@/stores/storesStore';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { WooCommerceSetup } from '@/components/WooCommerceSetup';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: 'Entry', icon: LayoutGrid, pro: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, pro: true },
  { to: '/stores', label: 'Stores', icon: Store, pro: true },
  { to: '/team', label: 'Team', icon: Users, pro: true },
  { to: '/license', label: 'License', icon: KeyRound, pro: false },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal, pro: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { tier, setTier, openUpgradeModal } = useTierStore();
  const { stores, activeStoreId, setActiveStore } = useStoresStore();
  const wooConfig = useProductStore((s) => s.wooConfig);
  const setCommandOpen = usePrefsStore((s) => s.setCommandOpen);
  const showHints = usePrefsStore((s) => s.prefs.showKeyboardHints);
  const focusMode = usePrefsStore((s) => s.prefs.focusMode);
  const connected = !!wooConfig?.connected;
  const isPro = tier === 'pro';

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? stores[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Package className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-[13px] font-semibold leading-tight truncate">
                Woo Bulk Entry
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                {isPro ? 'Pro workspace' : 'Free workspace'}
              </div>
            </div>

            {isPro && activeStore && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 hidden md:flex items-center gap-2 px-2.5 h-8 rounded-md border border-border bg-card hover:bg-muted transition text-xs font-medium">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: activeStore.color }}
                    />
                    {activeStore.name}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel className="label-eyebrow">Switch store</DropdownMenuLabel>
                  {stores.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setActiveStore(s.id)}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="font-medium flex-1">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {s.productCount}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/stores" className="text-xs">Manage stores →</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isPro && (
              <button
                onClick={() => openUpgradeModal('multi_store')}
                className="ml-1 hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
              >
                <Lock className="h-3 w-3" /> Single store
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search or jump to…</span>
              {showHints && <kbd className="kbd ml-6">Ctrl K</kbd>}
            </button>

            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-md bg-muted/70 border border-border/70 text-[11px] font-medium">
              <button
                onClick={() => setTier('free')}
                className={cn(
                  'px-2.5 h-7 rounded-[5px] transition',
                  !isPro ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Free
              </button>
              <button
                onClick={() => setTier('pro')}
                className={cn(
                  'px-2.5 h-7 rounded-[5px] transition flex items-center gap-1',
                  isPro ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="h-3 w-3" /> Pro
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border text-[11px] font-medium text-muted-foreground">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  connected ? 'bg-success' : 'bg-muted-foreground/40'
                )}
              />
              {connected ? 'Connected' : 'Offline'}
            </div>

            <WooCommerceSetup />
          </div>
        </div>

        {!focusMode && (
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 -mb-px flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = location.pathname === tab.to;
              const locked = tab.pro && !isPro;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault();
                      openUpgradeModal(
                        tab.to === '/analytics' ? 'analytics'
                        : tab.to === '/stores' ? 'multi_store'
                        : 'team'
                      );
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 h-9 text-[13px] font-medium border-b-2 transition whitespace-nowrap',
                    active
                      ? 'text-foreground border-foreground'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {locked && <Lock className="h-3 w-3 opacity-60" />}
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      <main className="workspace-canvas min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
