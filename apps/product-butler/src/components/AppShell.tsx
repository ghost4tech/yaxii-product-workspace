import { Keyboard, LayoutGrid, Search, SlidersHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import workspaceLogo from "../../../../assets/img/yaxii-product-workspace-logo.svg";
import { cn } from "@/lib/utils";
import { usePrefsStore } from "@/stores/prefsStore";
import { __, _x } from "@/production/core/i18n/wordpress";

const TABS = [
  { to: "/", label: _x("Entry", "Main navigation tab", "yaxii-product-workspace"), icon: LayoutGrid },
  { to: "/settings", label: _x("Settings", "Main navigation tab", "yaxii-product-workspace"), icon: SlidersHorizontal },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setCommandOpen = usePrefsStore((state) => state.setCommandOpen);
  const setShortcutsOpen = usePrefsStore((state) => state.setShortcutsOpen);
  const showHints = usePrefsStore((state) => state.prefs.showKeyboardHints);
  const focusMode = usePrefsStore((state) => state.prefs.focusMode);

  return (
    <div className="workspace-shell flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={workspaceLogo} alt="" className="h-7 w-7 shrink-0" />
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-[13px] font-semibold leading-tight">Yaxii Product Workspace</div>
              <div className="text-[10px] font-medium tracking-[0.04em] text-muted-foreground">
                {__("Create products faster.", "yaxii-product-workspace")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden h-8 items-center gap-2 rounded-md border border-border bg-muted/40 ps-2.5 pe-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground md:flex"
              type="button"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{__("Search or jump to…", "yaxii-product-workspace")}</span>
              {showHints && <kbd className="kbd ms-6" dir="ltr">Ctrl K</kbd>}
            </button>
            <button
              aria-label={__("Keyboard shortcuts", "yaxii-product-workspace")}
              aria-haspopup="dialog"
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground lg:flex"
              onClick={() => setShortcutsOpen(true)}
              title={__("Keyboard shortcuts", "yaxii-product-workspace")}
              type="button"
            >
              <Keyboard aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!focusMode && (
          <nav className="no-scrollbar mx-auto -mb-px flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4 sm:px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = location.pathname === tab.to;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition",
                    active
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      <main className="workspace-canvas flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
