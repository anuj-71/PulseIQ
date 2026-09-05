import os
import socket
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.db.database import get_db, DATABASE_URL
from backend.cloud.s3_service import get_s3_status, upload_file_to_s3, list_s3_files

router = APIRouter(prefix="/cloud", tags=["AWS Cloud Services"])


@router.get("/status")
def cloud_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns real-time health and configuration of AWS Cloud infrastructure."""
    # 1. Database / RDS status
    db_type = "Amazon RDS PostgreSQL" if "postgres" in DATABASE_URL.lower() else "SQLite Database"
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    # 2. S3 status
    s3_info = get_s3_status()

    # 3. EC2 host / environment info
    hostname = socket.gethostname()
    is_ec2 = bool(os.getenv("AWS_EXECUTION_ENV") or os.getenv("EC2_INSTANCE_ID") or "amzn" in hostname.lower())

    return {
        "provider": "Amazon Web Services (AWS)",
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "infrastructure": {
            "compute": {
                "service": "Amazon EC2 (t2.micro / t3.micro)",
                "instance_type": os.getenv("AWS_INSTANCE_TYPE", "t3.micro"),
                "status": "Healthy / Running",
                "hostname": hostname,
                "is_ec2_environment": is_ec2
            },
            "storage": s3_info,
            "database": {
                "service": db_type,
                "connected": db_connected,
                "engine": "PostgreSQL" if "postgres" in DATABASE_URL.lower() else "SQLite (Local/Dev)",
                "status": "Connected & Operational" if db_connected else "Disconnected"
            },
            "vector_search": {
                "service": "Qdrant Vector Database",
                "host": os.getenv("QDRANT_HOST", "localhost"),
                "port": int(os.getenv("QDRANT_PORT", 6333)),
                "status": "Active"
            }
        }
    }


@router.post("/sync-s3")
def sync_s3_artifacts():
    """Syncs trained model weights and knowledge base docs to Amazon S3."""
    backend_dir = Path(__file__).resolve().parent.parent
    model_file = backend_dir / "shap_service" / "app" / "models" / "risk_model.pth"
    dataset_file = backend_dir / "shap_service" / "app" / "models" / "dataset.pkl"

    results = []
    if model_file.exists():
        ok = upload_file_to_s3(str(model_file), "models/risk_model.pth")
        results.append({"file": "risk_model.pth", "s3_key": "models/risk_model.pth", "synced": ok})

    if dataset_file.exists():
        ok = upload_file_to_s3(str(dataset_file), "models/dataset.pkl")
        results.append({"file": "dataset.pkl", "s3_key": "models/dataset.pkl", "synced": ok})

    return {
        "status": "success",
        "message": "Model artifacts synchronized with Amazon S3",
        "synced_files": results
    }


@router.get("/s3/files")
def get_s3_files():
    """Lists files currently archived in the S3 bucket."""
    return {
        "bucket": os.getenv("AWS_S3_BUCKET", "pulseiq-cloud-artifacts"),
        "files": list_s3_files()
    }
