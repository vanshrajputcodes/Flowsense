import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// ==================== DETECTION DATA (15 items) ====================
const DETECTIONS = [
  { label: 'FIREARM', pos: [-0.30, 0.80, 0.08] as V3, severity: 'critical' as const, detail: 'Handgun · Metal' },
  { label: 'KNIFE', pos: [0.30, 0.78, 0.08] as V3, severity: 'critical' as const, detail: 'Blade · 14cm' },
  { label: 'EXPLOSIVE VEST', pos: [0, 1.22, 0.1] as V3, severity: 'critical' as const, detail: 'Wired device' },
  { label: 'CONCEALED OBJECT', pos: [0.14, 0.88, 0.1] as V3, severity: 'critical' as const, detail: 'Metallic mass' },
  { label: 'HIDDEN FACE', pos: [0, 1.74, 0.12] as V3, severity: 'warning' as const, detail: '82% occluded' },
  { label: 'SUSPICIOUS BAG', pos: [0.28, 1.28, -0.08] as V3, severity: 'warning' as const, detail: 'X-ray opaque' },
  { label: 'BODY ARMOR', pos: [0, 1.32, 0.06] as V3, severity: 'warning' as const, detail: 'Ballistic plate' },
  { label: 'NARCOTICS', pos: [-0.13, 0.84, 0.08] as V3, severity: 'warning' as const, detail: 'Chemical trace' },
  { label: 'PHONE DETONATOR', pos: [0.13, 0.84, 0.08] as V3, severity: 'critical' as const, detail: 'Modified device' },
  { label: 'ANKLE MONITOR', pos: [-0.1, 0.1, 0.02] as V3, severity: 'info' as const, detail: 'Electronic tag' },
  { label: 'WIRE CONCEALED', pos: [0, 1.15, -0.1] as V3, severity: 'warning' as const, detail: 'Under jacket' },
  { label: 'STEEL KNUCKLES', pos: [0.32, 0.72, 0.06] as V3, severity: 'warning' as const, detail: 'Metal duster' },
  { label: 'CHEMICAL AGENT', pos: [-0.12, 0.52, 0.06] as V3, severity: 'critical' as const, detail: 'Pepper spray' },
  { label: 'COUNTERFEIT ID', pos: [-0.08, 1.36, 0.1] as V3, severity: 'info' as const, detail: 'ID anomaly' },
  { label: 'ABNORMAL GAIT', pos: [0, 0.42, 0.04] as V3, severity: 'info' as const, detail: 'Pattern irregular' },
];

type V3 = [number, number, number];

