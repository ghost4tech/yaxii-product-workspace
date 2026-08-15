import { useEffect } from "react";
import { ArrowRight, Check, CloudUpload, Copy, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { __ } from "@/production/core/i18n/wordpress";

export interface SaveSuccessInfo {
  name: string;
  sku?: string;
  updated?: boolean;
}

interface Props {
  autoDismiss?: number;
  info: SaveSuccessInfo | null;
  onDismiss: () => void;
  onDuplicate?: () => void;
  onViewQueue?: () => void;
}

export function SaveSuccess({ autoDismiss = 1600, info, onDismiss, onDuplicate, onViewQueue }: Props) {
  useEffect(() => {
    if (!info || !autoDismiss) return;
    const timer = window.setTimeout(onDismiss, autoDismiss);
    return () => window.clearTimeout(timer);
  }, [autoDismiss, info, onDismiss]);
  if (!info) return null;
  return <div className="absolute inset-0 z-30 grid place-items-center bg-card/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div className={cn(
      "w-full max-w-[360px] rounded-lg border border-border bg-card p-5 text-center",
      "shadow-[0_20px_50px_-24px_hsl(224_71%_4%/0.45)] animate-in zoom-in-95 slide-in-from-bottom-2 duration-300",
    )}>
      <div className="relative mx-auto h-12 w-12">
        <span className="absolute inset-0 animate-ping rounded-full bg-success/15" />
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-success text-success-foreground">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </span>
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold">{info.updated ? __("Product updated", "yaxii-product-workspace") : __("Product saved", "yaxii-product-workspace")}</h3>
      <p className="mt-1 text-[12px] text-muted-foreground" dir="auto">
        <bdi className="font-medium text-foreground">{info.name}</bdi>
        {info.sku && <bdi className="font-mono" dir="ltr"> · {info.sku}</bdi>}
      </p>
      <div className="mt-3 inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 text-[11px] font-medium">
        <CloudUpload className="h-3 w-3 text-success" /> {__("Saved to current store", "yaxii-product-workspace")}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={onDismiss} className="h-9 text-[13px] font-semibold">
          {__("Add another", "yaxii-product-workspace")} <ArrowRight className="ms-1.5 h-3.5 w-3.5 rtl:-scale-x-100" />
        </Button>
        <div className="flex gap-2">
          {onDuplicate && <Button variant="outline" onClick={onDuplicate} className="h-8 flex-1 text-[12px]">
            <Copy className="me-1.5 h-3.5 w-3.5" /> {__("Duplicate", "yaxii-product-workspace")}
          </Button>}
          {onViewQueue && <Button variant="ghost" onClick={onViewQueue}
            className="h-8 flex-1 text-[12px] text-muted-foreground">
            <ListChecks className="me-1.5 h-3.5 w-3.5" /> {__("View queue", "yaxii-product-workspace")}
          </Button>}
        </div>
      </div>
    </div>
  </div>;
}
