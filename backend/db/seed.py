import json
import uuid
from backend.db.database import SessionLocal, init_db
from backend.db.models import CustomerModel, OutcomeModel, utc_now_iso

DEFAULT_CUSTOMERS = [
    {
        "id": "c_001",
        "name": "Maya Chen",
        "company": "Northwind Robotics",
        "email": "maya@northwind.io",
        "tier": "Enterprise",
        "plan_value": 12000.0,
        "avatar_hue": 190,
        "joined_days": 420,
        "last_active_days": 2,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.45, "display": "45% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.38, "display": "3 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.62, "display": "0.62"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.70, "display": "70%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_002",
        "name": "Diego Alvarez",
        "company": "Lumen Health",
        "email": "diego@lumenhealth.com",
        "tier": "Growth",
        "plan_value": 4500.0,
        "avatar_hue": 220,
        "joined_days": 180,
        "last_active_days": 5,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.20, "display": "20% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.75, "display": "6 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.35, "display": "0.35"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.40, "display": "40%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 1.0, "display": "flagged"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 0.83, "display": "5/6 steps"}
        ]
    },
    {
        "id": "c_003",
        "name": "Priya Nair",
        "company": "Atlas Freight",
        "email": "priya@atlasfreight.co",
        "tier": "Enterprise",
        "plan_value": 12000.0,
        "avatar_hue": 140,
        "joined_days": 310,
        "last_active_days": 1,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.85, "display": "85% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.12, "display": "1 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.88, "display": "0.88"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.90, "display": "90%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_004",
        "name": "Sam Okafor",
        "company": "Brightwave Media",
        "email": "sam@brightwave.tv",
        "tier": "Starter",
        "plan_value": 990.0,
        "avatar_hue": 45,
        "joined_days": 65,
        "last_active_days": 8,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.15, "display": "15% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.50, "display": "4 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.40, "display": "0.40"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.25, "display": "25%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 0.33, "display": "2/6 steps"}
        ]
    },
    {
        "id": "c_005",
        "name": "Hana Kobayashi",
        "company": "Vertex Labs",
        "email": "hana@vertexlabs.ai",
        "tier": "Growth",
        "plan_value": 4500.0,
        "avatar_hue": 280,
        "joined_days": 210,
        "last_active_days": 3,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.60, "display": "60% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.25, "display": "2 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.70, "display": "0.70"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.65, "display": "65%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_006",
        "name": "Lucas Pereira",
        "company": "Cedar & Co",
        "email": "lucas@cedarco.com",
        "tier": "Enterprise",
        "plan_value": 12000.0,
        "avatar_hue": 210,
        "joined_days": 500,
        "last_active_days": 11,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.10, "display": "10% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.88, "display": "7 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.22, "display": "0.22"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.30, "display": "30%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 1.0, "display": "flagged"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_007",
        "name": "Aaliyah Brooks",
        "company": "Skyline Energy",
        "email": "aaliyah@skyline.energy",
        "tier": "Growth",
        "plan_value": 4500.0,
        "avatar_hue": 320,
        "joined_days": 120,
        "last_active_days": 2,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.70, "display": "70% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.30, "display": "2 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.75, "display": "0.75"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.80, "display": "80%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 0.83, "display": "5/6 steps"}
        ]
    },
    {
        "id": "c_008",
        "name": "Theo Müller",
        "company": "Quantum Gear",
        "email": "theo@quantumgear.de",
        "tier": "Starter",
        "plan_value": 990.0,
        "avatar_hue": 160,
        "joined_days": 45,
        "last_active_days": 1,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.90, "display": "90% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.0, "display": "0 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.95, "display": "0.95"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.85, "display": "85%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 0.67, "display": "4/6 steps"}
        ]
    },
    {
        "id": "c_009",
        "name": "Ines Garcia",
        "company": "Harbor Pay",
        "email": "ines@harborpay.io",
        "tier": "Enterprise",
        "plan_value": 12000.0,
        "avatar_hue": 240,
        "joined_days": 380,
        "last_active_days": 6,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.35, "display": "35% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.60, "display": "5 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.48, "display": "0.48"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.50, "display": "50%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_010",
        "name": "Ravi Shankar",
        "company": "Nimbus Cloud",
        "email": "ravi@nimbus.cloud",
        "tier": "Growth",
        "plan_value": 4500.0,
        "avatar_hue": 20,
        "joined_days": 270,
        "last_active_days": 4,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.55, "display": "55% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.40, "display": "3 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.65, "display": "0.65"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.60, "display": "60%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    },
    {
        "id": "c_011",
        "name": "Greta Lindholm",
        "company": "Polar Foods",
        "email": "greta@polarfoods.se",
        "tier": "Starter",
        "plan_value": 990.0,
        "avatar_hue": 175,
        "joined_days": 90,
        "last_active_days": 9,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.25, "display": "25% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.65, "display": "5 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.38, "display": "0.38"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.35, "display": "35%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 1.0, "display": "flagged"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 0.50, "display": "3/6 steps"}
        ]
    },
    {
        "id": "c_012",
        "name": "Omar Haddad",
        "company": "Sable Logistics",
        "email": "omar@sablelog.com",
        "tier": "Enterprise",
        "plan_value": 12000.0,
        "avatar_hue": 260,
        "joined_days": 600,
        "last_active_days": 1,
        "signals": [
            {"key": "login_frequency", "label": "Login frequency", "value": 0.80, "display": "80% vs 30d"},
            {"key": "support_tickets", "label": "Support tickets", "value": 0.20, "display": "2 open"},
            {"key": "sentiment_score", "label": "Sentiment score", "value": 0.82, "display": "0.82"},
            {"key": "feature_adoption", "label": "Feature adoption", "value": 0.88, "display": "88%"},
            {"key": "billing_anomaly", "label": "Billing anomaly", "value": 0.0, "display": "clean"},
            {"key": "onboarding_progress", "label": "Onboarding progress", "value": 1.0, "display": "6/6 steps"}
        ]
    }
]


