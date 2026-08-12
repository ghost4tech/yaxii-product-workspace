import { Languages, Moon, MoveHorizontal, Rows3, Sun, Waves } from "lucide-react";
import type { LocaleFormatters } from "../../core/i18n/formatters";
import type { Translate } from "../../core/i18n/messages";
import type { Direction } from "../../domain/workspace";
import {
  usePreferencesStore,
  type Density,
  type Theme,
} from "./preferencesStore";

interface PreferencesPanelProps {
  direction: Direction;
  formatters: LocaleFormatters;
  locale: string;
  t: Translate;
}

const THEMES: readonly Theme[] = ["light", "dark", "system"];
const DENSITIES: readonly Density[] = ["comfortable", "compact"];

export function PreferencesPanel({ direction, formatters, locale, t }: PreferencesPanelProps) {
  const { preferences, setDensity, setFocusMode, setReduceMotion, setTheme } = usePreferencesStore();

  return (
    <main className="ypw-main ypw-preferences" aria-labelledby="ypw-preferences-title">
      <header className="ypw-page-heading">
        <span className="ypw-eyebrow">Workspace setup</span>
        <h1 id="ypw-preferences-title">{t("preferences")}</h1>
        <p>These browser preferences affect only the plugin-owned workspace root.</p>
      </header>

      <div className="ypw-preferences-grid">
        <section className="ypw-panel ypw-preference-card">
          <header>
            <Sun aria-hidden="true" size={19} />
            <div><h2>{t("theme")}</h2><p>Light, dark, or your operating-system preference.</p></div>
          </header>
          <div className="ypw-segmented" aria-label={t("theme")}>
            {THEMES.map((theme) => (
              <button
                aria-pressed={preferences.theme === theme}
                key={theme}
                onClick={() => setTheme(theme)}
                type="button"
              >
                {theme === "dark" ? <Moon aria-hidden="true" size={15} /> : <Sun aria-hidden="true" size={15} />}
                {t(theme)}
              </button>
            ))}
          </div>
        </section>

        <section className="ypw-panel ypw-preference-card">
          <header>
            <Rows3 aria-hidden="true" size={19} />
            <div><h2>{t("density")}</h2><p>Adjust control and panel spacing without changing content.</p></div>
          </header>
          <div className="ypw-segmented" aria-label={t("density")}>
            {DENSITIES.map((density) => (
              <button
                aria-pressed={preferences.density === density}
                key={density}
                onClick={() => setDensity(density)}
                type="button"
              >
                {t(density)}
              </button>
            ))}
          </div>
        </section>

        <section className="ypw-panel ypw-preference-card">
          <header>
            <Waves aria-hidden="true" size={19} />
            <div><h2>Workspace behavior</h2><p>Keep attention and motion suited to your workflow.</p></div>
          </header>
          <label className="ypw-switch-row">
            <span><strong>{t("focusMode")}</strong><small>Hide the queue while entering a product.</small></span>
            <input
              checked={preferences.focusMode}
              onChange={(event) => setFocusMode(event.target.checked)}
              role="switch"
              type="checkbox"
            />
          </label>
          <label className="ypw-switch-row">
            <span><strong>{t("reducedMotion")}</strong><small>Minimize workspace transitions and animation.</small></span>
            <input
              checked={preferences.reduceMotion}
              onChange={(event) => setReduceMotion(event.target.checked)}
              role="switch"
              type="checkbox"
            />
          </label>
        </section>

        <section className="ypw-panel ypw-preference-card">
          <header>
            <Languages aria-hidden="true" size={19} />
            <div><h2>Locale foundation</h2><p>Supplied by WordPress; complete translations arrive later.</p></div>
          </header>
          <dl className="ypw-locale-grid">
            <div><dt>{t("locale")}</dt><dd>{locale}</dd></div>
            <div><dt>{t("direction")}</dt><dd><MoveHorizontal aria-hidden="true" size={14} /> {direction.toUpperCase()}</dd></div>
            <div><dt>{t("localeSample")}</dt><dd>{formatters.number(1234567.89)}</dd></div>
            <div><dt>Date</dt><dd>{formatters.date(new Date("2026-08-12T00:00:00.000Z"))}</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}
