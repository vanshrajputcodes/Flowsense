import { useSimulation } from '@/hooks/useSimulation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Play, Square, Radio } from 'lucide-react';

interface SimulationToggleProps {
  compact?: boolean;
}

export function SimulationToggle({ compact = false }: SimulationToggleProps) {
  const { language } = useLanguage();
  const { isRunning, tickCount, toggle } = useSimulation({ intervalMs: 2500 });

  const label = language === 'hi' 
    ? (isRunning ? 'सिमुलेशन रोकें' : 'सिमुलेशन शुरू करें')
    : (isRunning ? 'Stop Simulation' : 'Start Simulation');

  const button = (
    <Button
      variant={isRunning ? 'destructive' : 'outline'}
      size={compact ? 'sm' : 'default'}
      onClick={toggle}
      className={`gap-2 ${isRunning ? 'animate-pulse' : ''}`}
    >
      {isRunning ? (
        <>
          <Square className="w-4 h-4" />
          {!compact && (
            <span className="hidden sm:inline">
              {language === 'hi' ? 'रोकें' : 'Stop'}
            </span>
          )}
          <Badge variant="secondary" className="ml-1 text-xs">
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            {tickCount}
          </Badge>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          {!compact && (
            <span className="hidden sm:inline">
              {language === 'hi' ? 'सिमुलेट करें' : 'Simulate'}
            </span>
          )}
        </>
      )}
    </Button>
  );

  if (compact) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
