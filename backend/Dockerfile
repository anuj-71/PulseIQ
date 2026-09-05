FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for PyTorch, psycopg2, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . /app/backend

# Set environment variables
ENV PYTHONPATH=/app:/app/backend:/app/backend/rag_service/src:/app/backend/shap_service:/app/backend/rl_service
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

# Run FastAPI backend via Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
