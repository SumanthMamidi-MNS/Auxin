# Auxin — Deployment plan

Snapshot taken **2026-10-11** on branch `docs/deploy-readiness`. This file is the quick answer to
"can we deploy right now, and where?". Architecture detail lives in `architecture.md`.

## 1. Where each piece goes

| Piece | Host | Why | Config in repo |
|---|---|---|---|
| FastAPI backend (`main.py`) | **Render** web service (Python) | Already has `render.yaml`; free tier works but cold-starts (frontend already retries on 503) | `render.yaml`, `Procfile`, `Dockerfile` |
| `auxin-frontend` (customer / farmer / delivery) | **Vercel** project #1, root dir `auxin-frontend` | Next.js 16, zero config | `auxin-frontend/vercel.json` |
| `auxin-admin` | **Vercel** project #2, root dir `auxin-admin` | Same | `auxin-admin/vercel.json` |
| `auxin-landing` | **Vercel** project #3, root dir `auxin-landing` (optional) | Marketing page only | `auxin-landing/vercel.json` |
| Auth + Postgres | **Supabase** | Auth issues JWTs, Postgres is the app DB | `alembic/` migrations |

Render + Vercel is the fastest path. Railway (`nixpacks.toml`) and Docker also work for the backend.

## 2. What was verified on 2026-10-11

| Check | Result |
|---|---|
| Backend tests (`pytest tests`, default `.env`) | 62 / 62 pass (after fixing a stale hard-coded date in one test) |
| `next build` — `auxin-frontend` | passes (Next 16.2.4, TypeScript clean, 23 routes) |
| `next build` — `auxin-admin` | passes (Next 16.2.6, TypeScript clean, 21 routes) |
| Alembic | single linear head `009_master_catalogue` (`alembic upgrade head` is safe) |
| Local API boot (SQLite) | `/health` ok; protected routes return the 401 envelope; CORS preflight OK |
| `start.bat` | prerequisite checks, dependency checks and port-conflict path verified |

**Not verified (needs credentials / a real project):** login against a real Supabase project,
the Postgres connection from Render, Razorpay, and the live farmer → customer → delivery flow.
The flow *is* covered end-to-end by `tests/test_delivery_otp_eta_and_mission.py` against SQLite.

## 3. Blockers before a public deploy

These need an owner decision or credentials. Ordered by severity.

1. **Anyone can register as `admin` (critical).** `POST /auth/sync-user` accepts `role: "admin"`
   from the request body and auto-approves admins (`app/api/v1/endpoints/auth.py`,
   `app/models/user.py::default_status_for_role`). Reproduced: a fresh JWT → `201 role=admin
   status=approved` → `200` on `/admin/users` and `/admin/disputes`. Needs a rule for how real admins
   are created (e.g. only the configured super-admin email, or pre-created rows only).
2. **Client-side demo login bypass ships in production.** `auxin-frontend/src/lib/auth.ts` lets
   `demo.customer|farmer|delivery|admin@auxin.app` sign in with OTP `111111`, using a hard-coded
   password that is visible in the JS bundle. The `demo.*` branch is not gated by `NODE_ENV`.
   Gate it on `NEXT_PUBLIC_DEMO_MODE` or remove it, and do not seed demo accounts in the live project.
3. **`000000` doorstep-OTP backdoor when `DEBUG=true`.** `app/core/security.py::verify_delivery_otp`
   accepts `000000` whenever `DEBUG` is true. `.env.development` sets `DEBUG=true`; `render.yaml`
   and `.env.production` set it false. Keep `DEBUG=false` on Render, or delete the bypass.
4. **No real Supabase project is reachable.** The connected Supabase account lists 0 projects, and
   the local `DATABASE_URL` values are placeholders (`YOUR_PROJECT`) or SQLite.
   Create the project, then fill the env vars in section 4.
5. **Placeholder URLs.** `.env.production` files point at `api.auxin.in` / `admin.auxin.in` /
   `app.auxin.in`; `ALLOWED_ORIGINS` in `render.yaml` is `YOUR_MAIN_APP_DOMAIN,...`. Replace with
   the real Render/Vercel URLs after the first deploy (CORS will block the browser otherwise).
6. **Login is email-OTP, not phone+password.** The frontend calls `supabase.auth.signInWithOtp({email})`.
   Supabase's built-in mailer is heavily rate-limited; configure a custom SMTP provider before real
   users arrive. (The README still says phone+password — it is stale.)
7. **DB connection mode.** Use the Supabase **session pooler** connection string (IPv4, port 5432)
   from Render. If you switch to the transaction pooler (port 6543), asyncpg needs
   `statement_cache_size=0`, which `app/db/session.py` does not set today.
8. **Table auto-create on boot.** `main.py` runs `Base.metadata.create_all` on every start, in every
   environment, next to `alembic upgrade head`. Harmless on a migrated DB, but it can create tables
   outside Alembic's control. Prefer Alembic only in production.

## 4. Environment variables (names only — never commit values)

### Render — backend
| Variable | Notes |
|---|---|
| `APP_ENV` | `production` |
| `DEBUG` | **`false`** |
| `DATABASE_URL` | `postgresql+asyncpg://…` Supabase session pooler string |
| `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `ALLOWED_ORIGINS` | comma-separated: the two Vercel app URLs |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | Fernet key (`Fernet.generate_key()`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` | blank = payments disabled |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_PASSWORD` | bootstrap super admin |
| `DELIVERY_OTP_EXPIRY_MINUTES`, `DELIVERY_GEOFENCE_RADIUS_METERS` | already in `render.yaml` |

### Vercel — `auxin-frontend` and `auxin-admin`
| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<render-service>.onrender.com/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key only |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_APP_URL` | cross-links between apps |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | public key id only (frontend only) |

`.env*` files are git-ignored (except `.env.example`), so Vercel gets its values **only** from the dashboard.

## 5. Order of operations

1. Resolve blockers 1–3 (code changes, small).
2. Create the Supabase project → enable Email auth → set SMTP → copy URL / anon key / JWT secret / service key / pooler URL.
3. Deploy backend on Render from `render.yaml` → set env vars → confirm `GET /health` returns `db: connected`
   (the start command runs `alembic upgrade head`, which builds the schema).
4. Deploy `auxin-frontend` and `auxin-admin` on Vercel with the env vars above.
5. Put the two Vercel URLs into Render `ALLOWED_ORIGINS`, redeploy backend.
6. Smoke test, in this order: sign up farmer → admin approves → farmer lists inventory → customer orders →
   farmer accepts / packs / ready → delivery partner claims, picks up, goes out-for-delivery →
   customer sees OTP on **Orders** → partner submits OTP inside the geofence → order shows completed.