def seed_database():
    """Initializes tables and seeds initial customers if empty."""
    init_db()
    db = SessionLocal()
    try:
        count = db.query(CustomerModel).count()
        if count == 0:
            print("[Database] Seeding initial customer records...")
            for c in DEFAULT_CUSTOMERS:
                cust = CustomerModel(
                    id=c["id"],
                    name=c["name"],
                    company=c["company"],
                    email=c["email"],
                    tier=c["tier"],
                    plan_value=c["plan_value"],
                    avatar_hue=c["avatar_hue"],
                    joined_days=c["joined_days"],
                    last_active_days=c["last_active_days"],
                    signals_json=json.dumps(c["signals"]),
                    created_at=utc_now_iso()
                )
                db.add(cust)

            # Add sample outcomes
            sample_outcomes = [
                {
                    "id": str(uuid.uuid4()),
                    "customer_id": "c_002",
                    "customer_name": "Diego Alvarez",
                    "risk_score": 0.78,
                    "risk_band": "critical",
                    "top_attribution": "repeated_failures",
                    "selected_action": "human_handoff",
                    "knowledge_response": "Integration troubleshooting session recommended.",
                    "confidence": 0.92,
                    "outcome": "success",
                    "created_at": utc_now_iso(),
                    "resolved_at": utc_now_iso()
                },
                {
                    "id": str(uuid.uuid4()),
                    "customer_id": "c_006",
                    "customer_name": "Lucas Pereira",
                    "risk_score": 0.84,
                    "risk_band": "critical",
                    "top_attribution": "billing_anomaly",
                    "selected_action": "incentive",
                    "knowledge_response": "Extended credit and payment plan offered.",
                    "confidence": 0.88,
                    "outcome": "pending",
                    "created_at": utc_now_iso(),
                    "resolved_at": None
                }
            ]
            for o in sample_outcomes:
                out = OutcomeModel(**o)
                db.add(out)

            db.commit()
            print("[Database] Seeded 12 customer accounts and sample outcomes.")
        else:
            print(f"[Database] Found {count} existing customer records. Skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
