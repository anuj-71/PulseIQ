import { useMemo, useState } from 'react';
import {
  Brain,
  Database,
  FileText,
  Gauge,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  Cpu,
} from 'lucide-react';
import { customers } from '@/lib/customers';
import type { AnalysisStage } from '@/lib/orchestrator';
import { getRiskScore, topAttribution } from '@/lib/riskEngine';
import { knowledgeRespond } from '@/lib/knowledgeAssistant';
import { decide, logDecision, actionLabel } from '@/lib/actionPolicy';
import { bandMeta, featureMeta, fmtPct } from '@/lib/ui';
import { useTypewriter } from '@/hooks/useTypewriter';
import { ActionIcon } from '@/components/ui/ActionIcon';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, Card, Spinner, ThinkingDots } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ShapScene3D } from '@/components/views/ShapScene3D';
import type { Attribution, KnowledgeResponse, PolicyDecision, RiskScoreResponse } from '@/lib/types';

type Phase = 'idle' | 'risk' | 'knowledge' | 'policy' | 'done';

export function ThinkView({ initialCustomerId }: { initialCustomerId?: string }) {
  const [customerId, setCustomerId] = useState(initialCustomerId ?? customers[0].id);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stages, setStages] = useState<AnalysisStage[]>([]);
  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null);
  const [decision, setDecision] = useState<PolicyDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcomeId, setOutcomeId] = useState<string | null>(null);

  const customer = useMemo(() => customers.find((c) => c.id === customerId)!, [customerId]);

  function setStage(idx: number, status: AnalysisStage['status']) {
    setStages((prev) => {
      const next = prev.map((s) => ({ ...s }));
      if (next[idx]) {
        next[idx] = { ...next[idx], status };
      }
      return next;
    });
  }

  async function run() {
    setError(null);
    setRisk(null);
    setKnowledge(null);
    setDecision(null);
    setOutcomeId(null);
    setStages([
      { key: 'risk', label: 'Risk & Behavior Engine', status: 'pending' },
      { key: 'knowledge', label: 'Knowledge Assistant', status: 'pending' },
      { key: 'policy', label: 'Action Policy', status: 'pending' },
      { key: 'persist', label: 'Log decision', status: 'pending' },
    ]);
    setPhase('risk');
    try {
      // 1. Risk engine
      setStage(0, 'running');
      const r = await getRiskScore(customerId);
      setRisk(r);
      setStage(0, 'done');

      // 2. Knowledge assistant
      setPhase('knowledge');
      setStage(1, 'running');
      const k = await knowledgeRespond({
        query: buildLocalQuery(topAttribution(r)),
        customer_id: customerId,
        top_k: 3,
      });
      await wait(300);
      setKnowledge(k);
      setStage(1, 'done');

      // 3. Action policy
      setPhase('policy');
      setStage(2, 'running');
      const decision = await decide(
        customerId,
        customer.name,
        r.risk_score,
        r.risk_band,
        topAttribution(r),
        k.grounded_response,
        k.confidence
      );
      setDecision(decision);
      setStage(2, 'done');

      // 4. Persist
      setStage(3, 'running');
      const record = await logDecision(decision);
      setOutcomeId(record.id);
      setStage(3, 'done');
      setPhase('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setPhase('idle');
    }
  }

  function reset() {
    setPhase('idle');
    setRisk(null);
    setKnowledge(null);
    setDecision(null);
    setOutcomeId(null);
    setStages([]);
    setError(null);
  }

  // When the customer changes while idle, just reset.
  function pickCustomer(id: string) {
    setCustomerId(id);
    reset();
  }

  const busy = phase !== 'idle' && phase !== 'done';

  return (
    <div className="space-y-6">
      {/* Customer picker + run controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-pulse-400/80">
              Live analysis
            </div>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-50">
              See the AI Think
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Pick a customer. Watch the orchestrator call all three subsystems and decide a fix before churn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw size={15} /> Reset
            </button>
            <button
              onClick={run}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pulse-400 to-pulse-600 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)] transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Spinner size={15} /> : <Play size={15} />}
              {busy ? 'Analyzing…' : 'Run analysis'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {customers.map((c) => {
            const active = c.id === customerId;
            return (
              <button
                key={c.id}
                onClick={() => pickCustomer(c.id)}
                disabled={busy}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition disabled:opacity-50 ${
                  active
                    ? 'border-pulse-500/40 bg-pulse-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <Avatar name={c.name} hue={c.avatarHue} size={26} />
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.company}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </Card>
      )}

      {/* Pipeline indicator */}
      <PipelineIndicator stages={stages} />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: SHAP / Risk */}
        <div className="space-y-6 lg:col-span-3">
          <RiskPanel risk={risk} phase={phase} />
          <KnowledgePanel knowledge={knowledge} phase={phase} />
        </div>
        {/* Right: action policy */}
        <div className="lg:col-span-2">
          <PolicyPanel decision={decision} phase={phase} outcomeId={outcomeId} />
        </div>
      </div>
    </div>
  );
}

