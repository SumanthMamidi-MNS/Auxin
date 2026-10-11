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
