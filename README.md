# PulseIQ: Cloud-Native Platform

PulseIQ is an intelligent, full-stack cloud platform for customer retention and proactive intervention. It integrates predictive neural network modeling, SHAP explainable AI, retrieval-augmented knowledge assistance, contextual reinforcement learning, and a relational database backend. The system is designed for deployment on Amazon Web Services (AWS) using Free Tier eligible services (EC2, S3, RDS PostgreSQL, CloudFormation).

---

## AWS Cloud Architecture

```
+---------------------------------------------------------------------------------+
|                                 AWS Cloud (Free Tier)                           |
|                                                                                 |
|  +--------------------------------+       +----------------------------------+  |
|  |       Amazon S3 Storage        |       |        Amazon RDS PostgreSQL     |  |
|  |  - Model Artifacts Bucket      |       |  (db.t3.micro / db.t4g.micro)    |  |
|  |  - Knowledge Base Docs Bucket  |       |  - customers table               |  |
|  |  - Generated Reports & Plots   |       |  - risk_scores table             |  |
|  +----------------+---------------+       |  - outcomes table                |  |
|                   ^                       |  - feedback table                |  |
|                   | boto3                 +-----------------+----------------+  |
|                   |                                         ^                   |
|  +----------------v-----------------------------------------+----------------+  |
|  |                   Amazon EC2 Instance (t2.micro / t3.micro)               |  |
|  |                                                                           |  |
|  |   +-----------------------+               +--------------------------+    |  |
|  |   |   FastAPI Backend     |<------------->|    Qdrant Vector DB      |    |  |
|  |   | (SHAP + RAG + RL + DB)|               |  (Docker Container:6333) |    |  |
|  |   +-----------+-----------+               +--------------------------+    |  |
|  |               ^                                                           |  |
|  |               | Nginx Reverse Proxy (Port 80/443)                         |  |
|  |               v                                                           |  |
|  |   +-----------------------+                                               |  |
|  |   |  React SPA Frontend   |                                               |  |
|  |   |    (Production Dist)  |                                               |  |
|  |   +-----------------------+                                               |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```

---

## Core System Capabilities

1. **Relational Database Layer (`backend/db`)**
   - Built on **SQLAlchemy ORM** supporting **Amazon RDS PostgreSQL** (and local SQLite fallback).
   - Tables: `customers`, `risk_scores`, `outcomes`, and `feedback`.
   - Automated startup migration and seeding (`seed.py`).

2. **Amazon S3 Cloud Integration (`backend/cloud`)**
   - Utilizes `boto3` SDK to sync model weights (`risk_model.pth`, `dataset.pkl`), ingest raw document corpora, and archive generated audit plots.

3. **Risk & Behavior Engine (`backend/shap_service`)**
   - PyTorch neural network evaluating customer behavior signals with SHAP feature attribution vectors.

4. **Grounded Knowledge Assistant (`backend/rag_service`)**
   - Qdrant vector database retrieval + Groq / LLaMA-3 with hallucination prevention and citation validation.

5. **Contextual Action Policy (`backend/rl_service`)**
   - Multi-armed bandit / Softmax policy mapping dominant root causes to interventions, with outcome tracking and feedback loop retraining.

6. **Interactive Dashboard (`frontend/`)**
   - React 18, TypeScript, Tailwind CSS, Lucide icons, Three.js 3D visualizers, and real-time AWS Cloud Health monitoring.

---

## Repository Structure

