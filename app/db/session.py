"""
app/db/session.py
==================
Async SQLAlchemy engine and session factory.

Why async?  FastAPI is fully async; using asyncpg + async SQLAlchemy
avoids blocking the event loop during DB queries.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.db.engine_utils import build_asyncpg_url

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

# Determine which database URL to use.
# DEMO_MODE=true switches to the sandbox database so investor demos
# never touch production data. Logs a clear warning at startup.
import logging as _logging

if settings.DEMO_MODE and settings.DEMO_DATABASE_URL:
    _active_db_url = settings.DEMO_DATABASE_URL
    _logging.getLogger("auxin.db").warning(
        "DEMO MODE ACTIVE — connected to sandbox database. "
        "Production data is NOT affected."
    )
else:
    _active_db_url = settings.DATABASE_URL

# Strip asyncpg-incompatible query params (sslmode, channel_binding) from the
# URL and translate them into connect_args. See app/db/engine_utils.py.
_db_url, _connect_args = build_asyncpg_url(_active_db_url)

# Set a short TCP connect timeout so startup DB check fails fast rather than
# blocking the event loop for the OS-level TCP timeout (~90s).
# asyncpg accepts 'timeout' (seconds) as a connect argument.
_connect_args.setdefault("timeout", 8.0)

engine_kwargs = {
    "connect_args": _connect_args,
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}
if not _active_db_url.startswith("sqlite"):
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 3600

engine = create_async_engine(_db_url, **engine_kwargs)


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,     # Keep attributes accessible after commit
    autoflush=False,
    autocommit=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an AsyncSession and guarantee cleanup.

    Usage (FastAPI endpoint):
        async def endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
