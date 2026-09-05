import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Check, X, Repeat, TrendingUp, AlertCircle, History } from 'lucide-react';
import { aggregate, listOutcomes, logOutcome, retrain, actionLabel } from '@/lib/actionPolicy';
import { bandMeta, featureMeta, fmtPct, timeAgo } from '@/lib/ui';
import { ActionIcon } from '@/components/ui/ActionIcon';
import { Card, KpiCard, SectionTitle, Spinner } from '@/components/ui/Card';
import type { AggregateResponse, OutcomeRecord, RiskBand, ActionType } from '@/lib/types';

export function OutcomesView() {
  const [outcomes, setOutcomes] = useState<OutcomeRecord[] | null>(null);
  const [agg, setAgg] = useState<AggregateResponse | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const a = await aggregate();
    setAgg(a);
    const rows = await listOutcomes();
    setOutcomes(rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id: string, outcome: 'success' | 'failure') {
    setBusyId(id);
    try {
      await logOutcome(id, outcome);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function doRetrain() {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await retrain();
      setRetrainMsg(`Retrained policy model → ${res.model_version}. The feedback loop now weighs recent outcomes.`);
      await load();
    } finally {
      setRetraining(false);
    }
  }

  const stats = agg
    ? {
        total: agg.total,
        resolved: outcomes?.filter((o) => o.outcome !== 'pending').length ?? 0,
        successRate: computeSuccessRate(agg.by_action),
        pending: outcomes?.filter((o) => o.outcome === 'pending').length ?? 0,
      }
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feedback loop"
        title="Outcomes & continuous learning"
        desc="Every decision the policy makes is logged here. Mark the real-world outcome so the policy can retrain on what worked."
        right={
          <button
            onClick={doRetrain}
            disabled={retraining}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pulse-400 to-pulse-600 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)] transition hover:brightness-110 disabled:opacity-50"
          >
            {retraining ? <Spinner size={15} /> : <RefreshCw size={15} />}
            {retraining ? 'Retraining…' : 'Retrain policy'}
          </button>
        }
      />

      {retrainMsg && (
        <Card className="border-pulse-500/30 bg-pulse-500/10 p-4 text-sm text-pulse-100 animate-fadeIn">
          {retrainMsg}
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Decisions logged" value={stats?.total ?? '-'} sub="all time" accent="pulse" icon={<History size={18} />} />
        <KpiCard label="Resolved" value={stats?.resolved ?? '-'} sub={`${stats?.pending ?? 0} pending`} accent="emerald" icon={<Check size={18} />} />
        <KpiCard label="Success rate" value={stats ? fmtPct(stats.successRate, 0) : '-'} sub="across resolved actions" accent="amber" icon={<TrendingUp size={18} />} />
        <KpiCard label="Policy version" value={<span className="font-mono text-base">{agg?.model_version ?? '-'}</span>} sub="softmax selector" accent="pulse" icon={<Repeat size={18} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Root cause aggregation */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-slate-100">Root-cause aggregation</h3>
          <p className="mt-1 text-xs text-slate-500">Why customers are churning, by frequency</p>
          <div className="mt-4 space-y-3">
            {agg?.by_root_cause.length ? (
              agg.by_root_cause.map((rc, i) => {
                const m = featureMeta(rc.feature);
                const maxCount = agg.by_root_cause[0].count || 1;
                return (
                  <div key={rc.feature} className="animate-fadeUp" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{rc.label}</span>
                      <span className="font-mono text-slate-500">{rc.count} · avg {fmtPct(rc.avg_risk, 0)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full origin-left rounded-full animate-scoreFill"
                        style={{
                          '--fill': rc.count / maxCount,
                          background: `linear-gradient(90deg, ${m.hex}55, ${m.hex})`,
                          animationDelay: `${i * 80 + 100}ms`,
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty text="No outcomes yet. Run an analysis in 'See the AI Think' to log your first decision." />
            )}
          </div>
        </Card>

        {/* Action performance */}
        <Card className="p-5 lg:col-span-3">
          <h3 className="font-display text-base font-semibold text-slate-100">Action performance</h3>
          <p className="mt-1 text-xs text-slate-500">Success rate per recommended action</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {agg && Object.keys(agg.by_action).length ? (
              (['guided_tutorial', 'proactive_nudge', 'human_handoff', 'incentive'] as const)
                .filter((a) => agg.by_action[a])
                .map((a, i) => {
                  const stat = agg.by_action[a];
                  return (
                    <div key={a} className="animate-fadeUp rounded-xl border border-white/5 bg-white/[0.02] p-4" style={{ animationDelay: `${i * 90}ms` }}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-slate-200">
                          <ActionIcon action={a} size={16} className="text-pulse-300" />
                          {actionLabel(a)}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{stat.count} runs</span>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">success rate</span>
                          <span className={stat.success_rate >= 0.6 ? 'text-emerald-300' : stat.success_rate > 0 ? 'text-amber-300' : 'text-slate-500'}>
                            {stat.success_rate ? fmtPct(stat.success_rate, 0) : '-'}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full origin-left rounded-full bg-gradient-to-r from-pulse-500 to-emerald-400 animate-scoreFill"
                            style={{ '--fill': stat.success_rate || 0.02, animationDelay: `${i * 90 + 120}ms` } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="sm:col-span-2"><Empty text="No action data yet." /></div>
            )}
          </div>
        </Card>
      </div>

      {/* Outcomes table */}
      <Card className="overflow-hidden">
        <div className="border-b border-white/5 px-5 py-3.5">
          <h3 className="font-display text-base font-semibold text-slate-100">Decision log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-2.5 text-left font-medium">Customer</th>
                <th className="px-3 py-2.5 text-left font-medium">Driver</th>
                <th className="px-3 py-2.5 text-left font-medium">Action</th>
                <th className="px-3 py-2.5 text-left font-medium">Risk</th>
                <th className="px-3 py-2.5 text-left font-medium">When</th>
                <th className="px-5 py-2.5 text-right font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {outcomes === null && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500"><Spinner size={16} /></td></tr>
              )}
              {outcomes?.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  <AlertCircle size={20} className="mx-auto mb-2 text-slate-600" />
                  No decisions logged yet. Head to <span className="text-pulse-300">See the AI Think</span> and run an analysis.
                </td></tr>
              )}
              {outcomes?.map((o) => {
                const m = bandMeta(o.risk_band as RiskBand);
                const driver = featureMeta(o.top_attribution);
                return (
                  <tr key={o.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-slate-200">{o.customer_name}</div>
                      <div className="text-[11px] text-slate-600">{o.customer_id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: driver.hex }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: driver.hex }} />
                        {driver.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <ActionIcon action={o.selected_action as ActionType} size={13} className="text-slate-400" />
                        {actionLabel(o.selected_action as ActionType)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-mono text-xs ${m.text}`}>{fmtPct(o.risk_score, 0)}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{timeAgo(o.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {o.outcome === 'pending' ? (
                          <>
                            <button
                              onClick={() => resolve(o.id, 'success')}
                              disabled={busyId === o.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {busyId === o.id ? <Spinner size={11} /> : <Check size={12} />} Success
                            </button>
                            <button
                              onClick={() => resolve(o.id, 'failure')}
                              disabled={busyId === o.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                            >
                              <X size={12} /> Failed
                            </button>
                          </>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                            o.outcome === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                          }`}>
                            {o.outcome === 'success' ? <Check size={11} /> : <X size={11} />}
                            {o.outcome}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function computeSuccessRate(byAction: AggregateResponse['by_action']): number {
  let count = 0;
  let success = 0;
  for (const a of Object.keys(byAction)) {
    // We only have aggregates; approximate from resolved counts via success_rate * count.
    const stat = byAction[a];
    count += stat.count;
    success += stat.success_rate * stat.count;
  }
  return count ? success / count : 0;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-sm text-slate-500">{text}</div>;
}
