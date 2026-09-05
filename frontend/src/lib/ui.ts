import type { ActionType, RiskBand } from './types';

export function bandMeta(band: RiskBand): {
  label: string;
  text: string;
  bg: string;
  ring: string;
  bar: string;
  glow: string;
  hex: string;
} {
  switch (band) {
    case 'critical':
      return {
        label: 'Critical',
        text: 'text-rose-300',
        bg: 'bg-rose-500/15',
        ring: 'ring-rose-500/40',
        bar: 'bg-rose-500',
        glow: 'shadow-[0_0_22px_-4px_rgba(244,63,94,0.7)]',
        hex: '#f43f5e',
      };
    case 'high':
      return {
        label: 'High',
        text: 'text-amber-300',
        bg: 'bg-amber-500/15',
        ring: 'ring-amber-500/40',
        bar: 'bg-amber-500',
        glow: 'shadow-[0_0_22px_-4px_rgba(245,158,11,0.6)]',
        hex: '#f59e0b',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        text: 'text-cyan-300',
        bg: 'bg-cyan-500/15',
        ring: 'ring-cyan-500/40',
        bar: 'bg-cyan-500',
        glow: 'shadow-[0_0_22px_-6px_rgba(6,182,212,0.6)]',
        hex: '#06b6d4',
      };
    default:
      return {
        label: 'Low',
        text: 'text-emerald-300',
        bg: 'bg-emerald-500/15',
        ring: 'ring-emerald-500/40',
        bar: 'bg-emerald-500',
        glow: 'shadow-[0_0_22px_-6px_rgba(16,185,129,0.5)]',
        hex: '#10b981',
      };
  }
}

export function actionMeta(a: ActionType): {
  label: string;
  icon: string;
  text: string;
  bg: string;
  bar: string;
  hex: string;
} {
  switch (a) {
    case 'guided_tutorial':
      return { label: 'Guided tutorial', icon: 'GraduationCap', text: 'text-sky-300', bg: 'bg-sky-500/15', bar: 'bg-sky-500', hex: '#0ea5e9' };
    case 'proactive_nudge':
      return { label: 'Proactive nudge', icon: 'BellRing', text: 'text-violet-300', bg: 'bg-violet-500/15', bar: 'bg-violet-500', hex: '#8b5cf6' };
    case 'human_handoff':
      return { label: 'Human handoff', icon: 'Headset', text: 'text-rose-300', bg: 'bg-rose-500/15', bar: 'bg-rose-500', hex: '#f43f5e' };
    case 'incentive':
      return { label: 'Incentive', icon: 'Gift', text: 'text-amber-300', bg: 'bg-amber-500/15', bar: 'bg-amber-500', hex: '#f59e0b' };
  }
}

export function featureMeta(feature: string): { label: string; hex: string } {
  const map: Record<string, { label: string; hex: string }> = {
    onboarding_confusion: { label: 'Onboarding confusion', hex: '#0ea5e9' },
    repeated_failures: { label: 'Repeated failures', hex: '#f43f5e' },
    pricing_concern: { label: 'Pricing concern', hex: '#f59e0b' },
    sentiment_decline: { label: 'Sentiment decline', hex: '#8b5cf6' },
    engagement_drop: { label: 'Engagement drop', hex: '#06b6d4' },
  };
  return map[feature] ?? { label: feature, hex: '#64748b' };
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function fmtPct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}