// ==================== SKELETON POINT CLOUD ====================
function buildSkeleton(): V3[] {
  const p: V3[] = [];
  const add = (x: number, y: number, z: number) => p.push([x, y, z]);

  // Skull — dense sphere
  for (let i = 0; i < 80; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 0.10 + Math.random() * 0.015;
    add(Math.sin(ph) * Math.cos(th) * r, 1.72 + Math.cos(ph) * r * 0.88, Math.sin(ph) * Math.sin(th) * r);
  }
  // Jaw arc
  for (let i = 0; i < 14; i++) { const a = (i / 13) * Math.PI; add(Math.cos(a) * 0.07, 1.63 + Math.sin(a) * 0.015, 0.035); }
  // Eye sockets
  for (let i = 0; i < 8; i++) { const a = (i / 7) * Math.PI * 2; add(-0.035 + Math.cos(a) * 0.013, 1.73 + Math.sin(a) * 0.013, 0.1); add(0.035 + Math.cos(a) * 0.013, 1.73 + Math.sin(a) * 0.013, 0.1); }

  // Spine — 24 vertebrae
  for (let i = 0; i < 24; i++) {
    const y = 0.85 + i * 0.037;
    add(0, y, 0); add(-0.01, y, -0.008); add(0.01, y, -0.008); add(0, y, -0.015);
  }

  // Ribcage — 12 pairs, torus arcs
  for (let i = 0; i < 12; i++) {
    const y = 1.02 + i * 0.032;
    const w = 0.06 + Math.sin((i + 1) / 13 * Math.PI) * 0.11;
    const d = 0.04 + Math.sin((i + 1) / 13 * Math.PI) * 0.045;
    for (let j = 0; j < 12; j++) {
      const a = (j / 11) * Math.PI;
      add(-Math.sin(a) * w, y, Math.cos(a) * d);
      add(Math.sin(a) * w, y, Math.cos(a) * d);
    }
  }

  // Sternum
  for (let i = 0; i < 10; i++) add(0, 1.05 + i * 0.038, 0.075);

  // Clavicles
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    add(THREE.MathUtils.lerp(0, -0.24, t), 1.42 - t * 0.015, 0.035);
    add(THREE.MathUtils.lerp(0, 0.24, t), 1.42 - t * 0.015, 0.035);
  }

  // Scapulae (shoulder blades)
  for (let i = 0; i < 14; i++) {
    add(-0.17 + (Math.random() - 0.5) * 0.08, 1.25 + (Math.random() - 0.5) * 0.12, -0.055);
    add(0.17 + (Math.random() - 0.5) * 0.08, 1.25 + (Math.random() - 0.5) * 0.12, -0.055);
  }

  // Pelvis
  for (let i = 0; i < 22; i++) {
    const a = (i / 21) * Math.PI * 2;
    const r = 0.11 + Math.sin(a * 2) * 0.03;
    add(Math.cos(a) * r, 0.85 + Math.sin(a) * 0.035, Math.sin(a * 0.5) * 0.025);
  }

  // Arms (both)
  [-1, 1].forEach(side => {
    const sx = side * 0.26;
    // Humerus
    for (let i = 0; i < 10; i++) { const t = i / 9; add(sx, THREE.MathUtils.lerp(1.38, 1.1, t), (Math.random() - 0.5) * 0.008); }
    // Radius + Ulna
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      add(sx + 0.006 * side, THREE.MathUtils.lerp(1.08, 0.80, t), 0.004);
      add(sx - 0.006 * side, THREE.MathUtils.lerp(1.08, 0.80, t), -0.004);
    }
    // Wrist + hand + fingers
    for (let f = 0; f < 5; f++) {
      const fx = sx + (f - 2) * 0.012 * side;
      for (let j = 0; j < 4; j++) add(fx, 0.78 - j * 0.014, 0.004 * j);
    }
  });

  // Legs (both)
  [-1, 1].forEach(side => {
    const sx = side * 0.1;
    // Femur
    for (let i = 0; i < 14; i++) { const t = i / 13; add(sx, THREE.MathUtils.lerp(0.82, 0.42, t), (Math.random() - 0.5) * 0.008); }
    // Patella
    add(sx, 0.42, 0.022);
    // Tibia + Fibula
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      add(sx - 0.003, THREE.MathUtils.lerp(0.40, 0.07, t), 0.003);
      add(sx + 0.01, THREE.MathUtils.lerp(0.40, 0.09, t), -0.003);
    }
    // Foot + toes
    for (let i = 0; i < 8; i++) add(sx + (Math.random() - 0.5) * 0.025, 0.04, 0.01 + i * 0.012);
    for (let t = 0; t < 5; t++) add(sx + (t - 2) * 0.008, 0.035, 0.11);
  });

  return p;
}

