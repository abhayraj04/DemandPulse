# ==========================================
# Multi-Stage Dockerfile for DemandPulse
# ==========================================

# Stage 1: Build Frontend Assets
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Service
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies if required for C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application, data, models, and docs
COPY backend/ ./backend/
COPY data/ ./data/
COPY models/ ./models/
COPY reports/ ./reports/
COPY config.py ./config.py

# Copy compiled frontend production assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Default environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV ENVIRONMENT=production
ENV DEBUG=false
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start Uvicorn serving both API and Single-Page Application
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
