# Build log

## 2026-10-11
Audited the repo for deployability: backend 62/62 tests pass (fixed one stale test date), both Next builds pass, Alembic has a single head. Wrote `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `deployment.md`, `phases.md`, `decisions.md` and a verified `start.bat`.
Found three auth blockers (open `admin` self-registration, shipped `demo.*` login bypass, `000000` OTP backdoor under `DEBUG`) and no reachable Supabase project; documented in `deployment.md`, not yet fixed.
