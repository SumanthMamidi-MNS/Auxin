#!/usr/bin/env python3
"""
scripts/db_setup.py
====================
Database setup helper script.

Usage:
    # 1. Test DB connectivity
    python scripts/db_setup.py check

    # 2. Run all migrations (creates all tables)
    python scripts/db_setup.py migrate

    # 3. Seed the database with a demo admin user (dev only)
    python scripts/db_setup.py seed

    # 4. Full setup (check + migrate + seed)
    python scripts/db_setup.py setup

IMPORTANT: Always run from the project root:
    cd "The Auxin"
    python scripts/db_setup.py setup
"""

import asyncio
import subprocess
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def run_migrations():
    """Run alembic upgrade head."""
    print("📦 Running Alembic migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=False,
        text=True,
    )
    if result.returncode != 0:
        print("❌ Migration failed.")
        sys.exit(1)
    print("✅ Migrations complete.")


async def check_db():
    """Test database connectivity."""
    from sqlalchemy import text
    from app.db.session import AsyncSessionLocal
    from app.core.config import settings

    print(f"🔌 Testing connection to: {settings.DATABASE_URL[:50]}...")
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected! PostgreSQL {version}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


async def seed_admin():
    """Create a demo admin user if one doesn't exist."""
    from sqlalchemy import text, select
    from app.db.session import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.core.config import settings

    if settings.APP_ENV == "production":
        print("⚠️  Skipping seed in production mode.")
        return

    print("🌱 Seeding demo admin user...")
    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        existing = await session.execute(
            select(User).where(User.role == UserRole.admin).limit(1)
        )
        if existing.scalar_one_or_none():
            print("ℹ️  Admin user already exists, skipping seed.")
            return

        admin = User(
            name="Aarav Kumar",
            phone="+919999999999",
            role=UserRole.admin,
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Demo admin created: phone={admin.phone}")


async def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "check"

    if command == "check":
        ok = await check_db()
        sys.exit(0 if ok else 1)

    elif command == "migrate":
        run_migrations()

    elif command == "seed":
        await seed_admin()

    elif command == "setup":
        ok = await check_db()
        if not ok:
            print("\n💡 Fix your DATABASE_URL in .env.development and try again.")
            print("   See .env.development for Supabase connection string format.")
            sys.exit(1)
        run_migrations()
        await seed_admin()
        print("\n🎉 Setup complete! Run: APP_ENV=development python main.py")

    else:
        print(f"Unknown command: {command}")
        print("Usage: python scripts/db_setup.py [check|migrate|seed|setup]")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
