import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSirenSound } from './useSirenSound';
import { toast } from 'sonner';

interface UserToken {
  id: string;
  queue_id: string;
  token_number: number;
  status: string;
  is_priority: boolean;
  estimated_wait_time: number | null;
  created_at: string;
  called_at: string | null;
  phone: string | null;
}

const TOKEN_STORAGE_KEY = 'mela_queue_token';

export function useTokenNotification() {
  const [userToken, setUserToken] = useState<UserToken | null>(null);
  const [isTokenCalled, setIsTokenCalled] = useState(false);
  const { playSiren, stopSiren } = useSirenSound();

  // Get stored token ID from localStorage
  const getStoredTokenId = useCallback((): string | null => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  // Store token ID in localStorage
  const storeTokenId = useCallback((tokenId: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenId);
    } catch {
      // localStorage not available
    }
  }, []);

  // Clear stored token
  const clearStoredToken = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  // Fetch user's active token from localStorage
  const fetchUserToken = useCallback(async () => {
    const storedTokenId = getStoredTokenId();
    if (!storedTokenId) {
      setUserToken(null);
      return;
    }

    const { data, error } = await supabase
      .from('queue_tokens')
      .select('*')
      .eq('id', storedTokenId)
      .in('status', ['waiting', 'called'])
      .maybeSingle();

    if (!error && data) {
      setUserToken(data);
      if (data.status === 'called') {
        setIsTokenCalled(true);
      }
    } else {
      // Token not found or expired, clear storage
      clearStoredToken();
      setUserToken(null);
    }
  }, [getStoredTokenId, clearStoredToken]);

  // Join a queue (no login required)
  const joinQueue = useCallback(async (queueId: string, name: string, phone: string) => {
    // Validate inputs
    if (!name.trim() || !phone.trim()) {
      toast.error('Please provide your name and phone number');
      return null;
    }

    // Get current max token number for this queue
    const { data: maxTokenData } = await supabase
      .from('queue_tokens')
      .select('token_number')
      .eq('queue_id', queueId)
      .order('token_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextTokenNumber = (maxTokenData?.token_number || 0) + 1;

    // Get queue avg service time for wait estimate
    const { data: queueData } = await supabase
      .from('queues')
      .select('avg_service_time, current_token')
      .eq('id', queueId)
      .single();

    const avgServiceTime = queueData?.avg_service_time || 120;
    const currentToken = queueData?.current_token || 0;
    const positionAhead = nextTokenNumber - currentToken - 1;
    const estimatedWait = Math.ceil((positionAhead * avgServiceTime) / 60);

    const { data, error } = await supabase
      .from('queue_tokens')
      .insert({
        queue_id: queueId,
        user_id: null, // No user ID for anonymous tokens
        token_number: nextTokenNumber,
        phone: phone.trim(),
        estimated_wait_time: estimatedWait,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to join queue:', error);
      toast.error('Failed to join queue');
      return null;
    }

    // Store token ID and name in localStorage
    storeTokenId(data.id);
    try {
      localStorage.setItem('mela_queue_name', name.trim());
    } catch {
      // localStorage not available
    }

    setUserToken(data);
    return data;
  }, [storeTokenId]);

  // Leave queue
  const leaveQueue = useCallback(async () => {
    if (!userToken) return;

    const { error } = await supabase
      .from('queue_tokens')
      .update({ status: 'cancelled' })
      .eq('id', userToken.id);

    if (!error) {
      clearStoredToken();
      setUserToken(null);
      setIsTokenCalled(false);
      stopSiren();
    }
  }, [userToken, stopSiren, clearStoredToken]);

  // Acknowledge token call
  const acknowledgeCall = useCallback(() => {
    setIsTokenCalled(false);
    stopSiren();
  }, [stopSiren]);

  // Fetch token on mount
  useEffect(() => {
    fetchUserToken();
  }, [fetchUserToken]);

  // Subscribe to token updates
  useEffect(() => {
    const storedTokenId = getStoredTokenId();
    if (!storedTokenId) return;

    // Subscribe to token updates for this specific token
    const channel = supabase
      .channel(`token-updates-${storedTokenId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_tokens',
          filter: `id=eq.${storedTokenId}`,
        },
        (payload) => {
          const updated = payload.new as UserToken;
          
          if (updated.status === 'called' && !isTokenCalled) {
            setUserToken(updated);
            setIsTokenCalled(true);
            
            // Play siren for token call
            playSiren('token', 8);
            
            toast.success(`🎉 Your token #${updated.token_number} is being called!`, {
              duration: 15000,
            });
          } else if (updated.status === 'served' || updated.status === 'cancelled') {
            clearStoredToken();
            setUserToken(null);
            setIsTokenCalled(false);
          } else {
            setUserToken(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getStoredTokenId, isTokenCalled, playSiren, clearStoredToken]);

  return {
    userToken,
    isTokenCalled,
    joinQueue,
    leaveQueue,
    acknowledgeCall,
    refreshToken: fetchUserToken,
  };
}
