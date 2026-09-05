import type { Attribution, RiskBand, RiskScoreResponse } from './types';
import { findCustomer } from './customers';

// ---- P1 - Risk & Behavior Engine ----
// Real implementation: PyTorch churn model + SHAP. Mock reproduces the
// published schema: GET /risk/score/{user_id} → {risk_score, attributions[],
// model_version, timestamp}.

export const RISK_MODEL_VERSION = 'churn-xgb-v2.4.1';


function band(score: number): RiskBand {
  if (score >= 0.75) return 'critical';
  if (score >= 0.55) return 'high';
  if (score >= 0.35) return 'moderate';
  return 'low';
}

export async function getRiskScore(userId: string): Promise<RiskScoreResponse> {
  const customer = findCustomer(userId);
  if (!customer) throw new Error(`unknown user ${userId}`);

  // Map our UI signals to the SHAP endpoint schema
  const sig = Object.fromEntries(customer.signals.map((s) => [s.key, s.value]));
  
  // Create a plausible RiskRequest from the customer signals
  const requestBody = {
    usage_decline: 1 - (sig['login_frequency'] ?? 0.5),
    tickets_last30: Math.round((sig['support_tickets'] ?? 0) * 10),
    negative_sentiment: 1 - (sig['sentiment_score'] ?? 0.5),
    feature_dropout: 1 - (sig['feature_adoption'] ?? 0.5),
    active_days: Math.round((sig['login_frequency'] ?? 0.5) * 30),
    support_delay: (sig['support_tickets'] ?? 0) * 24,
    payment_delay: (sig['billing_anomaly'] ?? 0) * 30,
  };

  try {
    const res = await fetch('http://localhost:8000/shap/risk/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) throw new Error(`SHAP API returned ${res.status}`);
    
    const data = await res.json();
    
    // Map SHAP response format to our frontend RiskScoreResponse
    const rawAttributions = data.attributions || [];
    const totalAbs = rawAttributions.reduce((s: number, a: { impact: number }) => s + Math.abs(a.impact), 0) || 1;
    
    const attributions: Attribution[] = rawAttributions.map((a: { feature: string; impact: number }) => ({
      feature: a.feature,
      label: a.feature.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      value: a.impact,
      contribution: +(Math.abs(a.impact) / totalAbs).toFixed(3),
      direction: a.impact >= 0 ? 'increases' : 'decreases',
    }));
    
    attributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return {
      user_id: userId,
      risk_score: +(data.risk_score || 0).toFixed(3),
      risk_band: band(data.risk_score || 0),
      attributions,
      model_version: data.model_version || RISK_MODEL_VERSION,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to call SHAP API:", err);
    // Fallback to avoid breaking UI if server isn't running
    return {
      user_id: userId,
      risk_score: 0.5,
      risk_band: 'moderate',
      attributions: [{ feature: 'api_error', label: 'API Unavailable', value: 0.5, contribution: 1, direction: 'increases' }],
      model_version: "unknown",
      timestamp: new Date().toISOString(),
    };
  }
}



export function topAttribution(resp: RiskScoreResponse): Attribution {
  return resp.attributions[0];
}


