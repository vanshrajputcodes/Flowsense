import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle,
  Crown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface UserWithRole extends Profile {
  roles: string[];
}

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
  admin: { label: 'Admin', color: 'text-danger border-danger/30 bg-danger/5', icon: '👑' },
  moderator: { label: 'Moderator', color: 'text-primary border-primary/30 bg-primary/5', icon: '🛡️' },
  visitor: { label: 'Visitor', color: 'text-muted-foreground border-border bg-muted/30', icon: '👤' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState('moderator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);

    // Get all profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Get all roles
    const { data: roles, error: rErr } = await supabase
      .from('user_roles')
      .select('*');

    if (pErr || rErr) {
      toast.error('Error fetching users');
      setLoading(false);
      return;
    }

    const merged: UserWithRole[] = (profiles || []).map((p) => ({
      ...p,
      roles: (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddRole = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('user_roles').insert({
      user_id: selectedUser.user_id,
      role: newRole as 'admin' | 'moderator' | 'visitor',
    });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Error assigning role: ' + error.message);
      }
      return;
    }

    toast.success(`Role "${newRole}" assigned successfully`);
    setAddRoleOpen(false);
    fetchUsers();
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if (role === 'visitor') {
      toast.error('Cannot remove default visitor role');
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role as 'admin' | 'moderator' | 'visitor');

    if (error) {
      toast.error('Error removing role');
      return;
    }
    toast.success(`Role "${role}" removed`);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(s) || (u.phone || '').includes(s);
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes('admin')).length,
    moderators: users.filter((u) => u.roles.includes('moderator')).length,
    visitors: users.filter((u) => !u.roles.includes('admin') && !u.roles.includes('moderator')).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground text-sm">Manage user roles and permissions</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total, icon: Users, color: 'text-primary' },
            { label: 'Admins', value: stats.admins, icon: Crown, color: 'text-danger' },
            { label: 'Moderators', value: stats.moderators, icon: Shield, color: 'text-caution' },
            { label: 'Visitors', value: stats.visitors, icon: CheckCircle, color: 'text-safe' },
          ].map((s) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Legend */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Role Permissions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-danger/5 border border-danger/20">
                <div className="flex items-center gap-2 mb-1">
                  <span>👑</span>
                  <span className="font-medium text-sm text-danger">Admin</span>
                </div>
                <p className="text-xs text-muted-foreground">Full system access, manage all users, view CCTV, manage alerts and orders</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span>🛡️</span>
                  <span className="font-medium text-sm text-primary">Moderator</span>
                </div>
                <p className="text-xs text-muted-foreground">Manage queues, respond to SOS, view analytics, update orders</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span>👤</span>
                  <span className="font-medium text-sm">Visitor</span>
                </div>
                <p className="text-xs text-muted-foreground">Join queues, place orders, view alerts, send SOS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((user) => (
              <Card key={user.user_id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {user.phone && <span>📞 {user.phone}</span>}
                        <span>Joined {format(new Date(user.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.roles.map((role) => {
                        const cfg = roleConfig[role] || roleConfig.visitor;
                        return (
                          <div key={role} className="flex items-center gap-1">
                            <Badge variant="outline" className={cfg.color}>
                              {cfg.icon} {cfg.label}
                            </Badge>
                            {role !== 'visitor' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-5 h-5 text-danger hover:bg-danger/10"
                                onClick={() => handleRemoveRole(user.user_id, role)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => { setSelectedUser(user); setAddRoleOpen(true); }}
                      >
                        <UserPlus className="w-3 h-3" />
                        Add Role
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground">User:</p>
              <p className="font-medium">{selectedUser?.full_name || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 Admin</SelectItem>
                  <SelectItem value="moderator">🛡️ Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