```
PulseIQ/
├── backend/                  # Unified Python backend services
│   ├── main.py               # Unified FastAPI server mounting all services
│   ├── requirements.txt      # Backend Python dependencies (SQLAlchemy, Boto3, PyTorch)
│   ├── Dockerfile            # Container build for FastAPI backend
│   ├── pytest.ini            # Pytest configuration
│   ├── db/                   # Database layer (SQLAlchemy models, seed, customer API)
│   │   ├── database.py       # Engine & session management (RDS Postgres / SQLite)
│   │   ├── models.py         # CustomerModel, RiskScoreModel, OutcomeModel, FeedbackModel
│   │   ├── seed.py           # Auto-seed database script
│   │   └── customer_routes.py# REST CRUD endpoints (/api/customers)
│   ├── cloud/                # AWS cloud integration layer
│   │   ├── s3_service.py     # Boto3 S3 upload/download and sync
│   │   └── routes.py         # Cloud status and S3 file endpoints (/cloud)
│   ├── rag_service/          # RAG Knowledge Assistant subsystem
│   ├── rl_service/           # Contextual Bandit & Action Policy subsystem
│   └── shap_service/         # Risk Prediction & SHAP Explainability subsystem
├── frontend/                 # React 18 + TypeScript + Vite frontend
│   ├── Dockerfile            # Multi-stage production Nginx container
│   ├── nginx.conf            # Nginx reverse proxy configuration
│   ├── package.json
│   ├── vite.config.ts
│   └── src/                  # Application components, views, hooks, and lib
├── cloud/                    # AWS Infrastructure-as-Code and deployment
│   ├── cloudformation.yml    # AWS CloudFormation template (EC2, S3, RDS, IAM)
│   └── ec2-user-data.sh      # Automated cloud-init bootstrap script
├── docs/                     # Pitch decks and project documentation
├── docker-compose.yml        # Full-stack container orchestration
├── .env.example              # Environment variables template
└── .gitignore                # Git ignore configuration
```

---

## Deployment & Running Instructions

### Option 1: 1-Click Docker Compose (Local or EC2)

Run the full stack with PostgreSQL, Qdrant, FastAPI backend, and Nginx frontend:

```bash
docker compose up --build -d
```

- Frontend: `http://localhost` (or `http://localhost:3000`)
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Qdrant: `localhost:6333`

---

### Option 2: Deploy to AWS EC2 using CloudFormation

1. Open the **AWS CloudFormation Console**.
2. Select **Create Stack** > **With new resources (standard)**.
3. Upload `cloud/cloudformation.yml`.
4. Specify your parameters:
   - `InstanceType`: `t3.micro` or `t2.micro` (Free Tier)
   - `S3BucketName`: `pulseiq-cloud-artifacts` (or a unique bucket name)
5. Review and click **Submit**.
6. Once provisioned, check the **Outputs** tab for your public frontend URL and backend documentation URL.

---

### Option 3: Local Development (Without Docker)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Environment Variables Configuration

Create a `.env` file at the root:

```ini
# Database (AWS RDS PostgreSQL or SQLite)
DATABASE_URL=sqlite:///./pulseiq.db
# For AWS RDS: DATABASE_URL=postgresql://user:password@mydb.xxxxxx.us-east-1.rds.amazonaws.com:5432/pulseiq_db

# LLM & RAG Configuration
GROQ_API_KEY=your_groq_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=pulseiq_knowledge

# AWS Cloud Credentials (Optional for local simulation)
AWS_REGION=us-east-1
AWS_S3_BUCKET=pulseiq-cloud-artifacts
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

---

## API Endpoints Reference

| Endpoint | Method | Subsystem | Description |
|---|---|---|---|
| `/health` | GET | System | Health check and cloud provider status |
| `/api/customers` | GET | Database | Retrieve all customers from relational DB |
| `/api/customers/{id}` | GET | Database | Get specific customer profile |
| `/api/customers` | POST | Database | Create a new customer profile |
| `/cloud/status` | GET | AWS Cloud | AWS infrastructure status (EC2, S3, RDS) |
| `/cloud/sync-s3` | POST | AWS Cloud | Sync model weights and docs with S3 |
| `/shap/risk/score` | POST | SHAP Engine | Compute churn risk and SHAP attributions |
| `/shap/feedback` | POST | SHAP Engine | Persist feedback to database |
| `/rag/knowledge/respond` | POST | RAG Assistant | Contextual document retrieval & grounded LLM |
| `/policy/decide` | POST | RL Policy | Softmax action policy recommendation |
| `/policy/outcome` | POST | RL Policy | Log intervention outcome to database |
| `/policy/aggregate` | GET | RL Policy | Root-cause aggregation and success rates |

---

## Testing & Verification

```bash
# Run backend tests
python -m pytest backend/rl_service/test_action_policy.py
python -m pytest backend/shap_service/tests/test_shap.py

# Test database seeding
python -m backend.db.seed

# Verify frontend build
cd frontend
npm run typecheck
npm run build
```

---

## License

MIT License. Open source for cloud deployment and portfolio evaluation.
