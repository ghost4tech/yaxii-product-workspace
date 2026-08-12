import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  BarChart3,
  Copy,
  Eraser,
  KeyRound,
  LayoutGrid,
  Moon,
  Rows3,
  Save,
  Settings,
  Sparkles,
  Store,
  Sun,
  Users,
} from 'lucide-react';
import { usePrefsStore } from '@/stores/prefsStore';
import { useTierStore } from '@/stores/tierStore';
import { clearDraft, duplicateLastProduct, saveDraft } from '@/lib/entryActions';

export function CommandMenu() {
  const navigate = useNavigate();
  const { commandOpen, setCommandOpen, prefs, setPref } = usePrefsStore();
  const { tier, setTier, setShortcutsOpen, openUpgradeModal } = useTierStore();
  const isPro = tier === 'pro';

  const run = (fn: () => void) => {
    setCommandOpen(false);
    setTimeout(fn, 0);
  };

  const go = (path: string, proFeature?: 'analytics' | 'multi_store' | 'team') => () => {
    if (proFeature && !isPro) openUpgradeModal(proFeature);
    else navigate(path);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search actions, pages and preferences…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Entry">
          <CommandItem onSelect={() => run(saveDraft)}>
            <Save className="mr-2 h-4 w-4" /> Save draft
            <CommandShortcut>Ctrl S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(duplicateLastProduct)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate last product
            <CommandShortcut>Ctrl D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(clearDraft)}>
            <Eraser className="mr-2 h-4 w-4" /> Clear current draft
            <CommandShortcut>Esc</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => run(go('/'))}>
            <LayoutGrid className="mr-2 h-4 w-4" /> Entry workspace
          </CommandItem>
          <CommandItem onSelect={() => run(go('/analytics', 'analytics'))}>
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => run(go('/stores', 'multi_store'))}>
            <Store className="mr-2 h-4 w-4" /> Stores
          </CommandItem>
          <CommandItem onSelect={() => run(go('/team', 'team'))}>
            <Users className="mr-2 h-4 w-4" /> Team
          </CommandItem>
          <CommandItem onSelect={() => run(go('/license'))}>
            <KeyRound className="mr-2 h-4 w-4" /> License
          </CommandItem>
          <CommandItem onSelect={() => run(go('/settings'))}>
            <Settings className="mr-2 h-4 w-4" /> Settings & preferences
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() =>
              run(() => setPref('theme', prefs.theme === 'dark' ? 'light' : 'dark'))
            }
          >
            {prefs.theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Switch to {prefs.theme === 'dark' ? 'light' : 'dark'} theme
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                setPref('density', prefs.density === 'compact' ? 'comfortable' : 'compact')
              )
            }
          >
            <Rows3 className="mr-2 h-4 w-4" />
            {prefs.density === 'compact' ? 'Comfortable' : 'Compact'} density
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTier(isPro ? 'free' : 'pro'))}>
            <Sparkles className="mr-2 h-4 w-4" /> Preview {isPro ? 'Free' : 'Pro'} plan
            <CommandShortcut>Ctrl B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setShortcutsOpen(true))}>
            <Settings className="mr-2 h-4 w-4" /> Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
