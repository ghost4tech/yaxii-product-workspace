import { Sparkles, Lock, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTierStore, PRO_FEATURE_LABELS } from '@/stores/tierStore';
import { useToast } from '@/hooks/use-toast';

const PRO_FEATURES = [
  'Connect unlimited WooCommerce stores',
  'Advanced analytics & performance tracking',
  'Bulk CSV import / export',
  'AI-generated product descriptions',
  'Team members with role permissions',
  'Scheduled sync & automatic retries',
  'Priority email support',
  'Unlimited products per month',
];

const FREE_FEATURES = [
  'Single store connection',
  'Up to 50 products / month',
  'Manual product entry',
  'Basic queue & stats',
];

export function UpgradeModal() {
  const { upgradeModalOpen, upgradeFeature, closeUpgradeModal, setTier } = useTierStore();
  const { toast } = useToast();

  const featured = upgradeFeature ? PRO_FEATURE_LABELS[upgradeFeature] : null;

  const startTrial = () => {
    setTier('pro');
    closeUpgradeModal();
    toast({
      title: 'Pro trial activated',
      description: 'All Pro features unlocked for this session.',
    });
  };

  return (
    <Dialog open={upgradeModalOpen} onOpenChange={(o) => !o && closeUpgradeModal()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.55)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Upgrade to Pro
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold">
              {featured ? `Unlock ${featured.title}` : 'Supercharge your workflow'}
            </DialogTitle>
            {featured && (
              <p className="text-sm text-muted-foreground mt-1">{featured.desc}</p>
            )}
          </DialogHeader>
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-6 border-r border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Free</h3>
                <p className="text-xs text-muted-foreground">Your current plan</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$0</div>
                <div className="text-[10px] text-muted-foreground uppercase">forever</div>
              </div>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-primary/[0.03] relative">
            <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded">
              Recommended
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-primary">Pro</h3>
                <p className="text-xs text-muted-foreground">For serious operators</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  $19<span className="text-sm text-muted-foreground font-medium">/mo</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">billed annually</div>
              </div>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-5 border-t border-border bg-muted/30">
          <Button variant="ghost" onClick={closeUpgradeModal}>
            <X className="h-4 w-4 mr-1.5" /> Maybe later
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={startTrial}>
              <Lock className="h-4 w-4 mr-1.5" /> Try Pro for this session
            </Button>
            <Button onClick={startTrial}>
              <Sparkles className="h-4 w-4 mr-1.5" /> Start Pro trial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
