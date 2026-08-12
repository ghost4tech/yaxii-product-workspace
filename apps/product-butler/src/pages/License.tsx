import { useState } from 'react';
import { useTierStore } from '@/stores/tierStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Sparkles, Check, AlertCircle, LogOut, Copy } from 'lucide-react';

const License = () => {
  const { licenseKey, licenseEmail, activateLicense, deactivateLicense, openUpgradeModal } = useTierStore();
  const [key, setKey] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!key || !email) {
      toast({ title: 'Missing info', description: 'License key and email are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    // Demo: accept any key matching pattern WBE-XXXX-XXXX-XXXX
    const valid = /^[A-Z0-9]{4}(-[A-Z0-9]{4}){2,3}$/i.test(key.trim());
    if (!valid) {
      setLoading(false);
      toast({ title: 'Invalid key', description: 'Try format WBE-XXXX-XXXX-XXXX.', variant: 'destructive' });
      return;
    }
    activateLicense(key.trim().toUpperCase(), email.trim());
    setLoading(false);
    toast({ title: 'License activated', description: 'Welcome to Pro!' });
  };

  if (licenseKey) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">License</h1>
          <p className="text-sm text-muted-foreground">Manage your activation and seat usage.</p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-success">Active</div>
                <div className="text-base font-semibold">Pro · Annual plan</div>
                <div className="text-xs text-muted-foreground">Licensed to {licenseEmail}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={deactivateLicense}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Deactivate
            </Button>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between gap-2 mb-5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">License key</div>
              <div className="font-mono font-semibold text-sm truncate">{licenseKey}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(licenseKey);
                toast({ title: 'Copied to clipboard' });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Plan', value: 'Pro Annual' },
              { label: 'Stores', value: 'Unlimited' },
              { label: 'Seats used', value: '4 / 5' },
              { label: 'Renews', value: 'Jun 13, 2027' },
            ].map((s) => (
              <div key={s.label} className="border border-border rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</div>
                <div className="font-semibold text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">License activation</h1>
        <p className="text-sm text-muted-foreground">Enter your license key to unlock Pro features.</p>
      </div>

      <div className="surface-card p-6 space-y-5">
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg text-xs">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Demo: any key matching <span className="font-mono">WBE-XXXX-XXXX-XXXX</span> activates Pro.
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="key" className="text-xs font-bold uppercase tracking-wider">License key</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="WBE-XXXX-XXXX-XXXX"
              className="pl-9 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <Button className="w-full" onClick={handleActivate} disabled={loading}>
          {loading ? 'Verifying…' : <><Check className="h-4 w-4 mr-1.5" /> Activate license</>}
        </Button>
      </div>

      <div className="surface-card p-6 bg-primary/[0.03] border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">No license yet?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get one instantly. Pro unlocks multi-store, analytics, team & AI.
            </p>
            <Button variant="outline" onClick={() => openUpgradeModal()}>
              View Pro plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default License;
