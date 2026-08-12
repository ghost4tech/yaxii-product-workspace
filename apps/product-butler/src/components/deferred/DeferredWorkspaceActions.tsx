import { FileSpreadsheet, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeferredWorkspaceActionsProps {
  isPro: boolean;
  onAi?: () => void;
  onBulk?: () => void;
}

/** Preserved Lovable actions; deliberately excluded from the Free production graph. */
export function DeferredWorkspaceActions({
  isPro,
  onAi,
  onBulk,
}: DeferredWorkspaceActionsProps) {
  return (
    <div className="hidden items-center gap-2 xl:flex">
      <Button variant="outline" size="sm" onClick={onBulk} className="h-8 text-[12px]">
        {isPro ? (
          <FileSpreadsheet className="me-1.5 h-3.5 w-3.5" />
        ) : (
          <Lock className="me-1.5 h-3.5 w-3.5" />
        )}
        Bulk CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onAi} className="h-8 text-[12px]">
        {isPro ? (
          <Sparkles className="me-1.5 h-3.5 w-3.5" />
        ) : (
          <Lock className="me-1.5 h-3.5 w-3.5" />
        )}
        AI descriptions
      </Button>
    </div>
  );
}
