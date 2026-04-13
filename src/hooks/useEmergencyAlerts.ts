import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertData {
  title: string;
  title_hi?: string;
  message: string;
  message_hi?: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  zone_ids?: string[];
  expires_in_minutes?: number;
}

interface Alert {
  id: string;
  title: string;
  title_hi: string | null;
  message: string;
  message_hi: string | null;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  status: 'active' | 'resolved' | 'expired';
  zone_ids: string[] | null;
  created_at: string;
  resolved_at: string | null;
  expires_at: string | null;
  created_by: string | null;
}

export function useEmergencyAlerts() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const broadcastAlert = useCallback(async (data: AlertData): Promise<Alert | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to broadcast alerts');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/broadcast-alert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to broadcast alert');
      }

      toast({
        title: data.severity === 'emergency' ? '🚨 Emergency Alert Sent' : 'Alert Broadcast',
        description: `"${data.title}" has been sent to all users`,
        variant: data.severity === 'emergency' ? 'destructive' : 'default',
      });

      return result.alert;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to broadcast alert';
      setError(message);
      toast({
        title: 'Broadcast Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resolveAlert = useCallback(async (alertId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to resolve alerts');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-alert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ alert_id: alertId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resolve alert');
      }

      toast({
        title: 'Alert Resolved',
        description: 'The alert has been marked as resolved',
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve alert';
      setError(message);
      toast({
        title: 'Failed to Resolve',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Pre-defined emergency templates
  const emergencyTemplates = [
    {
      id: 'evacuation',
      title: 'Emergency Evacuation',
      title_hi: 'आपातकालीन निकासी',
      message: 'Please evacuate immediately using the nearest exit. Follow staff instructions and do not run.',
      message_hi: 'कृपया निकटतम निकास से तुरंत बाहर निकलें। कर्मचारियों के निर्देशों का पालन करें और न भागें।',
      severity: 'emergency' as const,
    },
    {
      id: 'medical',
      title: 'Medical Emergency',
      title_hi: 'चिकित्सा आपातकाल',
      message: 'Medical teams are responding. Please clear the area and make way for emergency responders.',
      message_hi: 'चिकित्सा टीमें जवाब दे रही हैं। कृपया क्षेत्र खाली करें और आपातकालीन प्रतिक्रियाकर्ताओं के लिए रास्ता बनाएं।',
      severity: 'critical' as const,
    },
    {
      id: 'overcrowd',
      title: 'Crowd Control Alert',
      title_hi: 'भीड़ नियंत्रण अलर्ट',
      message: 'Area is overcrowded. Entry is temporarily paused. Please use alternate routes.',
      message_hi: 'क्षेत्र में बहुत भीड़ है। प्रवेश अस्थायी रूप से रोका गया है। कृपया वैकल्पिक मार्गों का उपयोग करें।',
      severity: 'critical' as const,
    },
    {
      id: 'weather',
      title: 'Severe Weather Warning',
      title_hi: 'गंभीर मौसम चेतावनी',
      message: 'Severe weather approaching. Please seek shelter in covered areas immediately.',
      message_hi: 'गंभीर मौसम आ रहा है। कृपया तुरंत ढके हुए क्षेत्रों में आश्रय लें।',
      severity: 'warning' as const,
    },
    {
      id: 'fire',
      title: 'Fire Alert',
      title_hi: 'आग का अलर्ट',
      message: 'Fire reported. Evacuate immediately using marked exit routes. Do not use elevators.',
      message_hi: 'आग की सूचना मिली। चिह्नित निकास मार्गों का उपयोग करके तुरंत बाहर निकलें। लिफ्ट का उपयोग न करें।',
      severity: 'emergency' as const,
    },
  ];

  return {
    broadcastAlert,
    resolveAlert,
    isLoading,
    error,
    emergencyTemplates,
  };
}
