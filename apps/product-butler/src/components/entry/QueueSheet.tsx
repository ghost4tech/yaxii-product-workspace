import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProductQueue } from '@/components/ProductQueue';
import { Product } from '@/types/product';
import { __ } from '@/production/core/i18n/wordpress';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (p: Product) => void;
  onRetry?: (p: Product) => void;
}

/** Queue as a bottom sheet — the mobile/focus-mode companion to the form. */
export const QueueSheet: React.FC<Props> = ({ open, onOpenChange, onEdit, onRetry }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="p-0 h-[85vh] flex flex-col gap-0">
      <SheetHeader className="px-4 py-3 border-b border-border text-start">
        <SheetTitle className="text-[15px]">{__("Recent products", "yaxii-product-workspace")}</SheetTitle>
        <SheetDescription className="sr-only">
          {__("Review the current product operation queue.", "yaxii-product-workspace")}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 min-h-0 p-3">
        <ProductQueue compact onEdit={onEdit} onRetry={onRetry} />
      </div>
    </SheetContent>
  </Sheet>
);
