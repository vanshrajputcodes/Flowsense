import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Search, AlertTriangle, CheckCircle, Phone, Mail, Clock, UserPlus, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function LostChildPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regForm, setRegForm] = useState({ child_name: '', parent_name: '', parent_phone: '', parent_email: '', age_approx: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // Realtime subscription for alerts
    const channel = supabase
      .channel('lost-child-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lost_child_alerts' }, (payload) => {
        toast.error('🚨 Lost child detected! Check alerts tab.');
        setAlerts(prev => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const [{ data: regs }, { data: alts }] = await Promise.all([
      supabase.from('registered_faces').select('*').order('created_at', { ascending: false }),
      supabase.from('lost_child_alerts').select('*, registered_faces(child_name, parent_name, parent_phone)').order('created_at', { ascending: false }),
    ]);
    if (regs) setRegistrations(regs);
    if (alts) setAlerts(alts);
  };

  const handleRegister = async () => {
    if (!regForm.child_name || !regForm.parent_name) {
      toast.error('Child name and parent name are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('registered_faces').insert({
        child_name: regForm.child_name,
        parent_name: regForm.parent_name,
        parent_phone: regForm.parent_phone || null,
        parent_email: regForm.parent_email || null,
        age_approx: regForm.age_approx ? parseInt(regForm.age_approx) : null,
        status: 'active',
      });
      if (error) throw error;
      toast.success(`${regForm.child_name} registered successfully!`);
      setRegForm({ child_name: '', parent_name: '', parent_phone: '', parent_email: '', age_approx: '' });
      fetchData();
    } catch (err: any) {
      toast.error(`Registration failed: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    await supabase.from('lost_child_alerts').update({ status: 'resolved', found_at: new Date().toISOString() } as any).eq('id', alertId);
    toast.success('Alert resolved - child found!');
    fetchData();
  };

  const triggerManualAlert = async (regId: string) => {
    await supabase.from('lost_child_alerts').insert({
      registered_face_id: regId,
      camera_location: 'Manual Report',
      confidence: 100,
      status: 'active',
    } as any);
    toast.error('🚨 Lost child alert triggered!');
    fetchData();
  };

  const filtered = registrations.filter(r =>
    r.child_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.parent_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Baby className="w-6 h-6 text-caution" />
            Lost Child Detection
          </h1>
          <p className="text-muted-foreground text-sm">Register children at entry, detect and alert when unaccompanied</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Registered', value: registrations.length, icon: UserPlus, color: 'text-primary' },
            { label: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length, icon: AlertTriangle, color: 'text-danger' },
            { label: 'Resolved', value: alerts.filter(a => a.status === 'resolved').length, icon: CheckCircle, color: 'text-safe' },
            { label: 'Today', value: registrations.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length, icon: Clock, color: 'text-caution' },
          ].map(s => (
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

        <Tabs defaultValue="register">
          <TabsList>
            <TabsTrigger value="register">Register Child</TabsTrigger>
            <TabsTrigger value="list">Registered ({registrations.length})</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {alerts.filter(a => a.status === 'active').length > 0 && (
                <Badge className="ml-1 bg-danger text-xs h-5 w-5 p-0 flex items-center justify-center animate-pulse">
                  {alerts.filter(a => a.status === 'active').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="glass-card max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Register Child at Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Child's Name *</label>
                    <Input value={regForm.child_name} onChange={e => setRegForm(p => ({ ...p, child_name: e.target.value }))} placeholder="Child name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Approx. Age</label>
                    <Input type="number" value={regForm.age_approx} onChange={e => setRegForm(p => ({ ...p, age_approx: e.target.value }))} placeholder="Age" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Parent/Guardian Name *</label>
                  <Input value={regForm.parent_name} onChange={e => setRegForm(p => ({ ...p, parent_name: e.target.value }))} placeholder="Parent name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Parent Phone</label>
                    <Input value={regForm.parent_phone} onChange={e => setRegForm(p => ({ ...p, parent_phone: e.target.value }))} placeholder="+91..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Parent Email</label>
                    <Input value={regForm.parent_email} onChange={e => setRegForm(p => ({ ...p, parent_email: e.target.value }))} placeholder="email@..." />
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={isSubmitting} className="w-full gap-2">
                  <UserPlus className="w-4 h-4" />
                  {isSubmitting ? 'Registering...' : 'Register Child'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name..." className="max-w-sm" />
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No registrations found</p>
                ) : (
                  <div className="space-y-3">
                    {filtered.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-caution/10 flex items-center justify-center">
                            <Baby className="w-5 h-5 text-caution" />
                          </div>
                          <div>
                            <p className="font-medium">{r.child_name} {r.age_approx ? `(~${r.age_approx}y)` : ''}</p>
                            <p className="text-xs text-muted-foreground">Guardian: {r.parent_name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                              {r.parent_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.parent_phone}</span>}
                              {r.parent_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.parent_email}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{r.status}</Badge>
                          <Button size="sm" variant="destructive" onClick={() => triggerManualAlert(r.id)} className="gap-1">
                            <Bell className="w-3 h-3" /> Report Lost
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="glass-card">
              <CardContent className="pt-6">
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No lost child alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(a => (
                      <div key={a.id} className={`p-4 rounded-lg border-2 ${a.status === 'active' ? 'border-danger bg-danger/5 animate-pulse' : 'border-safe/30 bg-safe/5'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className={`w-5 h-5 ${a.status === 'active' ? 'text-danger' : 'text-safe'}`} />
                              <span className="font-bold">{(a as any).registered_faces?.child_name || 'Unknown Child'}</span>
                              <Badge variant={a.status === 'active' ? 'destructive' : 'secondary'}>{a.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Guardian: {(a as any).registered_faces?.parent_name}</p>
                            {(a as any).registered_faces?.parent_phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {(a as any).registered_faces.parent_phone}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Location: {a.camera_location || 'Unknown'} | Confidence: {a.confidence}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                          {a.status === 'active' && (
                            <Button size="sm" onClick={() => resolveAlert(a.id)} className="gap-1 bg-safe hover:bg-safe/90">
                              <CheckCircle className="w-3 h-3" /> Found
                            </Button>
                          )}
                        </div>
                        {a.screenshot_url && (
                          <img src={a.screenshot_url} alt="Detection screenshot" className="mt-2 rounded-md max-h-32 object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
