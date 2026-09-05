import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey
from backend.db.database import Base


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    company = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    tier = Column(String(32), default="Starter")
    plan_value = Column(Float, default=990.0)
    avatar_hue = Column(Integer, default=180)
    joined_days = Column(Integer, default=30)
    last_active_days = Column(Integer, default=1)
    signals_json = Column(Text, nullable=False, default="[]")
    created_at = Column(String(64), default=utc_now_iso)


class RiskScoreModel(Base):
    __tablename__ = "risk_scores"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    risk_band = Column(String(32), nullable=False)
    attributions_json = Column(Text, nullable=False, default="[]")
    model_version = Column(String(64), default="v1.0")
    created_at = Column(String(64), default=utc_now_iso)


class OutcomeModel(Base):
    __tablename__ = "outcomes"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(64), nullable=False, index=True)
    customer_name = Column(String(128), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_band = Column(String(32), nullable=False)
    top_attribution = Column(String(64), nullable=False)
    selected_action = Column(String(64), nullable=False, index=True)
    knowledge_response = Column(Text, default="")
    confidence = Column(Float, default=0.0)
    outcome = Column(String(32), default="pending", index=True)
    created_at = Column(String(64), default=utc_now_iso)
    resolved_at = Column(String(64), nullable=True)


class FeedbackModel(Base):
    __tablename__ = "feedback"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(String(64), default=utc_now_iso)
