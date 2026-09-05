import sys
import os

# Add backend and workspace roots to path so all imports work reliably
backend_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(backend_dir)
sys.path.append(workspace_dir)
sys.path.append(backend_dir)
sys.path.append(os.path.join(backend_dir, "rag_service", "src"))
sys.path.append(os.path.join(backend_dir, "shap_service"))
sys.path.append(os.path.join(backend_dir, "rl_service"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from shap_service.app.main import app as shap_app
from rl_service.api import router as rl_router
from rag_service.src.knowledge_assistant.api.main import app as rag_app
from backend.db.customer_routes import router as customer_router
from backend.cloud.routes import router as cloud_router
from backend.db.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed the relational database on application startup
    print("[PulseIQ Backend] Initializing relational database and AWS cloud connectors...")
    try:
        seed_database()
    except Exception as e:
        print(f"[PulseIQ Backend] Warning during DB seed: {e}")
    yield


app = FastAPI(
    title="PulseIQ Unified Cloud API",
    description="Full-stack AI customer intelligence platform powered by AWS Cloud, PyTorch SHAP, RAG, and RL policy engine.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Customer Database CRUD endpoints under /api
app.include_router(customer_router, prefix="/api")

# 2. AWS Cloud Management & S3 endpoints under /cloud
app.include_router(cloud_router)

# 3. Mount RAG Knowledge Assistant endpoints under /rag
app.mount("/rag", rag_app)

# 4. Mount SHAP Risk & Attribution Engine endpoints under /shap
app.mount("/shap", shap_app)

# 5. Include RL Action Policy router under /policy
app.include_router(rl_router, prefix="/policy")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "Unified PulseIQ Cloud backend is running",
        "cloud_provider": "AWS",
        "database": "Operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
