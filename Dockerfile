# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Auxin FastAPI Backend
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build for a lean production image.
# Build: docker build -t auxin-api .
# Run:   docker run -p 8000:8000 --env-file .env auxin-api
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

RUN pip install --upgrade pip

WORKDIR /app

# Copy only requirements first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: final runtime image ──────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Non-root user for security
RUN useradd --create-home --shell /bin/bash auxin
USER auxin

WORKDIR /home/auxin/app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY --chown=auxin:auxin . .

EXPOSE 8000

# Environment defaults (all overridden by platform env vars)
ENV APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=8000 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Run migrations then start the server
CMD alembic upgrade head && \
    gunicorn main:app \
      --worker-class uvicorn.workers.UvicornWorker \
      --workers 2 \
      --bind 0.0.0.0:${APP_PORT:-8000} \
      --timeout 120 \
      --keep-alive 5 \
      --access-logfile - \
      --error-logfile -
