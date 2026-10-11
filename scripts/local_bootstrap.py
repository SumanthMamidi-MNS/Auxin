#!/usr/bin/env python3
"""
scripts/local_bootstrap.py
===========================
Idempotent first-run setup for LOCAL (SQLite) development.

  1. Creates every table from the SQLAlchemy models (no-op if they exist).
  2. Seeds the master catalogue (categories + 120 master products) using the
     same data as Alembic migration 009 (scripts/apply_009_migration.py).

Hosted Postgres/Supabase databases are NOT touched: they are managed with
`alembic upgrade head`.  Run by start.bat; safe to run repeatedly.

    python scripts/local_bootstrap.py
"""

import os
import runpy
import sqlite3
import sys
from pathlib import Path

# Windows consoles default to cp1252; the seeder prints emoji.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
os.environ.setdefault("APP_ENV", "development")

from app.core.config import settings  # noqa: E402


def _sqlite_path(url: str) -> Path | None:
    if not url.startswith("sqlite"):
        return None
    # sqlite+aiosqlite:///auxin.db  or  sqlite:///C:/path/auxin.db
    tail = url.split("///", 1)[-1]
    if tail in ("", ":memory:"):
        return None
    return (ROOT / tail).resolve() if not Path(tail).is_absolute() else Path(tail)


def main() -> int:
    db_path = _sqlite_path(settings.DATABASE_URL)
    if db_path is None:
        print("[bootstrap] DATABASE_URL is not a local SQLite file - skipping.")
        print("            Hosted databases are managed with: alembic upgrade head")
        return 0

    if db_path.name != "auxin.db":
        print(f"[bootstrap] Unexpected SQLite file name '{db_path.name}'; the catalogue seeder targets auxin.db - skipping seed.")

    from sqlalchemy import create_engine

    from app.db.base_all import Base  # registers all models

    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    engine.dispose()
    print(f"[bootstrap] Tables ready in {db_path.name}")

    if db_path.name == "auxin.db":
        with sqlite3.connect(db_path) as conn:
            # The legacy seeder stamps alembic_version; a create_all database has none.
            conn.execute(
                "CREATE TABLE IF NOT EXISTS alembic_version "
                "(version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
            )
            have = conn.execute("SELECT COUNT(*) FROM master_products").fetchone()[0]
        if have == 0:
            print("[bootstrap] Seeding master catalogue ...")
            runpy.run_path(str(ROOT / "scripts" / "apply_009_migration.py"), run_name="__main__")
        else:
            print(f"[bootstrap] Catalogue already seeded ({have} master products).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
