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
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { __, _x } from "@/production/core/i18n/wordpress";

export function CommandMenu() {
  const navigate = useNavigate();
  const { client } = useWorkspaceRuntime();
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
      <CommandInput placeholder={__("Search actions, pages and preferences…", "yaxii-product-workspace")} />
      <CommandList>
        <CommandEmpty>{__("No results.", "yaxii-product-workspace")}</CommandEmpty>

        <CommandGroup heading={_x("Entry", "Command menu group", "yaxii-product-workspace")}>
          <CommandItem onSelect={() => run(saveDraft)}>
            <Save className="me-2 h-4 w-4" /> {__("Save draft", "yaxii-product-workspace")}
            <CommandShortcut>Ctrl S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => void duplicateLastProduct(client))}>
            <Copy className="me-2 h-4 w-4" /> {__("Duplicate last product", "yaxii-product-workspace")}
            <CommandShortcut>Ctrl D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(clearDraft)}>
            <Eraser className="me-2 h-4 w-4" /> {__("Clear current draft", "yaxii-product-workspace")}
            <CommandShortcut>Esc</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={__("Go to", "yaxii-product-workspace")}>
          <CommandItem onSelect={() => run(() => void navigate("/"))}>
            <LayoutGrid className="me-2 h-4 w-4" /> {__("Entry workspace", "yaxii-product-workspace")}
          </CommandItem>
          <CommandItem onSelect={() => run(() => void navigate("/settings"))}>
            <Settings className="me-2 h-4 w-4" /> {__("Settings & preferences", "yaxii-product-workspace")}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={__("Preferences", "yaxii-product-workspace")}>
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
            {prefs.theme === "dark" ? __("Switch to light theme", "yaxii-product-workspace") : __("Switch to dark theme", "yaxii-product-workspace")}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                setPref("density", prefs.density === "compact" ? "comfortable" : "compact"),
              )
            }
          >
            <Rows3 className="me-2 h-4 w-4" />
            {prefs.density === "compact" ? __("Comfortable density", "yaxii-product-workspace") : __("Compact density", "yaxii-product-workspace")}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setShortcutsOpen(true))}>
            <Settings className="me-2 h-4 w-4" /> {__("Keyboard shortcuts", "yaxii-product-workspace")}
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