function buildLocalQuery(attr?: Attribution) {
  if (!attr) return 'general churn risk';
  const f = attr.feature;
  if (f === 'onboarding_confusion') return 'onboarding_confusion stalled onboarding';
  if (f === 'repeated_failures') return 'repeated_failures support escalation';
  if (f === 'pricing_concern') return 'pricing_concern downgrade risk';
  if (f === 'sentiment_decline') return 'sentiment_decline low sentiment recovery';
  if (f === 'engagement_drop') return 'engagement_drop dormant feature nudge';
  return attr.label;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------- Pipeline indicator ----------------
const PIPELINE_NODES = [
  { key: 'risk', label: 'Risk Engine', Icon: Gauge },
  { key: 'knowledge', label: 'Knowledge Assistant', Icon: FileText },
  { key: 'policy', label: 'Action Policy', Icon: Cpu },
] as const;

function PipelineIndicator({ stages }: { stages: AnalysisStage[] }) {
  const nodeStatus = (key: string): AnalysisStage['status'] =>
    stages.find((s) => s.key === key)?.status ?? 'pending';

  return (
    <Card className="relative max-h-[80px] overflow-hidden px-5 py-3.5">
      <div className="flex h-full items-center">
        {PIPELINE_NODES.map((node, i) => {
          const status = nodeStatus(node.key);
          const leftDone = i > 0 ? nodeStatus(PIPELINE_NODES[i - 1].key) === 'done' : false;
          return (
            <div key={node.key} className="flex flex-1 items-center">
              <PipelineNode node={node} status={status} />
              {i < PIPELINE_NODES.length - 1 && (
                <PipelineLine filled={leftDone} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PipelineNode({
  node,
  status,
}: {
  node: (typeof PIPELINE_NODES)[number];
  status: AnalysisStage['status'];
}) {
  const { label, Icon } = node;
  if (status === 'done') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pulse-500 text-ink-950 shadow-[0_0_16px_-2px_rgba(34,211,238,0.8)]">
          <Check size={15} strokeWidth={3} />
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-pulse-200">{label}</span>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-pulse-400 bg-pulse-500/15 animate-pulseGlow">
          <Spinner size={13} />
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-pulse-200">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
        <Icon size={13} className="text-slate-600" />
      </div>
      <span className="whitespace-nowrap text-xs font-medium text-slate-600">{label}</span>
    </div>
  );
}

function PipelineLine({ filled }: { filled: boolean }) {
  return (
    <div className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-white/8">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-400 transition-all duration-700 ease-out"
        style={{ width: filled ? '100%' : '0%' }}
      />
    </div>
  );
}

// ---------------- Risk / SHAP panel ----------------
function RiskPanel({
  risk,
  phase,
}: {
  risk: RiskScoreResponse | null;
  phase: Phase;
}) {
  const loading = phase === 'risk' && !risk;
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="scan-line animate-scan" style={{ display: loading ? 'block' : 'none' }} />
      <PanelHeader
        icon={<Gauge size={15} />}
        title="Risk & Behavior Engine"
        sub="PyTorch churn model · SHAP explainability"
        version={risk?.model_version}
      />

      {loading && <SkeletonRows />}

      {!risk && !loading && (
        <EmptyState icon={<Brain size={26} />} text="Run an analysis to see the model score this customer and explain why." />
      )}

      {risk && (
        <div className="mt-5 animate-fadeUp">
          {/* Score ring + band */}
          <div className="flex items-center gap-5">
            <ScoreRing score={risk.risk_score} band={risk.risk_band} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-500">Churn risk</span>
                <Badge className={bandMeta(risk.risk_band).bg + ' ' + bandMeta(risk.risk_band).text + ' ring-1 ' + bandMeta(risk.risk_band).ring}>
                  {bandMeta(risk.risk_band).label}
                </Badge>
              </div>
              <div className="mt-1 font-display text-3xl font-semibold text-slate-50">
                {fmtPct(risk.risk_score, 1)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Top driver: <span className="text-slate-300">{featureMeta(risk.attributions[0].feature).label}</span>
              </p>
            </div>
          </div>

          {/* SHAP bars */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                SHAP attributions
              </h4>
              <span className="text-[10px] text-slate-600">signed contribution to risk</span>
            </div>
            <div className="mt-4 animate-fadeUp" style={{ animationDelay: '300ms' }}>
              <ShapScene3D attributions={risk.attributions} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}


function ScoreRing({ score, band }: { score: number; band: RiskScoreResponse['risk_band'] }) {
  const m = bandMeta(band);
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={m.hex}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          style={{
            animation: `dash 1.1s cubic-bezier(0.22,1,0.36,1) forwards`,
            animationDelay: '120ms',
            filter: `drop-shadow(0 0 6px ${m.hex})`,
          }}
        >
          <animate attributeName="stroke-dashoffset" from={circ} to={offset} dur="1.1s" begin="120ms" fill="freeze" />
        </circle>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-semibold text-slate-50">{Math.round(score * 100)}</span>
        <span className="text-[9px] uppercase tracking-wider text-slate-500">risk</span>
      </div>
    </div>
  );
}

// ---------------- Knowledge panel ----------------
function KnowledgePanel({ knowledge, phase }: { knowledge: KnowledgeResponse | null; phase: Phase }) {
  const loading = phase === 'knowledge' && !knowledge;
  const response = knowledge?.grounded_response ?? '';
  const { shown, done } = useTypewriter(response, 12, !!knowledge);

  return (
    <Card className="relative overflow-hidden p-5">
      <PanelHeader
        icon={<FileText size={15} />}
        title="Knowledge Assistant"
        sub="RAG + fine-tuned LLM · grounded in company docs"
        version={knowledge?.model_version}
      />

      {loading && <SkeletonRows />}

      {!knowledge && !loading && (
        <EmptyState icon={<Database size={26} />} text="The assistant will retrieve relevant docs and compose a grounded recommendation." />
      )}

      {knowledge && (
        <div className="mt-5 animate-fadeUp">
          {/* Retrieval chips */}
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Retrieved docs
            </h4>
            <span className="text-[10px] text-slate-600">{knowledge.retrieved_docs.length} sources</span>
          </div>
          <div className="space-y-2">
            {knowledge.retrieved_docs.map((d, i) => (
              <RetrievedDocRow key={d.id} doc={d} index={i} />
            ))}
          </div>

          {/* Grounded response */}
          <div className="mt-5 rounded-xl border border-pulse-500/15 bg-pulse-500/[0.04] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-pulse-200">
                <Sparkles size={13} /> Grounded response
              </span>
              <Badge className="bg-white/5 text-slate-300">
                confidence {fmtPct(knowledge.confidence, 0)}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {shown}
              {!done && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-pulse-300 align-middle" />}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function RetrievedDocRow({ doc, index }: { doc: KnowledgeResponse['retrieved_docs'][number]; index: number }) {
  return (
    <div
      className="animate-fadeUp rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/10"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText size={13} className="shrink-0 text-pulse-400" />
            <span className="truncate text-sm font-medium text-slate-200">{doc.title}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">{doc.source}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">relevance</div>
          <div className="font-mono text-xs text-pulse-300">{fmtPct(doc.relevance, 0)}</div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {highlightSnippet(doc.snippet, doc.highlights)}
      </p>
      {doc.highlights.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doc.highlights.map((h) => (
            <span key={h} className="rounded-md bg-pulse-500/10 px-1.5 py-0.5 text-[10px] text-pulse-300">
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightSnippet(text: string, terms: string[]) {
  if (!terms.length) return text;
  const parts = text.split(new RegExp(`(${terms.join('|')})`, 'gi'));
  return parts.map((p, i) =>
    terms.includes(p.toLowerCase()) ? (
      <mark key={i} className="rounded bg-pulse-500/20 px-0.5 text-pulse-100">{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

// ---------------- Policy panel ----------------
function PolicyPanel({
  decision,
  phase,
  outcomeId,
}: {
  decision: PolicyDecision | null;
  phase: Phase;
  outcomeId: string | null;
}) {
  const loading = phase === 'policy' && !decision;
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pulse-500/10 blur-3xl" />
      <PanelHeader
        icon={<Cpu size={15} />}
        title="Action Policy"
        sub="Picks one of 4 actions from the root-cause driver"
        version={decision?.model_version}
      />

      {loading && <SkeletonRows />}

      {!decision && !loading && (
        <EmptyState icon={<Sparkles size={26} />} text="The policy scores four actions and selects the best fit for this customer's root cause." />
      )}

      {decision && (
        <div className="mt-5 animate-fadeUp">
          {/* Winner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 animate-winnerGlow">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald-300">
              <Check size={13} /> Recommended action
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <ActionIcon action={decision.selected_action} size={20} />
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-slate-50">
                  {actionLabel(decision.selected_action)}
                </div>
                <div className="text-xs text-slate-400">
                  driver: {featureMeta(decision.top_attribution).label} · risk {fmtPct(decision.risk_score, 1)}
                </div>
              </div>
            </div>
          </div>

          {/* All action scores */}
          <div className="mt-5">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Action scores
            </h4>
            <div className="space-y-3">
              {decision.action_scores.map((s, i) => {
                const winner = s.action === decision.selected_action;
                return (
                  <div
                    key={s.action}
                    className={`animate-fadeUp rounded-xl border p-3 ${
                      winner ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-white/5 bg-white/[0.02]'
                    }`}
                    style={{ animationDelay: `${i * 130}ms` }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-200">
                        <ActionIcon action={s.action} size={15} className={winner ? 'text-emerald-300' : 'text-slate-400'} />
                        {actionLabel(s.action)}
                      </span>
                      <span className="font-mono text-xs text-slate-300">{fmtPct(s.score, 1)}</span>
                    </div>
                    <ProgressBar
                      value={s.score}
                      barClassName={winner ? 'bg-emerald-400' : 'bg-slate-500'}
                      delay={i * 130 + 80}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{s.rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {outcomeId && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-emerald-400" />
                Decision logged to feedback loop · id {outcomeId.slice(0, 8)}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    fetch('http://localhost:8000/rl/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: decision.selected_action,
                        action: decision.selected_action,
                        feedback: 'thumbs_up'
                      })
                    }).then(() => console.log('Thumbs up sent'));
                  }}
                  className="rounded bg-emerald-500/20 px-3 py-1.5 text-emerald-300 transition hover:bg-emerald-500/30"
                >
                  👍 Good Choice
                </button>
                <button
                  onClick={() => {
                    fetch('http://localhost:8000/rl/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: decision.selected_action,
                        action: decision.selected_action,
                        feedback: 'thumbs_down'
                      })
                    }).then(() => console.log('Thumbs down sent'));
                  }}
                  className="rounded bg-rose-500/20 px-3 py-1.5 text-rose-300 transition hover:bg-rose-500/30"
                >
                  👎 Bad Choice
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------- shared bits ----------------
function PanelHeader({
  icon,
  title,
  sub,
  version,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  version?: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-pulse-300">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-100">{title}</h3>
          <p className="text-[11px] text-slate-500">{sub}</p>
        </div>
      </div>
      {version && (
        <span className="hidden rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-400 sm:block">
          {version}
        </span>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="mt-5 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-xl bg-white/[0.02]">
          <div className="h-full w-full animate-shimmer rounded-xl shimmer" />
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 text-xs text-pulse-300">
        <ThinkingDots /> processing signals…
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.01] px-6 py-10 text-center">
      <div className="mb-3 text-slate-600">{icon}</div>
      <p className="max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}


