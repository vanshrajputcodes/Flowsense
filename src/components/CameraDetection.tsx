import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CameraOff, Loader2, AlertTriangle, Users, RefreshCw, Baby, SwitchCamera, ShieldAlert, Brain, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useThreatVoiceAlert } from '@/hooks/useThreatVoiceAlert';
import { useStampedeDetector } from '@/hooks/useStampedeDetector';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';

interface PersonInfo {
  id: number;
  bbox: [number, number, number, number];
  score: number;
  gender: 'Male' | 'Female' | 'Unknown';
  genderConfidence: number;
  age: number;
  isChild: boolean;
}

interface ThreatObject {
  id: string;
  class: string;
  label: string;
  bbox: [number, number, number, number];
  score: number;
  severity: 'high' | 'critical';
}

// COCO-SSD classes that are dangerous / suspicious objects
const THREAT_CLASSES: Record<string, { label: string; severity: 'high' | 'critical' }> = {
  'knife': { label: '🔪 KNIFE', severity: 'critical' },
  'scissors': { label: '✂️ SCISSORS', severity: 'high' },
  'baseball bat': { label: '🏏 BAT/STICK', severity: 'high' },
  'fork': { label: '🍴 SHARP OBJECT', severity: 'high' },
  'fire hydrant': { label: '🔥 HAZARD AREA', severity: 'high' },
};

// AI demographics cache from Gemini scans
interface AIDemographics {
  estimated_males: number;
  estimated_females: number;
  estimated_children: number;
  estimated_elderly: number;
  crowd_density: string;
}

interface AIPersonHint {
  gender: 'Male' | 'Female' | 'Unknown';
  ageGroup: 'child' | 'adult' | 'elderly' | 'unknown';
}


interface CameraDetectionProps {
  onPersonCountChange?: (count: number) => void;
  onAnomalyDetected?: (type: string, description: string) => void;
}

// IST midnight reset helpers
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDayKey(): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);
  return istDate.toISOString().slice(0, 10);
}

function msUntilISTMidnight(): number {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istMidnight = new Date(istNow);
  istMidnight.setUTCHours(0, 0, 0, 0);
  istMidnight.setUTCDate(istMidnight.getUTCDate() + 1);
  return istMidnight.getTime() - now.getTime();
}

const STORAGE_KEY = 'cctv_daily_count';

interface DailyCount {
  day: string;
  total: number;
  peakCount: number;
  maleCount: number;
  femaleCount: number;
  childCount: number;
}

function loadDailyCount(): DailyCount {
  const today = getISTDayKey();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: DailyCount = JSON.parse(stored);
      if (parsed.day === today) return parsed;
    }
  } catch {}
  return { day: today, total: 0, peakCount: 0, maleCount: 0, femaleCount: 0, childCount: 0 };
}

function saveDailyCount(dc: DailyCount) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dc)); } catch {}
}

const FACE_API_MODEL_URL = 'https://cdn.jsdelivr.net/gh/nicolo-ribaudo/face-api.js@master/weights';

