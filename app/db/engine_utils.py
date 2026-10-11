"""
app/db/engine_utils.py
=======================
Shared helper for building async SQLAlchemy engines that connect to
PostgreSQL via asyncpg.

The problem this solves
-----------------------
Some cloud PostgreSQL providers (Supabase, Neon, etc.) issue connection
strings that include psycopg2-style URL query parameters:

    postgresql+asyncpg://user:pass@host/db?sslmode=require&channel_binding=require

asyncpg does NOT accept ``sslmode`` or ``channel_binding`` as query
parameters.  Passing them directly causes:

    TypeError: connect() got an unexpected keyword argument 'sslmode'

The correct asyncpg SSL configuration is via ``connect_args={"ssl": "require"}``.
This module strips the incompatible query params from the URL and returns
the correct ``create_async_engine`` kwargs for both the FastAPI session pool
and the Alembic migration engine.

SSL defaults:
  - Cloud hosts (non-localhost): ssl=require (covers Supabase, Render, Railway)
  - Local hosts (localhost/127.0.0.1): no SSL
  - Explicitly disabled via sslmode=disable: no SSL
"""

from __future__ import annotations

from urllib.parse import urlencode, urlparse, parse_qs

# asyncpg uses its own SSL configuration mechanism; these psycopg2-style URL
# query parameters must be stripped before the URL is passed to asyncpg.
_ASYNCPG_INCOMPATIBLE_PARAMS = frozenset({"sslmode", "channel_binding"})

# Maps the psycopg2 sslmode value to the asyncpg ssl argument.
_SSLMODE_TO_ASYNCPG: dict[str, str] = {
    "require":     "require",
    "verify-ca":   "require",
    "verify-full": "require",
    "prefer":      "prefer",
    "allow":       "prefer",
    "disable":     "disable",
}


def build_asyncpg_url(database_url: str) -> tuple[str, dict]:
    """
    Parse ``database_url``, strip asyncpg-incompatible query parameters,
    and return a ``(clean_url, connect_args)`` tuple suitable for passing
    to ``create_async_engine``.

    Usage::

        url, connect_args = build_asyncpg_url(settings.DATABASE_URL)
        engine = create_async_engine(url, connect_args=connect_args, ...)

    Args:
        database_url: The raw DATABASE_URL string from settings / env.

    Returns:
        A tuple of (clean_url_string, connect_args_dict).
    """
    if database_url.startswith("sqlite"):
        return database_url, {}

    parsed = urlparse(database_url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    # Determine SSL mode from the stripped params
    sslmode_values = params.pop("sslmode", None)
    params.pop("channel_binding", None)  # asyncpg doesn't understand this

    # Build connect_args
    connect_args: dict = {}
    if sslmode_values:
        sslmode = sslmode_values[0].lower()
        asyncpg_ssl = _SSLMODE_TO_ASYNCPG.get(sslmode)
        if asyncpg_ssl and asyncpg_ssl != "disable":
            connect_args["ssl"] = asyncpg_ssl
    else:
        # Default to require SSL for cloud hosts (not localhost)
        if parsed.hostname and parsed.hostname not in ("localhost", "127.0.0.1", "::1"):
            connect_args["ssl"] = "require"

    # Rebuild clean query string
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = parsed._replace(query=clean_query).geturl()

    return clean_url, connect_args
