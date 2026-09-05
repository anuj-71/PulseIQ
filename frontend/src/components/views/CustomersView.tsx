import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Brain } from 'lucide-react';
import { customers } from '@/lib/customers';
import { useAllRiskScores } from '@/hooks/useAllRiskScores';
import { bandMeta, featureMeta, fmtPct } from '@/lib/ui';
import { Avatar } from '@/components/ui/Avatar';
import { Card, RiskBandPill, Spinner } from '@/components/ui/Card';
import { ActionIcon } from '@/components/ui/ActionIcon';
import type { RiskBand } from '@/lib/types';

type SortKey = 'risk' | 'name' | 'value';

export function CustomersView({ onAnalyze }: { onAnalyze: (id: string) => void }) {
  const { rows, ready } = useAllRiskScores();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('risk');
  const [bandFilter, setBandFilter] = useState<RiskBand | 'all'>('all');

  const list = useMemo(() => {
    let out = customers.map((c) => {
      const row = rows.find((r) => r.customerId === c.id);
      return { customer: c, score: row?.score ?? null };
    });
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((x) => x.customer.name.toLowerCase().includes(q) || x.customer.company.toLowerCase().includes(q));
    }
    if (bandFilter !== 'all') {
      out = out.filter((x) => x.score?.risk_band === bandFilter);
    }
    out.sort((a, b) => {
      if (sort === 'name') return a.customer.name.localeCompare(b.customer.name);
      if (sort === 'value') return b.customer.plan_value - a.customer.plan_value;
      return (b.score?.risk_score ?? 0) - (a.score?.risk_score ?? 0);
    });
    return out;
  }, [rows, query, sort, bandFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-100">Customers</h2>
          <p className="mt-1 text-sm text-slate-400">{customers.length} active accounts · risk scored live</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or company…"
              className="w-56 rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-pulse-500/40 focus:bg-white/5"
            />
          </div>
          <button
            onClick={() => setSort((s) => (s === 'risk' ? 'name' : s === 'name' ? 'value' : 'risk'))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
          >
            <ArrowUpDown size={13} /> {sort === 'risk' ? 'Risk' : sort === 'name' ? 'Name' : 'Plan $'}
          </button>
        </div>
      </div>

      {/* Band filter chips */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((b) => {
          const active = bandFilter === b;
          const label = b === 'all' ? 'All bands' : bandMeta(b as RiskBand).label;
          const cls =
            b === 'all'
              ? 'border-white/10 text-slate-300'
              : `${bandMeta(b as RiskBand).ring} ${bandMeta(b as RiskBand).text}`;
          return (
            <button
              key={b}
              onClick={() => setBandFilter(b)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                active ? 'bg-white/10 ' + cls : 'border-white/5 bg-white/[0.02] text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-12 gap-3 border-b border-white/5 px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 sm:grid">
          <div className="col-span-4">Customer</div>
          <div className="col-span-2">Tier</div>
          <div className="col-span-2">Top driver</div>
          <div className="col-span-2">Risk</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="divide-y divide-white/5">
          {list.map(({ customer, score }, i) => {
            const band = score?.risk_band;
            const m = band ? bandMeta(band) : null;
            const driver = score ? featureMeta(score.attributions[0].feature) : null;
            return (
              <button
                key={customer.id}
                onClick={() => onAnalyze(customer.id)}
                className="group grid w-full grid-cols-12 items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/[0.02] animate-fadeUp"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div className="col-span-12 flex items-center gap-3 sm:col-span-4">
                  <Avatar name={customer.name} hue={customer.avatarHue} size={34} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-200">{customer.name}</div>
                    <div className="truncate text-xs text-slate-500">{customer.company}</div>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <span className="text-xs text-slate-400">{customer.tier}</span>
                  <div className="text-[10px] text-slate-600">${customer.plan_value.toLocaleString()}/mo</div>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  {driver ? (
                    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: driver.hex }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: driver.hex }} />
                      <span className="hidden text-slate-300 sm:inline">{driver.label}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">{ready ? '-' : <Spinner size={11} />}</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-2 sm:col-span-2">
                  {m ? (
                    <>
                      <span className={`font-display text-sm font-semibold ${m.text}`}>{fmtPct(score!.risk_score, 0)}</span>
                      <RiskBandPill band={band!} />
                    </>
                  ) : (
                    <span className="text-xs text-slate-600">{ready ? '-' : <Spinner size={11} />}</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-2">
                  <span className="hidden items-center gap-1 text-xs text-pulse-300 opacity-0 transition group-hover:opacity-100 sm:flex">
                    <Brain size={12} /> Analyze
                  </span>
                  <span className="text-slate-500">
                    {driver && <ActionIcon action={actionFromDriver(score!.attributions[0].feature)} size={15} className="opacity-60 group-hover:opacity-100" />}
                  </span>
                </div>
              </button>
            );
          })}
          {list.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No customers match your filters.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function actionFromDriver(feature: string) {
  const map: Record<string, 'guided_tutorial' | 'proactive_nudge' | 'human_handoff' | 'incentive'> = {
    onboarding_confusion: 'guided_tutorial',
    repeated_failures: 'human_handoff',
    pricing_concern: 'incentive',
    sentiment_decline: 'proactive_nudge',
    engagement_drop: 'proactive_nudge',
  };
  return map[feature] ?? 'proactive_nudge';
}