export function CameraDetection({ onPersonCountChange, onAnomalyDetected }: CameraDetectionProps) {
  const { announceTheat, stopSpeaking } = useThreatVoiceAlert();
  const { risk: stampedeRisk, analyze: analyzeStampede } = useStampedeDetector(640, 480);
  const { crowdEmotion, analyzeExpressions } = useEmotionDetection();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cocoModelRef = useRef<any>(null);
  const faceApiLoadedRef = useRef(false);
  const faceApiModuleRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const detectingRef = useRef(false);
  const prevCountRef = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const dailyCountRef = useRef<DailyCount>(loadDailyCount());
  const midnightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenIdsRef = useRef(new Set<string>());

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [personCount, setPersonCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [faceModelLoaded, setFaceModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState<DailyCount>(loadDailyCount);
  const [persons, setPersons] = useState<PersonInfo[]>([]);
  const [threats, setThreats] = useState<ThreatObject[]>([]);
  const threatCooldownRef = useRef<Record<string, number>>({});
  const [loadingStatus, setLoadingStatus] = useState('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState(false);

  // AI Vision-based threat detection
  const [aiThreats, setAiThreats] = useState<{ object: string; severity: string; confidence: number; description: string }[]>([]);
  const [aiScanning, setAiScanning] = useState(false);
  const [lastAiScan, setLastAiScan] = useState<string>('');
  const aiScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiScanningRef = useRef(false);
  const [aiDemographics, setAiDemographics] = useState<AIDemographics | null>(null);
  const [aiPersonHints, setAiPersonHints] = useState<AIPersonHint[]>([]);

  // Capture frame as base64 JPEG
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.paused) return null;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320; // smaller for faster upload
    tempCanvas.height = 240;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 320, 240);
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.7);
    return dataUrl.split(',')[1]; // return base64 only
  }, []);

  // Upload screenshot to storage and return public URL
  const uploadScreenshot = useCallback(async (base64: string): Promise<string | null> => {
    try {
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: 'image/jpeg' });
      const fileName = `threat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

      const { error } = await supabase.storage
        .from('threat-screenshots')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (error) { console.warn('Screenshot upload error:', error); return null; }

      const { data: urlData } = supabase.storage
        .from('threat-screenshots')
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.warn('Screenshot upload failed:', err);
      return null;
    }
  }, []);

  // Save threat to database + auto-create incident for weapon-level threats
  const saveThreatLog = useCallback(async (
    threat: { object: string; severity: string; confidence: number; description: string; category?: string },
    screenshotUrl: string | null
  ) => {
    try {
      // 1. Log to threat_logs
      await supabase.from('threat_logs').insert({
        object: threat.object,
        category: threat.category || 'weapon',
        severity: threat.severity,
        confidence: threat.confidence,
        description: threat.description,
        screenshot_url: screenshotUrl,
      });

      // 2. Auto-create incident for weapon/explosive/chemical threats
      const criticalCategories = ['weapon', 'explosive', 'chemical', 'sharp_object', 'blunt_weapon'];
      const isCritical = criticalCategories.includes(threat.category || 'weapon') || threat.severity === 'critical';
      
      if (isCritical) {
        const severityMap: Record<string, 'critical' | 'warning' | 'emergency'> = {
          critical: 'critical',
          high: 'warning',
          medium: 'warning',
        };
        const incidentSeverity = severityMap[threat.severity] || 'warning';
        
        await supabase.from('incidents').insert({
          title: `AI Detected: ${threat.object.toUpperCase()}`,
          description: `${threat.description}${screenshotUrl ? `\n\n📸 Screenshot: ${screenshotUrl}` : ''}\n\nConfidence: ${threat.confidence}% | Category: ${threat.category || 'weapon'} | Auto-logged by AI CCTV at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          severity: incidentSeverity,
          status: 'open',
        });
        console.log('Auto-created incident for:', threat.object);
      }
    } catch (err) {
      console.warn('Threat log save error:', err);
    }
  }, []);

  // AI threat scan using Gemini vision
  const runAiThreatScan = useCallback(async () => {
    if (aiScanningRef.current || !isRunningRef.current) return;
    aiScanningRef.current = true;
    setAiScanning(true);
    try {
      const base64 = captureFrame();
      if (!base64) return;

      const { data, error } = await supabase.functions.invoke('analyze-threat', {
        body: { imageBase64: base64 },
      });

      if (error) {
        console.warn('AI threat scan error:', error);
        return;
      }

      setLastAiScan(new Date().toLocaleTimeString());

      if (data?.threats_detected && data.threats?.length > 0) {
        setAiThreats(data.threats);

        // Upload screenshot once for all threats in this frame
        const screenshotUrl = await uploadScreenshot(base64);

        // Save each threat to DB + alert admin + voice announce
        for (const t of data.threats) {
          await saveThreatLog(t, screenshotUrl);
          announceTheat(t.object, t.description);
          toast.error(`🚨 AI THREAT: ${t.object.toUpperCase()} detected! ${t.description}`, {
            duration: 10000,
          });
          onAnomalyDetected?.(
            'weapon',
            `🚨 AI VISION DETECTED: ${t.object.toUpperCase()} — ${t.description} (${t.confidence}% confidence, severity: ${t.severity})`
          );
        }
        toast.success(`📸 Threat logged with screenshot for admin review`);
      } else {
        setAiThreats([]);
      }

      // Update AI demographics for gender/age enrichment
      if (data?.demographics) {
        setAiDemographics(data.demographics);
      }
      setAiPersonHints(Array.isArray(data?.people) ? data.people : []);
    } catch (err) {
      console.warn('AI scan failed:', err);
    } finally {
      aiScanningRef.current = false;
      setAiScanning(false);
    }
  }, [captureFrame, onAnomalyDetected, uploadScreenshot, saveThreatLog]);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cameras[0].deviceId);
      }
      return cameras;
    } catch {
      return [];
    }
  }, [selectedDeviceId]);

  // midnight reset
  const scheduleMidnightReset = useCallback(() => {
    if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    const ms = msUntilISTMidnight();
    midnightTimerRef.current = setTimeout(() => {
      const fresh: DailyCount = { day: getISTDayKey(), total: 0, peakCount: 0, maleCount: 0, femaleCount: 0, childCount: 0 };
      dailyCountRef.current = fresh;
      saveDailyCount(fresh);
      setDailyCount(fresh);
      toast.info('📅 Daily person count reset at 12:00 AM IST');
      scheduleMidnightReset();
    }, ms);
  }, []);

  useEffect(() => {
    scheduleMidnightReset();
    return () => { if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current); };
  }, [scheduleMidnightReset]);

  // Draw detections
  const drawDetections = useCallback((
    ctx: CanvasRenderingContext2D,
    people: PersonInfo[],
    threats: ThreatObject[],
    W: number,
    H: number
  ) => {
    ctx.clearRect(0, 0, W, H);

    // Draw threat objects FIRST (behind people) with flashing red
    threats.forEach((t) => {
      const [x, y, w, h] = t.bbox;
      const conf = Math.round(t.score * 100);

      // Flashing red border
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Red fill overlay
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fillRect(x, y, w, h);

      // Danger label
      const label = `⚠️ ${t.label} ${conf}%`;
      ctx.font = 'bold 13px monospace';
      const labelW = ctx.measureText(label).width + 16;
      const labelH = 24;
      ctx.fillStyle = '#ff0000ee';
      ctx.beginPath();
      ctx.roundRect?.(x, y - labelH - 4, labelW, labelH, 4) ?? ctx.fillRect(x, y - labelH - 4, labelW, labelH);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(label, x + 8, y - 10);

      // Severity badge
      ctx.fillStyle = t.severity === 'critical' ? '#ff0000' : '#ff6600';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(t.severity.toUpperCase(), x + 4, y + h + 14);
    });

    people.forEach((p) => {
      const [x, y, w, h] = p.bbox;
      const conf = Math.round(p.score * 100);
      const color = p.isChild ? '#f59e0b' : p.gender === 'Male' ? '#3b82f6' : p.gender === 'Female' ? '#ec4899' : '#22c55e';

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner markers
      const m = 10;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      [[x, y + m, x, y, x + m, y], [x + w - m, y, x + w, y, x + w, y + m],
       [x, y + h - m, x, y + h, x + m, y + h], [x + w - m, y + h, x + w, y + h, x + w, y + h - m]]
        .forEach(([x1, y1, x2, y2, x3, y3]) => {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
        });

      // Label pill
      const genderSymbol = p.gender === 'Male' ? '♂' : p.gender === 'Female' ? '♀' : '?';
      const ageLabel = p.isChild ? `Child ~${Math.round(p.age)}y` : `~${Math.round(p.age)}y`;
      const label = `#${p.id} ${genderSymbol} ${ageLabel}`;
      ctx.font = 'bold 11px monospace';
      const labelW = ctx.measureText(label).width + 12;
      const labelH = 20;
      ctx.fillStyle = color + 'dd';
      ctx.beginPath();
      ctx.roundRect?.(x, y - labelH - 2, labelW, labelH, 4) ?? ctx.fillRect(x, y - labelH - 2, labelW, labelH);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 6, y - 7);

      // Confidence + gender confidence
      const genderConf = Math.round(p.genderConfidence * 100);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x + w - 50, y + 2, 48, 28);
      ctx.fillStyle = color;
      ctx.font = '9px monospace';
      ctx.fillText(`Det: ${conf}%`, x + w - 47, y + 13);
      ctx.fillText(`Gen: ${genderConf}%`, x + w - 47, y + 25);
    });

    // HUD overlay
    const males = people.filter(p => p.gender === 'Male').length;
    const females = people.filter(p => p.gender === 'Female').length;
    const children = people.filter(p => p.isChild).length;

    const hudHeight = threats.length > 0 ? 80 : 60;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 260, hudHeight);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`👥 ${people.length} persons detected`, 8, 18);
    ctx.fillStyle = '#3b82f6';
    ctx.font = '11px monospace';
    ctx.fillText(`♂ ${males}  ♀ ${females}  🧒 ${children}`, 8, 35);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`Today: ${dailyCountRef.current.total} | Peak: ${dailyCountRef.current.peakCount}`, 8, 52);

    if (threats.length > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`🚨 ${threats.length} THREAT(S) DETECTED!`, 8, 70);
    }
  }, []);
  const runDetection = useCallback(async () => {
    if (!isRunningRef.current || detectingRef.current) return;
    detectingRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cocoModelRef.current) { detectingRef.current = false; return; }

    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState < 2 || video.paused) { detectingRef.current = false; return; }

    const W = video.videoWidth;
    const H = video.videoHeight;
    if (W === 0 || H === 0) { detectingRef.current = false; return; }
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    try {
      // Run COCO-SSD for person body detection
      const preds = await cocoModelRef.current.detect(video);
      if (!isRunningRef.current) return;

      // Filter person detections
      const bodyDetections = preds.filter((p: any) => p.class === 'person' && p.score > 0.4);

      // Detect dangerous/suspicious objects (low threshold — knives are hard to detect)
      const detectedThreats: ThreatObject[] = preds
        .filter((p: any) => THREAT_CLASSES[p.class] && p.score > 0.20)
        .map((p: any) => ({
          id: `${p.class}-${Math.round(p.bbox[0])}-${Math.round(p.bbox[1])}`,
          class: p.class,
          label: THREAT_CLASSES[p.class].label,
          bbox: p.bbox as [number, number, number, number],
          score: p.score,
          severity: THREAT_CLASSES[p.class].severity,
        }));

      // Alert admin for new threats (with 10s cooldown per object type)
      const alertNow = Date.now();
      detectedThreats.forEach((t) => {
        const lastAlert = threatCooldownRef.current[t.class] || 0;
        if (alertNow - lastAlert > 10000) {
          threatCooldownRef.current[t.class] = alertNow;
          announceTheat(t.class);
          onAnomalyDetected?.('suspicious', `🚨 WEAPON/THREAT DETECTED: ${t.label} (${Math.round(t.score * 100)}% confidence)`);
        }
      });
      setThreats(detectedThreats);

      // Run face-api.js for face analysis (age, gender)
      let faceResults: any[] = [];
      if (faceApiLoadedRef.current && faceApiModuleRef.current) {
        try {
          const faceapi = faceApiModuleRef.current;
          // Use SSD MobilenetV1 with landmarks for max gender accuracy
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
            .withFaceLandmarks()
            .withAgeAndGender()
            .withFaceExpressions();
          faceResults = [...detections];
          
          // Analyze crowd emotions
          analyzeExpressions(faceResults);
        } catch (e) {
          // Non-fatal — body detection still works
          console.warn('Face detection frame skip:', e);
        }
      }

      // Map face results to person bboxes
      const remainingFaces = [...faceResults];
      let maleHintsUsed = 0;
      let femaleHintsUsed = 0;
      const totalMaleHints = aiPersonHints.filter((hint) => hint.gender === 'Male').length;
      const totalFemaleHints = aiPersonHints.filter((hint) => hint.gender === 'Female').length;

      const people: PersonInfo[] = bodyDetections.map((body: any, i: number) => {
        const [bx, by, bw, bh] = body.bbox;
        const bodyCenterX = bx + bw / 2;
        const bodyTopY = by + bh * 0.18;

        let bestFace: any = null;
        let bestScore = -Infinity;
        let bestIdx = -1;
        for (let fi = 0; fi < remainingFaces.length; fi++) {
          const face = remainingFaces[fi];
          const det = face?.detection;
          if (!det?.box) continue;
          const fb = det.box;
          const faceCenterX = fb.x + fb.width / 2;
          const faceCenterY = fb.y + fb.height / 2;
          const horizontalDelta = Math.abs(faceCenterX - bodyCenterX);
          const verticalDelta = Math.abs(faceCenterY - bodyTopY);
          const faceWidthRatio = fb.width / Math.max(1, bw);
          const faceHeightRatio = fb.height / Math.max(1, bh);

          const isInsideHeadZone = fb.y >= by - bh * 0.08 && fb.y + fb.height <= by + bh * 0.5;
          const isReasonableSize = faceWidthRatio > 0.12 && faceWidthRatio < 0.65 && faceHeightRatio > 0.08 && faceHeightRatio < 0.5;
          if (!isInsideHeadZone || !isReasonableSize || horizontalDelta > bw * 0.32 || verticalDelta > bh * 0.28) continue;

          const score = det.score - (horizontalDelta / Math.max(1, bw)) - (verticalDelta / Math.max(1, bh));
          if (score > bestScore) {
            bestScore = score;
            bestFace = face;
            bestIdx = fi;
          }
        }

        let gender: 'Male' | 'Female' | 'Unknown' = 'Unknown';
        let genderConfidence = 0;
        let age = 25;
        let isChild = false;

        if (bestFace && bestIdx >= 0) {
          const rawGender = bestFace.gender;
          const rawProb = bestFace.genderProbability ?? 0.5;
          if (rawProb >= 0.4 && (rawGender === 'male' || rawGender === 'female')) {
            gender = rawGender === 'male' ? 'Male' : 'Female';
            genderConfidence = rawProb;
          }
          age = Math.max(1, Math.round(bestFace.age ?? 25));
          isChild = age < 14;
          remainingFaces.splice(bestIdx, 1);
        } else {
          const heightRatio = bh / H;
          const aspectRatio = bw / Math.max(1, bh);
          if (heightRatio < 0.34 || (heightRatio < 0.42 && aspectRatio > 0.48)) {
            isChild = true;
            age = 10;
          } else if (heightRatio > 0.72) {
            age = 30;
          } else {
            age = 24;
          }

          if (totalMaleHints > totalFemaleHints && maleHintsUsed < totalMaleHints) {
            gender = 'Male';
            genderConfidence = 0.72;
            maleHintsUsed += 1;
          } else if (totalFemaleHints > totalMaleHints && femaleHintsUsed < totalFemaleHints) {
            gender = 'Female';
            genderConfidence = 0.72;
            femaleHintsUsed += 1;
          }
        }

        return {
          id: i + 1,
          bbox: body.bbox as [number, number, number, number],
          score: body.score,
          gender,
          genderConfidence,
          age,
          isChild,
        };
      });

      drawDetections(ctx, people, detectedThreats, W, H);

      // Stampede risk analysis
      analyzeStampede(people.map(p => ({ id: p.id, bbox: p.bbox })));

      // Emotion-based alert
      if (crowdEmotion.alertTriggered) {
        onAnomalyDetected?.('behavior', `🧠 CROWD PANIC: ${crowdEmotion.message} (Fear: ${crowdEmotion.fearCount}, Angry: ${crowdEmotion.angryCount})`);
        announceTheat('panic', crowdEmotion.message);
      }

      // Stampede alert
      if (stampedeRisk.level === 'critical') {
        onAnomalyDetected?.('behavior', `⚠️ STAMPEDE RISK: ${stampedeRisk.message}`);
        announceTheat('stampede', stampedeRisk.message);
      }

      const count = people.length;
      setPersonCount(count);
      setPersons(people);
      onPersonCountChange?.(count);

      // Update daily counters — only count unique detections per frame, not cumulative
      const dc = dailyCountRef.current;
      const maleNow = people.filter(p => p.gender === 'Male').length;
      const femaleNow = people.filter(p => p.gender === 'Female').length;
      const childNow = people.filter(p => p.isChild).length;

      // Use peak tracking — don't add every frame's count
      const updated: DailyCount = {
        ...dc,
        total: dc.total + Math.max(0, count - prevCountRef.current), // only count new arrivals
        peakCount: Math.max(dc.peakCount, count),
        maleCount: dc.maleCount + Math.max(0, maleNow - (prevCountRef.current > 0 ? Math.round(prevCountRef.current * (dc.maleCount / Math.max(1, dc.maleCount + dc.femaleCount))) : 0)),
        femaleCount: dc.femaleCount + Math.max(0, femaleNow - (prevCountRef.current > 0 ? Math.round(prevCountRef.current * (dc.femaleCount / Math.max(1, dc.maleCount + dc.femaleCount))) : 0)),
        childCount: dc.childCount + Math.max(0, childNow),
      };
      dailyCountRef.current = updated;
      setDailyCount({ ...updated });
      saveDailyCount(updated);

      // Anomaly detection
      if (count > prevCountRef.current + 3 && count > 2) {
        onAnomalyDetected?.('behavior', `Sudden crowd spike: ${prevCountRef.current} → ${count} persons`);
      }
      if (prevCountRef.current > 3 && count === 0) {
        onAnomalyDetected?.('suspicious', 'Sudden crowd dispersal detected');
      }
      prevCountRef.current = count;

      // FPS
      const now = Date.now();
      setFps(Math.round(1000 / Math.max(1, now - lastFrameTime.current)));
      lastFrameTime.current = now;
    } catch (err) {
      console.warn('Detection frame error (non-fatal):', err);
    } finally {
      detectingRef.current = false;
    }
  }, [drawDetections, onPersonCountChange, onAnomalyDetected]);

  // Stop camera
  const stopCamera = useCallback(() => {
    isRunningRef.current = false;
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (aiScanIntervalRef.current) {
      clearInterval(aiScanIntervalRef.current);
      aiScanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopSpeaking();
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsActive(false);
    setPersonCount(0);
    setFps(0);
    setPersons([]);
    setThreats([]);
    setAiThreats([]);
    onPersonCountChange?.(0);
  }, [onPersonCountChange]);

  // Switch to a different camera without reloading AI models
  const switchCamera = useCallback(async (newDeviceId: string) => {
    if (newDeviceId === selectedDeviceId && isActive) return;
    setSelectedDeviceId(newDeviceId);
    
    if (!isActive) return;
    
    setIsSwitching(true);
    try {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
      }
      detectingRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: newDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        const onLoaded = () => { video.removeEventListener('loadeddata', onLoaded); resolve(); };
        video.addEventListener('loadeddata', onLoaded);
      });
      await video.play();

      detectIntervalRef.current = setInterval(() => {
        if (isRunningRef.current && !detectingRef.current) {
          runDetection();
        }
      }, 1200);

      toast.success('📷 Camera switched!');
    } catch (err: any) {
      toast.error(`Failed to switch: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSwitching(false);
    }
  }, [selectedDeviceId, isActive, runDetection]);

  // Start camera (optionally with a specific deviceId)
  const startCamera = async (deviceId?: string) => {
    if (isRunningRef.current) return;
    setError(null);
    setIsLoading(true);

    try {
      // Enumerate cameras first
      const cameras = await enumerateCameras();

      // Step 1: Get camera
      setLoadingStatus('Requesting camera access...');
      const targetDeviceId = deviceId || selectedDeviceId || undefined;
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Update selected device from actual stream track
      const activeTrack = stream.getVideoTracks()[0];
      const settings = activeTrack?.getSettings();
      if (settings?.deviceId) {
        setSelectedDeviceId(settings.deviceId);
      }

      // Re-enumerate after permission grant (labels become available)
      await enumerateCameras();

      const video = videoRef.current!;
      video.srcObject = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          video.removeEventListener('loadeddata', onLoaded);
          resolve();
        };
        video.addEventListener('loadeddata', onLoaded);
        video.onerror = () => reject(new Error('Video failed to load'));
        setTimeout(() => reject(new Error('Video load timeout')), 15000);
      });

      await video.play();

      // Step 2: Load COCO-SSD model
      if (!cocoModelRef.current) {
        setLoadingStatus('Loading person detection AI (COCO-SSD)...');
        const tf = await import('@tensorflow/tfjs');
        // Try WebGL first, fall back to WASM, then CPU
        try {
          await tf.setBackend('webgl');
          await tf.ready();
        } catch {
          console.warn('WebGL failed, trying wasm...');
          try {
            await tf.setBackend('wasm');
            await tf.ready();
          } catch {
            console.warn('WASM failed, using CPU backend');
            await tf.setBackend('cpu');
            await tf.ready();
          }
        }
        console.log('TF backend:', tf.getBackend());
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        cocoModelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        setModelLoaded(true);
        toast.success('✅ Person detection model loaded');
      }

      // Step 3: Load face-api.js models (SSD MobilenetV1 for max accuracy)
      if (!faceApiLoadedRef.current) {
        setLoadingStatus('Loading face AI (high-accuracy gender + age)...');
        try {
          const faceapi = await import('face-api.js');
          faceApiModuleRef.current = faceapi;
          
          // Load SSD MobilenetV1 (much more accurate than TinyFaceDetector for gender)
          // + faceLandmark68Net improves age/gender accuracy significantly
          // + faceExpressionNet for emotion detection
          await faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_API_MODEL_URL);
          await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODEL_URL);
          await faceapi.nets.ageGenderNet.loadFromUri(FACE_API_MODEL_URL);
          await faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URL);
          
          faceApiLoadedRef.current = true;
          setFaceModelLoaded(true);
          toast.success('✅ Face analysis (age + gender) AI loaded');
        } catch (e) {
          console.error('Face-api load error:', e);
          toast.warning('Face AI failed — using body-only detection as fallback');
        }
      }

      // Step 4: Start detection loop
      isRunningRef.current = true;
      setIsActive(true);
      setLoadingStatus('');
      toast.success('🎥 Camera & AI detection active!');

      // Run detection every 1200ms (SSD MobilenetV1 is heavier but much more accurate)
      detectIntervalRef.current = setInterval(() => {
        if (isRunningRef.current && !detectingRef.current) {
          runDetection();
        }
      }, 1200);

      // Step 5: Start AI Vision threat scanning every 5 seconds
      toast.info('🛡️ AI Vision threat scanning active (every 5s)');
      runAiThreatScan(); // initial scan
      aiScanIntervalRef.current = setInterval(() => {
        if (isRunningRef.current) runAiThreatScan();
      }, 2500);

    } catch (err: any) {
      isRunningRef.current = false;
      if (err?.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission in your browser settings.');
        toast.error('Camera permission denied');
      } else if (err?.name === 'NotFoundError' || err?.name === 'NotReadableError') {
        setError('No camera found or camera is in use by another app.');
        toast.error('Camera not available');
      } else {
        setError(`Camera error: ${err?.message || 'Unknown error'}`);
        toast.error('Failed to start camera');
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (aiScanIntervalRef.current) clearInterval(aiScanIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const resetDailyCount = () => {
    const fresh: DailyCount = { day: getISTDayKey(), total: 0, peakCount: 0, maleCount: 0, femaleCount: 0, childCount: 0 };
    dailyCountRef.current = fresh;
    saveDailyCount(fresh);
    setDailyCount(fresh);
    seenIdsRef.current.clear();
    toast.success('Daily count reset');
  };

  const totalGender = dailyCount.maleCount + dailyCount.femaleCount || 1;
  const maleRatio = Math.round((dailyCount.maleCount / totalGender) * 100);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Live Camera Detection</span>
          {isActive && (
            <Badge variant="outline" className="text-[10px] text-safe border-safe/30 bg-safe/10 animate-pulse">
              ● LIVE
            </Badge>
          )}
          {faceModelLoaded && (
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              Face AI ✓
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isActive && (
            <>
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="w-3 h-3" /> {personCount} live
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {fps} FPS
              </Badge>
            </>
          )}
          {isActive ? (
            <Button size="sm" variant="destructive" onClick={stopCamera} className="gap-1">
              <CameraOff className="w-3.5 h-3.5" /> Stop
            </Button>
          ) : (
            <Button size="sm" variant="default" onClick={() => startCamera()} disabled={isLoading} className="gap-1">
              {isLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {loadingStatus || 'Starting…'}</>
              ) : (
                <><Camera className="w-3.5 h-3.5" /> Start Camera</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Camera Selector */}
      {availableCameras.length > 1 && (
        <div className="flex items-center gap-2">
          <SwitchCamera className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select
            value={selectedDeviceId}
            onValueChange={(val) => switchCamera(val)}
            disabled={isSwitching}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select camera..." />
            </SelectTrigger>
            <SelectContent>
              {availableCameras.map((cam, idx) => (
                <SelectItem key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${idx + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isSwitching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <Badge variant="outline" className="text-[10px] whitespace-nowrap">
            {availableCameras.length} cameras
          </Badge>
        </div>
      )}

      {/* Camera feed + canvas overlay */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: isActive ? 'block' : 'none', pointerEvents: 'none' }}
        />

        {!isActive && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Camera className="w-16 h-16 opacity-20" />
            <p className="text-sm font-medium">Camera is off</p>
            <p className="text-xs opacity-60">Click "Start Camera" for real AI person + face detection</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 text-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">{loadingStatus || 'Initializing...'}</p>
            <p className="text-xs text-muted-foreground">Loading person detection + face analysis AI models</p>
          </div>
        )}

        {isActive && (
          <div className="absolute left-0 right-0 h-0.5 bg-primary/60 opacity-60 pointer-events-none"
            style={{ animation: 'scanline 3s linear infinite', top: 0 }} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* COCO-SSD Threat Alert Banner */}
      {isActive && threats.length > 0 && (
        <div className="p-3 rounded-lg border-2 border-destructive bg-destructive/10 animate-pulse space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold">
            <AlertTriangle className="w-5 h-5" />
            🚨 THREAT DETECTED — {threats.length} suspicious object(s)
          </div>
          <div className="flex flex-wrap gap-2">
            {threats.map((t) => (
              <Badge key={t.id} variant="destructive" className="gap-1 text-xs">
                {t.label} — {Math.round(t.score * 100)}%
                <span className="opacity-70">({t.severity})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* AI Vision Threat Alert Banner */}
      {isActive && aiThreats.length > 0 && (
        <div className="p-4 rounded-lg border-2 border-destructive bg-destructive/15 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-bold text-lg animate-pulse">
            <ShieldAlert className="w-6 h-6" />
            🚨 AI VISION: THREAT DETECTED! ({aiThreats.length} item{aiThreats.length > 1 ? 's' : ''})
          </div>
          <div className="space-y-2">
            {aiThreats.map((t, i) => {
              const categoryColors: Record<string, string> = {
                weapon: 'bg-destructive text-destructive-foreground',
                sharp_object: 'bg-destructive/80 text-destructive-foreground',
                blunt_weapon: 'bg-caution text-caution-foreground',
                explosive: 'bg-destructive text-destructive-foreground',
                suspicious_behavior: 'bg-caution/80 text-foreground',
                unattended_item: 'bg-caution text-caution-foreground',
              };
              const categoryIcons: Record<string, string> = {
                weapon: '🔪', sharp_object: '✂️', blunt_weapon: '🏏',
                explosive: '💣', suspicious_behavior: '👁️', unattended_item: '🎒',
              };
              const cat = (t as any).category || 'weapon';
              return (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <div className="font-bold text-destructive uppercase">
                      {categoryIcons[cat] || '⚠️'} {t.object} — {t.confidence}%
                    </div>
                    <div className="text-destructive/80 text-xs mt-0.5">{t.description}</div>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge variant="destructive" className="text-[10px]">
                        {t.severity}
                      </Badge>
                      <Badge className={`text-[10px] ${categoryColors[cat] || 'bg-muted text-muted-foreground'}`}>
                        {cat.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Scan Status */}
      {isActive && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>AI Vision Scan: {aiScanning ? 'Analyzing...' : aiThreats.length > 0 ? '⚠️ THREATS FOUND' : '✅ Clear'}</span>
          {lastAiScan && <span className="opacity-60">Last: {lastAiScan}</span>}
          <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px]" onClick={runAiThreatScan} disabled={aiScanning}>
            {aiScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Scan Now'}
          </Button>
        </div>
      )}

      {/* Stampede Risk Indicator */}
      {isActive && (
        <div className={`p-3 rounded-lg border ${
          stampedeRisk.level === 'critical' ? 'border-destructive bg-destructive/10 animate-pulse' :
          stampedeRisk.level === 'warning' ? 'border-caution bg-caution/10' :
          stampedeRisk.level === 'elevated' ? 'border-caution/50 bg-caution/5' :
          'border-border bg-muted/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${stampedeRisk.level === 'critical' ? 'text-destructive' : stampedeRisk.level === 'warning' ? 'text-caution' : 'text-muted-foreground'}`} />
              Stampede Risk: <Badge variant={stampedeRisk.level === 'critical' ? 'destructive' : stampedeRisk.level === 'warning' ? 'default' : 'secondary'} className="text-xs">{stampedeRisk.level.toUpperCase()}</Badge>
            </span>
            <span className="text-xs text-muted-foreground">Score: {stampedeRisk.score}/100</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${stampedeRisk.score > 75 ? 'bg-destructive' : stampedeRisk.score > 50 ? 'bg-caution' : 'bg-safe'}`} style={{ width: `${stampedeRisk.score}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Velocity: {stampedeRisk.avgVelocity}px/s</span>
            <span>Direction: {stampedeRisk.dominantDirection}</span>
            <span>Density: {stampedeRisk.density}%</span>
          </div>
          <p className="text-xs mt-1">{stampedeRisk.message}</p>
        </div>
      )}

      {/* Crowd Emotion Monitor */}
      {isActive && crowdEmotion.emotions.length > 0 && (
        <div className={`p-3 rounded-lg border ${
          crowdEmotion.panicLevel >= 70 ? 'border-destructive bg-destructive/10 animate-pulse' :
          crowdEmotion.panicLevel >= 40 ? 'border-caution bg-caution/10' :
          'border-border bg-muted/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Smile className="w-4 h-4" /> Crowd Emotion
              {crowdEmotion.panicLevel >= 40 && <Badge variant="destructive" className="text-[10px] animate-pulse">PANIC {crowdEmotion.panicLevel}%</Badge>}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-md bg-safe/10 p-1.5">
              <p className="text-lg">😊</p>
              <p className="font-medium text-safe">{crowdEmotion.happyCount}</p>
              <p className="text-[10px] text-muted-foreground">Happy</p>
            </div>
            <div className="rounded-md bg-muted/50 p-1.5">
              <p className="text-lg">😐</p>
              <p className="font-medium">{crowdEmotion.neutralCount}</p>
              <p className="text-[10px] text-muted-foreground">Neutral</p>
            </div>
            <div className="rounded-md bg-caution/10 p-1.5">
              <p className="text-lg">😡</p>
              <p className="font-medium text-caution">{crowdEmotion.angryCount}</p>
              <p className="text-[10px] text-muted-foreground">Angry</p>
            </div>
            <div className="rounded-md bg-destructive/10 p-1.5">
              <p className="text-lg">😰</p>
              <p className="font-medium text-destructive">{crowdEmotion.fearCount}</p>
              <p className="text-[10px] text-muted-foreground">Fear</p>
            </div>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">{crowdEmotion.message}</p>
        </div>
      )}

      {/* Live person list with real demographics */}
      {isActive && persons.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {persons.map((p) => (
            <div key={p.id} className={`rounded-lg border p-2 text-xs space-y-0.5 ${
              p.isChild ? 'border-caution/30 bg-caution/5' :
              p.gender === 'Male' ? 'border-primary/30 bg-primary/5' :
              p.gender === 'Female' ? 'border-danger/30 bg-danger/5' :
              'border-border bg-muted/30'
            }`}>
              <div className="font-bold text-foreground flex items-center gap-1">
                {p.isChild && <Baby className="w-3 h-3 text-caution" />}
                Person #{p.id}
              </div>
              <div className={
                p.gender === 'Male' ? 'text-primary' :
                p.gender === 'Female' ? 'text-danger' : 'text-muted-foreground'
              }>
                {p.gender === 'Male' ? '♂' : p.gender === 'Female' ? '♀' : '?'} {p.gender}
                {p.genderConfidence > 0 && ` (${Math.round(p.genderConfidence * 100)}%)`}
              </div>
              <div className="text-muted-foreground">
                Age: ~{Math.round(p.age)} {p.isChild ? '(Child)' : ''}
              </div>
              <div className="text-[10px] text-safe">{Math.round(p.score * 100)}% det</div>
            </div>
          ))}
        </div>
      )}

      {/* 24-hour Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Today Total', value: dailyCount.total, color: 'text-primary' },
          { label: 'Peak Count', value: dailyCount.peakCount, color: 'text-caution' },
          { label: `Male (${maleRatio}%)`, value: dailyCount.maleCount, color: 'text-primary' },
          { label: `Female (${100 - maleRatio}%)`, value: dailyCount.femaleCount, color: 'text-danger' },
          { label: 'Children', value: dailyCount.childCount, color: 'text-caution' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {modelLoaded ? '✓ COCO-SSD' : '○ Body model'} • {faceModelLoaded ? '✓ Face-API (Age+Gender)' : '○ Face model'} • Resets 12AM IST • {dailyCount.day}
        </span>
        <button onClick={resetDailyCount} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
