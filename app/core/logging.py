"""
app/core/logging.py
====================
Centralized structured logging for the Auxin backend.

Outputs JSON-formatted log records so they can be ingested by any
log aggregator (Datadog, Papertrail, CloudWatch, etc.).

Usage:
    from app.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("event", extra={"order_id": 42, "user_id": 7})
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class _JSONFormatter(logging.Formatter):
    """
    Emit a single-line JSON object per log record.

    Standard fields:
        ts        – ISO-8601 UTC timestamp
        level     – DEBUG / INFO / WARNING / ERROR / CRITICAL
        logger    – dotted module path
        message   – human-readable event description
        **extra   – any keyword args passed via extra={}
    """

    def format(self, record: logging.LogRecord) -> str:
        # Built-in fields
        payload: dict[str, Any] = {
            "ts":      datetime.now(tz=timezone.utc).isoformat(),
            "level":   record.levelname,
            "logger":  record.name,
            "message": record.getMessage(),
        }

        # Attach any extra= keys (except internal Python logging fields)
        _skip = {
            "msg", "args", "created", "relativeCreated", "thread",
            "threadName", "process", "processName", "pathname",
            "filename", "module", "funcName", "lineno", "levelno",
            "levelname", "name", "exc_info", "exc_text", "stack_info",
            "msecs",
        }
        for key, value in record.__dict__.items():
            if key not in _skip and not key.startswith("_"):
                payload[key] = value

        # Attach exception info if present
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


def _build_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JSONFormatter())
        logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Return a JSON-formatting logger for the given module name.
    Idempotent: calling multiple times for the same name returns the
    same logger instance.
    """
    from app.core.config import settings  # lazy import avoids circular
    level = logging.DEBUG if settings.DEBUG else logging.INFO
    return _build_logger(name, level)


# ---------------------------------------------------------------------------
# Domain-specific convenience loggers
# ---------------------------------------------------------------------------

auth_logger     = get_logger("auxin.auth")
payment_logger  = get_logger("auxin.payment")
order_logger    = get_logger("auxin.order")
delivery_logger = get_logger("auxin.delivery")
admin_logger    = get_logger("auxin.admin")
dispute_logger  = get_logger("auxin.dispute")
security_logger = get_logger("auxin.security")
