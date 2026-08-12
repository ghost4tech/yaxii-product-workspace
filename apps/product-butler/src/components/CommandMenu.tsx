import { Copy, Eraser, LayoutGrid, Moon, Rows3, Save, Settings, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { clearDraft, duplicateLastProduct, saveDraft } from "@/lib/entryActions";
import { usePrefsStore } from "@/stores/prefsStore";

export function CommandMenu() {
  const navigate = useNavigate();
  const {
    commandOpen,
    prefs,
    setCommandOpen,
    setPref,
    setShortcutsOpen,
  } = usePrefsStore();

  const run = (action: () => void) => {
    setCommandOpen(false);
    window.setTimeout(action, 0);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search actions, pages and preferences…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Entry">
          <CommandItem onSelect={() => run(saveDraft)}>
            <Save className="me-2 h-4 w-4" /> Save draft
            <CommandShortcut>Ctrl S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(duplicateLastProduct)}>
            <Copy className="me-2 h-4 w-4" /> Duplicate last product
            <CommandShortcut>Ctrl D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(clearDraft)}>
            <Eraser className="me-2 h-4 w-4" /> Clear current draft
            <CommandShortcut>Esc</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => run(() => void navigate("/"))}>
            <LayoutGrid className="me-2 h-4 w-4" /> Entry workspace
          </CommandItem>
          <CommandItem onSelect={() => run(() => void navigate("/settings"))}>
            <Settings className="me-2 h-4 w-4" /> Settings & preferences
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() =>
              run(() => setPref("theme", prefs.theme === "dark" ? "light" : "dark"))
            }
          >
            {prefs.theme === "dark" ? (
              <Sun className="me-2 h-4 w-4" />
            ) : (
              <Moon className="me-2 h-4 w-4" />
            )}
            Switch to {prefs.theme === "dark" ? "light" : "dark"} theme
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                setPref("density", prefs.density === "compact" ? "comfortable" : "compact"),
              )
            }
          >
            <Rows3 className="me-2 h-4 w-4" />
            {prefs.density === "compact" ? "Comfortable" : "Compact"} density
          </CommandItem>
          <CommandItem onSelect={() => run(() => setShortcutsOpen(true))}>
            <Settings className="me-2 h-4 w-4" /> Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
