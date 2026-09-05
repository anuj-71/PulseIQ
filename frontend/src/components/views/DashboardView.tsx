import { useMemo } from 'react';
import { Link as LinkIcon, Brain, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { customers } from '@/lib/customers';
import { useAllRiskScores } from '@/hooks/useAllRiskScores';
import { bandMeta, featureMeta, fmtPct } from '@/lib/ui';
import { Card, KpiCard, RiskBandPill, SectionTitle, Spinner } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import type { ViewKey } from '@/components/layout/Sidebar';
import type { RiskBand } from '@/lib/types';

export function DashboardView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { rows, ready } = useAllRiskScores();

  const stats = useMemo(() => {
    const scored = rows.filter((r) => r.score);
    const atRisk = scored.filter((r) => r.score!.risk_band === 'high' || r.score!.risk_band === 'critical');
    const critical = scored.filter((r) => r.score!.risk_band === 'critical');
    const avgRisk = scored.length ? scored.reduce((s, r) => s + r.score!.risk_score, 0) / scored.length : 0;
    const arrValue = atRisk.reduce((s, r) => {
      const c = customers.find((c) => c.id === r.customerId)!;
      return s + c.plan_value;
    }, 0);
    const bandCounts: Record<RiskBand, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    scored.forEach((r) => (bandCounts[r.score!.risk_band] += 1));
    const topDrivers: Record<string, number> = {};
    scored.forEach((r) => {
      const f = r.score!.attributions[0].feature;
      topDrivers[f] = (topDrivers[f] ?? 0) + 1;
    });
    return { scored, atRisk, critical, avgRisk, arrValue, bandCounts, topDrivers };
  }, [rows]);

  const topDriversList = Object.entries(stats.topDrivers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Overview"
        title="Customer intelligence at a glance"
        desc="PulseIQ continuously scores every customer for churn risk, explains the dominant driver, and recommends a fix."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Customers scored"
          value={ready ? stats.scored.length : '-'}
          sub={`of ${customers.length} active`}
          accent="pulse"
          icon={<Brain size={18} />}
        />
        <KpiCard
          label="At-risk accounts"
          value={ready ? stats.atRisk.length : '-'}
          sub={`${stats.critical.length} critical`}
          accent="rose"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          label="Avg churn risk"
          value={ready ? fmtPct(stats.avgRisk, 1) : '-'}
          sub="across scored customers"
          accent="amber"
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="ARR at risk"
          value={ready ? `$${(stats.arrValue / 1000).toFixed(1)}k` : '-'}
          sub="sum of at-risk plan value"
          accent="emerald"
          icon={<ShieldCheck size={18} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Risk distribution */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-100">Risk distribution</h3>
            {!ready && <Spinner size={14} />}
          </div>
          <p className="mt-1 text-xs text-slate-500">Customers grouped by churn-risk band</p>
          <div className="mt-5 space-y-3">
            {(['critical', 'high', 'moderate', 'low'] as RiskBand[]).map((band, i) => {
              const count = stats.bandCounts[band];
              const total = stats.scored.length || 1;
              const pct = count / total;
              const m = bandMeta(band);
              return (
                <div key={band} className="animate-fadeUp" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className={`h-2.5 w-2.5 rounded-full ${m.bar}`} />
                      {m.label}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {count} · {fmtPct(pct, 0)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full origin-left rounded-full animate-scoreFill"
                      style={{
                        '--fill': pct,
                        background: `linear-gradient(90deg, ${m.hex}66, ${m.hex})`,
                        boxShadow: `0 0 16px -4px ${m.hex}`,
                        animationDelay: `${i * 90 + 120}ms`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top drivers */}
          <div className="mt-6 border-t border-white/5 pt-5">
            <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">Top root-cause drivers</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {topDriversList.length === 0 && !ready && <span className="text-xs text-slate-600">computing…</span>}
              {topDriversList.map(([f, count]) => {
                const m = featureMeta(f);
                return (
                  <span
                    key={f}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
                    style={{ borderColor: `${m.hex}40`, background: `${m.hex}12`, color: m.hex }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.hex }} />
                    {m.label}
                    <span className="font-mono text-[10px] opacity-70">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </Card>

        {/* At-risk watchlist */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-100">At-risk watchlist</h3>
            <button
              onClick={() => onNavigate('think')}
              className="text-xs text-pulse-300 hover:text-pulse-200"
            >
              Analyze →
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Highest-risk customers, sorted descending</p>
          <div className="mt-4 space-y-2">
            {stats.atRisk
              .sort((a, b) => b.score!.risk_score - a.score!.risk_score)
              .slice(0, 5)
              .map((r, i) => {
                const c = customers.find((c) => c.id === r.customerId)!;
                const m = bandMeta(r.score!.risk_band);
                const driver = featureMeta(r.score!.attributions[0].feature);
                return (
                  <button
                    key={c.id}
                    onClick={() => onNavigate('think')}
                    className="group flex w-full animate-fadeUp items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/10 hover:bg-white/5"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <Avatar name={c.name} hue={c.avatarHue} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-200">{c.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <LinkIcon size={10} /> {driver.label}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-display text-sm font-semibold ${m.text}`}>{fmtPct(r.score!.risk_score, 0)}</span>
                      <RiskBandPill band={r.score!.risk_band} />
                    </div>
                  </button>
                );
              })}
            {stats.atRisk.length === 0 && ready && (
              <div className="rounded-xl border border-dashed border-white/5 p-6 text-center text-sm text-slate-500">
                No at-risk customers right now.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
