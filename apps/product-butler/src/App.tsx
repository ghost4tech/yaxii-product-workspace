import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Entry from './pages/Entry';
import Analytics from './pages/Analytics';
import Stores from './pages/Stores';
import Team from './pages/Team';
import License from './pages/License';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { AppShell } from '@/components/AppShell';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { CommandMenu } from '@/components/CommandMenu';
import { PreferencesEffects } from '@/components/PreferencesEffects';
import { useTierStore } from '@/stores/tierStore';
import { useProductStore } from '@/stores/productStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { clearDraft, duplicateLastProduct, saveDraft } from '@/lib/entryActions';
import { toast } from '@/hooks/use-toast';

const queryClient = new QueryClient();

/** Redirects to the user's preferred landing tab on first load. */
function LandingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = usePrefsStore((s) => s.prefs.defaultTab);

  useEffect(() => {
    if (location.pathname === '/' && defaultTab !== '/') navigate(defaultTab, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function GlobalHotkeys() {
  const navigate = useNavigate();
  const { setShortcutsOpen, tier, setTier, openUpgradeModal } = useTierStore();
  const setCommandOpen = usePrefsStore((s) => s.setCommandOpen);
  const { lastDeletedProduct, addProduct, setLastDeletedProduct } = useProductStore();

  useEffect(() => {
    let lastG = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // --- Modifier shortcuts (work everywhere, including inputs) ---
      if (mod && key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (mod && key === 's') {
        e.preventDefault();
        saveDraft();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        duplicateLastProduct();
        navigate('/');
        return;
      }
      if (mod && key === 'b') {
        e.preventDefault();
        const next = tier === 'pro' ? 'free' : 'pro';
        setTier(next);
        toast({ title: `${next === 'pro' ? 'Pro' : 'Free'} plan preview` });
        return;
      }
      if (mod && key === 'z' && !inField) {
        if (lastDeletedProduct) {
          e.preventDefault();
          addProduct(lastDeletedProduct);
          setLastDeletedProduct(null);
          toast({ title: 'Restored', description: lastDeletedProduct.name });
        }
        return;
      }

      if (inField) return;

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        clearDraft();
        return;
      }

      // g-then-letter navigation
      if (key === 'g') {
        lastG = Date.now();
        return;
      }
      if (Date.now() - lastG < 800) {
        const map: Record<string, string> = {
          e: '/',
          q: '/',
          a: '/analytics',
          s: '/stores',
          t: '/team',
          l: '/license',
          p: '/settings',
        };
        const path = map[key];
        if (path) {
          e.preventDefault();
          if ((path === '/analytics' || path === '/stores' || path === '/team') && tier !== 'pro') {
            openUpgradeModal(
              path === '/analytics' ? 'analytics' : path === '/stores' ? 'multi_store' : 'team'
            );
          } else {
            navigate(path);
          }
          lastG = 0;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    navigate,
    setShortcutsOpen,
    setCommandOpen,
    tier,
    setTier,
    lastDeletedProduct,
    addProduct,
    setLastDeletedProduct,
    openUpgradeModal,
  ]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PreferencesEffects />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LandingRedirect />
        <GlobalHotkeys />
        <AppShell>
          <Routes>
            <Route path="/" element={<Entry />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/team" element={<Team />} />
            <Route path="/license" element={<License />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
        <UpgradeModal />
        <ShortcutsModal />
        <CommandMenu />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
