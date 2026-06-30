"""
app/core/middleware.py
=======================
Production-grade HTTP middleware stack for Auxin.

Middleware applied (in order — outermost first):
  1. RequestLoggingMiddleware  – Structured JSON log per request/response
  2. SecurityHeadersMiddleware – Injects strict HTTP security headers
  3. SuspendedUserMiddleware   – Short-circuits requests from suspended users
                                  (belt-and-suspenders beyond the DB check)

Rate limiting is handled at the reverse proxy in production (nginx / Render /
Railway ingress). Supabase Auth handles authentication-related rate limits.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging import get_logger

_req_logger = get_logger("auxin.http")


# ---------------------------------------------------------------------------
# 1. Request / Response structured logger
# ---------------------------------------------------------------------------

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log every HTTP request + response as a single structured JSON entry.

    Fields logged:
      request_id – UUID v4 for correlation
      method     – HTTP verb
      path       – URL path (no query params for privacy)
      status     – response status code
      duration_ms– wall-clock time for the request
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        # Attach to request state so downstream code can reference it
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        # Skip health-check noise at INFO; log at DEBUG instead
        log_fn = (
            _req_logger.debug
            if request.url.path in ("/health", "/metrics")
            else _req_logger.info
        )

        log_fn(
            "http_request",
            extra={
                "request_id": request_id,
                "method":     request.method,
                "path":       request.url.path,
                "status":     response.status_code,
                "duration_ms": duration_ms,
                "client_ip":  _get_client_ip(request),
            },
        )

        # Echo request_id back in headers for client-side correlation
        response.headers["X-Request-ID"] = request_id
        return response


def _get_client_ip(request: Request) -> str:
    """Extract real IP, respecting standard reverse-proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# 2. Security headers
# ---------------------------------------------------------------------------

# Content-Security-Policy tuned for Swagger UI / ReDoc in development.
#
# Swagger UI (FastAPI's built-in /docs) loads assets from:
#   - https://cdn.jsdelivr.net  (swagger-ui-dist CSS + JS bundles)
#   - https://fastapi.tiangolo.com  (favicon.png)
#   - inline <script> and <style> blocks injected by the HTML template
#
# These requirements are fundamentally incompatible with default-src 'none',
# so in DEBUG mode we relax the policy just enough to permit them while still
# blocking every other untrusted origin.  Production keeps the strict policy.

_CSP_DEVELOPMENT = (
    "default-src 'self'; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: https://fastapi.tiangolo.com; "
    "connect-src 'self'; "
    "font-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "object-src 'none'"
)

_CSP_PRODUCTION = (
    "default-src 'none'; "
    "frame-ancestors 'none'"
)

_SECURITY_HEADERS_BASE = {
    "X-Content-Type-Options":    "nosniff",
    "X-Frame-Options":           "DENY",
    "X-XSS-Protection":          "1; mode=block",
    "Referrer-Policy":           "strict-origin-when-cross-origin",
    "Permissions-Policy":        "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Inject HTTP security headers on every response.

    Headers set:
      X-Content-Type-Options    – Prevent MIME sniffing
      X-Frame-Options           – Deny framing (clickjacking)
      X-XSS-Protection          – Legacy XSS filter (belt + suspenders)
      Referrer-Policy           – Limit referrer leakage
      Permissions-Policy        – Restrict browser features
      Strict-Transport-Security – HSTS (only useful behind HTTPS)
      Content-Security-Policy   – Restrict resource origins

    CSP policy selection:
      DEBUG=true  → permissive policy that allows Swagger UI / ReDoc assets
      DEBUG=false → strict ``default-src 'none'`` production policy
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        # Import here (not at module top-level) to avoid circular import with
        # config → middleware at startup.
        from app.core.config import settings  # noqa: PLC0415

        csp = _CSP_DEVELOPMENT if settings.DEBUG else _CSP_PRODUCTION
        self._headers: dict[str, str] = {
            **_SECURITY_HEADERS_BASE,
            "Content-Security-Policy": csp,
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        for header, value in self._headers.items():
            response.headers[header] = value
        return response
