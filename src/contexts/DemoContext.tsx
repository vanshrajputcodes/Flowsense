import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

type DemoSpeed = 0.5 | 1 | 2 | 3;

interface DemoConfig {
  demoMode: boolean;
  autoThreats: boolean;
  autoSOS: boolean;
  voiceEnabled: boolean;
  speed: DemoSpeed;
}

interface DemoContextType extends DemoConfig {
  setDemoMode: (v: boolean) => void;
  setAutoThreats: (v: boolean) => void;
  setAutoSOS: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  setSpeed: (v: DemoSpeed) => void;
  scaledTimeout: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
  scaledInterval: (cb: () => void, ms: number) => ReturnType<typeof setInterval>;
  resetAll: () => void;
}

const defaults: DemoConfig = {
  demoMode: false,
  autoThreats: false,
  autoSOS: false,
  voiceEnabled: true,
  speed: 1,
};

const DemoContext = createContext<DemoContextType | null>(null);

function loadConfig(): DemoConfig {
  try {
    const raw = localStorage.getItem('fs_demo_config');
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DemoConfig>(loadConfig);
  const speedRef = useRef(config.speed);
  speedRef.current = config.speed;

  useEffect(() => {
    localStorage.setItem('fs_demo_config', JSON.stringify(config));
  }, [config]);

  const update = useCallback((partial: Partial<DemoConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const scaledTimeout = useCallback((cb: () => void, ms: number) => {
    return setTimeout(cb, ms / speedRef.current);
  }, []);

  const scaledInterval = useCallback((cb: () => void, ms: number) => {
    return setInterval(cb, ms / speedRef.current);
  }, []);

  const resetAll = useCallback(() => {
    setConfig({ ...defaults });
    localStorage.removeItem('fs_demo_config');
  }, []);

  return (
    <DemoContext.Provider value={{
      ...config,
      setDemoMode: (demoMode) => update({ demoMode }),
      setAutoThreats: (autoThreats) => update({ autoThreats }),
      setAutoSOS: (autoSOS) => update({ autoSOS }),
      setVoiceEnabled: (voiceEnabled) => update({ voiceEnabled }),
      setSpeed: (speed) => update({ speed }),
      scaledTimeout,
      scaledInterval,
      resetAll,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be inside DemoProvider');
  return ctx;
}
