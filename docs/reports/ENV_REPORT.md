# MISSION 2 — ENVIRONMENT REPORT
# Auxin v2.0 Environment Variable Audit
# Generated: 2026-06-20T07:14:00Z
# ─────────────────────────────────────────────────────────────────────────────

## Summary

This report audits all environment variable files in the Auxin v2.0 project.
All findings are based on direct file inspection and cross-referencing against
`app/core/config.py` (the Settings model which is the single source of truth).

---

## Settings Model Variables (from `app/core/config.py`)

The following variables are consumed by the backend Settings model:

| Variable | Type | Default | Required |
|----------|------|---------|----------|
| `APP_ENV` | str | `"development"` | No |
| `APP_HOST` | str | `"0.0.0.0"` | No |
| `APP_PORT` | int | `8000` | No |
| `DEBUG` | bool | `False` | No |
| `ALLOWED_ORIGINS` | str | `"*"` | No |
| `LOG_LEVEL` | str | `"INFO"` | No |
| `DATABASE_URL` | str | — | **YES** (no default) |
| `DEMO_MODE` | bool | `False` | No |
| `DEMO_DATABASE_URL` | str | `""` | Only if DEMO_MODE=true |
| `SUPABASE_URL` | str | `""` | **YES** (production required) |
| `SUPABASE_JWT_SECRET` | str | `""` | **YES** (required before any request) |
| `SUPABASE_SERVICE_ROLE_KEY` | str | `""` | **YES** (required for admin ops) |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | str | `""` | No (blank = unencrypted, dev only) |
| `DELIVERY_OTP_EXPIRY_MINUTES` | int | `10` | No |
| `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` | int | `30` | No |
| `DELIVERY_GEOFENCE_RADIUS_METERS` | float | `100.0` | No |
| `RAZORPAY_KEY_ID` | str | `""` | No (blank = payments disabled) |
| `RAZORPAY_SECRET` | str | `""` | No (blank = payments disabled) |

---

## File-by-File Audit

### `.env` (root) — gitignored

**Status:** ✅ SANITIZED (this session)

Previously contained real Neon DB URL and Razorpay secret. Now contains placeholder values only. This file is gitignored and serves as a fallback when APP_ENV is not set.

| Variable | Value | Status |
|----------|-------|--------|
| `APP_ENV` | development | ✅ |
| `DATABASE_URL` | `postgresql+asyncpg://USER:PASSWORD@HOST:5432/auxin_db?sslmode=require` | ✅ Placeholder |
| `SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` | ✅ Placeholder |
| `SUPABASE_SERVICE_ROLE_KEY` | `REPLACE_WITH_SERVICE_ROLE_KEY` | ✅ Placeholder |
| `SUPABASE_JWT_SECRET` | `REPLACE_WITH_JWT_SECRET` | ✅ Placeholder |
| `RAZORPAY_KEY_ID` | `rzp_test_REPLACE_WITH_YOUR_KEY_ID` | ✅ Placeholder |
| `RAZORPAY_SECRET` | `REPLACE_WITH_YOUR_RAZORPAY_SECRET` | ✅ Placeholder |

---

### `.env.development` — gitignored

**Status:** ✅ COMPLETE (updated this session)

| Variable | Set? | Notes |
|----------|------|-------|
| `APP_ENV` | ✅ `development` | |
| `DEBUG` | ✅ `true` | Correct for dev |
| `ALLOWED_ORIGINS` | ✅ `localhost:3000,localhost:3001,...` | |
| `LOG_LEVEL` | ✅ `DEBUG` | |
| `DATABASE_URL` | ✅ Real Neon URL | asyncpg format, sslmode=require |
| `SUPABASE_URL` | ✅ `https://snjqxpelsbsvytxezwne.supabase.co` | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Real key | `sb_secret_...` |
| `SUPABASE_JWT_SECRET` | ✅ Real secret | len=88 (base64) |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | ✅ Blank | Acceptable for dev |
| `DELIVERY_OTP_EXPIRY_MINUTES` | ✅ `60` | Extended for dev testing |
| `DELIVERY_GEOFENCE_RADIUS_METERS` | ✅ `5000.0` | Relaxed for dev |
| `RAZORPAY_KEY_ID` | ✅ `rzp_test_T0pmjmofHEnu9p` | Test key |
| `RAZORPAY_SECRET` | ✅ Real test secret | |

