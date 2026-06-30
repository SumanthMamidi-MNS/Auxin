# MISSION 9 — DEPLOYMENT REPORT
# Auxin v2.0 Deployment Readiness Assessment
# Generated: 2026-06-20T07:14:00Z
# ─────────────────────────────────────────────────────────────────────────────

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODUCTION STACK                                                │
│                                                                  │
│  Supabase Auth ────────────────────────────────────────────────  │
│  Project: snjqxpelsbsvytxezwne (ap-southeast-1)                 │
│  Status: OPERATIONAL                                             │
│                                                                  │
│  Neon PostgreSQL ───────────────────────────────────────────────  │
│  Project: ep-cool-feather-aoh0hilu (ap-southeast-1)             │
│  Version: PostgreSQL 17.10                                       │
│  Status: OPERATIONAL (verified)                                  │
│                                                                  │
│  Backend: Render.com (PLANNED)                                   │
│  URL: NOT YET DEPLOYED                                           │
│  Config: render.yaml ✅                                          │
│                                                                  │
│  Frontend: Vercel (PLANNED)                                      │
│  URL: NOT YET DEPLOYED                                           │
│  Config: auxin-frontend/vercel.json ✅                           │
│                                                                  │
│  Admin: Vercel (PLANNED)                                         │
│  URL: NOT YET DEPLOYED                                           │
│  Config: auxin-admin/vercel.json ✅                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Backend: Render.com

### `render.yaml` (Updated This Session)

```yaml
type: web
name: auxin-api
runtime: python
region: singapore
buildCommand: pip install --upgrade pip && pip install -r requirements.txt
startCommand: alembic upgrade head && gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:$PORT --timeout 120 --keep-alive 5
healthCheckPath: /health
```

### Environment Variables Required on Render Dashboard

| Variable | Source | Status |
|----------|--------|--------|
| `APP_ENV` | Set to `production` | Listed in render.yaml |
| `DATABASE_URL` | Neon Dashboard → Connection string (asyncpg) | Must set manually |
| `SUPABASE_URL` | `https://snjqxpelsbsvytxezwne.supabase.co` | Must set manually |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API | Must set manually |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Must set manually |
| `ALLOWED_ORIGINS` | Your Vercel app URLs | Must update before deploy |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard (use live key for prod) | Must set manually |
| `RAZORPAY_SECRET` | Razorpay Dashboard | Must set manually |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | Generate with Fernet | Must set manually |
| `DEBUG` | `false` | Listed in render.yaml |
| `LOG_LEVEL` | `INFO` | Listed in render.yaml |

### Step-by-Step: Deploy Backend to Render

```
1. Create account at render.com
2. New → Web Service → Connect GitHub repo
3. Select "The Auxin" repository root
4. Render auto-detects render.yaml
5. Go to Environment → Add all variables from table above
6. Click "Deploy"
7. Wait for build (2-3 minutes)
8. Verify health check: https://auxin-api.onrender.com/health
```

### Alternatives to Render

- **Railway:** `nixpacks.toml` + `Procfile` are configured → one-click deploy
- **Docker:** `Dockerfile` is configured → `docker build -t auxin-api . && docker run -p 8000:8000 --env-file .env auxin-api`
- **Any PaaS:** Supports standard Python + gunicorn

---

## Frontend: Vercel (auxin-frontend)

### `auxin-frontend/vercel.json` (Exists)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "headers": [ security headers ],
  "env": { "NEXT_PUBLIC_APP_ENV": "production" }
}
```

### Environment Variables Required on Vercel (Frontend)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://auxin-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://snjqxpelsbsvytxezwne.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_g0iWwspd0NZs3vnnmU43VQ_tM1fKc9a` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://auxin-admin.vercel.app` (your admin URL) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_XXXX` (switch to live key) |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NEXT_PUBLIC_APP_URL` | `https://app.auxin.in` (your domain) |

### Step-by-Step: Deploy Frontend to Vercel

