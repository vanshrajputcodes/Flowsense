import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type Status = 'green' | 'yellow' | 'red' | 'critical';

interface StatusBadgeProps {
  status: Status;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusConfig = {
  green: {
    label: 'safe' as const,
    bgClass: 'bg-safe',
    textClass: 'text-safe-foreground',
    dotClass: 'bg-safe',
  },
  yellow: {
    label: 'moderate' as const,
    bgClass: 'bg-caution',
    textClass: 'text-caution-foreground',
    dotClass: 'bg-caution',
  },
  red: {
    label: 'crowded' as const,
    bgClass: 'bg-danger',
    textClass: 'text-danger-foreground',
    dotClass: 'bg-danger',
  },
  critical: {
    label: 'critical' as const,
    bgClass: 'bg-critical',
    textClass: 'text-critical-foreground',
    dotClass: 'bg-critical',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    dot: 'w-2 h-2',
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base',
    dot: 'w-3 h-3',
  },
};

export function StatusBadge({
  status,
  showLabel = true,
  size = 'md',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgClass,
        config.textClass,
        sizeStyles.badge,
        pulse && status === 'critical' && 'animate-pulse',
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          sizeStyles.dot,
          config.dotClass,
          pulse && 'animate-ping'
        )}
        style={{ animationDuration: pulse ? '1.5s' : undefined }}
      />
      {showLabel && t(config.label)}
    </span>
  );
}

interface StatusDotProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, size = 'md', pulse = false, className }: StatusDotProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeStyles.dot,
          config.dotClass
        )}
      />
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-75',
            config.dotClass,
            'animate-ping'
          )}
        />
      )}
    </span>
  );
}
