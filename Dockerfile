# Production Dockerfile for RAILOPT AI (FastAPI + Google OR-Tools CP-SAT)
FROM python:3.11-slim

# Install system dependencies (libgomp1 is required by Google OR-Tools for OpenMP multi-threading)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions first to leverage Docker layer caching
COPY pyproject.toml README.md ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy application source code
COPY rail_opti/ ./rail_opti/

# Set default environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# Run FastAPI via Uvicorn on dynamic port
CMD ["sh", "-c", "uvicorn rail_opti.api.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
