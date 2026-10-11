# Environment variables

Names and meaning only — never commit values. Each service has a committed `.env.example`.

## Core API (`.env.development` locally, platform dashboard when hosted)

`APP_ENV` selects the file: `development` → `.env.development`, `production` → `.env.production`,
anything else (e.g. `demo`) → `.env`.

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | `production` disables `create_all` on boot, wildcard CORS and demo reset on a real DB |
| `DEBUG` | `false` | Enables `/docs`, SQL echo and verbose 500s. **Never true in production** |
| `DATABASE_URL` | required | `sqlite+aiosqlite:///auxin.db` locally; `postgresql+asyncpg://…` (Supabase session pooler, port 5432) hosted |
| `ALLOWED_ORIGINS` | `*` | Comma-separated browser origins. `*` is ignored when `APP_ENV=production` |
| `SUPABASE_URL` / `SUPABASE_JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` | empty | Verify sign-in tokens; admin calls |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PHONE` / `SUPER_ADMIN_PASSWORD` | placeholders | The single address allowed to self-register as admin; password is the offline fallback for demo-reset confirmation |
| `DEMO_MODE` / `DEMO_DATABASE_URL` | `false` / empty | Marks a sandbox deployment; routes DB access to `DEMO_DATABASE_URL` when set; permits demo reset |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | empty | Fernet key. Blank stores bank numbers as `plain:` — fill in for anything real |
| `DELIVERY_OTP_EXPIRY_MINUTES` | `10` | Doorstep OTP lifetime |
| `DELIVERY_GEOFENCE_RADIUS_METERS` | `100` | Partner must be this close to complete a delivery |
| `PRODUCT_EXPIRY_DAYS` | `30` | Listing age cutoff |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | empty | Blank disables online payments (COD still works) |
| `MILO_BACKEND_URL` | `http://127.0.0.1:8001` | Where the API proxies Milo chat |
| `MILO_ENABLED` / `MILO_PROVIDER` / `MILO_MODEL` / `MILO_API_KEY` | off | Status endpoint only |

## Milo AI (`Milo_AI/.env.development`)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Generated answers (optional) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Hosted knowledge store (optional; local curated index otherwise) |

## `auxin-frontend/.env.local` (values are inlined into the browser bundle)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Core API base, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign-in (anon key is public by design) |
| `NEXT_PUBLIC_APP_ENV` | `production` turns on standalone output, security headers and the CSP |
| `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_DEMO_PASSWORD` | One-click demo buttons — demo deployments only |
| `NEXT_PUBLIC_DEV_TEST_EMAILS`, `NEXT_PUBLIC_DEV_TEST_PASSWORD` | Shortcut accounts under `next dev` only |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Cross-links; Razorpay public key id |

## `auxin-admin/.env.local`

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_DEMO_MODE` (shows the demo banner), `NEXT_PUBLIC_APP_URL`.

## `auxin-landing/.env.local`

`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`.

## Scripts

| Variable | Used by | Purpose |
|---|---|---|
| `DEMO_SEED_PASSWORD` | `scripts/prod_seed.py` | Shared sandbox password for seeded demo users (never stored in source) |
