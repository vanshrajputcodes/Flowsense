import { useState, useRef, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Zap, AlertTriangle, Users, ArrowRight } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  color: string;
  speed: number;
}

interface Gate {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'entry' | 'exit';
  label: string;
  rate: number;
}

interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  capacity: number;
}

const PRESETS = {
  stadium: {
    name: 'Stadium Event',
    gates: [
      { x: 50, y: 200, w: 20, h: 80, type: 'entry' as const, label: 'Gate A', rate: 5 },
      { x: 730, y: 200, w: 20, h: 80, type: 'exit' as const, label: 'Gate B', rate: 3 },
      { x: 350, y: 10, w: 80, h: 20, type: 'entry' as const, label: 'Gate C', rate: 4 },
      { x: 350, y: 450, w: 80, h: 20, type: 'exit' as const, label: 'Gate D', rate: 3 },
    ],
    zones: [
      { x: 200, y: 100, w: 400, h: 280, label: 'Main Stage', capacity: 200 },
      { x: 100, y: 350, w: 150, h: 100, label: 'Food Court', capacity: 80 },
      { x: 550, y: 350, w: 150, h: 100, label: 'Rest Area', capacity: 60 },
    ],
    barriers: [
      { x: 300, y: 200, w: 10, h: 120 },
      { x: 500, y: 150, w: 10, h: 100 },
    ],
  },
  kumbh: {
    name: 'Kumbh Mela',
    gates: [
      { x: 50, y: 100, w: 20, h: 60, type: 'entry' as const, label: 'North Gate', rate: 8 },
      { x: 50, y: 320, w: 20, h: 60, type: 'entry' as const, label: 'South Gate', rate: 6 },
      { x: 730, y: 200, w: 20, h: 80, type: 'exit' as const, label: 'Ghat Exit', rate: 4 },
    ],
    zones: [
      { x: 250, y: 80, w: 300, h: 160, label: 'Bathing Ghat', capacity: 300 },
      { x: 200, y: 300, w: 200, h: 120, label: 'Akhara Zone', capacity: 150 },
      { x: 500, y: 300, w: 180, h: 120, label: 'Medical Camp', capacity: 50 },
    ],
    barriers: [
      { x: 400, y: 240, w: 10, h: 60 },
    ],
  },
};

