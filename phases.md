# Phases

Living execution plan. No PRD.md exists in this repo yet, so phases are derived from the code and the
owner's request to make Auxin deployable. Updated at the end of each work session.

## Phase A — Understand and document  ✅ done (2026-10-11)
- [x] Map backend, frontends, DB, deployment config
- [x] `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `deployment.md`
- [x] One-click local launcher: `start.bat`

## Phase B — Deploy-readiness fixes  ⏳ in progress, waiting on owner decisions
- [x] Backend suite green: 62 / 62
- [x] Both Next.js builds pass
- [x] Alembic: single head `009_master_catalogue`
- [ ] Block self-registration as `admin` on `/auth/sync-user` (needs admin-bootstrap decision)
- [ ] Gate or remove the `demo.*` client login bypass (`auxin-frontend/src/lib/auth.ts`)
- [ ] Remove or env-guard the `000000` OTP bypass (`app/core/security.py`)
- [x] Supabase project `Auxin` exists (healthy) — still need its env values on Render
- [ ] Apply migrations 009 + 010 to Supabase (010 drafted, awaiting approval)
- [ ] Enable RLS on public tables (owner decision, SQL in deployment.md §6)
- [ ] Replace placeholder domains in `.env.production`, `render.yaml` `ALLOWED_ORIGINS`

## Phase C — First live deploy  ⬜ not started
- [ ] Render backend → `/health` shows `db: connected`
- [ ] Vercel: `auxin-frontend`, `auxin-admin` (and optionally `auxin-landing`)
- [ ] Live smoke test of the farmer → customer → delivery-OTP flow (steps in `deployment.md` §5)

## Phase D — After launch  ⬜ backlog
- [ ] Custom SMTP for Supabase email OTP
- [ ] Stop `create_all` on boot in production; Alembic only
- [ ] Refresh the stale README (still describes phone+password and Alembic head 006)
