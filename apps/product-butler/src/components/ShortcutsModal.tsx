import { Command, Keyboard, Navigation, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePrefsStore } from "@/stores/prefsStore";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
const modifier = isMac ? "⌘" : "Ctrl";

const groups = [
  {
    group: "Product entry",
    icon: PenLine,
    items: [
      { keys: [modifier, "↵"], label: "Validate and save current draft" },
      { keys: [modifier, "S"], label: "Save draft" },
      { keys: [modifier, "D"], label: "Duplicate last product" },
      { keys: ["Esc"], label: "Clear current draft" },
    ],
  },
  {
    group: "Navigation",
    icon: Navigation,
    items: [
      { keys: ["G", "E"], label: "Entry workspace" },
      { keys: ["G", "P"], label: "Settings & preferences" },
    ],
  },
  {
    group: "Workspace",
    icon: Command,
    items: [
      { keys: [modifier, "K"], label: "Open command menu" },
      { keys: ["?"], label: "Show this panel" },
      { keys: [modifier, "Z"], label: "Undo last delete" },
    ],
  },
];

export function ShortcutsModal() {
  const shortcutsOpen = usePrefsStore((state) => state.shortcutsOpen);
  const setShortcutsOpen = usePrefsStore((state) => state.setShortcutsOpen);

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/60">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-[15px]">Keyboard shortcuts</DialogTitle>
              <p className="text-xs text-muted-foreground">Every shortcut below is live in this workspace.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.group} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="label-eyebrow">{group.group}</h3>
                </div>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] leading-snug text-foreground/90">{item.label}</span>
                      <span className="flex shrink-0 gap-1">
                        {item.keys.map((key) => (
                          <kbd key={key} className="kbd">{key}</kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground">
          <span>Shortcuts pause while you type in a field, except save & submit.</span>
          <span className="hidden sm:inline">
            Hide inline hints in <span className="font-medium text-foreground">Settings → Workspace</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