export default function DigitalTwinPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [spawnRate, setSpawnRate] = useState([5]);
  const [speed, setSpeed] = useState([1]);
  const [preset, setPreset] = useState<keyof typeof PRESETS>('stadium');
  const [bottlenecks, setBottlenecks] = useState<{ x: number; y: number; density: number }[]>([]);
  const [stats, setStats] = useState({ total: 0, entered: 0, exited: 0, avgDensity: 0 });
  const enteredRef = useRef(0);
  const exitedRef = useRef(0);

  const config = PRESETS[preset];

  const spawnParticle = useCallback(() => {
    const entries = config.gates.filter(g => g.type === 'entry');
    const gate = entries[Math.floor(Math.random() * entries.length)];
    if (!gate) return;

    const exits = config.gates.filter(g => g.type === 'exit');
    const target = exits.length > 0 ? exits[Math.floor(Math.random() * exits.length)] : config.zones[0];

    const p: Particle = {
      x: gate.x + gate.w / 2 + (Math.random() - 0.5) * gate.h * 0.5,
      y: gate.y + gate.h / 2 + (Math.random() - 0.5) * gate.h * 0.5,
      vx: 0,
      vy: 0,
      targetX: target ? target.x + (target.w || 0) / 2 + (Math.random() - 0.5) * 60 : 400,
      targetY: target ? target.y + (target.h || 0) / 2 + (Math.random() - 0.5) * 60 : 250,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      speed: 0.3 + Math.random() * 0.5,
    };
    particlesRef.current.push(p);
    enteredRef.current++;
  }, [config]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const speedMul = speed[0];

    // Spawn
    for (let i = 0; i < spawnRate[0]; i++) {
      if (Math.random() < 0.3) spawnParticle();
    }

    // Update particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        // Reached target — check if exit
        const atExit = config.gates.filter(g => g.type === 'exit').some(g =>
          p.x > g.x - 20 && p.x < g.x + g.w + 20 && p.y > g.y - 20 && p.y < g.y + g.h + 20
        );
        if (atExit) {
          particles.splice(i, 1);
          exitedRef.current++;
          continue;
        }
        // Pick new target
        const exits = config.gates.filter(g => g.type === 'exit');
        if (exits.length > 0) {
          const t = exits[Math.floor(Math.random() * exits.length)];
          p.targetX = t.x + t.w / 2 + (Math.random() - 0.5) * 40;
          p.targetY = t.y + t.h / 2 + (Math.random() - 0.5) * 40;
        }
      }

      // Steering + separation
      p.vx += (dx / Math.max(1, dist)) * p.speed * 0.1 * speedMul;
      p.vy += (dy / Math.max(1, dist)) * p.speed * 0.1 * speedMul;

      // Separation from nearby
      for (let j = 0; j < particles.length; j++) {
        if (i === j) continue;
        const ox = p.x - particles[j].x;
        const oy = p.y - particles[j].y;
        const od = ox * ox + oy * oy;
        if (od < 400 && od > 0) {
          const force = 0.5 / Math.sqrt(od);
          p.vx += ox * force;
          p.vy += oy * force;
        }
      }

      // Barrier avoidance
      for (const b of (config as any).barriers || []) {
        if (p.x > b.x - 15 && p.x < b.x + b.w + 15 && p.y > b.y - 15 && p.y < b.y + b.h + 15) {
          const cx = b.x + b.w / 2;
          p.vx += (p.x - cx) * 0.3;
        }
      }

      // Damping
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.x += p.vx;
      p.y += p.vy;

      // Bounds
      p.x = Math.max(5, Math.min(W - 5, p.x));
      p.y = Math.max(5, Math.min(H - 5, p.y));
    }

    // Detect bottlenecks (grid density)
    const gridSize = 40;
    const grid: Record<string, number> = {};
    for (const p of particles) {
      const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`;
      grid[key] = (grid[key] || 0) + 1;
    }
    const bns = Object.entries(grid)
      .filter(([, count]) => count > 8)
      .map(([key, count]) => {
        const [gx, gy] = key.split(',').map(Number);
        return { x: gx * gridSize + gridSize / 2, y: gy * gridSize + gridSize / 2, density: count };
      });
    setBottlenecks(bns);

    // Draw
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Zones
    for (const z of config.zones) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px monospace';
      ctx.fillText(z.label, z.x + 8, z.y + 16);
      // Count people in zone
      const inZone = particles.filter(p => p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h).length;
      ctx.fillText(`${inZone}/${z.capacity}`, z.x + 8, z.y + 30);
    }

    // Barriers
    for (const b of (config as any).barriers || []) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Gates
    for (const g of config.gates) {
      ctx.fillStyle = g.type === 'entry' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = g.type === 'entry' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(g.label, g.x - 10, g.y - 5);
    }

    // Bottleneck heatmap
    for (const bn of bns) {
      const intensity = Math.min(1, bn.density / 20);
      const gradient = ctx.createRadialGradient(bn.x, bn.y, 0, bn.x, bn.y, gridSize);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(bn.x - gridSize, bn.y - gridSize, gridSize * 2, gridSize * 2);
    }

    // Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W - 180, 0, 180, 70);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Active: ${particles.length}`, W - 170, 18);
    ctx.font = '10px monospace';
    ctx.fillText(`Entered: ${enteredRef.current}`, W - 170, 35);
    ctx.fillText(`Exited: ${exitedRef.current}`, W - 170, 48);
    ctx.fillText(`Bottlenecks: ${bns.length}`, W - 170, 61);

    setParticleCount(particles.length);
    setStats({
      total: particles.length,
      entered: enteredRef.current,
      exited: exitedRef.current,
      avgDensity: bns.length > 0 ? Math.round(bns.reduce((s, b) => s + b.density, 0) / bns.length) : 0,
    });

    if (isRunning) animFrameRef.current = requestAnimationFrame(update);
  }, [isRunning, spawnRate, speed, config, spawnParticle]);

  useEffect(() => {
    if (isRunning) {
      animFrameRef.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, update]);

  const reset = () => {
    particlesRef.current = [];
    enteredRef.current = 0;
    exitedRef.current = 0;
    setParticleCount(0);
    setBottlenecks([]);
    setStats({ total: 0, entered: 0, exited: 0, avgDensity: 0 });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Digital Twin Simulator
          </h1>
          <p className="text-muted-foreground text-sm">Simulate crowd flow, test scenarios, and identify bottlenecks before the event</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Active People</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <ArrowRight className="w-8 h-8 text-safe" />
              <div>
                <p className="text-2xl font-bold">{stats.entered}</p>
                <p className="text-xs text-muted-foreground">Entered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <ArrowRight className="w-8 h-8 text-caution rotate-180" />
              <div>
                <p className="text-2xl font-bold">{stats.exited}</p>
                <p className="text-xs text-muted-foreground">Exited</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className={`w-8 h-8 ${bottlenecks.length > 0 ? 'text-danger' : 'text-safe'}`} />
              <div>
                <p className="text-2xl font-bold">{bottlenecks.length}</p>
                <p className="text-xs text-muted-foreground">Bottlenecks</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={480}
                  className="w-full rounded-lg border border-border"
                  style={{ imageRendering: 'pixelated' }}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Scenario Preset</label>
                <Select value={preset} onValueChange={(v) => { setPreset(v as any); reset(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Spawn Rate: {spawnRate[0]}</label>
                <Slider value={spawnRate} onValueChange={setSpawnRate} min={1} max={15} step={1} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Speed: {speed[0]}x</label>
                <Slider value={speed} onValueChange={setSpeed} min={0.5} max={3} step={0.5} />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setIsRunning(!isRunning)} className="flex-1 gap-2">
                  {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              {bottlenecks.length > 0 && (
                <div className="p-3 rounded-lg border border-danger/30 bg-danger/5">
                  <p className="text-sm font-medium text-danger flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {bottlenecks.length} bottleneck(s) detected!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Red zones indicate crush risk. Consider adding barriers or redirecting flow.
                  </p>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Legend:</p>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-safe/50 border border-safe rounded-sm" /> Entry Gate</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-danger/50 border border-danger rounded-sm" /> Exit Gate</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/30 border border-primary/50 rounded-sm" /> Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-danger/50 rounded-full" /> Bottleneck</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
