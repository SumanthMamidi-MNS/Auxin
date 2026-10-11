# Decision log

One line per non-obvious technical choice: what, and why.

- 2026-10-11 — `start.bat` launches API / app / admin in separate `cmd` windows instead of wrapping `run_auxin.py`: no hidden Milo AI failures, each service's log stays visible, and closing a window stops only that service.
- 2026-10-11 — `start.bat` refuses to start when port 8000 is held by a non-Auxin process (identified via `/health` containing `demo_mode`) instead of killing it: another local project was already bound there and killing foreign processes is unsafe.
- 2026-10-11 — `start.bat` uses `APP_ENV=development` (SQLite `auxin.db`) for local runs: it needs no cloud credentials, so the launcher works on a fresh clone.
- 2026-10-11 — Documented the demo-login bypass, `000000` OTP backdoor and open `role=admin` self-registration as blockers in `deployment.md` rather than changing them: each alters auth behaviour and needs an owner decision on how real admins are bootstrapped.
- 2026-10-11 — Fixed the stale hard-coded `harvest_date` in `tests/test_functional_workflows.py` to `date.today()`: the product's 30-day listing cutoff made a fixed date fail with time, which is a test defect, not a product bug.
- 2026-10-11 — Recommend Supabase **session pooler** (port 5432) for Render: asyncpg through the transaction pooler needs `statement_cache_size=0`, which the engine does not set.
- 2026-10-11 — Added migration `010_sync_order_status` (IF NOT EXISTS, Postgres-only) instead of hand-patching Supabase: the live DB lacked 9 `orderstatus` values and 4 columns that no Alembic migration ever created, and a migration keeps Render's `alembic upgrade head` the single source of schema truth.
- 2026-10-11 — Did not sign in to Supabase with the demo accounts and did not apply migration 010 or RLS to the live project: signing in with passwords and irreversible DDL on production data both need the owner to act or approve.
