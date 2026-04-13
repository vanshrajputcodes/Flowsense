import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealtimeZones, useRealtimeQueues } from '@/hooks/useRealtime';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS = ['hsl(var(--safe))', 'hsl(var(--caution))', 'hsl(var(--danger))', 'hsl(var(--primary))'];

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const { zones, isLoading: zonesLoading } = useRealtimeZones();
  const { queues, isLoading: queuesLoading } = useRealtimeQueues();
  
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [zoneDistribution, setZoneDistribution] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Calculate summary stats
  const totalVisitors = zones.reduce((sum, z) => sum + z.current_count, 0);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalVisitors / totalCapacity) * 100) : 0;
  const activeQueues = queues.filter(q => q.status === 'active').length;

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, zones]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    
    // Generate simulated daily data based on date range
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const baseVisitors = 15000 + Math.random() * 10000;
      daily.push({
        date: format(date, 'MMM dd'),
        visitors: Math.round(baseVisitors),
        capacity: 30000,
        incidents: Math.floor(Math.random() * 5),
      });
    }
    setDailyData(daily);

    // Generate hourly data for today
    const hourly = [];
    const currentHour = new Date().getHours();
    for (let h = 6; h <= 22; h++) {
      const baseValue = getHourlyPattern(h);
      hourly.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        visitors: h <= currentHour ? Math.round(baseValue * (0.9 + Math.random() * 0.2)) : null,
        predicted: baseValue,
      });
    }
    setHourlyData(hourly);

    // Zone distribution from real data
    if (zones.length > 0) {
      const distribution = zones.map(zone => ({
        name: language === 'hi' ? (zone.name_hi || zone.name) : zone.name,
        value: zone.current_count,
        capacity: zone.capacity,
        status: zone.status,
      }));
      setZoneDistribution(distribution);
    }

    // Queue statistics from real data
    if (queues.length > 0) {
      const stats = queues.map(queue => ({
        name: language === 'hi' ? (queue.name_hi || queue.name) : queue.name,
        waiting: queue.current_token,
        avgTime: Math.round((queue.avg_service_time || 120) / 60),
        status: queue.status,
      }));
      setQueueStats(stats);
    }

    setIsLoading(false);
  };

  const getHourlyPattern = (hour: number): number => {
    const patterns: Record<number, number> = {
      6: 1200, 7: 2400, 8: 4500, 9: 6800, 10: 9200,
      11: 12500, 12: 15000, 13: 16500, 14: 17200,
      15: 16800, 16: 15500, 17: 14000, 18: 11000,
      19: 7500, 20: 4000, 21: 2000, 22: 1000,
    };
    return patterns[hour] || 5000;
  };

  const handleExport = () => {
    const csvContent = dailyData.map(row => 
      `${row.date},${row.visitors},${row.capacity},${row.incidents}`
    ).join('\n');
    const blob = new Blob([`Date,Visitors,Capacity,Incidents\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'hi' ? 'विश्लेषण' : 'Analytics'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'hi' ? 'विस्तृत आंकड़े और रुझान' : 'Detailed statistics and trends'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              {language === 'hi' ? 'निर्यात' : 'Export'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAnalyticsData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'वर्तमान आगंतुक' : 'Current Visitors'}
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalVisitors.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1 text-safe text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12%</span>
                  </div>
                </div>
                <div className="p-4 rounded-full bg-primary/10">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'औसत अधिभोग' : 'Avg Occupancy'}
                  </p>
                  <p className="text-3xl font-bold mt-1">{avgOccupancy}%</p>
                  <div className="flex items-center gap-1 mt-1 text-caution text-sm">
                    <Activity className="w-4 h-4" />
                    <span>{language === 'hi' ? 'सामान्य' : 'Normal'}</span>
                  </div>
                </div>
                <div className="p-4 rounded-full bg-caution/10">
                  <BarChart3 className="w-8 h-8 text-caution" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'सक्रिय कतारें' : 'Active Queues'}
                  </p>
                  <p className="text-3xl font-bold mt-1">{activeQueues}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {queues.length} {language === 'hi' ? 'कुल' : 'total'}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-safe/10">
                  <Clock className="w-8 h-8 text-safe" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'कुल क्षमता' : 'Total Capacity'}
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalCapacity.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {zones.length} {language === 'hi' ? 'क्षेत्र' : 'zones'}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-primary/10">
                  <PieChart className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Tabs */}
        <Tabs defaultValue="7d" onValueChange={(v) => setDateRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">{language === 'hi' ? '7 दिन' : '7 Days'}</TabsTrigger>
            <TabsTrigger value="30d">{language === 'hi' ? '30 दिन' : '30 Days'}</TabsTrigger>
            <TabsTrigger value="90d">{language === 'hi' ? '90 दिन' : '90 Days'}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Visitors Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {language === 'hi' ? 'दैनिक आगंतुक' : 'Daily Visitors'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
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
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorVisitors)"
                        name={language === 'hi' ? 'आगंतुक' : 'Visitors'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Pattern Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-caution" />
                {language === 'hi' ? 'आज का पैटर्न' : "Today's Pattern"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name={language === 'hi' ? 'वास्तविक' : 'Actual'}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--caution))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name={language === 'hi' ? 'अनुमानित' : 'Predicted'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Zone Distribution & Queue Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Zone Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'hi' ? 'क्षेत्र वितरण' : 'Zone Distribution'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {zonesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : zoneDistribution.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">
                  {language === 'hi' ? 'कोई डेटा नहीं' : 'No data available'}
                </p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        name={language === 'hi' ? 'आगंतुक' : 'Visitors'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'hi' ? 'कतार प्रदर्शन' : 'Queue Performance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queuesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : queueStats.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">
                  {language === 'hi' ? 'कोई कतार नहीं' : 'No queues configured'}
                </p>
              ) : (
                <div className="space-y-4">
                  {queueStats.map((queue, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{queue.name}</span>
                        <Badge variant={queue.status === 'active' ? 'default' : 'secondary'}>
                          {queue.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            {language === 'hi' ? 'प्रतीक्षा में' : 'Waiting'}
                          </p>
                          <p className="text-lg font-bold">{queue.waiting}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {language === 'hi' ? 'औसत समय' : 'Avg Time'}
                          </p>
                          <p className="text-lg font-bold">{queue.avgTime} min</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}