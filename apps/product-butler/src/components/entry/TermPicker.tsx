import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkspaceRuntime } from "@/production/app/WorkspaceRuntime";
import type { Category } from "@/types/product";
import { __, _x, sprintf } from "@/production/core/i18n/wordpress";

type TermKind = "category" | "shipping" | "tag";

interface Props {
  kind: TermKind;
  label: string;
  multiple?: boolean;
  onChange: (ids: number[]) => void;
  value: number[];
}

export function TermPicker({ kind, label, multiple = true, onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const labels = useRef(new Map<number, string>());
  const { client } = useWorkspaceRuntime();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const page = kind === "category"
          ? await client.searchCategories(query, controller.signal)
          : kind === "tag"
            ? await client.searchTags(query, controller.signal)
            : await client.searchShippingClasses(query, controller.signal);
        page.items.forEach((item) => labels.current.set(item.id, item.name));
        setItems(page.items);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, kind, open, query]);

  const summary = useMemo(() => {
    if (value.length === 0) {
      /* translators: %s: taxonomy field label. */
      return sprintf(__("Select %s…", "yaxii-product-workspace"), label.toLocaleLowerCase());
    }
    return value.map((id) => labels.current.get(id) ?? `#${id}`).join(_x(", ", "List separator", "yaxii-product-workspace"));
  }, [label, value]);

  const toggle = (item: Category) => {
    labels.current.set(item.id, item.name);
    if (!multiple) {
      onChange(value.includes(item.id) ? [] : [item.id]);
      setOpen(false);
      return;
    }
    onChange(value.includes(item.id) ? value.filter((id) => id !== item.id) : [...value, item.id]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-label={label}
          className="ctl w-full justify-between overflow-hidden font-normal">
          <bdi className="truncate" dir="auto">{summary}</bdi>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={
            /* translators: %s: taxonomy field label. */
            sprintf(__("Search %s…", "yaxii-product-workspace"), label.toLocaleLowerCase())
          } />
          <CommandList>
            <CommandEmpty>{loading
              ? __("Searching…", "yaxii-product-workspace")
              : /* translators: %s: taxonomy field label. */ sprintf(__("No %s found.", "yaxii-product-workspace"), label.toLocaleLowerCase())}</CommandEmpty>
            {items.map((item) => (
              <CommandItem key={item.id} value={`${item.name}-${item.id}`} onSelect={() => toggle(item)}>
                <Check className={cn("me-2 h-4 w-4", value.includes(item.id) ? "opacity-100" : "opacity-0")} />
                <bdi className="min-w-0 flex-1 truncate" dir="auto">{item.name}</bdi>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
