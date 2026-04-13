import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  User,
  Mail,
  ExternalLink,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SOSRequest {
  id: string;
  token_number: string;
  user_id: string;
  phone: string | null;
  location: string | null;
  message: string | null;
  status: string;
  created_at: string;
  zone_id: string | null;
  latitude: number | null;
  longitude: number | null;
  sender_name: string | null;
  sender_email: string | null;
}

export function SOSAlertPanel() {
  const { language } = useLanguage();
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([]);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create alarm audio
  useEffect(() => {
    // Create an oscillator-based alarm sound
    const createAlarmSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playAlarm = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      };

      return { playAlarm, audioContext };
    };

    const alarm = createAlarmSound();
    (window as any).sosAlarm = alarm;

    return () => {
      if ((window as any).sosAlarm?.audioContext) {
        (window as any).sosAlarm.audioContext.close();
      }
    };
  }, []);

  // Fetch existing SOS requests
  useEffect(() => {
    const fetchSOSRequests = async () => {
      const { data, error } = await supabase
        .from('sos_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSOSRequests(data);
        if (data.length > 0) {
          startFlashing();
        }
      }
    };

    fetchSOSRequests();
  }, []);

  // Real-time subscription for new SOS requests
  useEffect(() => {
    const channel = supabase
      .channel('sos-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_requests',
        },
        (payload) => {
          const newSOS = payload.new as SOSRequest;
          setSOSRequests((prev) => [newSOS, ...prev]);
          
          // Play alarm
          if (isAlarmEnabled && (window as any).sosAlarm) {
            (window as any).sosAlarm.playAlarm();
            // Play multiple times for urgency
            setTimeout(() => (window as any).sosAlarm?.playAlarm(), 1000);
            setTimeout(() => (window as any).sosAlarm?.playAlarm(), 2000);
          }

          // Start flashing
          startFlashing();

          // Show toast notification
          toast.error(
            language === 'hi'
              ? `🚨 आपातकालीन SOS! टोकन: ${newSOS.token_number}`
              : `🚨 EMERGENCY SOS! Token: ${newSOS.token_number}`,
            {
              duration: 10000,
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sos_requests',
        },
        (payload) => {
          const updatedSOS = payload.new as SOSRequest;
          if (updatedSOS.status === 'resolved') {
            setSOSRequests((prev) => prev.filter((s) => s.id !== updatedSOS.id));
          } else {
            setSOSRequests((prev) =>
              prev.map((s) => (s.id === updatedSOS.id ? updatedSOS : s))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAlarmEnabled, language]);

  // Flash effect
  const startFlashing = () => {
    if (flashIntervalRef.current) return;
    
    setIsFlashing(true);
    flashIntervalRef.current = setInterval(() => {
      setIsFlashing((prev) => !prev);
    }, 500);

    // Stop flashing after 10 seconds
    setTimeout(() => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
        setIsFlashing(false);
      }
    }, 10000);
  };

  // Resolve SOS request
  const handleResolve = async (sosId: string) => {
    const { error } = await supabase
      .from('sos_requests')
      .update({
        status: 'resolved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', sosId);

    if (error) {
      toast.error(language === 'hi' ? 'अपडेट विफल' : 'Failed to update');
    } else {
      setSOSRequests((prev) => prev.filter((s) => s.id !== sosId));
      toast.success(
        language === 'hi' ? 'SOS हल किया गया' : 'SOS resolved'
      );
    }
  };

  if (sosRequests.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        'border-2 transition-all duration-300',
        isFlashing ? 'border-danger bg-danger/20' : 'border-danger/50 bg-danger/10'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            {language === 'hi' ? '🚨 आपातकालीन SOS अलर्ट' : '🚨 EMERGENCY SOS ALERTS'}
            <Badge variant="destructive" className="ml-2">
              {sosRequests.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
            className="h-8 w-8"
          >
            {isAlarmEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {sosRequests.map((sos) => (
              <div
                key={sos.id}
                className="p-4 rounded-lg bg-background border border-danger/30 animate-pulse-slow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-lg font-bold px-3 py-1">
                        {sos.token_number}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(sos.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {sos.sender_name && (
                      <p className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-foreground" />
                        <span className="font-medium">{sos.sender_name}</span>
                      </p>
                    )}

                    {sos.sender_email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        {sos.sender_email}
                      </p>
                    )}

                    {sos.location && (
                      <p className="text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {sos.location}
                      </p>
                    )}

                    {sos.latitude && sos.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        📍 Open in Google Maps ({sos.latitude.toFixed(5)}, {sos.longitude.toFixed(5)})
                      </a>
                    )}

                    {sos.phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="w-4 h-4 text-safe" />
                        {sos.phone}
                      </p>
                    )}

                    {sos.message && (
                      <p className="text-sm text-muted-foreground mt-2">
                        "{sos.message}"
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(sos.id)}
                    className="gap-1 border-safe text-safe hover:bg-safe hover:text-safe-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {language === 'hi' ? 'हल करें' : 'Resolve'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}