import type { ReactElement, ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePrefsStore } from "@/stores/prefsStore";

interface HelpTipProps {
  children: ReactNode;
  className?: string;
  force?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function HelpTip({ children, className, force, side = "top" }: HelpTipProps) {
  const show = usePrefsStore((state) => state.prefs.showTooltips);
  if (!show && !force) return null;
  return <Tooltip delayDuration={120}>
    <TooltipTrigger asChild>
      <button type="button" aria-label="More information"
        onClick={(event) => event.preventDefault()}
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground",
          className,
        )}><HelpCircle className="h-3.5 w-3.5" /></button>
    </TooltipTrigger>
    <TooltipContent side={side} className="max-w-[260px] text-[12px] leading-relaxed">{children}</TooltipContent>
  </Tooltip>;
}

interface ExplainProps {
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  tip: ReactNode;
}

export function Explain({ children, side = "top", tip }: ExplainProps) {
  const show = usePrefsStore((state) => state.prefs.showTooltips);
  if (!show) return children;
  return <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} className="max-w-[260px] text-[12px] leading-relaxed">{tip}</TooltipContent>
  </Tooltip>;
}