// ==================== MAIN COMPONENT ====================
export function HologramCCTV({ speed }: { speed: number }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'assemble' | 'detect'>('assemble');
  const [detIdx, setDetIdx] = useState(-1);
  const [detCount, setDetCount] = useState(0);

  // Assembly
  useEffect(() => {
    let step = 0;
    const total = 80;
    const id = setInterval(() => {
      step++;
      setProgress(Math.min(step / total, 1));
      if (step >= total) {
        clearInterval(id);
        setTimeout(() => setPhase('detect'), 400 / speed);
      }
    }, (3500 / speed) / total);
    return () => clearInterval(id);
  }, [speed]);

  // Detection cycle
  useEffect(() => {
    if (phase !== 'detect') return;
    let cancelled = false;
    let idx = 0;
    const tick = () => {
      if (cancelled) return;
      setDetIdx(idx % DETECTIONS.length);
      setDetCount(prev => Math.min(prev + 1, DETECTIONS.length));
      idx++;
      setTimeout(tick, 3200 / speed);
    };
    setTimeout(tick, 600 / speed);
    return () => { cancelled = true; };
  }, [phase, speed]);

  const det = detIdx >= 0 ? DETECTIONS[detIdx] : null;
  const sevColor = det ? (det.severity === 'critical' ? '#ff2020' : det.severity === 'warning' ? '#ff9500' : '#00bbff') : '#00ff88';

  return (
    <div className="w-full h-full relative" style={{ background: '#010208' }}>
      {/* Top-left: detection label */}
      {det && (
        <div className="absolute top-2 left-2 z-20 animate-fade-in" key={detIdx}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sevColor, boxShadow: `0 0 6px ${sevColor}` }} />
            <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: sevColor }}>{det.label}</span>
            <span className="text-[8px] font-mono" style={{ color: `${sevColor}77` }}>· {det.detail}</span>
          </div>
        </div>
      )}

      {/* Bottom-left: counter */}
      <div className="absolute bottom-2 left-2 z-20">
        <span className="text-[8px] font-mono" style={{ color: '#ffffff20' }}>
          {phase === 'assemble' ? `BUILDING ${Math.floor(progress * 100)}%` : `SCAN ${Math.min(detCount, 15)}/15`}
        </span>
      </div>

      {/* Bottom-right: confidence */}
      {det && (
        <div className="absolute bottom-2 right-2 z-20">
          <span className="text-[8px] font-mono" style={{ color: `${sevColor}88` }}>
            CONF {82 + (detIdx * 3) % 17}%
          </span>
        </div>
      )}

      <Canvas
        camera={{ position: [3, 1.8, 3], fov: 38 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#010208', 5, 12]} />

        <CinematicCam phase={phase} det={det} detIdx={detIdx} speed={speed} />
        <ParticleSkeleton progress={progress} phase={phase} det={det} speed={speed} />
        {det && <Marker det={det} />}
        <FloorGrid />
      </Canvas>
    </div>
  );
}

// ==================== CINEMATIC CAMERA ====================
function CinematicCam({ phase, det, detIdx, speed }: {
  phase: string;
  det: typeof DETECTIONS[0] | null;
  detIdx: number;
  speed: number;
}) {
  const { camera } = useThree();
  const tPos = useRef(new THREE.Vector3(3, 1.8, 3));
  const tLook = useRef(new THREE.Vector3(0, 0.95, 0));
  const cLook = useRef(new THREE.Vector3(0, 0.95, 0));

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;

    if (phase === 'assemble') {
      // Slow orbit, wide
      const a = t * 0.35;
      tPos.current.set(Math.cos(a) * 4, 2.2, Math.sin(a) * 4);
      tLook.current.set(0, 0.95, 0);
    } else if (det) {
      // Zoom toward detection, orbit around it slightly
      const p = det.pos;
      const angle = detIdx * 1.1 + t * 0.15;
      const dist = 1.0 + Math.sin(t * 0.2) * 0.1;
      tPos.current.set(
        p[0] + Math.cos(angle) * dist,
        p[1] + 0.35,
        p[2] + Math.sin(angle) * dist + 0.5
      );
      tLook.current.set(p[0], p[1], p[2]);
    }

    const ls = phase === 'assemble' ? 0.012 : 0.03;
    camera.position.lerp(tPos.current, ls);
    cLook.current.lerp(tLook.current, ls);
    camera.lookAt(cLook.current);
  });

  return null;
}

