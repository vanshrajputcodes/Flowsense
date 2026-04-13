import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ShieldAlert, CheckCircle, Clock, Trash2, Eye, Filter,
  AlertTriangle, RefreshCw, ImageIcon, X
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';

interface ThreatLog {
  id: string;
  created_at: string;
  object: string;
  category: string;
  severity: string;
  confidence: number;
  description: string | null;
  screenshot_url: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  notes: string | null;
}

const categoryIcons: Record<string, string> = {
  weapon: '🔪', sharp_object: '✂️', blunt_weapon: '🏏',
  explosive: '💣', suspicious_behavior: '👁️', unattended_item: '🎒',
};

const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-caution text-caution-foreground',
  medium: 'bg-primary/80 text-primary-foreground',
};

export default function ThreatLogsPage() {
  const [logs, setLogs] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterReviewed, setFilterReviewed] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ThreatLog | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('threat_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterSeverity !== 'all') query = query.eq('severity', filterSeverity);
    if (filterReviewed === 'reviewed') query = query.eq('reviewed', true);
    if (filterReviewed === 'unreviewed') query = query.eq('reviewed', false);

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load threat logs');
      console.error(error);
    } else {
      setLogs((data as ThreatLog[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterSeverity, filterReviewed]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('threat-logs-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'threat_logs',
      }, (payload) => {
        setLogs(prev => [payload.new as ThreatLog, ...prev]);
        toast.error(`🚨 New threat detected: ${(payload.new as ThreatLog).object}`, { duration: 8000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markReviewed = async (id: string) => {
    const { error } = await supabase
      .from('threat_logs')
      .update({ reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to mark as reviewed');
    } else {
      toast.success('Marked as reviewed');
      setLogs(prev => prev.map(l => l.id === id ? { ...l, reviewed: true, reviewed_at: new Date().toISOString() } : l));
    }
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase
      .from('threat_logs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Threat log deleted');
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'critical').length,
    unreviewed: logs.filter(l => !l.reviewed).length,
    withScreenshot: logs.filter(l => l.screenshot_url).length,
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            <h2 className="text-2xl font-bold">Threat Logs</h2>
            <Badge variant="outline" className="text-xs">{stats.total} total</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={fetchLogs} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Threats', value: stats.total, icon: ShieldAlert, color: 'text-destructive' },
            { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-destructive' },
            { label: 'Unreviewed', value: stats.unreviewed, icon: Clock, color: 'text-caution' },
            { label: 'With Screenshot', value: stats.withScreenshot, icon: ImageIcon, color: 'text-primary' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterReviewed} onValueChange={setFilterReviewed}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unreviewed">Unreviewed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Threat Log Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading threat logs...</div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No threat logs found</p>
              <p className="text-xs mt-1">Threats detected by AI Vision will appear here automatically</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {logs.map(log => (
              <Card key={log.id} className={`overflow-hidden transition-all ${!log.reviewed ? 'border-destructive/50 shadow-destructive/10 shadow-lg' : 'opacity-80'}`}>
                {/* Screenshot */}
                {log.screenshot_url && (
                  <div
                    className="relative aspect-video bg-black cursor-pointer group"
                    onClick={() => setImagePreview(log.screenshot_url)}
                  >
                    <img
                      src={log.screenshot_url}
                      alt={`Threat: ${log.object}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Badge className={`absolute top-2 left-2 ${severityColors[log.severity] || 'bg-muted'}`}>
                      {log.severity.toUpperCase()}
                    </Badge>
                    {!log.reviewed && (
                      <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse text-[10px]">
                        NEW
                      </Badge>
                    )}
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  {/* Object + Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        {categoryIcons[log.category] || '⚠️'} {log.object.toUpperCase()}
                      </h3>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {log.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.confidence}% conf
                    </span>
                  </div>

                  {/* Description */}
                  {log.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{log.description}</p>
                  )}

                  {/* Time */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.created_at)}
                  </div>

                  {/* Review status */}
                  {log.reviewed ? (
                    <div className="flex items-center gap-1 text-xs text-safe">
                      <CheckCircle className="w-3.5 h-3.5" /> Reviewed {log.reviewed_at ? `at ${formatTime(log.reviewed_at)}` : ''}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="flex-1 h-7 text-xs gap-1" onClick={() => markReviewed(log.id)}>
                        <CheckCircle className="w-3 h-3" /> Mark Reviewed
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => deleteLog(log.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Auto-cleanup info */}
        <div className="text-center text-[10px] text-muted-foreground">
          ⏰ Screenshots are auto-deleted every 45 minutes • Logs are kept for review
        </div>
      </div>

      {/* Screenshot Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl p-1">
          <DialogHeader className="p-3 pb-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4" /> Threat Screenshot
            </DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <img src={imagePreview} alt="Threat screenshot" className="w-full rounded-b-lg" />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
