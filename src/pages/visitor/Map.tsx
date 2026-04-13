import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Navigation, ZoomIn, ZoomOut, Locate, Layers, MapPin, Thermometer } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapZone {
  id: string;
  name: string;
  name_hi: string | null;
  status: 'green' | 'yellow' | 'red' | 'critical';
  current_count: number;
  capacity: number;
  coordinates: { x: number; y: number; width: number; height: number; type?: string } | null;
}

// Generate a persistent session ID for GPS tracking
function getSessionId(): string {
  let id = localStorage.getItem('visitor_session_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem('visitor_session_id', id);
  }
  return id;
}

export default function MapPage() {
  const { language, t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [userLocation, setUserLocation] = useState<{ x: number; y: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'off' | 'tracking' | 'error'>('off');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  // Fetch zones from DB
  const fetchZones = useCallback(async () => {
    const { data } = await supabase.from('zones').select('*').order('name');
    if (data) {
      setZones(data.map(z => ({
        ...z,
        coordinates: z.coordinates as MapZone['coordinates'],
        status: z.status as MapZone['status'],
      })));
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('visitor-zones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, () => fetchZones())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchZones]);

  // GPS tracking + store in DB
  const startGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('tracking');
    const sessionId = getSessionId();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Map GPS to SVG coordinates (demo mapping using fractional parts)
        const x = 20 + ((lng * 1000) % 60);
        const y = 20 + ((lat * 1000) % 60);
        const clampedX = Math.max(5, Math.min(95, x));
        const clampedY = Math.max(5, Math.min(95, y));
        setUserLocation({ x: clampedX, y: clampedY });

        // Store location in database for admin tracking
        try {
          await supabase.from('visitor_locations').upsert({
            session_id: sessionId,
            latitude: lat,
            longitude: lng,
            map_x: clampedX,
            map_y: clampedY,
            last_seen: new Date().toISOString(),
          }, { onConflict: 'session_id' });
        } catch (e) {
          console.warn('GPS store error:', e);
        }
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getZoneFillColor = (status: string, type?: string) => {
    if (type === 'gate') return { fill: 'hsl(var(--primary) / 0.4)', stroke: 'hsl(var(--primary))' };
    if (type === 'medical') return { fill: 'hsl(var(--danger) / 0.2)', stroke: 'hsl(var(--danger))' };
    if (type === 'parking') return { fill: 'hsl(var(--muted) / 0.5)', stroke: 'hsl(var(--muted-foreground))' };
    switch (status) {
      case 'red': case 'critical': return { fill: 'hsl(var(--danger) / 0.3)', stroke: 'hsl(var(--danger))' };
      case 'yellow': return { fill: 'hsl(var(--caution) / 0.3)', stroke: 'hsl(var(--caution))' };
      default: return { fill: 'hsl(var(--safe) / 0.3)', stroke: 'hsl(var(--safe))' };
    }
  };

  // Heatmap color based on density ratio
  const getHeatmapGradient = (zone: MapZone) => {
    const ratio = zone.current_count / Math.max(1, zone.capacity);
    if (ratio < 0.3) return 'rgba(34, 197, 94, 0.35)'; // green
    if (ratio < 0.5) return 'rgba(234, 179, 8, 0.35)';  // yellow
    if (ratio < 0.7) return 'rgba(249, 115, 22, 0.4)';  // orange
    if (ratio < 0.9) return 'rgba(239, 68, 68, 0.45)';   // red
    return 'rgba(220, 38, 38, 0.6)'; // deep red
  };

  const selectedZoneData = selectedZone ? zones.find((z) => z.id === selectedZone) : null;
  const occupancy = selectedZoneData ? Math.round((selectedZoneData.current_count / (selectedZoneData.capacity || 1)) * 100) : 0;

  return (
    <VisitorLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('map')}</h1>
            <p className="text-muted-foreground text-sm">
              {language === 'hi' ? 'इंटीग्रल यूनिवर्सिटी फेस्ट — लाइव मैप' : 'Integral University Fest — Live Map'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant={gpsStatus === 'tracking' ? 'default' : 'outline'}
              size="icon"
              onClick={startGPS}
            >
              <Locate className={`w-4 h-4 ${gpsStatus === 'tracking' ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* GPS Status */}
          {gpsStatus !== 'off' && (
            <Badge variant={gpsStatus === 'tracking' ? 'default' : 'destructive'} className="gap-1">
              <MapPin className="w-3 h-3" />
              {gpsStatus === 'tracking' ? (language === 'hi' ? 'GPS ट्रैकिंग सक्रिय' : 'GPS Tracking Active') : (language === 'hi' ? 'GPS त्रुटि' : 'GPS Error')}
            </Badge>
          )}

          {/* Heatmap toggle */}
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-danger" />
            <span className="text-sm">{language === 'hi' ? 'हीटमैप' : 'Heatmap'}</span>
            <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
          </div>
        </div>

        {/* Map Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-safe/30 border-2 border-safe" />
            <span>{t('safe')} (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-caution/30 border-2 border-caution" />
            <span>{t('moderate')} (50-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-danger/30 border-2 border-danger" />
            <span>{t('crowded')} (75-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/30 border-2 border-primary" />
            <span>{language === 'hi' ? 'प्रवेश द्वार' : 'Entry Gate'}</span>
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.5), rgba(234,179,8,0.5), rgba(239,68,68,0.6))' }} />
              <span className="text-xs">{language === 'hi' ? 'घनत्व' : 'Density'}</span>
            </div>
          )}
        </div>

        {/* Interactive Map */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-muted/30 overflow-auto" style={{ height: '400px' }}>
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-muted" />
                  </pattern>
                  {/* Radial gradient for heatmap glow */}
                  {showHeatmap && zones.map(zone => {
                    if (!zone.coordinates) return null;
                    const ratio = zone.current_count / Math.max(1, zone.capacity);
                    const r = ratio < 0.3 ? 0 : ratio < 0.5 ? 1 : ratio < 0.7 ? 2 : 3;
                    const colors = [
                      ['rgba(34,197,94,0.0)', 'rgba(34,197,94,0.3)'],
                      ['rgba(234,179,8,0.0)', 'rgba(234,179,8,0.4)'],
                      ['rgba(249,115,22,0.0)', 'rgba(249,115,22,0.5)'],
                      ['rgba(239,68,68,0.0)', 'rgba(239,68,68,0.6)'],
                    ][r];
                    return (
                      <radialGradient key={`hm-${zone.id}`} id={`heatmap-${zone.id}`}>
                        <stop offset="0%" stopColor={colors[1]} />
                        <stop offset="100%" stopColor={colors[0]} />
                      </radialGradient>
                    );
                  })}
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Campus boundary */}
                <rect x="3" y="3" width="94" height="94" rx="2" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1,1" className="text-muted-foreground/30" />
                <text x="50" y="7" textAnchor="middle" className="fill-muted-foreground text-[2px]">INTEGRAL UNIVERSITY — ANNUAL FEST</text>

                {/* Roads */}
                <line x1="50" y1="96" x2="50" y2="75" stroke="currentColor" strokeWidth="0.6" className="text-muted-foreground/20" />
                <line x1="96" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="0.6" className="text-muted-foreground/20" />
                <line x1="4" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="0.6" className="text-muted-foreground/20" />

                {/* Heatmap overlay layer (behind zones) */}
                {showHeatmap && zones.map((zone) => {
                  if (!zone.coordinates) return null;
                  const c = zone.coordinates;
                  const cx = c.x + c.width / 2;
                  const cy = c.y + c.height / 2;
                  const r = Math.max(c.width, c.height) * 0.8;
                  const ratio = zone.current_count / Math.max(1, zone.capacity);
                  if (ratio < 0.05) return null; // Skip nearly empty zones

                  return (
                    <ellipse
                      key={`heat-${zone.id}`}
                      cx={cx}
                      cy={cy}
                      rx={r}
                      ry={r * 0.7}
                      fill={`url(#heatmap-${zone.id})`}
                      opacity={0.7 + ratio * 0.3}
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* Zones */}
                {zones.map((zone) => {
                  if (!zone.coordinates) return null;
                  const c = zone.coordinates;
                  const colors = getZoneFillColor(zone.status, c.type);
                  const isGate = c.type === 'gate';

                  return (
                    <g
                      key={zone.id}
                      className="cursor-pointer transition-all hover:opacity-80"
                      onClick={() => setSelectedZone(zone.id)}
                    >
                      <rect
                        x={c.x} y={c.y} width={c.width} height={c.height}
                        rx={isGate ? 1 : 0.5}
                        fill={showHeatmap ? getHeatmapGradient(zone) : colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={selectedZone === zone.id ? 0.6 : 0.3}
                        strokeDasharray={isGate ? '1,0.5' : undefined}
                      />
                      <text
                        x={c.x + c.width / 2} y={c.y + c.height / 2}
                        textAnchor="middle" dominantBaseline="middle"
                        className="fill-foreground text-[2px] font-medium pointer-events-none"
                      >
                        {isGate ? '🚪 ' : ''}{language === 'hi' ? (zone.name_hi || zone.name) : zone.name}
                      </text>
                      <text
                        x={c.x + c.width / 2} y={c.y + c.height / 2 + 3}
                        textAnchor="middle" dominantBaseline="middle"
                        className="fill-muted-foreground text-[1.5px] pointer-events-none"
                      >
                        {zone.current_count}/{zone.capacity}
                        {showHeatmap && ` (${Math.round((zone.current_count / Math.max(1, zone.capacity)) * 100)}%)`}
                      </text>
                    </g>
                  );
                })}

                {/* User GPS location */}
                {userLocation && (
                  <g>
                    <circle cx={userLocation.x} cy={userLocation.y} r="3" fill="hsl(var(--primary) / 0.2)" className="animate-pulse" />
                    <circle cx={userLocation.x} cy={userLocation.y} r="1.5" fill="hsl(var(--primary))" stroke="white" strokeWidth="0.4" />
                    <text x={userLocation.x} y={userLocation.y - 4} textAnchor="middle" className="fill-primary text-[2px] font-bold">
                      📍 {language === 'hi' ? 'आप' : 'You'}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Selected Zone Details */}
        {selectedZoneData && (
          <Card className="glass-card animate-slide-in-right">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {language === 'hi' ? (selectedZoneData.name_hi || selectedZoneData.name) : selectedZoneData.name}
                </CardTitle>
                <StatusBadge status={selectedZoneData.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{occupancy}%</p>
                  <p className="text-xs text-muted-foreground">{language === 'hi' ? 'अधिभोग' : 'Occupancy'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{selectedZoneData.current_count}</p>
                  <p className="text-xs text-muted-foreground">{language === 'hi' ? 'वर्तमान' : 'Current'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{selectedZoneData.capacity.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{language === 'hi' ? 'क्षमता' : 'Capacity'}</p>
                </div>
              </div>
              <Button className="w-full mt-4 gap-2">
                <Navigation className="w-4 h-4" />
                {language === 'hi' ? 'यहाँ नेविगेट करें' : 'Navigate Here'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Zone List */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {language === 'hi' ? 'सभी क्षेत्र' : 'All Zones'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {zones.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {language === 'hi' ? 'कोई ज़ोन उपलब्ध नहीं' : 'No zones available yet'}
                </p>
              )}
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedZone === zone.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={zone.status} showLabel={false} size="sm" />
                    <span className="font-medium text-sm">
                      {language === 'hi' ? (zone.name_hi || zone.name) : zone.name}
                    </span>
                    {(zone.coordinates as any)?.type === 'gate' && (
                      <Badge variant="outline" className="text-[10px]">Gate</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {zone.current_count}/{zone.capacity}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </VisitorLayout>
  );
}
