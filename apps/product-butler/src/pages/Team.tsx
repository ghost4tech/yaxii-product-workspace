import { useState } from 'react';
import { useTierStore } from '@/stores/tierStore';
import { ProLock } from '@/components/ProLock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Crown, Edit2, Eye, Mail, MoreHorizontal, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Role = 'Owner' | 'Editor' | 'Viewer';

const SEED = [
  { id: '1', name: 'Sarah Khoury', email: 'sarah@example.com', role: 'Owner' as Role, status: 'active', initials: 'SK', color: '#10b981' },
  { id: '2', name: 'Marco Rivera', email: 'marco@example.com', role: 'Editor' as Role, status: 'active', initials: 'MR', color: '#6366f1' },
  { id: '3', name: 'Lina Park', email: 'lina@example.com', role: 'Editor' as Role, status: 'active', initials: 'LP', color: '#f59e0b' },
  { id: '4', name: 'You', email: 'you@example.com', role: 'Viewer' as Role, status: 'active', initials: 'YO', color: '#8b5cf6' },
  { id: '5', name: 'Pending invite', email: 'amir@example.com', role: 'Editor' as Role, status: 'invited', initials: 'AM', color: '#94a3b8' },
];

const Team = () => {
  const { tier } = useTierStore();
  const { toast } = useToast();
  const [members, setMembers] = useState(SEED);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'Editor' as Role });

  if (tier !== 'pro') return <ProLock feature="team" />;

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.includes(search)
  );

  const handleInvite = () => {
    if (!invite.email) return;
    const initials = invite.email.slice(0, 2).toUpperCase();
    setMembers((cur) => [
      ...cur,
      {
        id: String(Date.now()),
        name: 'Pending invite',
        email: invite.email,
        role: invite.role,
        status: 'invited',
        initials,
        color: '#94a3b8',
      },
    ]);
    setInvite({ email: '', role: 'Editor' });
    setOpen(false);
    toast({ title: 'Invite sent', description: `Invitation emailed to ${invite.email}` });
  };

  const changeRole = (id: string, role: Role) => {
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, role } : m)));
    toast({ title: 'Role updated' });
  };

  const remove = (id: string) => {
    setMembers((cur) => cur.filter((m) => m.id !== id));
    toast({ title: 'Member removed' });
  };

  const roleIcon = (r: Role) =>
    r === 'Owner' ? <Crown className="h-3 w-3 text-warning" /> :
    r === 'Editor' ? <Edit2 className="h-3 w-3" /> :
    <Eye className="h-3 w-3" />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.filter((m) => m.status === 'active').length} active members ·{' '}
            {members.filter((m) => m.status === 'invited').length} pending
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite team member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="i-email">Email address</Label>
                <Input
                  id="i-email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={invite.role} onValueChange={(v) => setInvite({ ...invite, role: v as Role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Editor">Editor — can create & edit products</SelectItem>
                    <SelectItem value="Viewer">Viewer — read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite}>
                <Mail className="h-4 w-4 mr-1.5" /> Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3">Member</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </div>
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {m.role === 'Owner' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded bg-muted">
                      {roleIcon(m.role)} {m.role}
                    </span>
                  ) : (
                    <Select value={m.role} onValueChange={(v) => changeRole(m.id, v as Role)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      m.status === 'active' ? 'text-success' : 'text-warning'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        m.status === 'active' ? 'bg-success' : 'bg-warning'
                      )}
                    />
                    {m.status === 'active' ? 'Active' : 'Invited'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status === 'invited' && (
                        <DropdownMenuItem onClick={() => toast({ title: 'Invite resent' })}>
                          <Mail className="h-4 w-4 mr-2" /> Resend invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => remove(m.id)}
                        disabled={m.role === 'Owner'}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="surface-card p-5">
        <h3 className="text-sm font-semibold mb-1">Role permissions</h3>
        <p className="text-xs text-muted-foreground mb-4">What each role can do</p>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {[
            { role: 'Owner', perms: ['Full access', 'Billing & licensing', 'Invite & remove members'] },
            { role: 'Editor', perms: ['Create products', 'Edit & sync queue', 'Manage variations'] },
            { role: 'Viewer', perms: ['Read-only access', 'View analytics', 'Cannot edit data'] },
          ].map((r) => (
            <div key={r.role} className="border border-border rounded-lg p-4">
              <div className="font-semibold text-sm mb-2">{r.role}</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {r.perms.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
