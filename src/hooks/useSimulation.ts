import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ZoneStatus = Database['public']['Enums']['zone_status'];
type AlertSeverity = Database['public']['Enums']['alert_severity'];

interface SimulationConfig {
  intervalMs: number;
  crowdFluctuation: number; // percentage variation per tick
  alertChance: number; // probability of generating an alert per tick
}

const DEFAULT_CONFIG: SimulationConfig = {
  intervalMs: 3000,
  crowdFluctuation: 0.15,
  alertChance: 0.1, // 10% chance per tick
};

const ALERT_TEMPLATES = [
  { title: 'High Crowd Density Detected', title_hi: 'उच्च भीड़ घनत्व पाया गया', severity: 'warning' as AlertSeverity },
  { title: 'Medical Emergency Reported', title_hi: 'चिकित्सा आपातकाल रिपोर्ट', severity: 'critical' as AlertSeverity },
  { title: 'Lost Child Alert', title_hi: 'खोए हुए बच्चे की चेतावनी', severity: 'warning' as AlertSeverity },
  { title: 'Severe Weather Warning', title_hi: 'गंभीर मौसम चेतावनी', severity: 'emergency' as AlertSeverity },
  { title: 'Queue Overflow at Gate', title_hi: 'द्वार पर कतार अधिक', severity: 'warning' as AlertSeverity },
  { title: 'VIP Movement in Progress', title_hi: 'VIP आवाजाही जारी', severity: 'info' as AlertSeverity },
  { title: 'Fire Safety Drill', title_hi: 'अग्नि सुरक्षा अभ्यास', severity: 'info' as AlertSeverity },
  { title: 'Stampede Risk - Zone Critical', title_hi: 'भगदड़ का खतरा - ज़ोन क्रिटिकल', severity: 'emergency' as AlertSeverity },
];

export function useSimulation(config: Partial<SimulationConfig> = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const zonesRef = useRef<Database['public']['Tables']['zones']['Row'][]>([]);

  const { intervalMs, crowdFluctuation, alertChance } = { ...DEFAULT_CONFIG, ...config };

  // Fetch zones once on mount
  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase.from('zones').select('*');
      if (data) zonesRef.current = data;
    };
    fetchZones();
  }, []);

  const getStatusFromOccupancy = (occupancy: number): ZoneStatus => {
    if (occupancy >= 95) return 'critical';
    if (occupancy >= 80) return 'red';
    if (occupancy >= 60) return 'yellow';
    return 'green';
  };

  const generateAlert = useCallback(async () => {
    const zones = zonesRef.current;
    const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
    const zone = zones.length > 0 ? zones[Math.floor(Math.random() * zones.length)] : null;

    const messages = {
      info: ['Routine update for your awareness.', 'नियमित अपडेट आपकी जानकारी के लिए।'],
      warning: ['Please stay alert and follow instructions.', 'कृपया सतर्क रहें और निर्देशों का पालन करें।'],
      critical: ['Immediate attention required. Stay calm.', 'तत्काल ध्यान देने की आवश्यकता। शांत रहें।'],
      emergency: ['URGENT! Follow evacuation procedures if instructed.', 'तत्काल! यदि निर्देश हो तो निकासी प्रक्रिया का पालन करें।'],
    };

    const [message, message_hi] = messages[template.severity];

    await supabase.from('alerts').insert({
      title: template.title,
      title_hi: template.title_hi,
      message,
      message_hi,
      severity: template.severity,
      zone_ids: zone ? [zone.id] : null,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    });

    setAlertCount((prev) => prev + 1);
  }, []);

  const generateReading = useCallback(async () => {
    const zones = zonesRef.current;
    if (zones.length === 0) return;

    // Pick a random zone to update
    const zone = zones[Math.floor(Math.random() * zones.length)];
    
    // Calculate new count with realistic fluctuation
    const currentHour = new Date().getHours();
    const isRushHour = (currentHour >= 9 && currentHour <= 12) || (currentHour >= 16 && currentHour <= 19);
    const rushMultiplier = isRushHour ? 1.3 : 0.8;
    
    const baseChange = Math.floor(zone.capacity * crowdFluctuation * (Math.random() - 0.4) * rushMultiplier);
    let newCount = Math.max(0, Math.min(zone.capacity, zone.current_count + baseChange));
    
    // Occasionally simulate crowd surges or drops
    if (Math.random() < 0.1) {
      const surgeDirection = Math.random() > 0.5 ? 1 : -1;
      const surgeAmount = Math.floor(zone.capacity * 0.2 * surgeDirection);
      newCount = Math.max(0, Math.min(zone.capacity, newCount + surgeAmount));
    }

    const newStatus = getStatusFromOccupancy((newCount / zone.capacity) * 100);

    // Insert sensor reading
    await supabase.from('sensor_readings').insert({
      zone_id: zone.id,
      count: newCount,
      temperature: 28 + Math.random() * 8, // 28-36°C
      flow_rate: Math.floor(50 + Math.random() * 150), // people per minute
    });

    // Update zone counts
    await supabase
      .from('zones')
      .update({
        current_count: newCount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', zone.id);

    // Update local ref
    zonesRef.current = zonesRef.current.map((z) =>
      z.id === zone.id ? { ...z, current_count: newCount, status: newStatus } : z
    );

    // Maybe generate an alert
    if (Math.random() < alertChance) {
      await generateAlert();
    }

    setTickCount((prev) => prev + 1);
  }, [crowdFluctuation, alertChance, generateAlert]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsRunning(true);
    // Immediate first reading
    generateReading();
    
    intervalRef.current = setInterval(generateReading, intervalMs);
  }, [generateReading, intervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    tickCount,
    alertCount,
    start,
    stop,
    toggle,
  };
}
