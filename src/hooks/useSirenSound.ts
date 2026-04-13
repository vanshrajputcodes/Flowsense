import { useRef, useCallback, useEffect } from 'react';

type SirenType = 'sos' | 'token' | 'alert';

const SIREN_FREQUENCIES: Record<SirenType, { start: number; end: number; duration: number }> = {
  sos: { start: 800, end: 1400, duration: 400 },
  token: { start: 600, end: 900, duration: 300 },
  alert: { start: 400, end: 700, duration: 400 },
};

export function useSirenSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize AudioContext lazily – must happen after user gesture
  const getOrCreateContext = useCallback(async (): Promise<AudioContext | null> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      // Resume if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
      return null;
    }
  }, []);

  const playBeep = useCallback(async (ctx: AudioContext, type: SirenType) => {
    return new Promise<void>((resolve) => {
      const { start, end, duration } = SIREN_FREQUENCIES[type];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(start, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(end, ctx.currentTime + duration / 1000);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
      osc.onended = () => resolve();
    });
  }, []);

  const playSiren = useCallback(async (type: SirenType = 'sos', loops: number = 5) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    stopRequestedRef.current = false;

    const ctx = await getOrCreateContext();
    if (!ctx) {
      isPlayingRef.current = false;
      return;
    }

    let count = 0;
    const play = async () => {
      if (stopRequestedRef.current || count >= loops) {
        isPlayingRef.current = false;
        return;
      }
      count++;
      await playBeep(ctx, type);
      await new Promise((r) => setTimeout(r, 80)); // gap between beeps
      play();
    };

    play();
  }, [getOrCreateContext, playBeep]);

  const stopSiren = useCallback(() => {
    stopRequestedRef.current = true;
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Warm up AudioContext on first user interaction so it's ready
  useEffect(() => {
    const warmUp = async () => {
      await getOrCreateContext();
      document.removeEventListener('click', warmUp);
      document.removeEventListener('keydown', warmUp);
      document.removeEventListener('touchstart', warmUp);
    };
    document.addEventListener('click', warmUp, { once: true });
    document.addEventListener('keydown', warmUp, { once: true });
    document.addEventListener('touchstart', warmUp, { once: true });

    return () => {
      document.removeEventListener('click', warmUp);
      document.removeEventListener('keydown', warmUp);
      document.removeEventListener('touchstart', warmUp);
      stopSiren();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [getOrCreateContext, stopSiren]);

  return { playSiren, stopSiren };
}
