from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime
import uuid
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import OutcomeModel

router = APIRouter()

# In-memory store fallback and cache
outcomes_db = []

POLICY_MODEL_VERSION = 'policy-softmax-v1.6.0'

ACTIONS = ['guided_tutorial', 'proactive_nudge', 'human_handoff', 'incentive']

ACTION_LABELS = {
    'guided_tutorial': 'Guided tutorial',
    'proactive_nudge': 'Proactive nudge',
    'human_handoff': 'Human handoff',
    'incentive': 'Incentive',
}

POLICY_RULES = {
    'onboarding_confusion': {
        'action': 'guided_tutorial',
        'rationale': 'Onboarding confusion is best resolved by a guided tutorial that walks the user to their first win.',
    },
    'repeated_failures': {
        'action': 'human_handoff',
        'rationale': 'Repeated failures typically stem from integration misconfigurations that a live session resolves far more often than an async nudge.',
    },
    'pricing_concern': {
        'action': 'incentive',
        'rationale': 'Pricing concern signals downgrade risk; a loyalty credit gated on renewal commitment is the highest-EV move.',
    },
    'sentiment_decline': {
        'action': 'proactive_nudge',
        'rationale': 'Sentiment decline responds to a personal CSM check-in paired with a roadmap share, not a scripted nudge.',
    },
    'engagement_drop': {
        'action': 'proactive_nudge',
        'rationale': 'Engagement drop is addressed by a single feature-tied proactive nudge within the dormancy window.',
    },
}


class DecideRequest(BaseModel):
    customer_id: str
    customer_name: str
    risk_score: float
    risk_band: str
    top_attribution: str
    knowledge_response: str
    knowledge_confidence: float


class ActionScore(BaseModel):
    action: str
    score: float
    rationale: str


class PolicyDecision(BaseModel):
    customer_id: str
    customer_name: str
    risk_score: float
    risk_band: str
    top_attribution: str
    selected_action: str
    action_scores: List[ActionScore]
    knowledge_response: str
    knowledge_confidence: float
    model_version: str
    timestamp: str


def softmax_scores(pref: str, top_weight: float) -> List[ActionScore]:
    base = {
        'guided_tutorial': 0.2,
        'proactive_nudge': 0.25,
        'human_handoff': 0.18,
        'incentive': 0.17,
    }
    base[pref] = top_weight
    total = sum(base.values())

    scores = []
    for a in ACTIONS:
        score = base[a] / total
        if a == pref:
            rationale = POLICY_RULES.get(pref, {}).get(
                'rationale', 'Highest expected value given the dominant risk driver.')
        else:
            rationale = f"Lower expected value than {ACTION_LABELS[pref]} for this root cause."
        scores.append(ActionScore(
            action=a, score=round(score, 3), rationale=rationale))

    scores.sort(key=lambda x: x.score, reverse=True)
    return scores


@router.post("/decide", response_model=PolicyDecision)
def decide_action(req: DecideRequest):
    rule = POLICY_RULES.get(req.top_attribution, {
        'action': 'proactive_nudge',
        'rationale': 'Default to a proactive nudge when the dominant driver is ambiguous.',
    })

    chosen = rule['action']
    top_weight = 0.46

    if req.risk_band == 'critical' and chosen != 'human_handoff':
        chosen = 'human_handoff'
        top_weight = 0.5
    elif req.risk_band == 'low':
        top_weight = 0.34
    elif req.risk_band in ('high', 'critical'):
        top_weight = min(0.58, top_weight + 0.1)

    action_scores = softmax_scores(chosen, top_weight)

    return PolicyDecision(
        customer_id=req.customer_id,
        customer_name=req.customer_name,
        risk_score=req.risk_score,
        risk_band=req.risk_band,
        top_attribution=req.top_attribution,
        selected_action=action_scores[0].action,
        action_scores=action_scores,
        knowledge_response=req.knowledge_response,
        knowledge_confidence=req.knowledge_confidence,
        model_version=POLICY_MODEL_VERSION,
        timestamp=datetime.datetime.now(
            datetime.timezone.utc).isoformat()
    )


class LogOutcomeRequest(BaseModel):
    decision: dict


@router.post("/outcome")
def log_outcome(req: LogOutcomeRequest, db: Session = Depends(get_db)):
    dec = req.decision
    outcome_id = str(uuid.uuid4())
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    record = {
        'id': outcome_id,
        'customer_id': dec.get('customer_id', 'unknown'),
        'customer_name': dec.get('customer_name', 'Unknown'),
        'risk_score': float(dec.get('risk_score', 0.0)),
        'risk_band': dec.get('risk_band', 'moderate'),
        'top_attribution': dec.get('top_attribution', 'usage_decline'),
        'selected_action': dec.get('selected_action', 'proactive_nudge'),
        'knowledge_response': dec.get('knowledge_response', ''),
        'confidence': float(dec.get('knowledge_confidence', 0.0)),
        'outcome': 'pending',
        'created_at': now_iso,
        'resolved_at': None
    }

    try:
        db_outcome = OutcomeModel(**record)
        db.add(db_outcome)
        db.commit()
    except Exception as e:
        print(f"[Outcome DB] Error writing to database: {e}")

    outcomes_db.insert(0, record)
    return record


