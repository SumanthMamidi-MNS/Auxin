"""
app/api/v1/router.py
=====================
Central v1 router.

  1. Aggregates all endpoint sub-routers.
  2. Registers global exception handlers that convert domain exceptions
     to a consistent JSON error envelope:
         { "success": false, "error": "<message>", "code": "<ERROR_CODE>" }
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.endpoints import admin, auth, delivery, disputes, farmers, orders, payments, products, profile
from app.core.exceptions import AuxinException
from app.core.logging import get_logger, security_logger

_logger = get_logger("auxin.router")

api_router = APIRouter()

# ---------------------------------------------------------------------------
# Sub-routers
# ---------------------------------------------------------------------------

api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(farmers.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(delivery.router)
api_router.include_router(payments.router)
api_router.include_router(disputes.router)
api_router.include_router(admin.router)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _error_response(
    status_code: int,
    code: str,
    message: str,
    request_id: str | None = None,
) -> JSONResponse:
    content = {
        "success": False,
        "error":   message,
        "code":    code,
    }
    if request_id:
        content["request_id"] = request_id
    return JSONResponse(status_code=status_code, content=content)


def _get_request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

def register_exception_handlers(app: FastAPI) -> None:
    """
    Attach global exception handlers to the FastAPI application.

    Priority (matched in order FastAPI checks):
      1. AuxinException   → domain errors (404, 409, 403, etc.)
      2. RequestValidationError → Pydantic 422s → standardised format
      3. StarletteHTTPException → FastAPI's own 404 / 405 / etc.
      4. Exception        → catch-all 500
    """

    @app.exception_handler(AuxinException)
    async def auxin_exception_handler(
        request: Request,
        exc: AuxinException,
    ) -> JSONResponse:
        code = type(exc).__name__.upper().replace("ERROR", "_ERROR")
        # Log auth / security failures at WARNING; everything else at INFO
        log_fn = (
            security_logger.warning
            if exc.status_code in (401, 403)
            else _logger.info
        )
        log_fn(
            "domain_exception",
            extra={
                "code":        code,
                "status":      exc.status_code,
                "path":        request.url.path,
                "request_id":  _get_request_id(request),
            },
        )
        return _error_response(
            status_code=exc.status_code,
            code=code,
            message=exc.detail,
            request_id=_get_request_id(request),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        # Collect all validation error messages into a single human-readable string
        errors = exc.errors()
        details = "; ".join(
            f"{' → '.join(str(loc) for loc in e['loc'])}: {e['msg']}"
            for e in errors
        )
        _logger.info(
            "validation_error",
            extra={
                "path":       request.url.path,
                "errors":     errors,
                "request_id": _get_request_id(request),
            },
        )
        return _error_response(
            status_code=422,
            code="VALIDATION_ERROR",
            message=details,
            request_id=_get_request_id(request),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        _logger.info(
            "http_exception",
            extra={
                "status":     exc.status_code,
                "path":       request.url.path,
                "request_id": _get_request_id(request),
            },
        )
        return _error_response(
            status_code=exc.status_code,
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            request_id=_get_request_id(request),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        from app.core.config import settings

        _logger.error(
            "unhandled_exception",
            extra={
                "type":       type(exc).__name__,
                "path":       request.url.path,
                "request_id": _get_request_id(request),
            },
            exc_info=exc,
        )
        detail = str(exc) if settings.DEBUG else "An unexpected internal error occurred."
        return _error_response(
            status_code=500,
            code="INTERNAL_SERVER_ERROR",
            message=detail,
            request_id=_get_request_id(request),
        )
