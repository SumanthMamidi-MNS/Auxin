"""
Auxin – Application Entry Point
================================
Production-hardened FastAPI application.

Changes from the development version:
  • Strict CORS: origins read from ALLOWED_ORIGINS env var
  • SecurityHeadersMiddleware injected (CSP, HSTS, XFO, etc.)
  • RequestLoggingMiddleware for structured JSON per-request logs
  • /health endpoint checks DB connectivity, not just uptime
  • Docs (Swagger + ReDoc) hidden in non-DEBUG mode
  • All models registered in base.py import chain for Alembic
"""

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router, register_exception_handlers
from app.core.config import settings
from app.core.logging import get_logger
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.db.session import AsyncSessionLocal, engine
from app.db.base_all import Base  # noqa: F401 – registers all models → metadata complete

_logger = get_logger("auxin.main")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """
    Startup: verify DB connectivity (non-fatal) and create tables if absent.
    Shutdown: dispose connection pool cleanly.

    DB connectivity is checked non-fatally: if the DB is unreachable at startup
    the server still starts and serves requests. The /health endpoint will report
    db=unreachable. This avoids a boot loop when the DB is temporarily unavailable.
    """
    _logger.info("startup", extra={"env": settings.APP_ENV})
    try:
        async with engine.begin() as conn:
            if settings.APP_ENV.lower() == "production":
                # Production schema is owned by Alembic (alembic upgrade head).
                await conn.execute(text("SELECT 1"))
            else:
                # Dev/test convenience: auto-create tables.
                await conn.run_sync(Base.metadata.create_all)
        _logger.info("db_connected")
    except Exception as exc:
        # Non-fatal: log and continue. /health will surface db=unreachable.
        # The engine's connect_timeout (8s) ensures this fails fast.
        _logger.warning(
            "db_startup_unavailable",
            extra={
                "error": str(exc)[:200],
                "advice": (
                    "DB unreachable at startup — server starts in degraded mode. "
                    "Run migrations once DB is reachable: alembic upgrade head"
                ),
            },
        )

    yield

    await engine.dispose()
    _logger.info("shutdown")



# ---------------------------------------------------------------------------
# CORS origins
# ---------------------------------------------------------------------------

def _get_cors_origins() -> list[str]:
    """
    Read allowed origins from ALLOWED_ORIGINS env var (comma-separated).
    Falls back to ["*"] only in DEBUG mode to prevent accidental open CORS
    in production.
    """
    raw = settings.ALLOWED_ORIGINS
    if raw.strip() == "*":
        if settings.APP_ENV.lower() == "production":
            # Never combine a wildcard with credentials in production.
            _logger.warning(
                "cors_wildcard_rejected",
                extra={"advice": "Set ALLOWED_ORIGINS to specific domains; no origins are allowed until you do."},
            )
            return []
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Auxin API",
    description=(
        "Farmer-to-customer marketplace — production build. "
        "Auth, Orders, Payments, Delivery, Admin, Disputes."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Hide interactive docs in production; expose only in DEBUG mode.
    docs_url="/docs"  if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# ---------------------------------------------------------------------------
# Middleware (applied outermost → innermost)
# ---------------------------------------------------------------------------

# 1. Security headers — applied to every response
app.add_middleware(SecurityHeadersMiddleware)

# 2. Request/response structured logger
app.add_middleware(RequestLoggingMiddleware)

# 3. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")
register_exception_handlers(app)


# ---------------------------------------------------------------------------
# Health check (production-grade: includes DB probe)
# ---------------------------------------------------------------------------

import time as _time
_START_TIME = _time.monotonic()  # module-level: set when server starts


@app.get(
    "/health",
    tags=["Health"],
    summary="Liveness + readiness check",
    description=(
        "Returns 200 when the API process is alive and the database is reachable. "
        "Returns 503 when the database is unreachable. "
        "Includes uptime, environment, and demo mode status."
    ),
)
async def health_check():
    """
    Lightweight DB connectivity check.
    Suitable for use as a Render/Railway/ECS health-check target.
    """
    db_ok = False
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        _logger.error("health_db_check_failed", extra={"error": str(exc)})

    uptime_s = round(_time.monotonic() - _START_TIME, 1)

    payload = {
        "status":    "ok"          if db_ok else "degraded",
        "version":   "2.0.0",
        "env":       settings.APP_ENV,
        "demo_mode": settings.DEMO_MODE,
        "db":        "connected"   if db_ok else "unreachable",
        "uptime_s":  uptime_s,
    }

    if not db_ok:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content=payload)

    return payload



# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
