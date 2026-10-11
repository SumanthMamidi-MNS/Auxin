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
| Backend tests (`pytest tests`, default `.env`) | 72 / 72 pass (62 original + 10 security regression tests) |
| `next build` — `auxin-frontend` | passes (Next 16.2.4, TypeScript clean, 23 routes) |
| `next build` — `auxin-admin` | passes (Next 16.2.6, TypeScript clean, 21 routes) |
| Alembic | single linear head `009_master_catalogue` (`alembic upgrade head` is safe) |
| Local API boot (SQLite) | `/health` ok; protected routes return the 401 envelope; CORS preflight OK |
| `start.bat` | prerequisite checks, dependency checks and port-conflict path verified |

**Not verified (needs credentials / a real project):** login against a real Supabase project,
the Postgres connection from Render, Razorpay, and the live farmer → customer → delivery flow.
The flow *is* covered end-to-end by `tests/test_delivery_otp_eta_and_mission.py` against SQLite.

## 3. Blockers before a public deploy (status as of 2026-10-11, later pass)

| # | Blocker | Status |
|---|---|---|
| 1 | Anyone could register as `admin`; accounts could be taken over through `sync-user` | **Fixed in code**, 10 regression tests |
| 2 | Client-side demo login with a password in the bundle | **Fixed in code**: off unless `NEXT_PUBLIC_DEMO_MODE=true` |
| 3 | `000000` doorstep-OTP backdoor; partner received the OTP | **Fixed in code** |
| 4 | Production CSP blocked Supabase and any API host except `api.auxin.in` | **Fixed**, header verified |
| 5 | Live Supabase schema behind the code (order enum, 4 columns, catalogue tables) | Migration 010 written, **not applied** (needs approval + backup) |
| 6 | RLS disabled on all public tables; permissive policies on Milo tables | Migration 011 written, **not applied** (needs approval + backup) |
| 7 | Placeholder domains in `.env.production`, `render.yaml` `ALLOWED_ORIGINS` | Open: needs the real URLs after first deploy |
| 8 | Email OTP uses Supabase's rate-limited mailer | Open: configure custom SMTP before real users |
| 9 | Demo accounts use the old shared password | Open: re-seed or reset passwords (`docs/RECOVERY.md` section 6) |
| 10 | Service-role key was hard-coded in two Milo scripts | Literal removed (never committed); **rotate the key** |

DB connection mode: use the Supabase **session pooler** (IPv4, port 5432) from Render; the transaction
pooler (6543) needs `statement_cache_size=0`, which `app/db/session.py` does not set.

The remaining medium/low items are tracked in `docs/KNOWN_LIMITATIONS.md`.

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

## 6. Live Supabase audit (project `Auxin`, 2026-10-11, read-only)

Checked through the Supabase connector with SELECT-only queries and the advisors. Nothing was changed.

| Finding | Detail | Fix |
|---|---|---|
| Schema is one migration behind | `alembic_version` = `31675d11771f`. Missing tables: `master_categories`, `master_products`, `farmer_inventory` (the farmer "list goods" flow). | `alembic upgrade head` (migration 009) |
| **Order status enum is stale** | Live `orderstatus` has 5 values; the code uses 14. `POST /orders` writes `reserved`, which Postgres rejects, so ordering fails on this DB. | New migration `010_sync_order_status` (drafted, **not applied**) |
| 4 columns missing | `orders.reservation_expires_at`, `orders.payment_method`, `delivery_partners.location_updated_at`, `delivery_partners.location_accuracy`. No earlier migration adds them (only a SQLite-only script did). | Same migration 010 |
| **RLS disabled on 14 public tables** | `users`, `orders`, `payments`, `deliveries` (incl. `plain_otp`), `farmers` (bank fields) etc. are readable and writable by anyone holding the anon key, which is public in the frontend bundle. The backend connects as `postgres` and bypasses RLS; the frontends only use Supabase Auth, so enabling RLS with no policies should not break the app. | Owner decision, see below |
| Demo accounts exist | `demo.customer/farmer/delivery/admin@auxin.app` are in `auth.users` and `public.users` (all `is_demo`, approved, linked). With blocker 2 this makes the demo bypass usable from the internet. | Gate or remove bypass; rotate demo passwords |
| Super admin present | One `is_super_admin` row for the owner's email, linked to its auth user. | none |
| Leftover test auth users | Five `+91…@auxin.app` / personal test emails exist in `auth.users` with no `public.users` row. | Clean up before launch (optional) |
| Advisors (warnings) | Leaked-password protection off; `vector` extension in `public`; two functions with mutable `search_path`. | Low priority |

### RLS statement (not applied — owner decision)

```sql
ALTER TABLE public.alembic_version   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
```

With RLS on and no policies, the anon and authenticated roles see nothing, which is what we want for a
backend-only data model. The new catalogue tables created by migration 009 need the same treatment.
