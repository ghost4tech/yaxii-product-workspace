import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTierStore, ProFeature, PRO_FEATURE_LABELS } from '@/stores/tierStore';

interface Props {
  feature: ProFeature;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function ProLock({ feature, title, description, compact }: Props) {
  const { openUpgradeModal } = useTierStore();
  const meta = PRO_FEATURE_LABELS[feature];

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => openUpgradeModal(feature)}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition"
      >
        <Lock className="h-3 w-3" /> Pro
      </button>
    );
  }

  return (
    <div className="surface-card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
        <Lock className="h-6 w-6" />
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
        Pro feature
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        {title ?? meta.title}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
        {description ?? meta.desc}
      </p>
      <Button onClick={() => openUpgradeModal(feature)}>
        <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade to unlock
      </Button>
    </div>
  );
}
