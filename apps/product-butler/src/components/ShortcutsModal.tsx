import { Command, Keyboard, Navigation, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePrefsStore } from "@/stores/prefsStore";
import { __, _x } from "@/production/core/i18n/wordpress";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
const modifier = isMac ? "⌘" : "Ctrl";

const groups = [
  {
    group: __("Product entry", "yaxii-product-workspace"),
    icon: PenLine,
    items: [
      { keys: [modifier, "↵"], label: __("Validate and save current draft", "yaxii-product-workspace") },
      { keys: [modifier, "S"], label: __("Save draft", "yaxii-product-workspace") },
      { keys: [modifier, "D"], label: __("Duplicate last product", "yaxii-product-workspace") },
      { keys: ["Esc"], label: __("Clear current draft", "yaxii-product-workspace") },
    ],
  },
  {
    group: __("Navigation", "yaxii-product-workspace"),
    icon: Navigation,
    items: [
      { keys: ["G", "E"], label: __("Entry workspace", "yaxii-product-workspace") },
      { keys: ["G", "P"], label: __("Settings & preferences", "yaxii-product-workspace") },
    ],
  },
  {
    group: _x("Workspace", "Keyboard shortcut group", "yaxii-product-workspace"),
    icon: Command,
    items: [
      { keys: [modifier, "K"], label: __("Open command menu", "yaxii-product-workspace") },
      { keys: ["?"], label: __("Show this panel", "yaxii-product-workspace") },
      { keys: [modifier, "Z"], label: __("Undo last delete", "yaxii-product-workspace") },
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
              <DialogTitle className="text-[15px]">{__("Keyboard shortcuts", "yaxii-product-workspace")}</DialogTitle>
              <p className="text-xs text-muted-foreground">{__("Every shortcut below is live in this workspace.", "yaxii-product-workspace")}</p>
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
                      <span className="flex shrink-0 gap-1" dir="ltr">
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
          <span>{__("Shortcuts pause while you type in a field, except save and submit.", "yaxii-product-workspace")}</span>
          <span className="hidden sm:inline">
            {__("Hide inline hints in", "yaxii-product-workspace")} <span className="font-medium text-foreground">{__("Settings → Workspace", "yaxii-product-workspace")}</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
