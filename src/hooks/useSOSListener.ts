import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSirenSound } from './useSirenSound';
import { toast } from 'sonner';

interface SOSRequest {
  id: string;
  token_number: string;
  phone: string | null;
  location: string | null;
  message: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  zone_id: string | null;
  latitude: number | null;
  longitude: number | null;
  sender_name: string | null;
  sender_email: string | null;
}

export function useSOSListener() {
  const [activeSOSRequests, setActiveSOSRequests] = useState<SOSRequest[]>([]);
  const [newSOSAlert, setNewSOSAlert] = useState<SOSRequest | null>(null);
  const { playSiren, stopSiren } = useSirenSound();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef(true);

  // Fetch active SOS requests and detect new ones
  const fetchActiveRequests = useCallback(async (triggerAlert = false) => {
    const { data, error } = await supabase
      .from('sos_requests')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Check for new SOS requests that we haven't seen before
      if (triggerAlert && !isInitialFetchRef.current) {
        const newRequests = data.filter(sos => !knownIdsRef.current.has(sos.id));
        if (newRequests.length > 0) {
          const latestNew = newRequests[0];
          setNewSOSAlert(latestNew);
          playSiren('sos', 5);
          toast.error(`🚨 SOS Alert: ${latestNew.token_number}`, {
            description: latestNew.location || 'Location not provided',
            duration: 10000,
          });
        }
      }
      
      // Update known IDs
      knownIdsRef.current = new Set(data.map(sos => sos.id));
      setActiveSOSRequests(data);
      isInitialFetchRef.current = false;
    }
  }, [playSiren]);

  // Mark SOS as responded
  const respondToSOS = useCallback(async (sosId: string) => {
    const { error } = await supabase
      .from('sos_requests')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
      })
      .eq('id', sosId);

    if (!error) {
      setActiveSOSRequests((prev) => prev.filter((s) => s.id !== sosId));
      setNewSOSAlert(null);
      stopSiren();
      return true;
    }
    return false;
  }, [stopSiren]);

  // Dismiss alert without responding
  const dismissAlert = useCallback(() => {
    setNewSOSAlert(null);
    stopSiren();
  }, [stopSiren]);

  useEffect(() => {
    // Initial fetch
    fetchActiveRequests(false);

    // Poll every 5 seconds as backup for realtime
    const pollInterval = setInterval(() => {
      fetchActiveRequests(true);
    }, 5000);

    // Subscribe to new SOS requests via realtime
    const channel = supabase
      .channel('sos-realtime-admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_requests',
        },
        (payload) => {
          const newSOS = payload.new as SOSRequest;
          if (!knownIdsRef.current.has(newSOS.id)) {
            knownIdsRef.current.add(newSOS.id);
            setActiveSOSRequests((prev) => [newSOS, ...prev]);
            setNewSOSAlert(newSOS);
            
            // Play siren sound
            playSiren('sos', 5);
            
            // Show toast notification
            toast.error(`🚨 SOS Alert: ${newSOS.token_number}`, {
              description: newSOS.location || 'Location not provided',
              duration: 10000,
            });
          }
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
          const updated = payload.new as SOSRequest;
          if (updated.status !== 'active') {
            setActiveSOSRequests((prev) => prev.filter((s) => s.id !== updated.id));
            knownIdsRef.current.delete(updated.id);
            if (newSOSAlert?.id === updated.id) {
              setNewSOSAlert(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchActiveRequests, playSiren, newSOSAlert]);

  return {
    activeSOSRequests,
    newSOSAlert,
    respondToSOS,
    dismissAlert,
    refreshRequests: fetchActiveRequests,
  };
}
