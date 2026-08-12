import { useEffect } from "react";
import type { WorkspaceSection } from "../../components/WorkspaceHeader";

interface HotkeyActions {
  commandOpen: () => void;
  navigate: (section: WorkspaceSection) => void;
  shortcutsOpen: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable)
  );
}

export function useWorkspaceHotkeys(actions: HotkeyActions) {
  useEffect(() => {
    let lastNavigationKey = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        actions.commandOpen();
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        actions.shortcutsOpen();
      } else if (key === "g") {
        lastNavigationKey = Date.now();
      } else if (Date.now() - lastNavigationKey < 800 && (key === "e" || key === "p")) {
        event.preventDefault();
        actions.navigate(key === "e" ? "entry" : "preferences");
        lastNavigationKey = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions]);
}
