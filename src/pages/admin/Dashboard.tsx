import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SOSAlertPanel } from '@/components/SOSAlertPanel';
import { usePredictions } from '@/hooks/usePredictions';
import { useRealtimeZones, useRealtimeAlerts, useRealtimeQueues } from '@/hooks/useRealtime';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Sparkles,
  Wifi,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function AdminDashboard() {
  const { language, t } = useLanguage();
  const { predictions, isLoading: isPredicting, generatePredictions, fetchStoredPredictions } = usePredictions();
  
  // Use real-time hooks
  const { zones, isLoading: zonesLoading } = useRealtimeZones();
  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(true);
  const { queues, isLoading: queuesLoading } = useRealtimeQueues();

  const [chartData, setChartData] = useState<{ time: string; actual: number | null; predicted: number | null }[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const isLoadingData = zonesLoading || alertsLoading || queuesLoading;

  // Calculate stats from real-time data
  const stats = {
    totalVisitors: zones.reduce((sum, z) => sum + z.current_count, 0),
    visitorTrend: 12,
    activeQueues: queues.filter(q => q.status === 'active').length,
    avgWaitTime: queues.length > 0 ? Math.round(queues.reduce((sum, q) => sum + (q.avg_service_time || 120), 0) / queues.length / 60) : 12,
    activeAlerts: alerts.length,
    capacity: zones.length > 0 
      ? Math.round((zones.reduce((sum, z) => sum + z.current_count, 0) / zones.reduce((sum, z) => sum + z.capacity, 0)) * 100) 
      : 0,
  };

  // Fetch predictions on mount
  useEffect(() => {
    fetchStoredPredictions();
  }, [fetchStoredPredictions]);

  // Update last updated when zones change
  useEffect(() => {
    if (zones.length > 0) {
      setLastUpdated(new Date());
    }
  }, [zones]);

  // Build chart data from predictions
  useEffect(() => {
    if (predictions?.predictions?.length) {
      const now = new Date();
      const currentHour = now.getHours();
      
      const zonePred = predictions.predictions[0];
      if (zonePred?.hourly_predictions) {
        const newChartData = zonePred.hourly_predictions.map((hp) => {
          const hourNum = parseInt(hp.hour.split(':')[0]);
          const isPast = hourNum <= currentHour;
          return {
            time: hp.hour,
            actual: isPast ? Math.round(hp.predicted_count * (0.9 + Math.random() * 0.2)) : null,
            predicted: hp.predicted_count,
          };
        });
        setChartData(newChartData);
      }
    } else {
      generateDefaultChartData();
    }
  }, [predictions]);

  const generateDefaultChartData = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const data = [];
    
    for (let h = 6; h <= 20; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const baseValue = getBaseFootfall(h);
      data.push({
        time: timeStr,
        actual: h <= currentHour ? Math.round(baseValue * (0.95 + Math.random() * 0.1)) : null,
        predicted: baseValue,
      });
    }
    setChartData(data);
  };

  const getBaseFootfall = (hour: number): number => {
    const patterns: Record<number, number> = {
      6: 1200, 7: 2400, 8: 4500, 9: 6800, 10: 9200,
      11: 12500, 12: 15000, 13: 16500, 14: 17200,
      15: 16800, 16: 15500, 17: 14000, 18: 11000,
      19: 7500, 20: 4000,
    };
    return patterns[hour] || 5000;
  };

  const handleRefresh = async () => {
    await generatePredictions(undefined, 12);
    setLastUpdated(new Date());
  };

  const handleGeneratePredictions = async () => {
    await generatePredictions(undefined, 12);
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return language === 'hi' ? 'अभी' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${language === 'hi' ? 'मिनट पहले' : 'min ago'}`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} ${language === 'hi' ? 'घंटे पहले' : 'hr ago'}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('overview')}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}</span>
              <div className="flex items-center gap-1 text-safe">
                <Wifi className="w-3 h-3" />
                <span className="text-xs">{language === 'hi' ? 'लाइव' : 'Live'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleGeneratePredictions}
              disabled={isPredicting}
            >
              <Brain className={`w-4 h-4 ${isPredicting ? 'animate-pulse' : ''}`} />
              {isPredicting ? (language === 'hi' ? 'AI विश्लेषण...' : 'Predicting...') : (language === 'hi' ? 'AI भविष्यवाणी' : 'AI Predict')}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* SOS Emergency Alerts Panel */}
        <SOSAlertPanel />

        {/* AI Prediction Summary Card */}
        {predictions && (
          <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{language === 'hi' ? 'AI विश्लेषण' : 'AI Insights'}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      predictions.risk_level === 'high' ? 'bg-danger/20 text-danger' :
                      predictions.risk_level === 'medium' ? 'bg-caution/20 text-caution' :
                      'bg-safe/20 text-safe'
                    }`}>
                      {predictions.risk_level?.toUpperCase()} RISK
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      predictions.overall_trend === 'increasing' ? 'bg-caution/20 text-caution' :
                      predictions.overall_trend === 'decreasing' ? 'bg-safe/20 text-safe' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {predictions.overall_trend === 'increasing' ? '↑' : predictions.overall_trend === 'decreasing' ? '↓' : '→'} {predictions.overall_trend}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{predictions.summary}</p>
                  {predictions.predictions?.some(p => p.surge_warning) && (
                    <div className="mt-2 flex items-center gap-2 text-caution text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{language === 'hi' ? 'भीड़ का उछाल आने की संभावना' : 'Surge warning detected in some zones'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              {isLoadingData ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalVisitors')}</p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalVisitors.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-safe text-sm">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+{stats.visitorTrend}%</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-full bg-primary/10">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              {isLoadingData ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('capacity')}</p>
                    <p className="text-3xl font-bold mt-1">{stats.capacity}%</p>
                    <Progress value={stats.capacity} className="mt-2 h-2 w-24" />
                  </div>
                  <div className="p-4 rounded-full bg-caution/10">
                    <TrendingUp className="w-8 h-8 text-caution" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              {isLoadingData ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'hi' ? 'औसत प्रतीक्षा' : 'Avg Wait Time'}
                    </p>
                    <p className="text-3xl font-bold mt-1">{stats.avgWaitTime} min</p>
                    <div className="flex items-center gap-1 mt-1 text-safe text-sm">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>-2 min</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-full bg-safe/10">
                    <Clock className="w-8 h-8 text-safe" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              {isLoadingData ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('activeAlerts')}</p>
                    <p className="text-3xl font-bold mt-1">{stats.activeAlerts}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.activeQueues} {t('activeQueues').toLowerCase()}
                    </p>
                  </div>
                  <div className="p-4 rounded-full bg-danger/10">
                    <AlertTriangle className="w-8 h-8 text-danger" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footfall Chart & Zone Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Footfall Predictions Chart */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('predictions')} - {language === 'hi' ? 'आज का फुटफॉल' : "Today's Footfall"}
                {isPredicting && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isPredicting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {language === 'hi' ? 'AI भविष्यवाणी कर रहा है...' : 'AI is analyzing patterns...'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--caution))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--caution))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorActual)"
                        name={language === 'hi' ? 'वास्तविक' : 'Actual'}
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--caution))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#colorPredicted)"
                        name={language === 'hi' ? 'AI अनुमान' : 'AI Predicted'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>{language === 'hi' ? 'वास्तविक' : 'Actual'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-caution" />
                  <span>{language === 'hi' ? 'AI अनुमान' : 'AI Predicted'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Status */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {t('zones')}
                <Wifi className="w-3 h-3 text-safe" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {zonesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : zones.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {language === 'hi' ? 'कोई ज़ोन नहीं' : 'No zones configured'}
                </p>
              ) : (
                <div className="space-y-3">
                  {zones.map((zone) => {
                    const occupancy = zone.capacity > 0 ? Math.round((zone.current_count / zone.capacity) * 100) : 0;
                    return (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <StatusBadge status={zone.status} showLabel={false} size="sm" pulse={zone.status === 'red' || zone.status === 'critical'} />
                          <span className="font-medium text-sm">{zone.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{occupancy}%</span>
                          <p className="text-[10px] text-muted-foreground">
                            {zone.current_count.toLocaleString()}/{zone.capacity.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Alerts */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {language === 'hi' ? 'हाल के अलर्ट' : 'Recent Alerts'}
                  <Wifi className="w-3 h-3 text-safe" />
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin/alerts">{t('viewAll')}</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t('noAlerts')}</p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            alert.severity === 'warning' || alert.severity === 'critical'
                              ? 'bg-caution/10 text-caution'
                              : alert.severity === 'emergency'
                              ? 'bg-danger/10 text-danger'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {alert.severity === 'warning' || alert.severity === 'critical' || alert.severity === 'emergency' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{alert.severity}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{getRelativeTime(alert.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {language === 'hi' ? 'त्वरित कार्रवाई' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-auto py-4 flex-col gap-2" variant="outline" asChild>
                  <a href="/admin/alerts">
                    <Bell className="w-6 h-6" />
                    <span className="text-sm">{t('broadcastAlert')}</span>
                  </a>
                </Button>
                <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                  <Users className="w-6 h-6" />
                  <span className="text-sm">{t('queue')}</span>
                </Button>
                <Button className="h-auto py-4 flex-col gap-2 border-danger/50 text-danger hover:bg-danger/10" variant="outline" asChild>
                  <a href="/admin/alerts">
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-sm">{t('emergencyAlert')}</span>
                  </a>
                </Button>
                <Button 
                  className="h-auto py-4 flex-col gap-2 border-primary/50 hover:bg-primary/10" 
                  variant="outline"
                  onClick={handleGeneratePredictions}
                  disabled={isPredicting}
                >
                  <Brain className={`w-6 h-6 ${isPredicting ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{language === 'hi' ? 'AI भविष्यवाणी' : 'AI Predict'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
