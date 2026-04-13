import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'w-6 h-6',
    text: 'text-lg',
    container: 'gap-1.5',
  },
  md: {
    icon: 'w-8 h-8',
    text: 'text-xl',
    container: 'gap-2',
  },
  lg: {
    icon: 'w-10 h-10',
    text: 'text-2xl',
    container: 'gap-2.5',
  },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', config.container, className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className="relative gradient-primary rounded-lg p-1.5 glow-primary">
          <Activity className={cn(config.icon, 'text-primary-foreground')} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold tracking-tight text-gradient', config.text)}>
            FlowSense
          </span>
          <span className="text-[10px] font-medium text-primary tracking-widest uppercase">
            AI
          </span>
        </div>
      )}
    </div>
  );
}
