"""
alembic/env.py
===============
Alembic environment for async SQLAlchemy.

Key behaviours:
  - DATABASE_URL is always read from the application's Settings,
    never from alembic.ini (so the ini file acts as a template only).
  - Autogenerate compares against all imported models via Base.metadata.
  - Both online (direct DB connection) and offline (SQL dump) modes are
    supported.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

# ---------------------------------------------------------------------------
# Import project settings and metadata
# ---------------------------------------------------------------------------
from app.core.config import settings
from app.db.base_all import Base  # noqa: F401 – registers all models for autogenerate

# ---------------------------------------------------------------------------
# Alembic Config object
# ---------------------------------------------------------------------------
config = context.config

# Override sqlalchemy.url with the real DATABASE_URL from settings.
# CRITICAL: Alembic's offline mode uses a synchronous SQLAlchemy engine.
# asyncpg is an async driver and cannot be used with sync engines.
# We strip the +asyncpg suffix for the config URL (used by offline mode).
# Online mode uses async_engine_from_config which re-adds async handling.
_sync_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql://"
).replace(
    "postgres+asyncpg://", "postgresql://"
).replace(
    "sqlite+aiosqlite://", "sqlite://"
)
config.set_main_option("sqlalchemy.url", _sync_url)

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Offline mode (generates SQL without a live DB connection)
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode (connects to the DB and runs migrations)
# ---------------------------------------------------------------------------

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # Use settings.DATABASE_URL directly (asyncpg URL) rather than reading
    # sqlalchemy.url from the ini section, which holds the *sync* URL that
    # was set for offline mode and would try to load psycopg2 (not installed).
    #
    # Also strip asyncpg-incompatible query params (sslmode, channel_binding)
    # and translate them into connect_args via build_asyncpg_url.
    from app.db.engine_utils import build_asyncpg_url
    _db_url, _connect_args = build_asyncpg_url(settings.DATABASE_URL)
    connectable: AsyncEngine = create_async_engine(
        _db_url,
        connect_args=_connect_args,
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
