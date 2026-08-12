import React, { useState, useMemo } from 'react';
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

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const [open, setOpen] = useState(false);
  const { categories, recentCategoryIds, addRecentCategory } = useProductStore();

  const recentCategories = useMemo(() => {
    return recentCategoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as Category[];
  }, [recentCategoryIds, categories]);

  const selectedCategory = categories.find((c) => c.id.toString() === value);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    addRecentCategory(parseInt(categoryId));
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          >
            {selectedCategory ? selectedCategory.name : 'Select category...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              
              {recentCategories.length > 0 && (
                <>
                  <CommandGroup heading="Recent">
                    {recentCategories.map((category) => (
                      <CommandItem
                        key={`recent-${category.id}`}
                        value={`recent-${category.name}`}
                        onSelect={() => handleSelect(category.id.toString())}
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {category.name}
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
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
                    <span className="text-xs text-muted-foreground mr-2">
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
      
      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh categories"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
};
