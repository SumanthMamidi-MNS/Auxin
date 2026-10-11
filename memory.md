# Build log

## 2026-10-11
Audited the repo for deployability: backend 62/62 tests pass (fixed one stale test date), both Next builds pass, Alembic has a single head. Wrote `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `deployment.md`, `phases.md`, `decisions.md` and a verified `start.bat`.
Found three auth blockers (open `admin` self-registration, shipped `demo.*` login bypass, `000000` OTP backdoor under `DEBUG`) and no reachable Supabase project; documented in `deployment.md`, not yet fixed.

## 2026-10-11 (later)
Audited the connected Supabase project read-only: found it one migration behind with a stale `orderstatus` enum, 4 missing columns and RLS off on 14 tables. Drafted migration `010_sync_order_status` (tests 62/62, not applied); findings in `deployment.md` §6.

## 2026-10-11 (stabilisation pass)
Fixed the audited security issues in code (admin self-registration, sync-user takeover, order/bank exposure, Milo auth, demo bypass/reset, OTP exposure, CSP), added 10 regression tests (72 pass) and migrations 010/011 (not applied). Made the launcher non-destructive and Python-version aware, added SQLite bootstrap, env templates and Milo requirements, and wrote RECOVERY / DEMO_DEPLOYMENT / KNOWN_LIMITATIONS docs. Everything is committed locally on `docs/deploy-readiness`; nothing pushed, deployed or applied to Supabase.
