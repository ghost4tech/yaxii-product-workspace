import { useMemo, useState } from "react";
import { ChevronRight, ChevronsUpDown, Clock, FolderTree, Loader2, Search, X } from "lucide-react";
import type { CategoryTreeNode } from "@/components/categories/categoryTree";
import { useCategoryTree } from "@/components/categories/useCategoryTree";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/stores/productStore";
import type { Category } from "@/types/product";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CategoryTreeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const categories = useProductStore((state) => state.categories);
  const recentCategoryIds = useProductStore((state) => state.recentCategoryIds);
  const addRecentCategory = useProductStore((state) => state.addRecentCategory);
  const selectedIds = useMemo(() => value.map(Number).filter(Number.isInteger), [value]);
  const categoryTree = useCategoryTree(open, query, selectedIds);
  const selected = value.map((id) => categories.find((category) => String(category.id) === id));
  const recent = recentCategoryIds
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category) && !value.includes(String(category?.id)));

  const toggle = (category: Category) => {
    const id = String(category.id);
    if (value.includes(id)) onChange(value.filter((selectedId) => selectedId !== id));
    else {
      onChange([...value, id]);
      addRecentCategory(category.id);
    }
  };

  const renderNodes = (nodes: CategoryTreeNode[], depth = 0): React.ReactNode => nodes.map((node) => {
    const { category, children } = node;
    const id = String(category.id);
    const isSelected = value.includes(id);
    const hasChildren = category.hasChildren || children.length > 0;
    const isCollapsed = categoryTree.collapsed.has(category.id) && !query.trim();
    const branch = categoryTree.branches[category.id];
    return (
      <div key={category.id}>
        <div
          className={cn(
            "group flex h-8 items-center gap-1.5 rounded-md pe-2 transition-colors hover:bg-muted/70",
            isSelected && "bg-muted/50",
          )}
          style={{ paddingInlineStart: `${depth * 14 + 4}px` }}
        >
          {hasChildren ? (
            <button type="button" onClick={() => categoryTree.toggleCollapse(category)}
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand" : "Collapse"}>
              {branch?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", !isCollapsed && "rotate-90")} />
              )}
            </button>
          ) : <span className="h-5 w-5 shrink-0" />}
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1">
            <Checkbox checked={isSelected} onCheckedChange={() => toggle(category)} className="h-3.5 w-3.5" />
            <span className={cn(
              "truncate text-[13px]",
              depth === 0 ? "font-medium" : "text-foreground/85",
              isSelected && "font-semibold",
            )}>{category.name}</span>
            <span className="ms-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">{category.count}</span>
          </label>
        </div>
        {hasChildren && !isCollapsed && (
          <div>
            {renderNodes(children, depth + 1)}
            {branch?.hasMore && (
              <button type="button" className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                style={{ marginInlineStart: `${(depth + 1) * 14 + 28}px` }}
                onClick={() => void categoryTree.loadChildren(category.id, branch.page + 1)}>
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-label="Categories" aria-expanded={open}
            className="ctl w-full justify-between font-normal text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className={cn("truncate", !selected.length && "text-muted-foreground")}>
                {selected.length === 0 ? "Select categories…"
                  : selected.length === 1 ? selected[0]?.name ?? `Category #${value[0]}`
                    : `${selected.length} categories selected`}
              </span>
            </span>
            <ChevronsUpDown className="ms-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0">
          <div className="flex h-9 items-center gap-2 border-b border-border px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70" />
            {value.length > 0 && <button type="button" onClick={() => onChange([])}
              className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>}
          </div>
          <div className="max-h-[280px] overflow-auto p-1.5">
            {recent.length > 0 && !query.trim() && <div className="mb-1.5">
              <div className="label-eyebrow flex items-center gap-1.5 px-2 py-1"><Clock className="h-3 w-3" /> Recent</div>
              <div className="flex flex-wrap gap-1 px-1.5 pb-1">{recent.slice(0, 4).map((category) => (
                <button key={category.id} type="button" onClick={() => toggle(category)}
                  className="h-6 rounded-md border border-border bg-muted/40 px-2 text-[11px] hover:bg-muted">
                  {category.name}
                </button>
              ))}</div>
            </div>}
            {categoryTree.searching || categoryTree.rootState.loading
              ? <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">Loading categories…</p>
              : categoryTree.tree.length === 0
                ? <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  {categoryTree.loadError ? "Categories could not be loaded." : "No category found."}
                </p>
                : renderNodes(categoryTree.tree)}
            {!query.trim() && categoryTree.rootState.hasMore && (
              <button type="button" className="mt-1 h-7 w-full text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => void categoryTree.loadRoots(categoryTree.rootState.page + 1)}>Load more categories</button>
            )}
          </div>
          <div className="flex h-8 items-center justify-between border-t border-border px-2.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{value.length} selected</span>
            <button type="button" onClick={() => setOpen(false)} className="font-medium text-foreground hover:underline">Done</button>
          </div>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.map((category, index) => (
        <span key={value[index]} className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-muted/50 ps-2 pe-1 text-[11px] font-medium">
          {category?.name ?? `Category #${value[index]}`}
          <button type="button" onClick={() => onChange(value.filter((id) => id !== value[index]))}
            className="grid h-4 w-4 place-items-center rounded text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${category?.name ?? `category ${value[index]}`}`}><X className="h-3 w-3" /></button>
        </span>
      ))}</div>}
    </div>
  );
}
