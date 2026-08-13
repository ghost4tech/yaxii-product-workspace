import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Check, ChevronsUpDown, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Category } from '@/types/product';
import { useProductStore } from '@/stores/productStore';
import { useWorkspaceRuntime } from '@/production/app/WorkspaceRuntime';
import { productOperationCopy } from '@/production/core/i18n/productMessages';

interface CategorySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  id,
  value,
  onChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const loadSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const { categories, recentCategoryIds, addRecentCategory, setCategories } = useProductStore();
  const { bootstrap, client } = useWorkspaceRuntime();
  const copy = productOperationCopy(bootstrap.locale);

  const loadCategories = useCallback(async (search: string) => {
    if (!bootstrap.features.categoryLookup) return;
    const sequence = ++loadSequence.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setLoadError(false);
    try {
      const page = await client.searchCategories(search, controller.signal);
      if (sequence !== loadSequence.current) return;
      setCategories(page.items);
    } catch (error) {
      if (sequence !== loadSequence.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setCategories([]);
      setLoadError(true);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [bootstrap.features.categoryLookup, client, setCategories]);

  useEffect(() => {
	loadSequence.current += 1;
    if (!open) {
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => void loadCategories(query), 250);
    return () => {
      window.clearTimeout(timer);
      activeRequest.current?.abort();
    };
  }, [loadCategories, open, query]);

  const recentCategories = useMemo(() => {
    return recentCategoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as Category[];
  }, [recentCategoryIds, categories]);

  const selectedCategory = categories.find((c) => c.id.toString() === value);

  useEffect(() => {
    if (!value) setSelectedLabel('');
    else if (selectedCategory) setSelectedLabel(selectedCategory.name);
  }, [selectedCategory, value]);

  const handleSelect = (categoryId: string) => {
    setSelectedLabel(categories.find((category) => category.id.toString() === categoryId)?.name ?? '');
    onChange(categoryId);
    addRecentCategory(parseInt(categoryId));
    setOpen(false);
  };

  const handleRefresh = () => {
    onRefresh?.();
    void loadCategories(query);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          >
            {selectedLabel || (value ? `Category #${value}` : 'Select category...')}
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search categories..." value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>{loadError ? copy.categoriesLoadFailed : 'No category found.'}</CommandEmpty>
              
              {recentCategories.length > 0 && (
                <>
                  <CommandGroup heading="Recent">
                    {recentCategories.map((category) => (
                      <CommandItem
                        key={`recent-${category.id}`}
                        value={`recent-${category.name}`}
                        onSelect={() => handleSelect(category.id.toString())}
                      >
                        <Clock className="me-2 h-4 w-4 text-muted-foreground" />
                        {category.name}
                        <Check
                          className={cn(
                            'ms-auto h-4 w-4',
                            value === category.id.toString()
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              
              <CommandGroup heading="All Categories">
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id.toString())}
                  >
                    <span className="flex-1">{category.name}</span>
                    <span className="me-2 text-xs text-muted-foreground">
                      {category.count} products
                    </span>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === category.id.toString()
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {bootstrap.features.categoryLookup && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          title="Refresh categories"
        >
          <RefreshCw className={cn('h-4 w-4', (isRefreshing || loading) && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
};
