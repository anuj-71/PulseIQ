import { cn } from '@/lib/cn';

export function ProgressBar({
  value,
  className = '',
  barClassName = '',
  delay = 0,
}: {
  value: number; // 0..1
  className?: string;
  barClassName?: string;
  delay?: number;
}) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className={cn('h-full origin-left rounded-full animate-scoreFill', barClassName)}
        style={{ '--fill': value, animationDelay: `${delay}ms` } as React.CSSProperties}
      />
    </div>
  );
}