> **Note on stale variables:** Previous versions of this file had `JWT_SECRET`, `BCRYPT_ROUNDS`, `OTP_EXPIRY_MINUTES`, etc. These have been **removed** as they don't exist in the current Settings model (`extra="ignore"` in Pydantic config, so they would silently be ignored anyway).

---

### `.env.production` — gitignored

**Status:** ✅ UPDATED (this session)

Contains placeholder template values only. Real values must be set via Render/Railway/Fly.io dashboard.

| Variable | Value | Status |
|----------|-------|--------|
| `SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` | ✅ Placeholder |
| `SUPABASE_JWT_SECRET` | `REPLACE_WITH_JWT_SECRET` | ✅ Placeholder |
| `SUPABASE_SERVICE_ROLE_KEY` | `REPLACE_WITH_SERVICE_ROLE_KEY` | ✅ Placeholder |
| `DATABASE_URL` | `postgresql+asyncpg://USER:...` | ✅ Placeholder |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | `REPLACE_WITH_FERNET_KEY` | ✅ Placeholder |
| `RAZORPAY_KEY_ID` | `rzp_live_REPLACE...` | ✅ Placeholder |
| `RAZORPAY_SECRET` | `REPLACE_WITH_LIVE_RAZORPAY_SECRET` | ✅ Placeholder |

---

### `.env.example` — ✅ Committed to git

**Status:** ✅ UPDATED (this session — rewritten for v2.0)

Safe template with placeholder values. Contains all 18 variables from the Settings model. No real secrets. Correctly annotated with generation instructions for Fernet key and JWT secret.

---

### `auxin-frontend/.env.local` — gitignored

| Variable | Set? |
|----------|------|
| `NEXT_PUBLIC_API_URL` | ✅ `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `https://snjqxpelsbsvytxezwne.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ `sb_publishable_g0iWwspd0NZs3vnnmU43VQ_tM1fKc9a` |
| `NEXT_PUBLIC_APP_ENV` | ✅ `development` |
| `NEXT_PUBLIC_ADMIN_URL` | ✅ `http://localhost:3001` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ `rzp_test_T0pmjmofHEnu9p` |

---

### `auxin-admin/.env.local` — gitignored

| Variable | Set? |
|----------|------|
| `NEXT_PUBLIC_API_URL` | ✅ `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `https://snjqxpelsbsvytxezwne.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ `sb_publishable_g0iWwspd0NZs3vnnmU43VQ_tM1fKc9a` |
| `NEXT_PUBLIC_APP_ENV` | ✅ `development` |

---

## Duplicate Variables

| Variable | Found In | Notes |
|----------|----------|-------|
| `DATABASE_URL` | `.env`, `.env.development` | Expected — each env file overrides |
| `RAZORPAY_KEY_ID` | `.env`, `.env.development`, `.env.example` | Expected |

No true duplicates within a single file.

---

## Missing Variables

| Variable | Missing Where | Impact |
|----------|--------------|--------|
| `DEMO_DATABASE_URL` | `.env.development` | None — `DEMO_MODE=false` (default) |
| `PRODUCT_EXPIRY_DAYS` | `.env.development` | None — has Settings default |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | `.env.development` (blank) | Acceptable — encryption disabled in dev |

---

## Stale/Unused Variables (removed this session)

The following variables appeared in old env files but **do NOT exist** in the current `Settings` model. They have been removed from all env files:

- `JWT_SECRET` ← replaced by Supabase JWT validation
- `ACCESS_TOKEN_EXPIRY_MINUTES` ← no longer issued internally
- `REFRESH_TOKEN_EXPIRY_DAYS` ← refresh tokens removed
- `BCRYPT_ROUNDS` ← hardcoded at 12 in `security.py`
- `OTP_EXPIRY_MINUTES` ← auth OTP system removed
- `OTP_MAX_REQUESTS_PER_WINDOW` ← removed
- `OTP_RATE_LIMIT_WINDOW_MINUTES` ← removed
- `OTP_MAX_VERIFICATION_ATTEMPTS` ← removed

---

## Verdict

| Check | Status |
|-------|--------|
| Real secrets in committed files | ✅ NONE |
| All required vars set in dev | ✅ YES |
| .env.example matches Settings model | ✅ YES |
| Stale v1 variables removed | ✅ YES |
| Duplicate detection | ✅ No unexpected duplicates |
