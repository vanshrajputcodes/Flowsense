import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

interface UseRealtimeOptions<T extends TableName> {
  table: T;
  filter?: {
    column: string;
    value: string;
  };
  onInsert?: (payload: Tables[T]['Row']) => void;
  onUpdate?: (payload: Tables[T]['Row']) => void;
  onDelete?: (payload: { old: Partial<Tables[T]['Row']> }) => void;
}

export function useRealtime<T extends TableName>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channelName = filter 
      ? `${table}_${filter.column}_${filter.value}` 
      : `${table}_changes`;

    const filterConfig = filter 
      ? { event: '*' as const, schema: 'public', table, filter: `${filter.column}=eq.${filter.value}` }
      : { event: '*' as const, schema: 'public', table };

    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        filterConfig,
        (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => {
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new as Tables[T]['Row']);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new as Tables[T]['Row']);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete({ old: payload.old as Partial<Tables[T]['Row']> });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, filter?.column, filter?.value, onInsert, onUpdate, onDelete]);

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  return { isConnected, unsubscribe };
}

// Hook for real-time zones data
export function useRealtimeZones() {
  const [zones, setZones] = useState<Tables['zones']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase
        .from('zones')
        .select('*')
        .order('name');
      if (data) setZones(data);
      setIsLoading(false);
    };
    fetchZones();
  }, []);

  // Real-time updates
  useRealtime({
    table: 'zones',
    onInsert: (zone) => {
      setZones((prev) => [...prev, zone].sort((a, b) => a.name.localeCompare(b.name)));
    },
    onUpdate: (zone) => {
      setZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
    },
    onDelete: ({ old }) => {
      if (old.id) {
        setZones((prev) => prev.filter((z) => z.id !== old.id));
      }
    },
  });

  return { zones, isLoading };
}

// Hook for real-time alerts
export function useRealtimeAlerts(activeOnly = true) {
  const [alerts, setAlerts] = useState<Tables['alerts']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchAlerts = async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (activeOnly) {
        query = query.eq('status', 'active');
      }
      
      const { data } = await query.limit(20);
      if (data) setAlerts(data);
      setIsLoading(false);
    };
    fetchAlerts();
  }, [activeOnly]);

  // Real-time updates
  useRealtime({
    table: 'alerts',
    onInsert: (alert) => {
      if (!activeOnly || alert.status === 'active') {
        setAlerts((prev) => [alert, ...prev].slice(0, 20));
      }
    },
    onUpdate: (alert) => {
      setAlerts((prev) => {
        if (activeOnly && alert.status !== 'active') {
          return prev.filter((a) => a.id !== alert.id);
        }
        return prev.map((a) => (a.id === alert.id ? alert : a));
      });
    },
    onDelete: ({ old }) => {
      if (old.id) {
        setAlerts((prev) => prev.filter((a) => a.id !== old.id));
      }
    },
  });

  return { alerts, isLoading };
}

// Hook for real-time sensor readings
export function useRealtimeSensorReadings(zoneId?: string) {
  const [readings, setReadings] = useState<Tables['sensor_readings']['Row'][]>([]);
  const [latestReading, setLatestReading] = useState<Tables['sensor_readings']['Row'] | null>(null);

  // Initial fetch
  useEffect(() => {
    const fetchReadings = async () => {
      let query = supabase
        .from('sensor_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);
      
      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }
      
      const { data } = await query;
      if (data) {
        setReadings(data);
        if (data.length > 0) setLatestReading(data[0]);
      }
    };
    fetchReadings();
  }, [zoneId]);

  // Real-time updates
  useRealtime({
    table: 'sensor_readings',
    filter: zoneId ? { column: 'zone_id', value: zoneId } : undefined,
    onInsert: (reading) => {
      setReadings((prev) => [reading, ...prev].slice(0, 50));
      setLatestReading(reading);
    },
  });

  return { readings, latestReading };
}

// Hook for real-time queues
export function useRealtimeQueues() {
  const [queues, setQueues] = useState<Tables['queues']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchQueues = async () => {
      const { data } = await supabase
        .from('queues')
        .select('*')
        .order('name');
      if (data) setQueues(data);
      setIsLoading(false);
    };
    fetchQueues();
  }, []);

  // Real-time updates
  useRealtime({
    table: 'queues',
    onInsert: (queue) => {
      setQueues((prev) => [...prev, queue].sort((a, b) => a.name.localeCompare(b.name)));
    },
    onUpdate: (queue) => {
      setQueues((prev) => prev.map((q) => (q.id === queue.id ? queue : q)));
    },
    onDelete: ({ old }) => {
      if (old.id) {
        setQueues((prev) => prev.filter((q) => q.id !== old.id));
      }
    },
  });

  return { queues, isLoading };
}
