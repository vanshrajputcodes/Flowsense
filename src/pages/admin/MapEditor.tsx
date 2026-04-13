import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Plus, Trash2, Save, Edit2, RotateCcw, Locate, Users, GripVertical, Eye
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapZone {
  id: string;
  name: string;
  name_hi: string | null;
  description: string | null;
  capacity: number;
  current_count: number;
  status: 'green' | 'yellow' | 'red' | 'critical';
  coordinates: { x: number; y: number; width: number; height: number; type?: string } | null;
}

interface VisitorDot {
  id: string;
  session_id: string;
  map_x: number;
  map_y: number;
  last_seen: string;
}

const IU_FEST_PRESET: Omit<MapZone, 'id'>[] = [
  { name: 'Gate 1 - Main Entry', name_hi: 'गेट 1 - मुख्य प्रवेश', description: 'Main entrance from Sitapur Road', capacity: 3000, current_count: 0, status: 'green', coordinates: { x: 45, y: 88, width: 14, height: 8, type: 'gate' } },
  { name: 'Gate 2 - East Entry', name_hi: 'गेट 2 - पूर्वी प्रवेश', description: 'East side entrance near parking', capacity: 2000, current_count: 0, status: 'green', coordinates: { x: 85, y: 50, width: 10, height: 8, type: 'gate' } },
  { name: 'Gate 3 - West Entry', name_hi: 'गेट 3 - पश्चिमी प्रवेश', description: 'West side entrance from hostel area', capacity: 2000, current_count: 0, status: 'green', coordinates: { x: 5, y: 50, width: 10, height: 8, type: 'gate' } },
  { name: 'Main Stage', name_hi: 'मुख्य मंच', description: 'Central performance stage area', capacity: 5000, current_count: 0, status: 'green', coordinates: { x: 35, y: 30, width: 30, height: 20, type: 'stage' } },
  { name: 'Food Court', name_hi: 'फूड कोर्ट', description: 'Food stalls and dining area', capacity: 2000, current_count: 0, status: 'green', coordinates: { x: 70, y: 25, width: 18, height: 15, type: 'food' } },
  { name: 'Exhibition Hall', name_hi: 'प्रदर्शनी हॉल', description: 'Tech exhibition and project showcase', capacity: 1500, current_count: 0, status: 'green', coordinates: { x: 12, y: 25, width: 18, height: 15, type: 'building' } },
  { name: 'Sports Ground', name_hi: 'खेल मैदान', description: 'Outdoor sports and competitions area', capacity: 3000, current_count: 0, status: 'green', coordinates: { x: 35, y: 55, width: 25, height: 18, type: 'ground' } },
  { name: 'Parking Zone A', name_hi: 'पार्किंग ज़ोन A', description: 'Main parking area near Gate 1', capacity: 500, current_count: 0, status: 'green', coordinates: { x: 25, y: 80, width: 15, height: 8, type: 'parking' } },
  { name: 'Parking Zone B', name_hi: 'पार्किंग ज़ोन B', description: 'East parking near Gate 2', capacity: 400, current_count: 0, status: 'green', coordinates: { x: 75, y: 70, width: 15, height: 10, type: 'parking' } },
  { name: 'Medical Center', name_hi: 'चिकित्सा केंद्र', description: 'First aid and medical assistance', capacity: 100, current_count: 0, status: 'green', coordinates: { x: 60, y: 55, width: 10, height: 8, type: 'medical' } },
  { name: 'Registration Desk', name_hi: 'पंजीकरण काउंटर', description: 'Entry registration and passes', capacity: 500, current_count: 0, status: 'green', coordinates: { x: 40, y: 78, width: 15, height: 6, type: 'building' } },
  { name: 'Rest & Lounge Area', name_hi: 'विश्राम क्षेत्र', description: 'Seating and rest zone with shade', capacity: 800, current_count: 0, status: 'green', coordinates: { x: 12, y: 55, width: 15, height: 12, type: 'rest' } },
];

