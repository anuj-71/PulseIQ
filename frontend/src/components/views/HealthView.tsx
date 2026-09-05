import { useEffect, useState, useCallback } from 'react';
import { Cpu, Gauge, FileText, Server, Zap, Activity, Check, XCircle, RefreshCw } from 'lucide-react';
import { RISK_MODEL_VERSION } from '@/lib/riskEngine';
import { KNOWLEDGE_MODEL_VERSION } from '@/lib/knowledgeAssistant';
import { POLICY_MODEL_VERSION } from '@/lib/actionPolicy';
import { Card, SectionTitle, Spinner } from '@/components/ui/Card';

interface LiveServiceStatus {
  key: string;
  name: string;
  endpoint: string;
  healthUrl: string;
  method: string;
  model: string;
  icon: typeof Gauge;
  accent: string;
  desc: string;
  // Live status (filled by health check)
  healthy: boolean;
  latencyMs: number | null;
  lastChecked: string | null;
  checking: boolean;
}

const SERVICES_CONFIG: Omit<LiveServiceStatus, 'healthy' | 'latencyMs' | 'lastChecked' | 'checking'>[] = [
  {
    key: 'risk',
    name: 'Risk & Behavior Engine',
    endpoint: '/shap/risk/score',
    healthUrl: 'http://localhost:8000/shap/risk/score',
    method: 'POST',
    model: RISK_MODEL_VERSION,
    icon: Gauge,
    accent: 'text-pulse-300',
    desc: 'PyTorch churn model + SHAP explainability. Scores 0..1 risk and returns signed attributions.',
  },
  {
    key: 'knowledge',
    name: 'Knowledge Assistant',
    endpoint: '/rag/knowledge/respond',
    healthUrl: 'http://localhost:8000/rag/knowledge/respond',
    method: 'POST',
    model: KNOWLEDGE_MODEL_VERSION,
    icon: FileText,
    accent: 'text-sky-300',
    desc: 'RAG + fine-tuned LLM (LoRA/QLoRA). Grounds responses in company docs with retrieval confidence.',
  },
  {
    key: 'policy',
    name: 'Action Policy & Feedback Loop',
    endpoint: '/policy/decide',
    healthUrl: 'http://localhost:8000/policy/decide',
    method: 'POST',
    model: POLICY_MODEL_VERSION,
    icon: Cpu,
    accent: 'text-emerald-300',
    desc: 'Picks 1 of 4 actions from the dominant risk driver. Logs outcomes, retrains, aggregates root causes.',
  },
  {
    key: 'orchestrator',
    name: 'Unified Backend',
    endpoint: '/health',
    healthUrl: 'http://localhost:8000/health',
    method: 'GET',
    model: 'orchestrator v0.4',
    icon: Server,
    accent: 'text-violet-300',
    desc: 'FastAPI backend sequencing P1 → P2 → P3 → persistence and exposing results to the dashboard.',
  },
];

async function checkHealth(url: string, method: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: method === 'GET' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      ...(method === 'POST' ? { body: JSON.stringify({}) } : {}),
    });
    const latencyMs = Math.round(performance.now() - start);
    // We consider any response (even 422 for missing fields) as "service is alive"
    return { ok: res.status < 500, latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs };
  }
}

