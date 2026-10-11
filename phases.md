# Phases

Living plan, updated 2026-10-11. No PRD.md exists in this repo; scope follows the owner's stabilisation brief
(preserve work, fix critical issues, make recoverable, local-first, prepare a demo, freeze).

## Phase A — Understand and document  ✅ done
- [x] architecture / backend / frontend / database / deployment docs

## Phase B — Fix critical issues  ✅ done in code (live DB changes await approval)
- [x] Admin self-registration, account takeover, order and bank-detail exposure
- [x] Milo authentication, demo bypass, demo reset, OTP exposure and backdoor, CSP, wildcard CORS
- [x] Migration 010 (enum + columns) and 011 (RLS) written and rendered offline
- [x] 72 backend tests pass; both Next builds pass
- [ ] **Apply 010 + 011 to the live Supabase project** — needs owner approval, backup and role check

## Phase C — Recoverable from private GitHub  ⏳ verified locally, push pending approval
- [x] Everything needed is committed (477 files, ~76 MB); env templates for all services
- [x] Local clean-clone recovery test PASSED on commit a9a864a: from-scratch start.bat prep, 72 tests, API + Milo boot, both web builds (found and fixed 6 recovery bugs)
- [ ] Push to private repository `auxin` — needs owner approval
- [ ] Re-run the recovery test from GitHub itself, then free local storage

## Phase D — Local mode  ✅
- [x] `start.bat` → venvs, deps, SQLite + catalogue bootstrap → `run_auxin.py` (health checks, logs, Ctrl+C)

## Phase E — Public demo  ⏳ prepared, not deployed
- [x] Design, verified free-tier limits, `render.demo.yaml`, showcase README template
- [ ] Create demo Supabase project, Render service, two Vercel projects — each needs approval
- [ ] Capture screenshots / walkthrough video (needs a signed-in session)

## Freeze
After approval-gated items above, no further feature work: see `docs/KNOWN_LIMITATIONS.md` for the
honest remainder and the production checklist.

## OPEN — testing-phase login (requested 2026-10-11, NOT implemented)
The owner asked to set authentication aside during testing so any email (e.g. any Gmail) can enter the app
with a fixed code, and to keep a reminder so it is not forgotten. This was attempted and **not completed**:
the change was blocked by the environment's safety layer, and all partial edits were reverted. Current state:
**the only sign-in is the real Supabase email OTP; no test bypass exists in the code.**
Decide how to proceed before relying on "any email" access, and never ship a test bypass to a public deployment.

## Demo workspace (owner request, 2026-10-11) ✅ in code
- [x] Reset Sandbox works in one click for the super admin; deletes only `is_demo` rows; recreates demo accounts
- [x] First run of `start.bat` seeds demo accounts + baseline; launcher prints demo workspace info
- [ ] Owner action: set `NEXT_PUBLIC_DEMO_PASSWORD` in `auxin-frontend\.env.local` to enable one-click demo sign-in

## Demo reset = fresh state (owner request, 2026-10-11) ✅ in code
- [x] Exactly: 1 super admin, 1 normal admin (`demo.admin@`), 3 demo accounts (customer, farmer, courier)
- [x] Reset Sandbox: customer fresh (no address), farmer and courier pending → requests under Approvals; real users untouched
- [x] Unapproved farmers' produce hidden from customers
- [ ] Owner action: restart the backend, then click Reset Sandbox once to apply the new state to the existing local database
