// ---- Shared domain types for the PulseIQ orchestration layer ----
// These mirror the published schemas of the three subsystems so the
// frontend can swap mocks for live endpoints with no interface changes.

// P1 - Risk & Behavior Engine (GET /risk/score/{user_id})
export type RiskBand = 'low' | 'moderate' | 'high' | 'critical';

export interface Attribution {
  feature: string; // e.g. onboarding_confusion, repeated_failures, pricing_concern
  label: string; // human-readable
  value: number; // signed SHAP value
  contribution: number; // 0..1 share of total |SHAP|
  direction: 'increases' | 'decreases'; // pushes risk up or down
}

export interface RiskScoreResponse {
  user_id: string;
  risk_score: number; // 0..1
  risk_band: RiskBand;
  attributions: Attribution[];
  model_version: string;
  timestamp: string;
}

// P2 - Knowledge Assistant (POST /knowledge/respond)
export interface RetrievedDoc {
  id: string;
  title: string;
  source: string;
  snippet: string;
  relevance: number; // 0..1
  highlights: string[];
}

export interface KnowledgeRequest {
  query: string;
  customer_id?: string;
  top_k?: number;
}

export interface KnowledgeResponse {
  retrieved_docs: RetrievedDoc[];
  grounded_response: string;
  confidence: number; // 0..1
  model_version: string;
}

// P3 - Action Policy & Feedback Loop
export type ActionType = 'guided_tutorial' | 'proactive_nudge' | 'human_handoff' | 'incentive';

export interface ActionScore {
  action: ActionType;
  score: number; // 0..1
  rationale: string;
}

export interface PolicyDecision {
  customer_id: string;
  customer_name: string;
  risk_score: number;
  risk_band: RiskBand;
  top_attribution: string;
  selected_action: ActionType;
  action_scores: ActionScore[];
  knowledge_response: string;
  knowledge_confidence: number;
  model_version: string;
  timestamp: string;
}

export type OutcomeStatus = 'pending' | 'success' | 'failure';

export interface OutcomeRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  risk_score: number;
  risk_band: RiskBand;
  top_attribution: string;
  selected_action: ActionType;
  knowledge_response: string;
  confidence: number;
  outcome: OutcomeStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface AggregateResponse {
  total: number;
  by_action: Record<string, { count: number; success_rate: number }>;
  by_root_cause: { feature: string; label: string; count: number; avg_risk: number }[];
  model_version: string;
  retrained: boolean;
  last_retrain: string | null;
}

// Customer profile (internal to the app layer)
export interface CustomerSignal {
  key: string;
  label: string;
  value: number; // raw-ish normalized 0..1 unless noted
  display: string; // human label for the UI
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  tier: 'Starter' | 'Growth' | 'Enterprise';
  plan_value: number;
  avatarHue: number;
  signals: CustomerSignal[];
  joinedDays: number;
  lastActiveDays: number;
}
