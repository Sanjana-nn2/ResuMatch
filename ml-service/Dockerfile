# ResuMatch ML Microservice Dockerfile
# Python 3.10 slim image for minimal memory footprint and fast boot times
FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered output logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Download spaCy lightweight English language pipeline
RUN python -m spacy download en_core_web_sm

# Pre-download and cache the sentence-transformers model at build time.
# CRITICAL: This ensures containers deployed to free-tier platforms (Render, Railway)
# boot instantly without timing out on cold-start model downloads.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application code
COPY . .

EXPOSE 8000

# Health check to ensure service readiness
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI server via Uvicorn ASGI (respecting dynamic cloud provider PORT e.g. Render/Cloud Run/Railway)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
