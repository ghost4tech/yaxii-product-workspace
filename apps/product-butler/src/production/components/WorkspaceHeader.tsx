import { Command, Focus, Moon, Package, Rows3, SlidersHorizontal, Sun } from "lucide-react";
import type { Translate } from "../core/i18n/messages";
import type { Density, Theme } from "../features/preferences/preferencesStore";

export type WorkspaceSection = "entry" | "preferences";

interface WorkspaceHeaderProps {
  activeSection: WorkspaceSection;
  density: Density;
  focusMode: boolean;
  onCommandOpen: () => void;
  onDensityToggle: () => void;
  onFocusToggle: () => void;
  onNavigate: (section: WorkspaceSection) => void;
  onThemeToggle: () => void;
  t: Translate;
  theme: Theme;
}

export function WorkspaceHeader(props: WorkspaceHeaderProps) {
  const themeLabel = props.theme === "dark" ? props.t("dark") : props.theme === "light" ? props.t("light") : props.t("system");

  return (
    <header className="ypw-header">
      <div className="ypw-header__identity">
        <span className="ypw-brand-mark" aria-hidden="true">
          <Package size={17} />
        </span>
        <div>
          <strong>{props.t("brandName")}</strong>
          <span>{props.t("currentStore")}</span>
        </div>
      </div>

      <nav aria-label={props.t("workspaceSections")} className="ypw-navigation">
        <button
          aria-current={props.activeSection === "entry" ? "page" : undefined}
          onClick={() => props.onNavigate("entry")}
          type="button"
        >
          <Package aria-hidden="true" size={15} /> {props.t("entry")}
        </button>
        <button
          aria-current={props.activeSection === "preferences" ? "page" : undefined}
          onClick={() => props.onNavigate("preferences")}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={15} /> {props.t("preferences")}
        </button>
      </nav>

      <div className="ypw-header__actions">
        <button className="ypw-icon-button" onClick={props.onThemeToggle} title={`${props.t("theme")}: ${themeLabel}`} type="button">
          {props.theme === "dark" ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
          <span className="ypw-visually-hidden">{props.t("theme")}: {themeLabel}</span>
        </button>
        <button className="ypw-icon-button" onClick={props.onDensityToggle} title={props.t("density")} type="button">
          <Rows3 aria-hidden="true" size={17} />
          <span className="ypw-visually-hidden">{props.t("density")}: {props.t(props.density)}</span>
        </button>
        <button
          aria-pressed={props.focusMode}
          className="ypw-icon-button"
          onClick={props.onFocusToggle}
          title={props.t("focusMode")}
          type="button"
        >
          <Focus aria-hidden="true" size={17} />
          <span className="ypw-visually-hidden">{props.t("focusMode")}</span>
        </button>
        <button
          aria-label={props.t("openCommands")}
          className="ypw-command-button"
          onClick={props.onCommandOpen}
          type="button"
        >
          <Command aria-hidden="true" size={16} />
          <span>{props.t("openCommands")}</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>
    </header>
  );
}