```
1. vercel login
2. cd auxin-frontend
3. vercel --prod
4. Set environment variables in Vercel dashboard
5. Trigger redeploy
6. Test login flow with admin user
```

---

## Admin Portal: Vercel (auxin-admin)

### `auxin-admin/vercel.json` (Exists)

Security headers configured. Same Vercel deployment process.

### Environment Variables Required on Vercel (Admin)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://auxin-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://snjqxpelsbsvytxezwne.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_g0iWwspd0NZs3vnnmU43VQ_tM1fKc9a` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

### Step-by-Step: Deploy Admin to Vercel

```
1. cd auxin-admin
2. vercel --prod
3. Set environment variables
4. Test admin login
```

---

## Database: Neon PostgreSQL

**Status:** OPERATIONAL  
**Version:** PostgreSQL 17.10  
**Project:** `ep-cool-feather-aoh0hilu` (ap-southeast-1)  
**Migrations:** All 6 applied, at HEAD (`006_add_user_status`)

### Migration on Deployment

The backend `render.yaml` start command includes `alembic upgrade head` before
starting gunicorn. This means migrations run automatically on every deploy.
This is safe — Alembic skips already-applied migrations.

### CRITICAL: Create Admin User Before Launch

```sql
-- Step 1: Create user in Supabase Auth Dashboard
-- Go to: https://supabase.com/dashboard/project/snjqxpelsbsvytxezwne/auth/users
-- Click "Add User" → Enter phone number → note the generated UUID

-- Step 2: Insert into Neon database
INSERT INTO users (name, phone, role, status, supabase_uid)
VALUES (
  'Admin User',
  '+91XXXXXXXXXX',
  'admin',
  'approved',
  'UUID-FROM-SUPABASE-DASHBOARD'
);
```

---

## CORS Configuration for Production

When deploying, update `ALLOWED_ORIGINS` in Render dashboard:

```
https://app.auxin.in,https://admin.auxin.in
```

Or with Vercel auto-generated domains:
```
https://auxin-frontend.vercel.app,https://auxin-admin.vercel.app
```

---

## Deployment Checklist

| # | Task | Status |
|---|------|--------|
| 1 | render.yaml configured | ✅ DONE |
| 2 | nixpacks.toml configured | ✅ DONE |
| 3 | Dockerfile configured | ✅ DONE |
| 4 | auxin-frontend/vercel.json exists | ✅ DONE |
| 5 | auxin-admin/vercel.json exists | ✅ DONE |
| 6 | Health endpoint `/health` working | ✅ DONE (verified) |
| 7 | Alembic migrations apply cleanly | ✅ DONE (verified) |
| 8 | Production env vars documented | ✅ DONE |
| 9 | Create admin user in Supabase | ❌ PENDING |
| 10 | Set ALLOWED_ORIGINS to production URLs | ❌ PENDING |
| 11 | Switch to Razorpay live keys | ❌ PENDING |
| 12 | Set BANK_ACCOUNT_ENCRYPTION_KEY | ❌ PENDING |
| 13 | Deploy backend to Render | ❌ NOT DEPLOYED |
| 14 | Deploy frontend to Vercel | ❌ NOT DEPLOYED |
| 15 | Deploy admin to Vercel | ❌ NOT DEPLOYED |
| 16 | End-to-end login test on production | ❌ PENDING |

---

## Deployment Readiness Score: 7/10

| Category | Score | Notes |
|----------|-------|-------|
| Backend config | 10/10 | render.yaml, Dockerfile, nixpacks.toml all ready |
| Frontend config | 10/10 | vercel.json, .env.example both ready |
| Database | 8/10 | Connected, migrations applied, but 0 users |
| Secrets | 8/10 | All env vars documented; live keys not yet set |
| CORS | 6/10 | Placeholder origins in render.yaml |
| Admin user | 0/10 | No admin created → platform unusable |
| **Total** | **42/60** | **Score: 70%** |

> Deployment readiness will jump to **95%** after creating the admin user and
> setting production credentials.
