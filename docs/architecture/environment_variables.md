# Auxin v2.0 — Environment Variables Reference

Complete reference for all environment variables across all three Auxin apps.

---

## Backend (root `.env`)

### Application

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `APP_ENV` | string | `development` | No | Environment name: `development`, `production` |
| `APP_HOST` | string | `0.0.0.0` | No | Host to bind the FastAPI server |
| `APP_PORT` | int | `8000` | No | Port to bind the FastAPI server |
| `DEBUG` | bool | `false` | No | Enables SQL logging and Swagger UI |
| `LOG_LEVEL` | string | `INFO` | No | Logging verbosity: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `ALLOWED_ORIGINS` | string | `*` | **Yes (prod)** | Comma-separated CORS origins. Must be set in production. |

**Example:**
```env
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://app.auxin.in,https://admin.auxin.in
```

---

### Database

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `DATABASE_URL` | string | — | **Yes** | Neon PostgreSQL connection URL in asyncpg format |
| `DEMO_MODE` | bool | `false` | No | When `true`, routes all DB queries to `DEMO_DATABASE_URL` |
| `DEMO_DATABASE_URL` | string | `""` | **Yes (demo)** | Sandbox Neon DB URL — used only when `DEMO_MODE=true` |

**Format:**
```
postgresql+asyncpg://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require
```

> ⚠️ **Important:** The `asyncpg` driver does NOT support `sslmode=require` in the URL directly — the backend's `engine_utils.py` strips it and converts to `connect_args`. Use the standard Neon URL format.

---

### Supabase Auth

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `SUPABASE_URL` | string | `""` | **Yes (prod)** | Your Supabase project URL: `https://xxxx.supabase.co` |
| `SUPABASE_JWT_SECRET` | string | `""` | **Yes** | JWT secret from Supabase → Project Settings → API → JWT Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | string | `""` | **Yes** | Service role key for backend admin operations |

> ⚠️ `SUPABASE_JWT_SECRET` is CRITICAL. The backend validates every incoming JWT against this secret. If it's wrong, all auth fails.

---

### Security

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `BANK_ACCOUNT_ENCRYPTION_KEY` | string | `""` | Recommended | Fernet symmetric key for encrypting farmer bank account numbers. Generate with: `from cryptography.fernet import Fernet; Fernet.generate_key().decode()` |

---

### Delivery

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DELIVERY_OTP_EXPIRY_MINUTES` | int | `10` | OTP lifetime for delivery confirmation handoff |
| `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` | int | `30` | Flag deliveries unassigned longer than this |
| `DELIVERY_GEOFENCE_RADIUS_METERS` | float | `100.0` | Max distance for delivery completion geofence |

---

### Razorpay

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `RAZORPAY_KEY_ID` | string | `""` | **Yes (prod)** | Razorpay API Key ID (starts with `rzp_live_` in production) |
| `RAZORPAY_SECRET` | string | `""` | **Yes (prod)** | Razorpay API Secret — **NEVER expose to frontend** |

---

### ⛔ Obsolete Variables (Remove from `.env`)

These variables were used by the old OTP authentication system. They have no effect in v2.0 (Supabase Auth) and should be removed from all environments:

| Variable | Status |
|----------|--------|
| `OTP_EXPIRY_MINUTES` | ❌ REMOVE |
| `OTP_MAX_REQUESTS_PER_WINDOW` | ❌ REMOVE |
| `OTP_RATE_LIMIT_WINDOW_MINUTES` | ❌ REMOVE |
| `OTP_MAX_VERIFICATION_ATTEMPTS` | ❌ REMOVE |
| `JWT_SECRET` | ❌ REMOVE (Supabase handles JWT) |
| `ACCESS_TOKEN_EXPIRY_MINUTES` | ❌ REMOVE |
| `REFRESH_TOKEN_EXPIRY_DAYS` | ❌ REMOVE |
| `BCRYPT_ROUNDS` | ❌ REMOVE |

---

## Frontend — `auxin-frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API base URL: `https://api.auxin.in/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL (same as backend `SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key — safe to expose to browser |
| `NEXT_PUBLIC_APP_ENV` | No | `development` or `production` |
| `NEXT_PUBLIC_DEMO_MODE` | No | `true` to enable demo mode indicators |
| `NEXT_PUBLIC_ADMIN_URL` | No | URL of the admin portal: `https://admin.auxin.in` |
| `NEXT_PUBLIC_APP_URL` | No | URL of the frontend: `https://app.auxin.in` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes (prod)** | Razorpay PUBLIC key ID only (starts with `rzp_live_`) |

> ⚠️ `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are REQUIRED for the Next.js build to succeed. Missing them causes build failures.

**Example `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Admin Portal — `auxin-admin/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon key |
| `NEXT_PUBLIC_APP_ENV` | No | `development` or `production` |
| `NEXT_PUBLIC_DEMO_MODE` | No | `true` to show amber "DEMO MODE" banner in admin shell |
| `NEXT_PUBLIC_APP_URL` | No | URL of the admin portal |

---

## Required for Production — Checklist

### Backend (Render)
- [ ] `DATABASE_URL` — Neon production database
- [ ] `SUPABASE_URL` — Supabase project URL
- [ ] `SUPABASE_JWT_SECRET` — JWT secret (critical)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Service role key
- [ ] `ALLOWED_ORIGINS` — Set to `https://app.auxin.in,https://admin.auxin.in`
- [ ] `RAZORPAY_KEY_ID` — Live Razorpay key
- [ ] `RAZORPAY_SECRET` — Live Razorpay secret
- [ ] `BANK_ACCOUNT_ENCRYPTION_KEY` — Fernet key for bank data
- [ ] `APP_ENV=production`
- [ ] `DEBUG=false`

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` — Production backend URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Live Razorpay public key
- [ ] `NEXT_PUBLIC_APP_ENV=production`

### Admin (Vercel)
- [ ] Same Supabase vars as frontend
- [ ] `NEXT_PUBLIC_API_URL` — Production backend URL
- [ ] `NEXT_PUBLIC_APP_ENV=production`

---

## Security Rules

1. **Never put secrets in `NEXT_PUBLIC_*` vars** — they are embedded in the JavaScript bundle and visible to anyone.
2. **`RAZORPAY_SECRET` stays backend-only** — only the public `RAZORPAY_KEY_ID` goes to the frontend.
3. **`SUPABASE_SERVICE_ROLE_KEY` stays backend-only** — it bypasses Row Level Security.
4. **`SUPABASE_JWT_SECRET` stays backend-only** — it validates all user tokens.
5. **`DATABASE_URL` and `DEMO_DATABASE_URL` stay backend-only** — direct database access.
6. **`BANK_ACCOUNT_ENCRYPTION_KEY` stays backend-only** — decrypts sensitive financial data.
7. **Commit `.env.example` not `.env`** — the actual `.env` files are gitignored.
