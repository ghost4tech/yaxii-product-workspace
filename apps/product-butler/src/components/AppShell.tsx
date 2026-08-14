import { LayoutGrid, Search, SlidersHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import workspaceLogo from "../../../../assets/img/yaxii-product-workspace-logo.svg";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import { usePrefsStore } from "@/stores/prefsStore";

const TABS = [
  { to: "/", label: "Entry", icon: LayoutGrid },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const setCommandOpen = usePrefsStore((state) => state.setCommandOpen);
  const showHints = usePrefsStore((state) => state.prefs.showKeyboardHints);
  const focusMode = usePrefsStore((state) => state.prefs.focusMode);
  const { bootstrap } = useWorkspaceRuntime();

  return (
    <div className="workspace-shell flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={workspaceLogo} alt="" className="h-7 w-7 shrink-0" />
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-[13px] font-semibold leading-tight">Yaxii Product Workspace</div>
              <div className="text-[10px] font-medium tracking-[0.04em] text-muted-foreground">
                Create products faster.
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
              <span>Search or jump to…</span>
              {showHints && <kbd className="kbd ms-6">Ctrl K</kbd>}
            </button>
            <div className="hidden h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[11px] font-medium text-muted-foreground lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Store ready · {bootstrap.woocommerce.currency}
            </div>
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