export default function AdminMapEditorPage() {
  const [zones, setZones] = useState<MapZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<MapZone | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [visitors, setVisitors] = useState<VisitorDot[]>([]);
  const [showVisitors, setShowVisitors] = useState(true);

  const fetchZones = useCallback(async () => {
    const { data, error } = await supabase.from('zones').select('*').order('name');
    if (error) { toast.error('Failed to load zones'); return; }
    setZones((data || []).map(z => ({
      ...z,
      coordinates: z.coordinates as MapZone['coordinates'],
      status: z.status as MapZone['status'],
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Fetch visitor locations
  const fetchVisitors = useCallback(async () => {
    // Only fetch visitors seen in last 5 minutes
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('visitor_locations')
      .select('id, session_id, map_x, map_y, last_seen')
      .gte('last_seen', cutoff);
    if (data) {
      setVisitors(data as VisitorDot[]);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
    // Poll every 3 seconds for updated positions
    const interval = setInterval(fetchVisitors, 3000);
    return () => clearInterval(interval);
  }, [fetchVisitors]);

  // Realtime visitor location subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-visitor-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_locations' }, () => fetchVisitors())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchVisitors]);

  const loadIUFestPreset = async () => {
    const confirm = window.confirm('This will delete all existing zones and load the Integral University Fest preset with 3 gates. Continue?');
    if (!confirm) return;
    toast.info('Setting up IU Fest map...');
    await supabase.from('zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    for (const zone of IU_FEST_PRESET) {
      await supabase.from('zones').insert({
        name: zone.name, name_hi: zone.name_hi, description: zone.description,
        capacity: zone.capacity, current_count: zone.current_count, status: zone.status, coordinates: zone.coordinates,
      });
    }
    toast.success('IU Fest map loaded with 3 gates + zones!');
    fetchZones();
  };

  const saveZone = async (zone: MapZone) => {
    const { error } = await supabase.from('zones').update({
      name: zone.name, name_hi: zone.name_hi, description: zone.description,
      capacity: zone.capacity, status: zone.status, coordinates: zone.coordinates,
    }).eq('id', zone.id);
    if (error) { toast.error('Failed to save zone'); return; }
    toast.success(`Zone "${zone.name}" saved`);
    setEditingZone(null);
    fetchZones();
  };

  const addZone = async () => {
    const { error } = await supabase.from('zones').insert({
      name: 'New Zone', capacity: 1000, current_count: 0, status: 'green',
      coordinates: { x: 40, y: 40, width: 15, height: 10, type: 'building' },
    });
    if (error) { toast.error('Failed to add zone'); return; }
    toast.success('Zone added');
    fetchZones();
  };

  const deleteZone = async (id: string) => {
    if (!window.confirm('Delete this zone?')) return;
    const { error } = await supabase.from('zones').delete().eq('id', id);
    if (error) { toast.error('Failed to delete zone'); return; }
    toast.success('Zone deleted');
    if (selectedZoneId === id) setSelectedZoneId(null);
    fetchZones();
  };

  const getZoneColor = (status: string, type?: string) => {
    if (type === 'gate') return { fill: 'hsl(var(--primary) / 0.4)', stroke: 'hsl(var(--primary))' };
    if (type === 'medical') return { fill: 'hsl(var(--danger) / 0.2)', stroke: 'hsl(var(--danger))' };
    if (type === 'parking') return { fill: 'hsl(var(--muted) / 0.5)', stroke: 'hsl(var(--muted-foreground))' };
    switch (status) {
      case 'red': case 'critical': return { fill: 'hsl(var(--danger) / 0.3)', stroke: 'hsl(var(--danger))' };
      case 'yellow': return { fill: 'hsl(var(--caution) / 0.3)', stroke: 'hsl(var(--caution))' };
      default: return { fill: 'hsl(var(--safe) / 0.3)', stroke: 'hsl(var(--safe))' };
    }
  };

  // SVG drag handling
  const handleSvgMouseDown = (e: React.MouseEvent<SVGElement>, zoneId: string) => {
    e.preventDefault();
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm);
    setDragging(zoneId);
    setDragStart({ x: svgPt.x, y: svgPt.y });
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !dragStart) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm);
    const dx = svgPt.x - dragStart.x;
    const dy = svgPt.y - dragStart.y;

    setZones(prev => prev.map(z => {
      if (z.id !== dragging || !z.coordinates) return z;
      return {
        ...z,
        coordinates: {
          ...z.coordinates,
          x: Math.max(0, Math.min(95, z.coordinates.x + dx)),
          y: Math.max(0, Math.min(95, z.coordinates.y + dy)),
        },
      };
    }));
    setDragStart({ x: svgPt.x, y: svgPt.y });
  };

  const handleSvgMouseUp = async () => {
    if (dragging) {
      const zone = zones.find(z => z.id === dragging);
      if (zone?.coordinates) {
        await supabase.from('zones').update({ coordinates: zone.coordinates }).eq('id', zone.id);
      }
    }
    setDragging(null);
    setDragStart(null);
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Map & Zone Editor
            </h1>
            <p className="text-muted-foreground text-sm">Drag zones on map, edit properties, manage event layout</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Visitor tracking toggle */}
            <div className="flex items-center gap-2 mr-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm">Visitors</span>
              <Switch checked={showVisitors} onCheckedChange={setShowVisitors} />
              {showVisitors && visitors.length > 0 && (
                <Badge variant="secondary" className="text-xs">{visitors.length} active</Badge>
              )}
            </div>
            <Button variant="outline" onClick={loadIUFestPreset} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Load IU Fest Preset
            </Button>
            <Button onClick={addZone} className="gap-2">
              <Plus className="w-4 h-4" /> Add Zone
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Canvas */}
          <div className="lg:col-span-2">
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Locate className="w-4 h-4" /> Integral University Annual Fest — Event Map
                  {showVisitors && visitors.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 ml-2">
                      <Users className="w-3 h-3" /> {visitors.length} visitors tracked
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative bg-muted/20 rounded-lg border border-border" style={{ height: 500 }}>
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full cursor-crosshair"
                    preserveAspectRatio="xMidYMid meet"
                    onMouseMove={handleSvgMouseMove}
                    onMouseUp={handleSvgMouseUp}
                    onMouseLeave={handleSvgMouseUp}
                  >
                    {/* Grid */}
                    <defs>
                      <pattern id="editorGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.08" className="text-muted-foreground/20" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#editorGrid)" />

                    {/* Campus boundary */}
                    <rect x="3" y="3" width="94" height="94" rx="2" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1,1" className="text-muted-foreground/30" />
                    <text x="50" y="7" textAnchor="middle" className="fill-muted-foreground text-[2px]">INTEGRAL UNIVERSITY CAMPUS</text>

                    {/* Roads */}
                    <line x1="50" y1="96" x2="50" y2="75" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/20" />
                    <line x1="96" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/20" />
                    <line x1="4" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/20" />

                    {/* Zones */}
                    {zones.map((zone) => {
                      if (!zone.coordinates) return null;
                      const c = zone.coordinates;
                      const colors = getZoneColor(zone.status, c.type);
                      const isSelected = selectedZoneId === zone.id;
                      const isGate = c.type === 'gate';

                      return (
                        <g
                          key={zone.id}
                          className="cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleSvgMouseDown(e, zone.id)}
                          onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
                        >
                          <rect
                            x={c.x} y={c.y} width={c.width} height={c.height}
                            rx={isGate ? 1 : 0.5}
                            fill={colors.fill} stroke={colors.stroke}
                            strokeWidth={isSelected ? 0.6 : 0.3}
                            strokeDasharray={isGate ? '1,0.5' : undefined}
                          />
                          <text
                            x={c.x + c.width / 2} y={c.y + c.height / 2 - 1}
                            textAnchor="middle" dominantBaseline="middle"
                            className="fill-foreground text-[1.8px] font-bold pointer-events-none"
                          >
                            {isGate ? '🚪 ' : ''}{zone.name.length > 15 ? zone.name.slice(0, 14) + '…' : zone.name}
                          </text>
                          <text
                            x={c.x + c.width / 2} y={c.y + c.height / 2 + 2}
                            textAnchor="middle" dominantBaseline="middle"
                            className="fill-muted-foreground text-[1.5px] pointer-events-none"
                          >
                            {zone.current_count}/{zone.capacity}
                          </text>
                          {isSelected && (
                            <rect
                              x={c.x - 0.3} y={c.y - 0.3}
                              width={c.width + 0.6} height={c.height + 0.6}
                              rx={1} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.4"
                              strokeDasharray="1,0.5"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Visitor location dots */}
                    {showVisitors && visitors.map((v) => (
                      <g key={v.id}>
                        <circle
                          cx={v.map_x} cy={v.map_y} r="1.2"
                          fill="hsl(var(--primary))" stroke="white" strokeWidth="0.3"
                          opacity={0.85}
                        >
                          <animate attributeName="r" values="1;1.5;1" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle
                          cx={v.map_x} cy={v.map_y} r="2.5"
                          fill="hsl(var(--primary) / 0.15)" stroke="none"
                        >
                          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone Properties Panel */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Edit2 className="w-5 h-5" /> Zones ({zones.length})
            </h2>

            {selectedZone ? (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Edit: {selectedZone.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input
                      value={editingZone?.id === selectedZone.id ? editingZone.name : selectedZone.name}
                      onChange={(e) => setEditingZone({ ...(editingZone || selectedZone), id: selectedZone.id, name: e.target.value })}
                      onFocus={() => !editingZone && setEditingZone({ ...selectedZone })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Hindi Name</label>
                    <Input
                      value={editingZone?.id === selectedZone.id ? (editingZone.name_hi || '') : (selectedZone.name_hi || '')}
                      onChange={(e) => setEditingZone({ ...(editingZone || selectedZone), id: selectedZone.id, name_hi: e.target.value })}
                      onFocus={() => !editingZone && setEditingZone({ ...selectedZone })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <Input
                      value={editingZone?.id === selectedZone.id ? (editingZone.description || '') : (selectedZone.description || '')}
                      onChange={(e) => setEditingZone({ ...(editingZone || selectedZone), id: selectedZone.id, description: e.target.value })}
                      onFocus={() => !editingZone && setEditingZone({ ...selectedZone })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Capacity</label>
                      <Input
                        type="number"
                        value={editingZone?.id === selectedZone.id ? editingZone.capacity : selectedZone.capacity}
                        onChange={(e) => setEditingZone({ ...(editingZone || selectedZone), id: selectedZone.id, capacity: parseInt(e.target.value) || 0 })}
                        onFocus={() => !editingZone && setEditingZone({ ...selectedZone })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <Select
                        value={editingZone?.id === selectedZone.id ? editingZone.status : selectedZone.status}
                        onValueChange={(v) => setEditingZone({ ...(editingZone || selectedZone), id: selectedZone.id, status: v as MapZone['status'] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="green">🟢 Green</SelectItem>
                          <SelectItem value="yellow">🟡 Yellow</SelectItem>
                          <SelectItem value="red">🔴 Red</SelectItem>
                          <SelectItem value="critical">⚠️ Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1" onClick={() => editingZone && saveZone(editingZone)}>
                      <Save className="w-3.5 h-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteZone(selectedZone.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Click a zone on the map to edit</p>
                  <p className="text-xs mt-1">Drag zones to reposition them</p>
                </CardContent>
              </Card>
            )}

            {/* Zone List */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {zones.map((z) => {
                const type = (z.coordinates as any)?.type;
                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.id === selectedZoneId ? null : z.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left text-sm ${
                      selectedZoneId === z.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        z.status === 'red' || z.status === 'critical' ? 'bg-danger' :
                        z.status === 'yellow' ? 'bg-caution' : 'bg-safe'
                      }`} />
                      <span className="truncate">{z.name}</span>
                      {type === 'gate' && <Badge variant="outline" className="text-[9px] px-1">Gate</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      <Users className="w-3 h-3 inline mr-1" />{z.current_count}/{z.capacity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
