import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePresentation } from '@/contexts/PresentationContext';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, QrCode, X, Pause, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { HologramCCTV } from '@/components/presentation/HologramCCTV';

// Module definitions
const MODULES = [
  { id: 'cctv', name: 'AI CCTV' },
  { id: 'twin', name: 'Digital Twin' },
  { id: 'map', name: 'Live Map' },
  { id: 'queue', name: 'Queue System' },
  { id: 'sos', name: 'SOS Monitor' },
  { id: 'alerts', name: 'Broadcast Alerts' },
  { id: 'orders', name: 'Order Feed' },
  { id: 'analytics', name: 'Analytics' },
] as const;

type ModuleId = typeof MODULES[number]['id'];

export default function PresentationPage() {
  const navigate = useNavigate();
  const pres = usePresentation();
  const demo = useDemo();
  const [clock, setClock] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentModule, setCurrentModule] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fullscreen sync
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-rotate for storyteller
  useEffect(() => {
    if (pres.layout !== 'storyteller' || paused) {
      clearInterval(intervalRef.current);
      return;
    }
    const step = 100;
    const total = pres.rotationInterval / (demo.speed || 1);
    const increment = (step / total) * 100;
    progressRef.current = 0;
    setProgress(0);

    intervalRef.current = setInterval(() => {
      progressRef.current += increment;
      setProgress(Math.min(progressRef.current, 100));
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setProgress(0);
        setCurrentModule(prev => (prev + 1) % MODULES.length);
      }
    }, step);

    return () => clearInterval(intervalRef.current);
  }, [pres.layout, pres.rotationInterval, paused, demo.speed]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentModule(p => (p + 1) % MODULES.length);
      if (e.key === 'ArrowLeft') setCurrentModule(p => (p - 1 + MODULES.length) % MODULES.length);
      if (e.key === 'Escape') navigate('/admin/settings');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const visitorUrl = `${window.location.origin}/`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0b0e', color: '#f0f0ee' }}>
      {/* Top Bar */}
      <div className="h-11 flex items-center justify-between px-4 shrink-0" style={{ background: 'rgba(15,17,23,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs font-medium" style={{ color: '#8a8a88' }}>Presentation Mode</span>
        </div>
        <span className="font-mono text-sm tabular-nums" style={{ color: '#8a8a88' }}>{clock}</span>
        <div className="flex items-center gap-2">
          {pres.showQR && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a8a88] hover:text-white" onClick={() => setQrOpen(true)}>
              <QrCode className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a8a88] hover:text-white" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[#8a8a88] hover:text-white" onClick={() => navigate('/admin/settings')}>
            <X className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {pres.layout === 'command-center' && <CommandCenterLayout showLabel={pres.showModuleLabel} speed={demo.speed} />}
        {pres.layout === 'spotlight' && (
          <SpotlightLayout
            current={currentModule}
            setCurrent={setCurrentModule}
            showLabel={pres.showModuleLabel}
            speed={demo.speed}
          />
        )}
        {pres.layout === 'storyteller' && (
          <StorytellerLayout
            current={currentModule}
            progress={progress}
            paused={paused}
            onPauseToggle={() => setPaused(p => !p)}
            showLabel={pres.showModuleLabel}
            speed={demo.speed}
          />
        )}
      </div>

      {/* QR Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm" style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0ee' }}>
          <DialogHeader>
            <DialogTitle className="text-center">Visitor View</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={visitorUrl} size={256} />
            </div>
            <p className="text-sm" style={{ color: '#8a8a88' }}>Scan to open visitor view on your phone</p>
            <p className="text-xs font-mono" style={{ color: '#8a8a88' }}>{visitorUrl}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== COMMAND CENTER ====================
function CommandCenterLayout({ showLabel, speed }: { showLabel: boolean; speed: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 h-full auto-rows-fr">
      {MODULES.map((mod) => (
        <ModuleCard key={mod.id} module={mod} showLabel={showLabel} speed={speed} />
      ))}
    </div>
  );
}

// ==================== SPOTLIGHT ====================
function SpotlightLayout({ current, setCurrent, showLabel, speed }: {
  current: number;
  setCurrent: (n: number) => void;
  showLabel: boolean;
  speed: number;
}) {
  return (
    <div className="h-full relative">
      {/* Module */}
      <div className="h-[calc(100%-60px)] p-2">
        <ModuleCard module={MODULES[current]} showLabel={showLabel} speed={speed} fullsize />
      </div>

      {/* Nav arrows */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition"
        onClick={() => setCurrent((current - 1 + MODULES.length) % MODULES.length)}
      >
        <ArrowLeft className="w-6 h-6" style={{ color: '#8a8a88' }} />
      </button>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition"
        onClick={() => setCurrent((current + 1) % MODULES.length)}
      >
        <ArrowRight className="w-6 h-6" style={{ color: '#8a8a88' }} />
      </button>

      {/* Thumbnail strip */}
      <div className="h-[56px] flex items-center justify-center gap-2 px-4">
        {MODULES.map((mod, i) => (
          <button
            key={mod.id}
            onClick={() => setCurrent(i)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              i === current ? "bg-[#1D9E75] text-white" : "bg-white/5 text-[#8a8a88] hover:bg-white/10"
            )}
          >
            {mod.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== STORYTELLER ====================
function StorytellerLayout({ current, progress, paused, onPauseToggle, showLabel, speed }: {
  current: number;
  progress: number;
  paused: boolean;
  onPauseToggle: () => void;
  showLabel: boolean;
  speed: number;
}) {
  return (
    <div className="h-full relative" onClick={onPauseToggle}>
      <div className="h-[calc(100%-36px)] p-2">
        <ModuleCard module={MODULES[current]} showLabel={showLabel} speed={speed} fullsize />
      </div>

      {/* Bottom bar */}
      <div className="h-[36px] flex items-center px-4 gap-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onPauseToggle} className="p-1 hover:bg-white/10 rounded">
          {paused ? <Play className="w-4 h-4 text-[#8a8a88]" /> : <Pause className="w-4 h-4 text-[#8a8a88]" />}
        </button>
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#1D9E75] transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-[#8a8a88]">
          {MODULES[current].name}
        </span>
      </div>
    </div>
  );
}

// ==================== MODULE CARD ====================
function ModuleCard({ module, showLabel, speed, fullsize }: {
  module: typeof MODULES[number];
  showLabel: boolean;
  speed: number;
  fullsize?: boolean;
}) {
  return (
    <div
      className={cn("rounded-lg overflow-hidden relative flex flex-col", fullsize && "h-full")}
      style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-medium" style={{ color: '#f0f0ee' }}>{module.name}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          <span className="text-[10px] font-medium" style={{ color: '#1D9E75' }}>LIVE</span>
        </div>
      </div>

      {/* Module label overlay */}
      {showLabel && (
        <span className="absolute top-8 left-3 text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {module.name}
        </span>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ModuleRenderer id={module.id} speed={speed} />
      </div>
    </div>
  );
}

// ==================== MODULE RENDERER ====================
function ModuleRenderer({ id, speed }: { id: ModuleId; speed: number }) {
  switch (id) {
    case 'cctv': return <CCTVModule speed={speed} />;
    case 'twin': return <TwinModule speed={speed} />;
    case 'map': return <MapModule speed={speed} />;
    case 'queue': return <QueueModule speed={speed} />;
    case 'sos': return <SOSModule speed={speed} />;
    case 'alerts': return <AlertsModule speed={speed} />;
    case 'orders': return <OrdersModule speed={speed} />;
    case 'analytics': return <AnalyticsModule speed={speed} />;
  }
}

// ==================== CCTV MODULE (3D Hologram) ====================
function CCTVModule({ speed }: { speed: number }) {
  return <HologramCCTV speed={speed} />;
}

// ==================== TWIN MODULE ====================
function TwinModule({ speed }: { speed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; ctx.scale(2, 2); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles: { x: number; y: number; vx: number; vy: number; target: { x: number; y: number } }[] = [];
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const gates = [
      { x: 0.1, y: 0.5, label: 'Gate A' },
      { x: 0.5, y: 0, label: 'Gate B' },
      { x: 0.9, y: 0.5, label: 'Gate C' },
    ];
    const zones = [
      { x: 0.5, y: 0.5, r: 0.15, label: 'Stage' },
      { x: 0.3, y: 0.3, r: 0.08, label: 'Food' },
      { x: 0.7, y: 0.7, r: 0.08, label: 'Medical' },
    ];

    for (let i = 0; i < 50; i++) {
      const gate = gates[Math.floor(Math.random() * gates.length)];
      particles.push({
        x: gate.x * w(),
        y: gate.y * h(),
        vx: 0,
        vy: 0,
        target: { x: zones[Math.floor(Math.random() * zones.length)].x * w(), y: zones[Math.floor(Math.random() * zones.length)].y * h() },
      });
    }

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w(), h());

      // Zones
      zones.forEach(z => {
        ctx.fillStyle = z.label === 'Stage' ? 'rgba(255,180,50,0.08)' : z.label === 'Food' ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)';
        ctx.beginPath();
        ctx.arc(z.x * w(), z.y * h(), z.r * w(), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(z.label, z.x * w(), z.y * h() + 4);
      });

      // Gates
      gates.forEach(g => {
        ctx.fillStyle = '#1D9E75';
        ctx.beginPath();
        ctx.arc(g.x * w(), g.y * h(), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, g.x * w(), g.y * h() + 16);
      });

      ctx.textAlign = 'start';

      // Particles
      particles.forEach(p => {
        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
          p.target = { x: zones[Math.floor(Math.random() * zones.length)].x * w(), y: zones[Math.floor(Math.random() * zones.length)].y * h() };
        }
        p.vx += (dx / dist) * 0.15 * speed;
        p.vy += (dy / dist) * 0.15 * speed;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = 'rgba(29,158,117,0.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [speed]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ==================== MAP MODULE ====================
function MapModule({ speed }: { speed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; ctx.scale(2, 2); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const mapZones = [
      { x: 0.5, y: 0.4, w: 0.3, h: 0.2, label: 'Stage', color: 'rgba(255,180,50,0.12)' },
      { x: 0.75, y: 0.15, w: 0.2, h: 0.15, label: 'Food Court', color: 'rgba(29,158,117,0.12)' },
      { x: 0.15, y: 0.7, w: 0.15, h: 0.12, label: 'Medical', color: 'rgba(226,75,74,0.12)' },
    ];

    const visitors: { x: number; y: number; tx: number; ty: number; timer: number }[] = [];
    for (let i = 0; i < 30; i++) {
      visitors.push({
        x: Math.random() * 0.8 + 0.1,
        y: Math.random() * 0.8 + 0.1,
        tx: Math.random() * 0.8 + 0.1,
        ty: Math.random() * 0.8 + 0.1,
        timer: Math.random() * 500,
      });
    }

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w(), h());

      // Venue outline
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      const margin = 20;
      ctx.strokeRect(margin, margin, w() - margin * 2, h() - margin * 2);

      // Zones
      mapZones.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.fillRect(z.x * w(), z.y * h(), z.w * w(), z.h * h());
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(z.label, (z.x + z.w / 2) * w(), (z.y + z.h / 2) * h() + 4);
      });
      ctx.textAlign = 'start';

      // Visitors
      visitors.forEach(v => {
        v.timer -= speed;
        if (v.timer <= 0) {
          v.tx = Math.random() * 0.8 + 0.1;
          v.ty = Math.random() * 0.8 + 0.1;
          v.timer = 400 + Math.random() * 300;
        }
        v.x += (v.tx - v.x) * 0.005 * speed;
        v.y += (v.ty - v.y) * 0.005 * speed;

        ctx.fillStyle = '#1D9E75';
        ctx.beginPath();
        ctx.arc(v.x * w(), v.y * h(), 4, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [speed]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ==================== QUEUE MODULE ====================
interface Token {
  id: number;
  name: string;
  status: 'waiting' | 'serving' | 'done';
  time: string;
}

function QueueModule({ speed }: { speed: number }) {
  const [tokens, setTokens] = useState<Token[]>(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: 101 + i,
      name: ['Amit S.', 'Priya R.', 'Raj K.', 'Meena T.', 'Sanjay M.'][i],
      status: i < 3 ? 'waiting' as const : i < 4 ? 'serving' as const : 'done' as const,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    }))
  );
  const nextId = useRef(106);

  useEffect(() => {
    // Move first waiting to serving
    const serveId = setInterval(() => {
      setTokens(prev => {
        const first = prev.findIndex(t => t.status === 'waiting');
        if (first === -1) return prev;
        return prev.map((t, i) => i === first ? { ...t, status: 'serving' as const } : t);
      });
    }, 6000 / speed);

    // Move serving to done
    const doneId = setInterval(() => {
      setTokens(prev => {
        const first = prev.findIndex(t => t.status === 'serving');
        if (first === -1) return prev;
        return prev.map((t, i) => i === first ? { ...t, status: 'done' as const } : t);
      });
    }, 10000 / speed);

    // Add new token
    const addId = setInterval(() => {
      const names = ['Vikram P.', 'Anita D.', 'Harsh V.', 'Deepa N.', 'Rahul G.', 'Kavita S.'];
      setTokens(prev => {
        const newToken: Token = {
          id: nextId.current++,
          name: names[Math.floor(Math.random() * names.length)],
          status: 'waiting',
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
        return [...prev.slice(-8), newToken];
      });
    }, 14000 / speed);

    return () => { clearInterval(serveId); clearInterval(doneId); clearInterval(addId); };
  }, [speed]);

  const waiting = tokens.filter(t => t.status === 'waiting');
  const serving = tokens.filter(t => t.status === 'serving');
  const done = tokens.filter(t => t.status === 'done').slice(-3);

  return (
    <div className="grid grid-cols-3 gap-2 p-3 h-full text-xs overflow-hidden">
      <Column title="Waiting" color="#8a8a88" items={waiting} />
      <Column title="Serving" color="#3b82f6" items={serving} />
      <Column title="Done" color="#1D9E75" items={done} />
    </div>
  );
}

function Column({ title, color, items }: { title: string; color: string; items: Token[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color }}>{title}</div>
      <div className="space-y-1.5">
        {items.map(t => (
          <div key={t.id} className="p-2 rounded-md animate-fade-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="font-bold" style={{ color: '#f0f0ee' }}>#{t.id}</div>
            <div style={{ color: '#8a8a88' }}>{t.name}</div>
            <div className="text-[9px]" style={{ color: '#8a8a88' }}>{t.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SOS MODULE ====================
function SOSModule({ speed }: { speed: number }) {
  const [events, setEvents] = useState<{ id: number; name: string; msg: string; time: string; active: boolean }[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    const id = setInterval(() => {
      const names = ['Sunita M.', 'Ravi P.', 'Anand K.', 'Geeta S.'];
      const msgs = ['Need help at Gate B', 'Medical emergency', 'Lost in crowd', 'Child missing'];
      setEvents(prev => [{
        id: nextId.current++,
        name: names[Math.floor(Math.random() * names.length)],
        msg: msgs[Math.floor(Math.random() * msgs.length)],
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        active: true,
      }, ...prev].slice(0, 5));
    }, 40000 / speed);
    return () => clearInterval(id);
  }, [speed]);

  return (
    <div className="p-3 space-y-2 overflow-hidden h-full">
      {events.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs" style={{ color: '#8a8a88' }}>
          No SOS events — monitoring...
        </div>
      )}
      {events.map(e => (
        <div key={e.id} className="p-2 rounded-md animate-fade-in" style={{
          background: e.active ? 'rgba(226,75,74,0.1)' : 'rgba(29,158,117,0.1)',
          border: `1px solid ${e.active ? 'rgba(226,75,74,0.3)' : 'rgba(29,158,117,0.3)'}`,
        }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#f0f0ee' }}>{e.name}</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
              e.active ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
            )}>
              {e.active ? 'ACTIVE' : 'RESPONDED'}
            </span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: '#8a8a88' }}>{e.msg}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px]" style={{ color: '#8a8a88' }}>{e.time}</span>
            {e.active && (
              <button
                className="text-[9px] px-2 py-0.5 rounded bg-[#1D9E75]/20 text-[#1D9E75] hover:bg-[#1D9E75]/30"
                onClick={() => setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, active: false } : ev))}
              >
                Respond
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== ALERTS MODULE ====================
function AlertsModule({ speed }: { speed: number }) {
  const [alerts, setAlerts] = useState<{ id: number; title: string; titleHi: string; severity: string; time: string }[]>([]);
  const nextId = useRef(1);
  const severities = ['info', 'warning', 'critical', 'emergency'];

  useEffect(() => {
    const titles = [
      { en: 'Zone B crowd density high', hi: 'ज़ोन B में भीड़ अधिक' },
      { en: 'Medical team dispatched', hi: 'मेडिकल टीम रवाना' },
      { en: 'Gate C entry restricted', hi: 'गेट C प्रवेश प्रतिबंधित' },
      { en: 'Weather alert: Rain expected', hi: 'मौसम चेतावनी: बारिश संभव' },
    ];
    const id = setInterval(() => {
      const t = titles[Math.floor(Math.random() * titles.length)];
      setAlerts(prev => [{
        id: nextId.current++,
        title: t.en,
        titleHi: t.hi,
        severity: severities[(nextId.current - 1) % severities.length],
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      }, ...prev].slice(0, 5));
    }, 18000 / speed);
    return () => clearInterval(id);
  }, [speed]);

  const severityColor = (s: string) => {
    switch (s) {
      case 'info': return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' };
      case 'warning': return { bg: 'rgba(255,180,50,0.1)', border: 'rgba(255,180,50,0.3)', text: '#fbbf24' };
      case 'critical': return { bg: 'rgba(226,75,74,0.1)', border: 'rgba(226,75,74,0.3)', text: '#E24B4A' };
      case 'emergency': return { bg: 'rgba(226,75,74,0.15)', border: 'rgba(226,75,74,0.5)', text: '#E24B4A' };
      default: return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#8a8a88' };
    }
  };

  return (
    <div className="p-3 space-y-2 overflow-hidden h-full">
      {alerts.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs" style={{ color: '#8a8a88' }}>No alerts</div>
      )}
      {alerts.map(a => {
        const c = severityColor(a.severity);
        return (
          <div key={a.id} className={cn("p-2 rounded-md animate-fade-in", a.severity === 'emergency' && 'animate-pulse')}
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#f0f0ee' }}>{a.title}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ color: c.text, background: c.bg }}>
                {a.severity}
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: '#8a8a88' }}>{a.titleHi}</p>
            <span className="text-[9px]" style={{ color: '#8a8a88' }}>{a.time}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== ORDERS MODULE ====================
function OrdersModule({ speed }: { speed: number }) {
  const statuses = ['pending', 'preparing', 'delivering', 'delivered'] as const;
  const [orders, setOrders] = useState<{ id: number; name: string; item: string; status: typeof statuses[number]; time: string }[]>([]);
  const nextId = useRef(1001);

  useEffect(() => {
    const items = ['Tea × 2', 'Samosa × 3', 'Water bottle', 'Biryani × 1', 'Chai × 4', 'Puri set'];
    const names = ['Arun K.', 'Priti S.', 'Mohit R.', 'Neha V.', 'Suresh D.'];

    const addId = setInterval(() => {
      setOrders(prev => [{
        id: nextId.current++,
        name: names[Math.floor(Math.random() * names.length)],
        item: items[Math.floor(Math.random() * items.length)],
        status: 'pending' as const,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      }, ...prev].slice(0, 7));
    }, 7000 / speed);

    const advId = setInterval(() => {
      setOrders(prev => prev.map(o => {
        const idx = statuses.indexOf(o.status);
        if (idx < statuses.length - 1 && Math.random() > 0.5) {
          return { ...o, status: statuses[idx + 1] };
        }
        return o;
      }));
    }, 5000 / speed);

    return () => { clearInterval(addId); clearInterval(advId); };
  }, [speed]);

  const statusStyle = (s: string) => {
    switch (s) {
      case 'pending': return { bg: 'rgba(138,138,136,0.2)', color: '#8a8a88' };
      case 'preparing': return { bg: 'rgba(255,180,50,0.2)', color: '#fbbf24' };
      case 'delivering': return { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa' };
      case 'delivered': return { bg: 'rgba(29,158,117,0.2)', color: '#1D9E75' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: '#8a8a88' };
    }
  };

  return (
    <div className="p-3 space-y-1.5 overflow-hidden h-full">
      {orders.map(o => {
        const s = statusStyle(o.status);
        return (
          <div key={o.id} className="p-2 rounded-md animate-fade-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: '#f0f0ee' }}>#{o.id}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase transition-colors duration-300"
                style={{ background: s.bg, color: s.color }}>{o.status}</span>
            </div>
            <div className="text-[10px]" style={{ color: '#8a8a88' }}>{o.name} — {o.item}</div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== ANALYTICS MODULE ====================
function AnalyticsModule({ speed }: { speed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>(Array.from({ length: 20 }, (_, i) => 200 + Math.sin(i * 0.3) * 80 + Math.random() * 15));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; ctx.scale(2, 2); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const updateId = setInterval(() => {
      const last = dataRef.current[dataRef.current.length - 1];
      const next = Math.max(50, Math.min(450, last + (Math.random() - 0.5) * 30));
      dataRef.current = [...dataRef.current.slice(1), next];
    }, 3000 / speed);

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w(), h());

      const data = dataRef.current;
      const pad = { l: 40, r: 10, t: 20, b: 30 };
      const cw = w() - pad.l - pad.r;
      const ch = h() - pad.t - pad.b;

      // Y axis
      ctx.fillStyle = '#8a8a88';
      ctx.font = '9px sans-serif';
      for (let v = 0; v <= 500; v += 100) {
        const y = pad.t + ch - (v / 500) * ch;
        ctx.fillText(String(v), 4, y + 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
      }

      // Title
      ctx.fillStyle = '#f0f0ee';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Live Crowd Count', pad.l, 14);

      // Line
      ctx.strokeStyle = '#1D9E75';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = pad.l + (i / (data.length - 1)) * cw;
        const y = pad.t + ch - (v / 500) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill
      const lastX = pad.l + cw;
      const lastY = pad.t + ch - (data[data.length - 1] / 500) * ch;
      ctx.lineTo(lastX, pad.t + ch);
      ctx.lineTo(pad.l, pad.t + ch);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
      grad.addColorStop(0, 'rgba(29,158,117,0.3)');
      grad.addColorStop(1, 'rgba(29,158,117,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Current value
      ctx.fillStyle = '#1D9E75';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0f0ee';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(String(Math.round(data[data.length - 1])), lastX - 30, lastY - 10);

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); clearInterval(updateId); ro.disconnect(); };
  }, [speed]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
