"""Quick schema audit — check table columns in the connected Supabase/PostgreSQL database."""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(".env")

from app.db.engine_utils import build_asyncpg_url
from app.core.config import settings
import asyncpg


async def main():
    url, kw = build_asyncpg_url(settings.DATABASE_URL)
    conn = await asyncpg.connect(url, **kw)

    for table in ["products", "orders", "order_items", "payments", "deliveries"]:
        rows = await conn.fetch(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_name = $1 ORDER BY ordinal_position",
            table,
        )
        print(f"\n{table}:")
        for r in rows:
            print(f"  {r['column_name']}  ({r['data_type']})")

    await conn.close()


asyncio.run(main())
