import { useEffect, useMemo, useState } from "react";
import { DialogFrame } from "../components/DialogFrame";
import { ToastRegion } from "../components/ToastRegion";
import { WorkspaceHeader, type WorkspaceSection } from "../components/WorkspaceHeader";
import { createFormatters } from "../core/i18n/formatters";
import { createTranslator } from "../core/i18n/messages";
import type { WorkspaceSnapshot } from "../domain/workspace";
import { CommandMenu } from "../features/command/CommandMenu";
import { ShortcutsDialog } from "../features/command/ShortcutsDialog";
import { useWorkspaceHotkeys } from "../features/command/useWorkspaceHotkeys";
import { EntryWorkspace } from "../features/entry/EntryWorkspace";
import { PreferencesPanel } from "../features/preferences/PreferencesPanel";
import {
  usePreferencesStore,
  type Density,
  type Theme,
} from "../features/preferences/preferencesStore";
import { useRootPreferences } from "../features/preferences/useRootPreferences";
import { QueuePanel } from "../features/queue/QueuePanel";

interface WorkspaceRootProps {
  portalRoot: HTMLElement;
  scope: HTMLElement;
  snapshot: WorkspaceSnapshot;
}

function nextTheme(theme: Theme): Theme {
  return theme === "system" ? "light" : theme === "light" ? "dark" : "system";
}

function nextDensity(density: Density): Density {
  return density === "comfortable" ? "compact" : "comfortable";
}

export function WorkspaceRoot({ portalRoot, scope, snapshot }: WorkspaceRootProps) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("entry");
  const [commandOpen, setCommandOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { preferences, setDensity, setFocusMode, setTheme } = usePreferencesStore();
  const formatters = useMemo(() => createFormatters(snapshot.bootstrap.locale), [snapshot.bootstrap.locale]);
  const t = useMemo(() => createTranslator(snapshot.bootstrap.locale), [snapshot.bootstrap.locale]);

  useRootPreferences(scope, preferences);

  const hotkeyActions = useMemo(
    () => ({
      commandOpen: () => setCommandOpen(true),
      navigate: (section: WorkspaceSection) => setActiveSection(section),
      shortcutsOpen: () => setShortcutsOpen(true),
    }),
    [],
  );
  useWorkspaceHotkeys(hotkeyActions);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const toggleTheme = () => {
    const next = nextTheme(preferences.theme);
    setTheme(next);
    setToast(`Theme set to ${next}.`);
  };
  const toggleDensity = () => {
    const next = nextDensity(preferences.density);
    setDensity(next);
    setToast(`Density set to ${next}.`);
  };
  const toggleFocus = () => {
    const next = !preferences.focusMode;
    setFocusMode(next);
    setToast(`Focus Mode ${next ? "enabled" : "disabled"}.`);
  };

  return (
    <div className={`ypw-app${preferences.focusMode ? " ypw-app--focus" : ""}`}>
      {snapshot.bootstrap.environment === "development" ? (
        <div className="ypw-development-banner">Development fixture mode — no WooCommerce store data.</div>
      ) : null}
      <WorkspaceHeader
        activeSection={activeSection}
        density={preferences.density}
        focusMode={preferences.focusMode}
        onCommandOpen={() => setCommandOpen(true)}
        onDensityToggle={toggleDensity}
        onFocusToggle={toggleFocus}
        onNavigate={setActiveSection}
        onThemeToggle={toggleTheme}
        t={t}
        theme={preferences.theme}
      />

      {activeSection === "entry" ? (
        <EntryWorkspace
          focusMode={preferences.focusMode}
          formatters={formatters}
          onFocusToggle={toggleFocus}
          onQueueOpen={() => setQueueOpen(true)}
          snapshot={snapshot}
        />
      ) : (
        <PreferencesPanel
          direction={snapshot.bootstrap.direction}
          formatters={formatters}
          locale={snapshot.bootstrap.locale}
          t={t}
        />
      )}

      <CommandMenu
        onClose={() => setCommandOpen(false)}
        onNavigate={setActiveSection}
        onShortcutsOpen={() => setShortcutsOpen(true)}
        open={commandOpen}
        portalRoot={portalRoot}
        t={t}
      />
      <ShortcutsDialog
        onClose={() => setShortcutsOpen(false)}
        open={shortcutsOpen}
        portalRoot={portalRoot}
      />
      <DialogFrame
        description="Server-authoritative product operations will appear here after Phase 2."
        onClose={() => setQueueOpen(false)}
        open={queueOpen}
        portalRoot={portalRoot}
        title="Operation queue"
      >
        <QueuePanel formatters={formatters} operations={snapshot.operations} />
      </DialogFrame>
      <ToastRegion message={toast} portalRoot={portalRoot} />
    </div>
  );
}