export function HealthView() {
  const [services, setServices] = useState<LiveServiceStatus[]>(
    SERVICES_CONFIG.map((s) => ({ ...s, healthy: false, latencyMs: null, lastChecked: null, checking: true }))
  );
  const [refreshing, setRefreshing] = useState(false);

  const runHealthChecks = useCallback(async () => {
    setRefreshing(true);
    setServices((prev) => prev.map((s) => ({ ...s, checking: true })));

    const results = await Promise.all(
      SERVICES_CONFIG.map(async (s) => {
        const { ok, latencyMs } = await checkHealth(s.healthUrl, s.method);
        return { key: s.key, healthy: ok, latencyMs, lastChecked: new Date().toISOString() };
      })
    );

    setServices((prev) =>
      prev.map((s) => {
        const result = results.find((r) => r.key === s.key);
        return result ? { ...s, ...result, checking: false } : { ...s, checking: false };
      })
    );
    setRefreshing(false);
  }, []);

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, [runHealthChecks]);

  const allHealthy = services.every((s) => s.healthy && !s.checking);
  const someDown = services.some((s) => !s.healthy && !s.checking);

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="System health"
        title="Live subsystem status & endpoint map"
        desc="PulseIQ is three AI subsystems plus an orchestration layer. Status is auto-detected from live health checks against the backend."
      />

      {/* Architecture diagram */}
      <Card className="relative overflow-hidden p-6">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative">
          <h3 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-slate-100">
            <Activity size={16} className="text-pulse-300" /> Request flow
          </h3>
          <p className="text-xs text-slate-500">How a single customer analysis flows through the platform</p>

          <div className="mt-6 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            <FlowNode label="Customer" sub="selected in dashboard" icon={Server} hue="06b6d4" />
            <FlowArrow />
            <FlowNode label="Risk Engine" sub="score + SHAP" icon={Gauge} hue="06b6d4" tag="P1" />
            <FlowArrow />
            <FlowNode label="Knowledge" sub="RAG retrieval" icon={FileText} hue="0ea5e9" tag="P2" />
            <FlowArrow />
            <FlowNode label="Action Policy" sub="decide + log" icon={Cpu} hue="10b981" tag="P3" />
            <FlowArrow />
            <FlowNode label="Feedback Loop" sub="outcome → retrain" icon={Activity} hue="8b5cf6" />
          </div>
        </div>
      </Card>

      {/* Overall status + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {allHealthy ? (
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              All systems operational
            </span>
          ) : someDown ? (
            <span className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              {services.filter((s) => !s.healthy && !s.checking).length} service(s) unreachable
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400">
              <Spinner size={12} /> Checking…
            </span>
          )}
        </div>
        <button
          onClick={runHealthChecks}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Service cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="relative overflow-hidden p-5 animate-fadeUp" >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pulse-500/5 blur-2xl" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03]">
                    <Icon size={18} className={s.accent} />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-slate-100">{s.name}</h4>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono">{s.model}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.checking ? (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Spinner size={11} /> checking
                    </span>
                  ) : s.healthy ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-rose-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> offline
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-400">{s.desc}</p>

              <div className="mt-4 space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">endpoint</span>
                  <span className="text-pulse-200">{s.endpoint}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">method</span>
                  <span className="text-slate-300">{s.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">latency</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Zap size={10} className="text-amber-300" />
                    {s.latencyMs !== null ? `${s.latencyMs}ms` : '-'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {s.checking ? (
                    <span className="flex items-center gap-1.5 text-slate-400"><Spinner size={13} /> Checking connectivity...</span>
                  ) : s.healthy ? (
                    <span className="flex items-center gap-1.5 text-emerald-300"><Check size={13} /> Live endpoint responding</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-300"><XCircle size={13} /> Endpoint unreachable</span>
                  )}
                </div>
                {s.lastChecked && (
                  <span className="text-[10px] text-slate-600">
                    checked {new Date(s.lastChecked).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* AWS Cloud & Database Infrastructure */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-100 flex items-center gap-2">
              <Server size={18} className="text-amber-400" />
              AWS Cloud Infrastructure & Relational Database
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Free-Tier optimized cloud deployment topology on Amazon Web Services
            </p>
          </div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono font-medium text-amber-300">
            AWS Free Tier
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <div className="text-[11px] text-slate-500">Compute Service</div>
            <div className="mt-1 font-display text-sm font-semibold text-slate-200">Amazon EC2</div>
            <div className="mt-2 text-xs font-mono text-cyan-400">t2.micro / t3.micro</div>
            <div className="mt-1 text-[11px] text-slate-400">FastAPI & Docker host</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <div className="text-[11px] text-slate-500">Object Storage</div>
            <div className="mt-1 font-display text-sm font-semibold text-slate-200">Amazon S3</div>
            <div className="mt-2 text-xs font-mono text-amber-400">pulseiq-artifacts</div>
            <div className="mt-1 text-[11px] text-slate-400">PyTorch models & docs</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <div className="text-[11px] text-slate-500">Relational Database</div>
            <div className="mt-1 font-display text-sm font-semibold text-slate-200">Amazon RDS</div>
            <div className="mt-2 text-xs font-mono text-emerald-400">PostgreSQL 16</div>
            <div className="mt-1 text-[11px] text-slate-400">SQLAlchemy ORM + Seeds</div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <div className="text-[11px] text-slate-500">Vector Search</div>
            <div className="mt-1 font-display text-sm font-semibold text-slate-200">Qdrant Engine</div>
            <div className="mt-2 text-xs font-mono text-purple-400">Port 6333</div>
            <div className="mt-1 text-[11px] text-slate-400">Knowledge embeddings</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-base font-semibold text-slate-100">Integration notes</h3>
        <ul className="mt-3 space-y-2.5 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-emerald-400">•</span> All three AI subsystems (Risk Engine, Knowledge Assistant, Action Policy) call the live FastAPI backend on port 8000.</li>
          <li className="flex gap-2"><span className="text-emerald-400">•</span> Relational persistence is handled by PostgreSQL / SQLAlchemy for accounts, signals, SHAP attributions, and outcomes.</li>
          <li className="flex gap-2"><span className="text-emerald-400">•</span> Amazon S3 stores model artifacts (risk_model.pth, dataset.pkl) and exports audit reports.</li>
          <li className="flex gap-2"><span className="text-emerald-400">•</span> Action choice depends on <em>which</em> attribution drove the risk score: same score from <code className="rounded bg-white/5 px-1 text-pulse-200">onboarding_confusion</code> picks a tutorial, from <code className="rounded bg-white/5 px-1 text-pulse-200">repeated_failures</code> picks a human handoff.</li>
        </ul>
      </Card>
    </div>
  );
}

function FlowNode({ label, sub, icon: Icon, hue, tag }: { label: string; sub: string; icon: typeof Gauge; hue: string; tag?: string }) {
  return (
    <div className="relative flex flex-1 items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3" style={{ boxShadow: `0 0 20px -10px #${hue}` }}>
      {tag && <span className="absolute -left-2 -top-2 rounded-md bg-ink-800 px-1.5 py-0.5 text-[9px] font-semibold text-pulse-300 ring-1 ring-white/10">{tag}</span>}
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `#${hue}22` }}>
        <Icon size={15} style={{ color: `#${hue}` }} />
      </div>
      <div>
        <div className="text-xs font-medium text-slate-200">{label}</div>
        <div className="text-[10px] text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center lg:px-1">
      <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="text-pulse-400/60">
        <path d="M0 7 H22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="animate-dash" />
        <path d="M22 3 L28 7 L22 11 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
