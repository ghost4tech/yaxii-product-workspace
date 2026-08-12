import { Focus, Keyboard, LayoutGrid, Rows3, Settings, Sun, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { DialogFrame } from "../../components/DialogFrame";
import type { WorkspaceSection } from "../../components/WorkspaceHeader";
import type { Translate } from "../../core/i18n/messages";
import {
  usePreferencesStore,
  type Density,
  type Theme,
} from "../preferences/preferencesStore";

interface CommandMenuProps {
  onClose: () => void;
  onNavigate: (section: WorkspaceSection) => void;
  onShortcutsOpen: () => void;
  open: boolean;
  portalRoot: HTMLElement;
  t: Translate;
}

interface CommandAction {
  icon: LucideIcon;
  keywords: string;
  label: string;
  run: () => void;
}

function nextTheme(theme: Theme): Theme {
  return theme === "system" ? "light" : theme === "light" ? "dark" : "system";
}

function nextDensity(density: Density): Density {
  return density === "compact" ? "comfortable" : "compact";
}

export function CommandMenu(props: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const { preferences, setDensity, setFocusMode, setTheme } = usePreferencesStore();
  const actions: readonly CommandAction[] = [
    {
      icon: LayoutGrid,
      keywords: "entry product form",
      label: props.t("commandActionEntry"),
      run: () => props.onNavigate("entry"),
    },
    {
      icon: Settings,
      keywords: "preferences settings",
      label: props.t("commandActionPreferences"),
      run: () => props.onNavigate("preferences"),
    },
    {
      icon: Sun,
      keywords: "theme light dark system",
      label: props.t("commandCycleTheme", { value: props.t(preferences.theme) }),
      run: () => setTheme(nextTheme(preferences.theme)),
    },
    {
      icon: Rows3,
      keywords: "density compact comfortable",
      label: props.t("commandUseDensity", { value: props.t(nextDensity(preferences.density)) }),
      run: () => setDensity(nextDensity(preferences.density)),
    },
    {
      icon: Focus,
      keywords: "focus mode queue",
      label: props.t(preferences.focusMode ? "commandDisableFocus" : "commandEnableFocus"),
      run: () => setFocusMode(!preferences.focusMode),
    },
    {
      icon: Keyboard,
      keywords: "keyboard shortcuts help",
      label: props.t("commandActionShortcuts"),
      run: props.onShortcutsOpen,
    },
  ];

  const filtered = actions.filter((action) =>
    `${action.label} ${action.keywords}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const close = () => {
    setQuery("");
    props.onClose();
  };
  const run = (action: CommandAction) => {
    close();
    action.run();
  };

  return (
    <DialogFrame
      closeLabel={props.t("closeDialog")}
      description={props.t("commandDescription")}
      onClose={close}
      open={props.open}
      portalRoot={props.portalRoot}
      title={props.t("commandMenu")}
    >
      <label className="ypw-command-search">
        <span className="ypw-visually-hidden">{props.t("commandSearchLabel")}</span>
        <input
          autoComplete="off"
          data-dialog-initial-focus
          onChange={(event) => setQuery(event.target.value)}
          placeholder={props.t("commandSearchPlaceholder")}
          value={query}
        />
      </label>
      <div className="ypw-command-list">
        {filtered.length === 0 ? <p className="ypw-command-empty">{props.t("noMatchingCommands")}</p> : null}
        {filtered.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} onClick={() => run(action)} type="button">
              <Icon aria-hidden="true" size={17} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </DialogFrame>
  );
}
