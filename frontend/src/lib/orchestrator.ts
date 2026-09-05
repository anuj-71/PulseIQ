import { findCustomer } from './customers';
import { getRiskScore, topAttribution } from './riskEngine';
import { knowledgeRespond } from './knowledgeAssistant';
import { decide, logDecision } from './actionPolicy';
import type { PolicyDecision } from './types';

// ---- Person 4 - Orchestration layer ----
// Orchestrates P1 -> P2 -> P3 and persists the decision. Exposes a single
// `analyze` call that the "See the AI Think" dashboard consumes.

export interface AnalysisStage {
  key: 'risk' | 'knowledge' | 'policy' | 'persist';
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt?: number;
  finishedAt?: number;
}

export interface AnalysisResult {
  decision: PolicyDecision;
  outcomeId: string;
}

export async function analyze(
  customerId: string,
  onStage?: (stages: AnalysisStage[]) => void
): Promise<AnalysisResult> {
  const customer = findCustomer(customerId);
  if (!customer) throw new Error(`unknown customer ${customerId}`);

  const stages: AnalysisStage[] = [
    { key: 'risk', label: 'Risk & Behavior Engine', status: 'pending' },
    { key: 'knowledge', label: 'Knowledge Assistant', status: 'pending' },
    { key: 'policy', label: 'Action Policy', status: 'pending' },
    { key: 'persist', label: 'Log decision', status: 'pending' },
  ];
  const emit = () => onStage?.(stages.map((s) => ({ ...s })));

  // 1. Risk engine
  stages[0].status = 'running';
  stages[0].startedAt = Date.now();
  emit();
  const risk = await getRiskScore(customerId);
  stages[0].status = 'done';
  stages[0].finishedAt = Date.now();
  emit();

  // 2. Knowledge assistant: query built from the top attribution
  stages[1].status = 'running';
  stages[1].startedAt = Date.now();
  emit();
  const query = buildQuery(topAttribution(risk), customer);
  const knowledge = await knowledgeRespond({ query, customer_id: customerId, top_k: 3 });
  stages[1].status = 'done';
  stages[1].finishedAt = Date.now();
  emit();

  // 3. Action policy
  stages[2].status = 'running';
  stages[2].startedAt = Date.now();
  emit();
  const decision = await decide(
    customerId,
    customer.name,
    risk.risk_score,
    risk.risk_band,
    topAttribution(risk),
    knowledge.grounded_response,
    knowledge.confidence
  );
  stages[2].status = 'done';
  stages[2].finishedAt = Date.now();
  emit();

  // 4. Persist
  stages[3].status = 'running';
  stages[3].startedAt = Date.now();
  emit();
  const record = await logDecision(decision);
  stages[3].status = 'done';
  stages[3].finishedAt = Date.now();
  emit();

  return { decision, outcomeId: record.id };
}

function buildQuery(attr: { feature: string; label: string }, customer: { tier: string }) {
  const f = attr.feature;
  const tierHint = customer.tier === 'Enterprise' ? ' for an Enterprise account' : '';
  if (f === 'onboarding_confusion') return `onboarding_confusion stalled onboarding${tierHint}`;
  if (f === 'repeated_failures') return `repeated_failures support escalation${tierHint}`;
  if (f === 'pricing_concern') return `pricing_concern downgrade risk${tierHint}`;
  if (f === 'sentiment_decline') return `sentiment_decline low sentiment recovery${tierHint}`;
  if (f === 'engagement_drop') return `engagement_drop dormant feature nudge${tierHint}`;
  return attr.label;
}
