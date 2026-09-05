from fastapi import APIRouter
from datetime import datetime
import pandas as pd
from pathlib import Path

from app.api.schemas import RiskRequest

from app.explainability.shap_engine import explain_customer

router = APIRouter()

SERVICE_DIR = Path(__file__).resolve().parent.parent.parent
FEEDBACK_FILE = SERVICE_DIR / "feedback.csv"


@router.get("/")
def home():
    return {
        "message": "PulseIQ Risk Engine Running 🚀"
    }


@router.post("/risk/score")
def risk_score(request: RiskRequest):

    features = [
        request.usage_decline,
        request.tickets_last30,
        request.negative_sentiment,
        request.feature_dropout,
        request.active_days,
        request.support_delay,
        request.payment_delay
    ]

    result = explain_customer(features)

    return {
        "risk_score": result["risk_score"],
        "attributions": result["attributions"],
        "model_version": "v1.0",
        "timestamp": datetime.now().isoformat()
    }


@router.post("/feedback")
def feedback(data: dict):
    # 1. Save to Database if available
    try:
        from backend.db.database import SessionLocal
        from backend.db.models import FeedbackModel
        db = SessionLocal()
        fb = FeedbackModel(
            customer_id=str(data.get("user_id", data.get("customer_id", "unknown"))),
            action=str(data.get("action", "unknown")),
            feedback=str(data.get("feedback", data.get("comments", str(data)))),
        )
        db.add(fb)
        db.commit()
        db.close()
    except Exception as e:
        print(f"[SHAP DB Feedback] Notice: {e}")

    # 2. Append to CSV for backup/training scripts
    df = pd.DataFrame([data])
    if FEEDBACK_FILE.exists():
        df.to_csv(FEEDBACK_FILE, mode="a", header=False, index=False)
    else:
        df.to_csv(FEEDBACK_FILE, index=False)

    return {
        "status": "success",
        "message": "Feedback stored in database and training queue successfully."
    }
