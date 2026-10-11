# Build log

## 2026-10-11
Audited the repo for deployability: backend 62/62 tests pass (fixed one stale test date), both Next builds pass, Alembic has a single head. Wrote `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `deployment.md`, `phases.md`, `decisions.md` and a verified `start.bat`.
Found three auth blockers (open `admin` self-registration, shipped `demo.*` login bypass, `000000` OTP backdoor under `DEBUG`) and no reachable Supabase project; documented in `deployment.md`, not yet fixed.

## 2026-10-11 (later)
Audited the connected Supabase project read-only: found it one migration behind with a stale `orderstatus` enum, 4 missing columns and RLS off on 14 tables. Drafted migration `010_sync_order_status` (tests 62/62, not applied); findings in `deployment.md` §6.

## 2026-10-11 (stabilisation pass)
Fixed the audited security issues in code (admin self-registration, sync-user takeover, order/bank exposure, Milo auth, demo bypass/reset, OTP exposure, CSP), added 10 regression tests (72 pass) and migrations 010/011 (not applied). Made the launcher non-destructive and Python-version aware, added SQLite bootstrap, env templates and Milo requirements, and wrote RECOVERY / DEMO_DEPLOYMENT / KNOWN_LIMITATIONS docs. Everything is committed locally on `docs/deploy-readiness`; nothing pushed, deployed or applied to Supabase.
Local clean-clone recovery test (clone of the committed branch, fresh venvs and node_modules) found and fixed six bugs the working copy had hidden: Python 3.14 picked by `py -3`, pip read timeouts, cp1252 console crash in the catalogue seeder, missing `alembic_version` for that seeder, missing `setuptools` for razorpay, and `.gitignore` hiding the admin audit-logs page. After the fixes: 72 tests, API/Milo boot and both production builds pass from the clone. GitHub push and the from-GitHub re-test are pending approval.

## 2026-10-11 (test-login request)
Owner asked for a testing-phase login that accepts any email with a fixed code and wants it noted so it is not forgotten. Attempted twice; both times blocked by the safety layer, partial edits reverted, tree clean, 72 tests pass. Nothing about authentication changed. Request is recorded as OPEN in `phases.md`.

## 2026-10-11 (demo workspace)
Fixed the Reset Sandbox button (my earlier password requirement had broken it), made reset super-admin-only and self-healing (recreates missing demo accounts), seeded the demo baseline on first run of start.bat, corrected the walkthrough text (no fixed delivery code), added a 4th demo account row. Verified on a throwaway DB: 5 users, 1 farm, 1 courier, 6 listings, idempotent re-run; 73 tests pass, admin build passes.
Reset now returns the demo customer to fresh (no address) and the demo farmer/courier to pending approval requests; demo.admin is the one normal admin; unapproved farmers' produce is hidden from customers. 73 tests pass; first-run state verified on a throwaway DB (1 super admin, 1 admin, 3 demo, 1+1 pending requests, 6 listings).
Demo reset now leaves the three demo accounts blank (owner request); full onboarding → approval flow is covered by a test. Fixed legacy farmer-approve route leaving users pending. Leaflet map crash fix written (map created once, markers updated in place). Logo draft deleted. Frontend redesign delegated to the frontend agent.
