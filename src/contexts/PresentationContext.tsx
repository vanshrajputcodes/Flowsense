import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type PresentationLayout = 'command-center' | 'spotlight' | 'storyteller';

interface PresentationConfig {
  layout: PresentationLayout;
  autoRotate: boolean;
  rotationInterval: number;
  showModuleLabel: boolean;
  kioskMode: boolean;
  showQR: boolean;
}

interface PresentationContextType extends PresentationConfig {
  setLayout: (l: PresentationLayout) => void;
  setAutoRotate: (v: boolean) => void;
  setRotationInterval: (v: number) => void;
  setShowModuleLabel: (v: boolean) => void;
  setKioskMode: (v: boolean) => void;
  setShowQR: (v: boolean) => void;
  resetAll: () => void;
}

const defaults: PresentationConfig = {
  layout: 'command-center',
  autoRotate: true,
  rotationInterval: 15000,
  showModuleLabel: true,
  kioskMode: false,
  showQR: true,
};

const PresentationContext = createContext<PresentationContextType | null>(null);

function loadConfig(): PresentationConfig {
  try {
    const raw = localStorage.getItem('fs_presentation_config');
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PresentationConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem('fs_presentation_config', JSON.stringify(config));
  }, [config]);

  const update = useCallback((partial: Partial<PresentationConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    setConfig({ ...defaults });
    localStorage.removeItem('fs_presentation_config');
  }, []);

  return (
    <PresentationContext.Provider value={{
      ...config,
      setLayout: (layout) => update({ layout }),
      setAutoRotate: (autoRotate) => update({ autoRotate }),
      setRotationInterval: (rotationInterval) => update({ rotationInterval }),
      setShowModuleLabel: (showModuleLabel) => update({ showModuleLabel }),
      setKioskMode: (kioskMode) => update({ kioskMode }),
      setShowQR: (showQR) => update({ showQR }),
      resetAll,
    }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error('usePresentation must be inside PresentationProvider');
  return ctx;
}
