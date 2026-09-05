import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import CustomerModel, utc_now_iso

router = APIRouter(prefix="/customers", tags=["Customers Database"])


class SignalSchema(BaseModel):
    key: str
    label: str
    value: float
    display: str


class CustomerSchema(BaseModel):
    id: str
    name: str
    company: str
    email: str
    tier: str
    plan_value: float
    avatar_hue: int
    joined_days: int
    last_active_days: int
    signals: List[SignalSchema]
    created_at: Optional[str] = None


class CreateCustomerRequest(BaseModel):
    id: Optional[str] = None
    name: str
    company: str
    email: str
    tier: str = "Starter"
    plan_value: float = 990.0
    avatar_hue: Optional[int] = 180
    joined_days: Optional[int] = 1
    last_active_days: Optional[int] = 0
    signals: Optional[List[SignalSchema]] = []


def model_to_schema(c: CustomerModel) -> dict:
    try:
        signals = json.loads(c.signals_json)
    except Exception:
        signals = []
    return {
        "id": c.id,
        "name": c.name,
        "company": c.company,
        "email": c.email,
        "tier": c.tier,
        "plan_value": c.plan_value,
        "avatarHue": c.avatar_hue,
        "avatar_hue": c.avatar_hue,
        "joinedDays": c.joined_days,
        "joined_days": c.joined_days,
        "lastActiveDays": c.last_active_days,
        "last_active_days": c.last_active_days,
        "signals": signals,
        "created_at": c.created_at
    }


@router.get("", response_model=List[dict])
def list_customers(db: Session = Depends(get_db)):
    """Fetches all customer accounts stored in the database."""
    customers = db.query(CustomerModel).all()
    return [model_to_schema(c) for c in customers]


@router.get("/{customer_id}", response_model=dict)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    """Fetches a specific customer account by ID."""
    cust = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return model_to_schema(cust)


@router.post("", response_model=dict)
def create_customer(req: CreateCustomerRequest, db: Session = Depends(get_db)):
    """Creates a new customer record in the database."""
    cid = req.id if req.id else f"c_{uuid.uuid4().hex[:6]}"
    existing = db.query(CustomerModel).filter(CustomerModel.id == cid).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer ID already exists")

    signals_data = [s.model_dump() for s in req.signals] if req.signals else []
    cust = CustomerModel(
        id=cid,
        name=req.name,
        company=req.company,
        email=req.email,
        tier=req.tier,
        plan_value=req.plan_value,
        avatar_hue=req.avatar_hue or 180,
        joined_days=req.joined_days or 1,
        last_active_days=req.last_active_days or 0,
        signals_json=json.dumps(signals_data),
        created_at=utc_now_iso()
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return model_to_schema(cust)
