import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTierStore } from '@/stores/tierStore';
import { Command, Keyboard, Navigation, PenLine } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS: {
  group: string;
  icon: typeof PenLine;
  items: { keys: string[]; label: string }[];
}[] = [
  {
    group: 'Product entry',
    icon: PenLine,
    items: [
      { keys: [MOD, '⏎'], label: 'Save product & start next' },
      { keys: [MOD, 'S'], label: 'Save draft' },
      { keys: [MOD, 'D'], label: 'Duplicate last product' },
      { keys: ['Esc'], label: 'Clear current draft' },
    ],
  },
  {
    group: 'Navigation',
    icon: Navigation,
    items: [
      { keys: ['G', 'E'], label: 'Entry workspace' },
      { keys: ['G', 'A'], label: 'Analytics' },
      { keys: ['G', 'S'], label: 'Stores' },
      { keys: ['G', 'P'], label: 'Settings & preferences' },
    ],
  },
  {
    group: 'Workspace',
    icon: Command,
    items: [
      { keys: [MOD, 'K'], label: 'Open command menu' },
      { keys: ['?'], label: 'Show this panel' },
      { keys: [MOD, 'Z'], label: 'Undo last delete' },
      { keys: [MOD, 'B'], label: 'Toggle Free / Pro preview' },
    ],
  },
];

export function ShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useTierStore();
  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md border border-border bg-muted/60 flex items-center justify-center">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-[15px]">Keyboard shortcuts</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Every shortcut below is live in this workspace.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {SHORTCUTS.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.group} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="label-eyebrow">{g.group}</h3>
                </div>
                <ul className="space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-foreground/90 leading-snug">{item.label}</span>
                      <span className="flex gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd key={k} className="kbd">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Shortcuts pause while you type in a field, except save & submit.</span>
          <span className="hidden sm:inline">
            Hide inline hints in <span className="font-medium text-foreground">Settings → Workspace</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