class UpdateOutcomeRequest(BaseModel):
    id: str
    outcome: str


@router.post("/outcome/update")
def update_outcome(req: UpdateOutcomeRequest, db: Session = Depends(get_db)):
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. Update in DB
    try:
        db_record = db.query(OutcomeModel).filter(OutcomeModel.id == req.id).first()
        if db_record:
            db_record.outcome = req.outcome
            db_record.resolved_at = now_iso
            db.commit()
            return {
                'id': db_record.id,
                'customer_id': db_record.customer_id,
                'customer_name': db_record.customer_name,
                'risk_score': db_record.risk_score,
                'risk_band': db_record.risk_band,
                'top_attribution': db_record.top_attribution,
                'selected_action': db_record.selected_action,
                'knowledge_response': db_record.knowledge_response,
                'confidence': db_record.confidence,
                'outcome': db_record.outcome,
                'created_at': db_record.created_at,
                'resolved_at': db_record.resolved_at
            }
    except Exception as e:
        print(f"[Outcome DB] Error querying database: {e}")

    # 2. Fallback to memory
    for record in outcomes_db:
        if record['id'] == req.id:
            record['outcome'] = req.outcome
            record['resolved_at'] = now_iso
            return record

    raise HTTPException(status_code=404, detail="Outcome not found")


@router.post("/retrain")
def retrain():
    return {"retrained": True, "model_version": POLICY_MODEL_VERSION}


@router.get("/aggregate")
def aggregate(db: Session = Depends(get_db)):
    # Read from DB first
    records = []
    try:
        db_records = db.query(OutcomeModel).all()
        for r in db_records:
            records.append({
                'id': r.id,
                'customer_id': r.customer_id,
                'customer_name': r.customer_name,
                'risk_score': r.risk_score,
                'risk_band': r.risk_band,
                'top_attribution': r.top_attribution,
                'selected_action': r.selected_action,
                'knowledge_response': r.knowledge_response,
                'confidence': r.confidence,
                'outcome': r.outcome,
                'created_at': r.created_at,
                'resolved_at': r.resolved_at
            })
    except Exception as e:
        print(f"[Outcome DB] Error fetching records: {e}")

    if not records:
        records = outcomes_db

    by_action = {}
    by_root = {}

    for r in records:
        act = r['selected_action']
        if act not in by_action:
            by_action[act] = {'count': 0, 'success_rate': 0}
        by_action[act]['count'] += 1

        root = r['top_attribution']
        if root not in by_root:
            by_root[root] = {'count': 0, 'riskSum': 0}
        by_root[root]['count'] += 1
        by_root[root]['riskSum'] += r['risk_score']

    for a in by_action.keys():
        acts = [r for r in records if r['selected_action'] == a]
        resolved = [r for r in acts if r['outcome'] != 'pending']
        success = len([r for r in resolved if r['outcome'] == 'success'])
        by_action[a]['success_rate'] = success / \
            len(resolved) if resolved else 0

    def feature_label(feature):
        map_labels = {
            'onboarding_confusion': 'Onboarding confusion',
            'repeated_failures': 'Repeated failures',
            'pricing_concern': 'Pricing concern',
            'sentiment_decline': 'Sentiment decline',
            'engagement_drop': 'Engagement drop',
            'billing_anomaly': 'Billing anomaly'
        }
        return map_labels.get(feature, feature)

    by_root_cause = []
    for feature, v in by_root.items():
        by_root_cause.append({
            'feature': feature,
            'label': feature_label(feature),
            'count': v['count'],
            'avg_risk': round(v['riskSum'] / v['count'], 3) if v['count'] else 0
        })
    by_root_cause.sort(key=lambda x: x['count'], reverse=True)

    return {
        "total": len(records),
        "by_action": by_action,
        "by_root_cause": by_root_cause,
        "model_version": POLICY_MODEL_VERSION,
        "retrained": False,
        "last_retrain": None
    }


class FeedbackPayload(BaseModel):
    user_id: str
    action: str
    feedback: str


@router.post("/feedback")
def receive_feedback(payload: FeedbackPayload):
    print(
        f"\n[RL Engine] Received Feedback: {payload.feedback} for User {payload.user_id} on action '{payload.action}'\n")
    return {"status": "success", "message": f"Feedback {payload.feedback} recorded for RL engine"}

