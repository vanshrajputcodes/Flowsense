import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HourlyPrediction {
  hour: string;
  predicted_count: number;
  confidence: number;
}

interface ZonePrediction {
  zone_name: string;
  zone_id: string;
  hourly_predictions: HourlyPrediction[];
  surge_warning: boolean;
  peak_hour: string;
  recommendation: string;
}

interface PredictionResponse {
  predictions: ZonePrediction[];
  overall_trend: 'increasing' | 'stable' | 'decreasing';
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
}

interface StoredPrediction {
  id: string;
  zone_id: string;
  predicted_count: number;
  prediction_for: string;
  confidence: number | null;
  factors: {
    day_of_week?: string;
    is_weekend?: boolean;
    surge_warning?: boolean;
    recommendation?: string;
  } | null;
  zones?: {
    name: string;
  };
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [storedPredictions, setStoredPredictions] = useState<StoredPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePredictions = useCallback(async (zoneId?: string, hoursAhead = 12) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-predictions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            zone_id: zoneId,
            hours_ahead: hoursAhead,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate predictions');
      }

      const data: PredictionResponse = await response.json();
      setPredictions(data);

      toast({
        title: 'Predictions Generated',
        description: `AI generated ${data.predictions?.length || 0} zone predictions`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate predictions';
      setError(message);
      toast({
        title: 'Prediction Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchStoredPredictions = useCallback(async () => {
    try {
      const now = new Date();
      const { data, error: fetchError } = await supabase
        .from('predictions')
        .select('*, zones(name)')
        .gte('prediction_for', now.toISOString())
        .order('prediction_for', { ascending: true })
        .limit(50);

      if (fetchError) throw fetchError;
      
      // Type cast the data to match our expected structure
      const typedData = (data || []).map(item => ({
        ...item,
        factors: item.factors as StoredPrediction['factors']
      })) as StoredPrediction[];
      
      setStoredPredictions(typedData);
      return typedData;
    } catch (err) {
      console.error('Failed to fetch stored predictions:', err);
      return [];
    }
  }, []);

  return {
    predictions,
    storedPredictions,
    isLoading,
    error,
    generatePredictions,
    fetchStoredPredictions,
  };
}
