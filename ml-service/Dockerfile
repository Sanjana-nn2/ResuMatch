# ResuMatch ML Microservice Dockerfile
# Python 3.10 slim image for minimal memory footprint and fast boot times
FROM python:3.10-slim

# Prevent Python from writing .pyc files, disable buffering, limit PyTorch threads
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    TORCH_THREADS=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

WORKDIR /app

# Install minimal system dependencies (curl for healthcheck, remove build tools to save image size)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first from the official PyTorch CPU wheel index.
# This prevents pip from pulling huge NVIDIA CUDA / cuDNN binaries (~2.5GB+ disk and heavy RAM).
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy lightweight English model
RUN python -m spacy download en_core_web_sm

# Pre-download and bake all-MiniLM-L6-v2 model weights into the container image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cpu')"

# Copy application code
COPY . .

EXPOSE 8000

# Health check to ensure service readiness
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start FastAPI server via Uvicorn ASGI with 1 single worker, bound to 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --no-access-log --timeout-keep-alive 30"]
