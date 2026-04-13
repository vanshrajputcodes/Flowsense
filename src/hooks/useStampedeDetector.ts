import { useRef, useState, useCallback } from 'react';

interface PersonPosition {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface StampedeRisk {
  level: 'safe' | 'elevated' | 'warning' | 'critical';
  score: number; // 0-100
  avgVelocity: number;
  dominantDirection: string;
  density: number;
  message: string;
}

const HISTORY_FRAMES = 5;
const VELOCITY_THRESHOLD = 35; // px/sec for warning
const CRITICAL_VELOCITY = 55; // px/sec for critical
const DENSITY_THRESHOLD = 0.6; // 60% of frame area covered

export function useStampedeDetector(frameWidth: number, frameHeight: number) {
  const positionHistory = useRef<PersonPosition[][]>([]);
  const [risk, setRisk] = useState<StampedeRisk>({
    level: 'safe', score: 0, avgVelocity: 0, dominantDirection: 'none', density: 0, message: 'All clear'
  });

  const analyze = useCallback((persons: { id: number; bbox: [number, number, number, number] }[]) => {
    const now = Date.now();
    const current: PersonPosition[] = persons.map(p => ({
      id: p.id,
      x: p.bbox[0] + p.bbox[2] / 2,
      y: p.bbox[1] + p.bbox[3] / 2,
      timestamp: now,
    }));

    positionHistory.current.push(current);
    if (positionHistory.current.length > HISTORY_FRAMES) {
      positionHistory.current.shift();
    }

    if (positionHistory.current.length < 2 || persons.length < 2) {
      setRisk({ level: 'safe', score: 0, avgVelocity: 0, dominantDirection: 'none', density: 0, message: 'Insufficient data' });
      return;
    }

    const prev = positionHistory.current[positionHistory.current.length - 2];
    const velocities: { vx: number; vy: number; speed: number }[] = [];

    for (const cp of current) {
      // Find same person in previous frame (closest match)
      let bestMatch: PersonPosition | null = null;
      let bestDist = Infinity;
      for (const pp of prev) {
        const dist = Math.sqrt((cp.x - pp.x) ** 2 + (cp.y - pp.y) ** 2);
        if (dist < bestDist && dist < 150) {
          bestDist = dist;
          bestMatch = pp;
        }
      }
      if (bestMatch) {
        const dt = (cp.timestamp - bestMatch.timestamp) / 1000;
        if (dt > 0) {
          const vx = (cp.x - bestMatch.x) / dt;
          const vy = (cp.y - bestMatch.y) / dt;
          velocities.push({ vx, vy, speed: Math.sqrt(vx * vx + vy * vy) });
        }
      }
    }

    if (velocities.length === 0) {
      setRisk({ level: 'safe', score: 0, avgVelocity: 0, dominantDirection: 'none', density: 0, message: 'No movement tracked' });
      return;
    }

    const avgSpeed = velocities.reduce((s, v) => s + v.speed, 0) / velocities.length;
    const avgVx = velocities.reduce((s, v) => s + v.vx, 0) / velocities.length;
    const avgVy = velocities.reduce((s, v) => s + v.vy, 0) / velocities.length;

    // Dominant direction
    let direction = 'none';
    const angle = Math.atan2(avgVy, avgVx) * (180 / Math.PI);
    if (avgSpeed > 10) {
      if (angle > -45 && angle <= 45) direction = 'right →';
      else if (angle > 45 && angle <= 135) direction = 'down ↓';
      else if (angle > -135 && angle <= -45) direction = 'up ↑';
      else direction = 'left ←';
    }

    // Direction uniformity (how aligned are people moving)
    const directionVariance = velocities.reduce((sum, v) => {
      const diff = Math.atan2(v.vy, v.vx) - Math.atan2(avgVy, avgVx);
      return sum + diff * diff;
    }, 0) / velocities.length;
    const uniformity = Math.max(0, 1 - directionVariance / (Math.PI * Math.PI));

    // Density calculation
    const totalPersonArea = persons.reduce((s, p) => s + p.bbox[2] * p.bbox[3], 0);
    const frameArea = Math.max(1, frameWidth * frameHeight);
    const density = totalPersonArea / frameArea;

    // Risk score
    let score = 0;
    score += Math.min(40, (avgSpeed / CRITICAL_VELOCITY) * 40);
    score += Math.min(30, uniformity * 30); // high uniformity = crowd moving together = bad
    score += Math.min(30, (density / DENSITY_THRESHOLD) * 30);
    score = Math.min(100, Math.round(score));

    let level: StampedeRisk['level'] = 'safe';
    let message = 'Normal crowd movement';
    if (score >= 75) {
      level = 'critical';
      message = `⚠️ STAMPEDE RISK! High velocity (${Math.round(avgSpeed)}px/s) + dense crowd moving ${direction}`;
    } else if (score >= 50) {
      level = 'warning';
      message = `Elevated crowd speed (${Math.round(avgSpeed)}px/s) trending ${direction}`;
    } else if (score >= 25) {
      level = 'elevated';
      message = `Moderate movement detected ${direction}`;
    }

    setRisk({ level, score, avgVelocity: Math.round(avgSpeed), dominantDirection: direction, density: Math.round(density * 100), message });
  }, [frameWidth, frameHeight]);

  return { risk, analyze };
}
