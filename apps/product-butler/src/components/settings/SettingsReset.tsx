import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefsStore } from "@/stores/prefsStore";
import { useWorkspacePreferences } from "@/production/features/preferences/useWorkspacePreferences";

export function SettingsReset() {
  const resetPrefs = usePrefsStore((state) => state.resetPrefs);
  const { reset: resetWorkflowPreferences } = useWorkspacePreferences();

  return (
    <div className="panel flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="text-[13px] font-medium">Reset to defaults</p>
        <p className="text-xs text-muted-foreground">
          Restores preferences and product defaults. Your products stay untouched.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={resetPrefs}>
          <RotateCcw className="me-1.5 h-3.5 w-3.5" /> Preferences
        </Button>
        <Button variant="outline" size="sm" onClick={resetWorkflowPreferences}>
          <RotateCcw className="me-1.5 h-3.5 w-3.5" /> Product defaults
        </Button>
      </div>
    </div>
  );
}
