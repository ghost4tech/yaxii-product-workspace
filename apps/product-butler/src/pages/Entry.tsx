import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { ProductEntryForm } from '@/components/ProductEntryForm';
import { ProductQueue } from '@/components/ProductQueue';
import { StatsBar } from '@/components/StatsBar';
import { WorkspaceToolbar } from '@/components/entry/WorkspaceToolbar';
import { QueueSheet } from '@/components/entry/QueueSheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProductStore } from '@/stores/productStore';
import { useTierStore, FREE_LIMITS } from '@/stores/tierStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { ProductFormData, Product } from '@/types/product';
import { createProduct } from '@/services/woocommerce';
import { generateMockProducts } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const Entry = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queueSheet, setQueueSheet] = useState(false);
  const {
    addProduct,
    products,
    lastDeletedProduct,
    setLastDeletedProduct,
    wooConfig,
    appSettings,
    clearDraftFormData,
  } = useProductStore();
  const { tier, openUpgradeModal } = useTierStore();
  const prefs = usePrefsStore((s) => s.prefs);
  const isPro = tier === 'pro';
  const { toast } = useToast();

  useEffect(() => {
    if (products.length === 0) {
      generateMockProducts(8).forEach((p) => useProductStore.getState().addProduct(p));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthCount = products.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const overLimit = !isPro && monthCount >= FREE_LIMITS.productsPerMonth;

  const handleProductSubmit = useCallback(
    async (formData: ProductFormData) => {
      if (overLimit) {
        openUpgradeModal();
        return;
      }
      setIsSubmitting(true);
      try {
        const product: Product = {
          id: crypto.randomUUID(),
          ...formData,
          status: wooConfig?.connected ? 'pending' : 'draft',
          createdAt: new Date(),
          createdBy: 'Current User',
          isVariable: formData.isVariable,
        };
        addProduct(product);
        if (prefs.keepValuesAfterSave) {
          useProductStore.getState().applyDraft({
            ...formData,
            name: '',
            sku: '',
            images: [],
            shortDescription: '',
            longDescription: '',
          });
        } else {
          clearDraftFormData();
        }
        if (wooConfig?.connected) {
          toast({ title: 'Uploading…', description: 'Uploading images and creating product.' });
          const result = await createProduct(wooConfig, product, appSettings);
          if (result.success) {
            useProductStore.getState().updateProduct(product.id, {
              status: 'synced',
              wooCommerceId: result.wooCommerceId,
            });
            toast({ title: 'Product created', description: 'Synced to WooCommerce.' });
          } else {
            useProductStore.getState().updateProduct(product.id, {
              status: 'error',
              errorMessage: result.error || 'Failed to sync',
            });
            toast({ title: 'Sync failed', description: result.error, variant: 'destructive' });
          }
        } else {
          toast({ title: 'Product saved', description: 'Saved locally. Connect a store to sync.' });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [addProduct, clearDraftFormData, wooConfig, appSettings, toast, overLimit, openUpgradeModal, prefs.keepValuesAfterSave]
  );

  const handleUndo = useCallback(() => {
    if (!lastDeletedProduct) return;
    addProduct(lastDeletedProduct);
    setLastDeletedProduct(null);
    toast({ title: 'Product restored', description: lastDeletedProduct.name });
  }, [lastDeletedProduct, addProduct, setLastDeletedProduct, toast]);

  const handleRetry = useCallback(
    async (product: Product) => {
      useProductStore.getState().updateProduct(product.id, { status: 'pending', errorMessage: undefined });
      if (!wooConfig?.connected) return;
      const result = await createProduct(wooConfig, product, appSettings);
      if (result.success) {
        useProductStore.getState().updateProduct(product.id, {
          status: 'synced',
          wooCommerceId: result.wooCommerceId,
        });
        toast({ title: 'Retry successful', description: `${product.name} synced` });
      } else {
        useProductStore.getState().updateProduct(product.id, {
          status: 'error',
          errorMessage: result.error,
        });
        toast({ title: 'Retry failed', description: result.error, variant: 'destructive' });
      }
    },
    [wooConfig, appSettings, toast]
  );

  const focus = prefs.focusMode;
  const showQueueColumn = !advancedOpen && (!focus || prefs.focusModeShowQueue);
  const handleEdit = (p: Product) =>
    toast({ title: 'Edit mode', description: `Editing ${p.name}` });

  return (
    <div className="space-y-5">
      <WorkspaceToolbar
        monthCount={monthCount}
        limit={FREE_LIMITS.productsPerMonth}
        isPro={isPro}
        advancedOpen={advancedOpen}
        onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
        canUndo={!!lastDeletedProduct}
        onUndo={handleUndo}
        onOpenQueue={() => setQueueSheet(true)}
        queueCount={products.length}
        onBulk={() =>
          isPro
            ? toast({ title: 'CSV import', description: 'Demo only — upload your CSV here.' })
            : openUpgradeModal('bulk_csv')
        }
        onAi={() =>
          isPro
            ? toast({ title: 'AI assist', description: 'Description generation triggered (demo).' })
            : openUpgradeModal('ai_descriptions')
        }
      />

      {overLimit && (
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">You've hit the Free plan limit</div>
              <div className="text-xs text-muted-foreground">
                Upgrade for unlimited products, multi-store, and analytics.
              </div>
            </div>
          </div>
          <Button onClick={() => openUpgradeModal()}>
            <Sparkles className="h-4 w-4 me-1.5" /> Upgrade
          </Button>
        </div>
      )}

      {!focus && <StatsBar />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section
          className={cn(
            'panel min-w-0 flex flex-col',
            showQueueColumn ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12'
          )}
        >
          <div className="panel-head">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[14px] font-semibold truncate">Add new product</h2>
              <span className="label-eyebrow">Draft</span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {prefs.density === 'compact' ? 'Compact' : 'Comfortable'}
            </span>
          </div>
          <div className="panel-body">
            <ProductEntryForm
              onSubmit={handleProductSubmit}
              isSubmitting={isSubmitting}
              advancedOpen={advancedOpen}
              onAdvancedChange={setAdvancedOpen}
              twoColumn={advancedOpen}
            />
          </div>
        </section>

        {showQueueColumn && (
          <section
            className={cn(
              'hidden lg:block lg:col-span-4 min-h-[520px]',
              prefs.stickyQueue && 'lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)]'
            )}
          >
            <ProductQueue compact onEdit={handleEdit} onRetry={handleRetry} />
          </section>
        )}

        {!showQueueColumn && (
          <section className="lg:col-span-12">
            <ProductQueue onEdit={handleEdit} onRetry={handleRetry} />
          </section>
        )}
      </div>

      <QueueSheet
        open={queueSheet}
        onOpenChange={setQueueSheet}
        onEdit={handleEdit}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default Entry;
