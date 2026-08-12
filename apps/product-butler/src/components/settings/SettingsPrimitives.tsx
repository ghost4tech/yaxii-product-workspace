import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingRow({
  children,
  description,
  last = false,
  title,
}: {
  children: ReactNode;
  description: string;
  last?: boolean;
  title: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5",
        !last && "border-b border-border",
      )}
    >
      <div className="min-w-0">
        <Label className="text-[13px] font-medium">{title}</Label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0 sm:shrink-0 sm:pt-0.5">{children}</div>
    </div>
  );
}

export function SettingsPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="panel overflow-hidden">
      <header className="border-b border-border bg-muted/25 px-4 py-3.5 sm:px-5">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      <div>{children}</div>
    </section>
  );
}
