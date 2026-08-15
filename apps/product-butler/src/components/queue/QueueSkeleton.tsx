import { Skeleton } from "@/components/ui/skeleton";
import { __ } from "@/production/core/i18n/wordpress";

const ROW_WIDTHS = ["w-28", "w-36", "w-24", "w-32"];

export function QueueSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="divide-y divide-border/70" role="status" aria-label={__("Loading recent products", "yaxii-product-workspace")}>
      {ROW_WIDTHS.map((nameWidth) => (
        <div className="data-row" key={nameWidth}>
          <Skeleton className="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={`h-3 ${nameWidth}`} />
            <Skeleton className="h-2.5 w-20" />
          </div>
          {!compact && <Skeleton className="h-3 w-16" />}
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-7 w-7" />
        </div>
      ))}
    </div>
  );
}
