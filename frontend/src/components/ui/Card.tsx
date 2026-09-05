import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-pulse-400/80 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-xl font-semibold text-slate-100 sm:text-2xl">{title}</h2>
        {desc && <p className="mt-1 max-w-2xl text-sm text-slate-400">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent = 'pulse',
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: 'pulse' | 'emerald' | 'amber' | 'rose';
  icon?: ReactNode;
  trend?: { value: string; up: boolean };
}) {
  const accents: Record<string, string> = {
    pulse: 'text-pulse-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
  };
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
        {icon && <div className={accents[accent]}>{icon}</div>}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-slate-50">{value}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {sub && <span className="text-slate-500">{sub}</span>}
        {trend && (
          <span className={trend.up ? 'text-emerald-400' : 'text-rose-400'}>
            {trend.up ? '▲' : '▼'} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-ringSpin rounded-full border-2 border-pulse-400/30 border-t-pulse-300"
      style={{ width: size, height: size }}
    />
  );
}

export function ThinkingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-pulse-300 animate-thinkDot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export function RiskBandPill({ band }: { band: 'low' | 'moderate' | 'high' | 'critical' }) {
  const m = {
    low: { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
    moderate: { label: 'Moderate', cls: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30' },
    high: { label: 'High', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
    critical: { label: 'Critical', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
  }[band];
  return <Badge className={m.cls}>{m.label}</Badge>;
}
