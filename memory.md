# Build log

## 2026-10-11
Audited the repo for deployability: backend 62/62 tests pass (fixed one stale test date), both Next builds pass, Alembic has a single head. Wrote `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `deployment.md`, `phases.md`, `decisions.md` and a verified `start.bat`.
Found three auth blockers (open `admin` self-registration, shipped `demo.*` login bypass, `000000` OTP backdoor under `DEBUG`) and no reachable Supabase project; documented in `deployment.md`, not yet fixed.

## 2026-10-11 (later)
Audited the connected Supabase project read-only: found it one migration behind with a stale `orderstatus` enum, 4 missing columns and RLS off on 14 tables. Drafted migration `010_sync_order_status` (tests 62/62, not applied); findings in `deployment.md` §6.
