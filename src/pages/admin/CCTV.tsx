import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  AlertTriangle,
  Activity,
  Eye,
  UserX,
  Package,
  TrendingUp,
  Zap,
  Shield,
  Wifi,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CameraDetection } from '@/components/CameraDetection';

interface CCTVZone {
  id: string;
  name: string;
  count: number;
  density: number;
  status: 'green' | 'yellow' | 'red';
  alerts: string[];
}

interface DetectionEvent {
  id: string;
  type: 'behavior' | 'abandoned' | 'suspicious';
  zone: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Simulated CCTV zones with AI detection
const initialZones: CCTVZone[] = [
  { id: 'z1', name: 'Main Entry Gate', count: 234, density: 42, status: 'green', alerts: [] },
  { id: 'z2', name: 'Event Area', count: 512, density: 78, status: 'yellow', alerts: ['High density detected'] },
  { id: 'z3', name: 'Food Plaza', count: 389, density: 89, status: 'red', alerts: ['Overcrowding', 'Running detected'] },
  { id: 'z4', name: 'Visitor Parking', count: 120, density: 30, status: 'green', alerts: [] },
];

export default function AdminCCTVPage() {
  const [zones, setZones] = useState<CCTVZone[]>(initialZones);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [selectedZone, setSelectedZone] = useState<CCTVZone | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [cameraPersonCount, setCameraPersonCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCameraAnomaly = useCallback((type: string, description: string) => {
    const event: DetectionEvent = {
      id: Math.random().toString(36).slice(2),
      type: type as DetectionEvent['type'],
      zone: 'Live Camera',
      description,
      severity: 'high',
      timestamp: new Date(),
    };
    setEvents((prev) => [event, ...prev].slice(0, 20));
    toast.error(`🚨 Camera Detection: ${description}`, { duration: 5000 });
  }, []);

  const generateEvent = (zones: CCTVZone[]): DetectionEvent => {
    const types: DetectionEvent['type'][] = ['behavior', 'abandoned', 'suspicious'];
    const descriptions = {
      behavior: ['Running crowd detected', 'Sudden directional shift', 'Fast density increase', 'Panic movement pattern'],
      abandoned: ['Unattended bag detected', 'Stationary object >60s', 'Abandoned luggage', 'Unattended package'],
      suspicious: ['Loitering detected', 'Restricted area entry attempt', 'Reverse crowd movement', 'High risk person tracked'],
    };
    const type = types[Math.floor(Math.random() * types.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const desc = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
    return {
      id: Math.random().toString(36).slice(2),
      type,
      zone: zone.name,
      description: desc,
      severity: zone.status === 'red' ? 'high' : zone.status === 'yellow' ? 'medium' : 'low',
      timestamp: new Date(),
    };
  };

  useEffect(() => {
    // Update total from DB
    const fetchZoneCounts = async () => {
      const { data } = await supabase.from('zones').select('current_count');
      if (data) {
        const total = data.reduce((s, z) => s + (z.current_count || 0), 0);
        setTotalCount(total);
      }
    };
    fetchZoneCounts();
  }, []);

  // Simulate AI detection
  const toggleSimulation = () => {
    if (simulationActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSimulationActive(false);
      return;
    }
    setSimulationActive(true);
    intervalRef.current = setInterval(() => {
      // Update zone counts
      setZones((prev) => prev.map((z) => ({
        ...z,
        count: Math.max(0, z.count + Math.floor((Math.random() - 0.4) * 20)),
        density: Math.min(100, Math.max(0, z.density + Math.floor((Math.random() - 0.4) * 5))),
      })));
      // Random event
      if (Math.random() > 0.5) {
        const event = generateEvent(zones);
        setEvents((prev) => [event, ...prev].slice(0, 20));
        if (event.severity === 'high') {
          toast.error(`🚨 ${event.type.toUpperCase()}: ${event.description} — ${event.zone}`, { duration: 5000 });
        }
      }
    }, 2500);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const severityColor = (s: DetectionEvent['severity']) =>
    s === 'high' ? 'text-danger border-danger/30 bg-danger/5'
    : s === 'medium' ? 'text-caution border-caution/30 bg-caution/5'
    : 'text-muted-foreground border-border bg-muted/30';

  const typeIcon = (t: DetectionEvent['type']) =>
    t === 'behavior' ? Activity : t === 'abandoned' ? Package : UserX;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              AI CCTV & Detection
            </h1>
            <p className="text-muted-foreground text-sm">Real-time crowd counting, behavior & anomaly detection</p>
          </div>
          <Button
            onClick={toggleSimulation}
            variant={simulationActive ? 'destructive' : 'default'}
            className="gap-2"
          >
            {simulationActive ? <><Wifi className="w-4 h-4 animate-pulse" />Stop AI Feed</> : <><Zap className="w-4 h-4" />Start AI Feed</>}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Live Camera Count', value: cameraPersonCount, icon: Eye, color: 'text-primary' },
            { label: 'High Density Zones', value: zones.filter((z) => z.status === 'red').length, icon: TrendingUp, color: 'text-danger' },
            { label: 'Active Alerts', value: events.filter((e) => e.severity === 'high').length, icon: AlertTriangle, color: 'text-caution' },
            { label: 'Cameras Online', value: zones.length + 1, icon: Camera, color: 'text-safe' },
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

        {/* Real Camera Detection */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <CameraDetection
              onPersonCountChange={setCameraPersonCount}
              onAnomalyDetected={handleCameraAnomaly}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CCTV Zone Grid */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" /> Zone Feeds
            </h2>
            {zones.map((zone) => (
              <Card
                key={zone.id}
                className={`glass-card cursor-pointer transition-all hover:shadow-md ${selectedZone?.id === zone.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedZone(zone.id === selectedZone?.id ? null : zone)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${simulationActive ? 'animate-pulse' : ''} ${zone.status === 'red' ? 'bg-danger' : zone.status === 'yellow' ? 'bg-caution' : 'bg-safe'}`} />
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        zone.status === 'red' ? 'border-danger/30 text-danger' :
                        zone.status === 'yellow' ? 'border-caution/30 text-caution' :
                        'border-safe/30 text-safe'
                      }>
                        {zone.status === 'red' ? 'Overcrowded' : zone.status === 'yellow' ? 'Busy' : 'Clear'}
                      </Badge>
                    </div>
                  </div>

                  {/* Simulated camera view */}
                  <div className="relative rounded-lg bg-black/80 h-28 mb-3 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-background to-muted" />
                    {simulationActive && (
                      <div className="absolute inset-0 opacity-20">
                        {Array.from({ length: zone.count > 300 ? 12 : zone.count > 150 ? 7 : 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-3 h-6 bg-primary/60 rounded-sm"
                            style={{
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 70}%`,
                              transform: 'translateX(-50%)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="relative z-10 text-center text-white">
                      <p className="text-3xl font-bold">{zone.count}</p>
                      <p className="text-xs text-white/60">persons detected</p>
                    </div>
                    {simulationActive && (
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                        <span className="text-[10px] text-white/80 uppercase">Live</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Density</span>
                      <span>{zone.density}%</span>
                    </div>
                    <Progress value={zone.density} className="h-1.5" />
                  </div>

                  {zone.alerts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {zone.alerts.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-danger border-danger/30 bg-danger/5">
                          <AlertTriangle className="w-2.5 h-2.5 mr-1" />{a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detection Events */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" /> Detection Events
              {events.length > 0 && (
                <Badge variant="secondary">{events.length}</Badge>
              )}
            </h2>

            {/* Detection type legend */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Behavior', icon: Activity, color: 'text-caution' },
                { label: 'Abandoned Object', icon: Package, color: 'text-primary' },
                { label: 'Suspicious', icon: UserX, color: 'text-danger' },
              ].map((t) => (
                <Badge key={t.label} variant="outline" className="gap-1">
                  <t.icon className={`w-3 h-3 ${t.color}`} />
                  {t.label}
                </Badge>
              ))}
            </div>

            {events.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No detection events yet</p>
                  <p className="text-xs mt-1">Start AI Feed to enable detection</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {events.map((ev) => {
                  const Icon = typeIcon(ev.type);
                  return (
                    <Card key={ev.id} className={`border ${severityColor(ev.severity)}`}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          ev.severity === 'high' ? 'text-danger' : ev.severity === 'medium' ? 'text-caution' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold uppercase">{ev.type}</span>
                            <Badge variant="outline" className="text-[10px]">{ev.zone}</Badge>
                            <Badge variant="outline" className={`text-[10px] ${ev.severity === 'high' ? 'text-danger border-danger/30' : ev.severity === 'medium' ? 'text-caution border-caution/30' : ''}`}>
                              {ev.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mt-0.5">{ev.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {ev.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
