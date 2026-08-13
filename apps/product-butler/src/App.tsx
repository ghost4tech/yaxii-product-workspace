import { useEffect } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { CommandMenu } from "@/components/CommandMenu";
import { PreferencesEffects } from "@/components/PreferencesEffects";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { clearDraft, duplicateLastProduct, saveDraft } from "@/lib/entryActions";
import Entry from "@/pages/Entry";
import Settings from "@/pages/Settings";
import { usePrefsStore } from "@/stores/prefsStore";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";

function LandingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = usePrefsStore((state) => state.prefs.defaultTab);

  useEffect(() => {
    if (location.pathname === "/" && defaultTab === "/settings") {
      void navigate(defaultTab, { replace: true });
    }
  }, [defaultTab, location.pathname, navigate]);

  return null;
}

function GlobalHotkeys() {
  const navigate = useNavigate();
  const setCommandOpen = usePrefsStore((state) => state.setCommandOpen);
  const setShortcutsOpen = usePrefsStore((state) => state.setShortcutsOpen);
  const { client } = useWorkspaceRuntime();

  useEffect(() => {
    let lastG = 0;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inField =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (modifier && key === "s") {
        event.preventDefault();
        saveDraft();
        return;
      }
      if (modifier && key === "d") {
        event.preventDefault();
        void duplicateLastProduct(client);
        void navigate("/");
        return;
      }
      if (inField) {
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (event.key === "Escape") {
        clearDraft();
        return;
      }
      if (key === "g") {
        lastG = Date.now();
        return;
      }
      if (Date.now() - lastG < 800) {
        const path = key === "p" ? "/settings" : key === "e" || key === "q" ? "/" : null;
        if (path) {
          event.preventDefault();
          void navigate(path);
        }
        lastG = 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [client, navigate, setCommandOpen, setShortcutsOpen]);

  return null;
}

export default function App() {
  return (
    <TooltipProvider>
      <PreferencesEffects />
      <Toaster />
      <MemoryRouter>
        <LandingRedirect />
        <GlobalHotkeys />
        <AppShell>
          <Routes>
            <Route path="/" element={<Entry />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Entry />} />
          </Routes>
        </AppShell>
        <ShortcutsModal />
        <CommandMenu />
      </MemoryRouter>
    </TooltipProvider>
  );
}
