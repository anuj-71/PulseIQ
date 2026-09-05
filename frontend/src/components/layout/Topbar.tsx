import { Cpu, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Card';

export function Topbar({ title, subtitle, busy }: { title: string; subtitle: string; busy?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 px-5 py-4 backdrop-blur-xl lg:static lg:bg-transparent lg:backdrop-blur-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-semibold text-slate-50 sm:text-xl">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-white/5 bg-ink-900/70 px-3 py-1.5 text-xs text-slate-400 sm:flex">
            <Cpu size={13} className="text-pulse-400" />
            <span className="font-mono text-[11px]">orchestrator v0.4</span>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${busy ? 'border-pulse-500/20 bg-pulse-500/10 text-pulse-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
            {busy ? <Spinner size={12} /> : <Sparkles size={13} className="text-emerald-300" />}
            <span>{busy ? 'Analyzing…' : 'Live mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
