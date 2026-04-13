import { useRef, useState, useCallback } from 'react';

interface EmotionResult {
  dominant: string;
  scores: Record<string, number>;
}

interface CrowdEmotionState {
  emotions: EmotionResult[];
  panicLevel: number; // 0-100
  fearCount: number;
  angryCount: number;
  happyCount: number;
  neutralCount: number;
  alertTriggered: boolean;
  message: string;
}

const PANIC_THRESHOLD = 40; // % of crowd showing fear/anger

export function useEmotionDetection() {
  const [crowdEmotion, setCrowdEmotion] = useState<CrowdEmotionState>({
    emotions: [], panicLevel: 0, fearCount: 0, angryCount: 0, happyCount: 0, neutralCount: 0, alertTriggered: false, message: 'Normal'
  });
  const lastAlertRef = useRef(0);

  const analyzeExpressions = useCallback((faceResults: any[]) => {
    if (!faceResults || faceResults.length === 0) {
      setCrowdEmotion(prev => ({ ...prev, emotions: [], panicLevel: 0, alertTriggered: false, message: 'No faces detected' }));
      return null;
    }

    const emotions: EmotionResult[] = faceResults
      .filter(f => f.expressions)
      .map(f => {
        const exps = f.expressions;
        let dominant = 'neutral';
        let maxScore = 0;
        for (const [emotion, score] of Object.entries(exps) as [string, number][]) {
          if (score > maxScore) {
            maxScore = score;
            dominant = emotion;
          }
        }
        return { dominant, scores: exps };
      });

    const total = emotions.length || 1;
    const fearCount = emotions.filter(e => e.dominant === 'fearful' || e.dominant === 'disgusted').length;
    const angryCount = emotions.filter(e => e.dominant === 'angry').length;
    const happyCount = emotions.filter(e => e.dominant === 'happy').length;
    const neutralCount = emotions.filter(e => e.dominant === 'neutral').length;
    const sadCount = emotions.filter(e => e.dominant === 'sad').length;
    const surprisedCount = emotions.filter(e => e.dominant === 'surprised').length;

    const negativePercent = ((fearCount + angryCount) / total) * 100;
    const panicLevel = Math.min(100, Math.round(negativePercent * 1.5));

    const now = Date.now();
    const alertTriggered = panicLevel >= PANIC_THRESHOLD && (now - lastAlertRef.current > 15000);
    if (alertTriggered) lastAlertRef.current = now;

    let message = 'Normal crowd mood';
    if (panicLevel >= 70) message = '🚨 PANIC DETECTED! Multiple people showing fear/anger';
    else if (panicLevel >= 40) message = '⚠️ Elevated distress detected in crowd';
    else if (happyCount > total * 0.6) message = '😊 Crowd is mostly happy';
    else if (neutralCount > total * 0.6) message = '😐 Crowd is calm';

    const state: CrowdEmotionState = {
      emotions, panicLevel, fearCount, angryCount, happyCount, neutralCount, alertTriggered, message
    };
    setCrowdEmotion(state);
    return state;
  }, []);

  return { crowdEmotion, analyzeExpressions };
}