// ==================== PARTICLE SKELETON ====================
function ParticleSkeleton({ progress, phase, det, speed }: {
  progress: number;
  phase: string;
  det: typeof DETECTIONS[0] | null;
  speed: number;
}) {
  const skeleton = useMemo(() => buildSkeleton(), []);
  const count = skeleton.length;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorRef = useRef<Float32Array>(new Float32Array(count * 3));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => skeleton.map((pt, i) => {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r = 3.5 + Math.random() * 4;
    return {
      sx: r * Math.sin(ph) * Math.cos(th),
      sy: r * Math.sin(ph) * Math.sin(th) + 0.9,
      sz: r * Math.cos(ph),
      tx: pt[0], ty: pt[1], tz: pt[2],
      delay: Math.random() * 0.5,
      size: 0.018 + Math.random() * 0.012,
      i,
    };
  }), [skeleton]);

  // Base color
  const baseColor = useMemo(() => new THREE.Color('#00ff88'), []);
  const alertColor = useMemo(() => new THREE.Color('#ff2020'), []);
  const warnColor = useMemo(() => new THREE.Color('#ff9500'), []);
  const infoColor = useMemo(() => new THREE.Color('#00bbff'), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed;
    const detPos = det?.pos;
    const dc = det?.severity === 'critical' ? alertColor : det?.severity === 'warning' ? warnColor : infoColor;

    particles.forEach((p) => {
      const pp = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
      const e = 1 - Math.pow(1 - pp, 3);

      let x: number, y: number, z: number;
      if (phase === 'assemble') {
        const sp = t * 1.6 + p.i * 0.05;
        const sr = (1 - e) * 0.5;
        x = THREE.MathUtils.lerp(p.sx, p.tx, e) + Math.cos(sp) * sr;
        y = THREE.MathUtils.lerp(p.sy, p.ty, e) + Math.sin(sp * 0.6) * sr * 0.25;
        z = THREE.MathUtils.lerp(p.sz, p.tz, e) + Math.sin(sp) * sr;
      } else {
        const breath = Math.sin(t * 0.5) * 0.006;
        x = p.tx + Math.sin(t * 0.25 + p.i * 0.08) * 0.002;
        y = p.ty + breath;
        z = p.tz + Math.cos(t * 0.25 + p.i * 0.08) * 0.002;
      }

      // Size — glow near detection
      let sz = p.size;
      let cr = baseColor.r, cg = baseColor.g, cb = baseColor.b;

      if (detPos && phase === 'detect') {
        const dx = p.tx - detPos[0], dy = p.ty - detPos[1], dz = p.tz - detPos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.18) {
          const f = 1 - dist / 0.18;
          sz *= 1.5 + f * 1.5 * (0.7 + Math.sin(t * 6) * 0.3);
          cr = THREE.MathUtils.lerp(cr, dc.r, f);
          cg = THREE.MathUtils.lerp(cg, dc.g, f);
          cb = THREE.MathUtils.lerp(cb, dc.b, f);
        }
      }

      colorRef.current[p.i * 3] = cr;
      colorRef.current[p.i * 3 + 1] = cg;
      colorRef.current[p.i * 3 + 2] = cb;

      dummy.position.set(x, y, z);
      const s = phase === 'assemble' ? sz * (1 + (1 - e) * 2) : sz;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(p.i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update instance colors
    const colorAttr = meshRef.current.geometry.getAttribute('color');
    if (!colorAttr) {
      meshRef.current.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorRef.current, 3));
    } else {
      (colorAttr as THREE.InstancedBufferAttribute).set(colorRef.current);
      colorAttr.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.7} vertexColors />
    </instancedMesh>
  );
}

// ==================== DETECTION MARKER ====================
function Marker({ det }: { det: typeof DETECTIONS[0] }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const color = det.severity === 'critical' ? '#ff2020' : det.severity === 'warning' ? '#ff9500' : '#00bbff';

  useFrame((s) => {
    if (!ringRef.current) return;
    const t = s.clock.elapsedTime;
    ringRef.current.rotation.z = t * 2;
    const sc = 1 + Math.sin(t * 4) * 0.12;
    ringRef.current.scale.set(sc, sc, 1);
  });

  return (
    <group position={det.pos}>
      {/* Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.055, 0.068, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Glow */}
      <pointLight color={color} intensity={1.5} distance={0.6} />
      {/* Label */}
      <Billboard position={[0.12, 0.08, 0]}>
        <Text fontSize={0.038} color={color} anchorX="left" anchorY="middle" fontWeight="bold">
          {'▸ ' + det.label}
        </Text>
        <Text fontSize={0.025} color="#666666" anchorX="left" anchorY="middle" position={[0, -0.045, 0]}>
          {'  ' + det.detail}
        </Text>
      </Billboard>
    </group>
  );
}

// ==================== FLOOR GRID ====================
function FloorGrid() {
  const c1 = useMemo(() => new THREE.Color('#00ff88').multiplyScalar(0.12), []);
  const c2 = useMemo(() => new THREE.Color('#00ff88').multiplyScalar(0.04), []);
  return (
    <group position={[0, 0.025, 0]}>
      <gridHelper args={[5, 20, c1, c2]} />
    </group>
  );
}
