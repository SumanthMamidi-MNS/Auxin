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
- 2026-10-11 — Reversed the earlier multi-window `start.bat`: it now prepares environments and hands over to `run_auxin.py`, which already did health checks, log streaming, browser launch and Ctrl+C cleanup; the launcher was changed to never kill processes it did not start (it previously killed whatever held ports 8000/8001/3000/3001).
- 2026-10-11 — `start.bat` selects Python 3.12 then 3.11 and refuses 3.13+: found in the clean-clone test that `py -3` picked 3.14 and the pinned pydantic/asyncpg have no wheels for it.
- 2026-10-11 — `/auth/sync-user` links an existing row only by the verified JWT `email` claim and never re-links an owned row; admin self-registration is limited to `SUPER_ADMIN_EMAIL`: request-body phone/email are client-controlled and previously allowed account takeover.
- 2026-10-11 — The partner no longer receives the OTP (customer-held secret); OTP attempts are limited in memory (5 per delivery per process): simplest bound without a schema change, DB-backed counter listed as a known limitation.
- 2026-10-11 — Demo sign-in is gated by `NEXT_PUBLIC_DEMO_MODE` and the shared password comes from env, not source: a public demo needs a known password, but it must not exist in builds that serve real users.
- 2026-10-11 — Public demo uses its own Supabase project, API and frontends rather than flagging rows in the real project: separate Auth and DB is the only isolation that makes accidental exposure of real data impossible.
- 2026-10-11 — Milo is reached only through the authenticated backend proxy with a configurable `MILO_BACKEND_URL`: the browser must not call an unauthenticated internal service, and the upstream differs per environment.
- 2026-10-11 — Frontend CSP `connect-src` is derived from `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SUPABASE_URL`: a hard-coded host would have blocked sign-in on any deployment.
- 2026-10-11 — Migrations 010 and 011 are idempotent `IF NOT EXISTS` / `to_regclass` guards and Postgres-only: safe on a database that was partly patched by hand, no-op on SQLite.
- 2026-10-11 — Kept the recovery test local (clone of the committed branch) until the owner approves a push: it exercises exactly what GitHub would hold without publishing anything; the same test must be re-run from GitHub after the push.
- 2026-10-11 — Applied only in-range `npm audit fix`; Next.js 16.4 upgrade deferred: the framework has breaking changes and the brief says not to introduce risk, so it needs its own tested step.
- 2026-10-11 — Did not add a test-login bypass: the owner asked for one, but the change was refused by the safety layer twice; partial work was reverted rather than reapplied by another route. Authentication is unchanged and the request is tracked as OPEN in `phases.md`.
