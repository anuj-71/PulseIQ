import { Activity, LayoutDashboard, Users, Repeat, HeartPulse, Brain, Network, Target } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ViewKey = 'dashboard' | 'think' | 'customers' | 'outcomes' | 'health' | 'neural' | 'reinforcement';

const NAV: { key: ViewKey; label: string; icon: typeof Activity; hint: string }[] = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, hint: 'KPIs & risk mix' },
  { key: 'think', label: 'See the AI Think', icon: Brain, hint: 'Live analysis' },
  { key: 'customers', label: 'Customers', icon: Users, hint: 'At-risk roster' },
  { key: 'outcomes', label: 'Feedback Loop', icon: Repeat, hint: 'Outcomes & retrain' },
  { key: 'health', label: 'System Health', icon: HeartPulse, hint: 'Service status' },
  { key: 'neural', label: 'Neural', icon: Network, hint: 'RL Policy' },
  { key: 'reinforcement', label: 'Reinforcement', icon: Target, hint: 'RL Policy' },
];

export function Sidebar({
  view,
  onNavigate,
}: {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0a1018]/40 backdrop-blur-2xl px-3 py-5 lg:flex shadow-2xl z-20">
      <div className="flex items-center gap-2.5 px-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_22px_-4px_rgba(34,211,238,0.8)]">
          <Activity size={18} className="text-white" />
          <span className="absolute inset-0 rounded-xl animate-pulseGlow" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg font-bold text-slate-50 tracking-wide">PulseIQ</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">Autonomous AI</div>
        </div>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300',
                active ? 'bg-cyan-500/10 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
              <Icon size={18} className={active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[10px] text-slate-500">{item.hint}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[11px] text-emerald-200 font-medium">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          All Services Live
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400">Real backends connected on :8000</div>
      </div>
    </aside>
  );
}

export function MobileNav({ view, onNavigate }: { view: ViewKey; onNavigate: (v: ViewKey) => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-white/5 bg-ink-950/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
          <Activity size={14} className="text-white" />
        </div>
        <span className="font-display text-sm font-bold text-slate-50">PulseIQ</span>
      </div>
      {NAV.map((item) => {
        const active = view === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
              active ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400'
            )}
          >
            <Icon size={14} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
