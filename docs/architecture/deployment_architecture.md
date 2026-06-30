# Auxin v2.0 — Deployment Architecture

Complete guide to the Auxin v2.0 production deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUXIN v2.0 PRODUCTION                          │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│   Landing Page  │    Frontend     │   Admin Portal   │    Backend API  │
│   Vercel        │    Vercel       │   Vercel         │    Render       │
│   auxin.in      │  app.auxin.in   │  admin.auxin.in  │  api.auxin.in   │
│                 │                 │                  │                 │
│   Next.js       │   Next.js 14    │   Next.js 14     │   FastAPI       │
│   Static/SSG    │   Customer      │   Admin RBAC     │   SQLAlchemy    │
│                 │   Farmer        │   5 Admin roles  │   asyncpg       │
│                 │   Delivery      │   Payments, etc. │   Alembic       │
└─────────────────┴────────┬────────┴───────┬──────────┴────────┬────────┘
                           │                │                   │
                    ┌──────▼────────────────▼─────────┐        │
                    │        SUPABASE AUTH             │        │
                    │   Mobile + Password              │        │
                    │   JWT Sessions                   │        │
                    │   Role Metadata                  │        │
                    └──────────────────────────────────┘        │
                                                                │
                    ┌───────────────────────────────────────────▼─┐
                    │            NEON POSTGRESQL                   │
                    │   Singapore region (ap-southeast-1)          │
                    │   Production DB + Optional Sandbox DB        │
                    └───────────────────────────────────────────────┘
                                                                │
                    ┌───────────────────────────────────────────▼─┐
                    │              RAZORPAY                        │
                    │   Indian payment gateway                     │
                    │   Orders → Payments → Webhooks               │
                    └───────────────────────────────────────────────┘
```

---

## Services

### 1. Landing Page
| Item | Value |
|------|-------|
| **Platform** | Vercel |
| **URL** | `https://auxin.in` |
| **Framework** | Next.js (SSG/ISR) |
| **Source** | `auxin-landing/` |
| **Deploy** | Auto from `main` branch |

### 2. Customer/Farmer/Delivery Frontend
| Item | Value |
|------|-------|
| **Platform** | Vercel |
| **URL** | `https://app.auxin.in` |
| **Framework** | Next.js 14 (App Router) |
| **Source** | `auxin-frontend/` |
| **Deploy** | Auto from `main` branch |

### 3. Admin Portal
| Item | Value |
|------|-------|
| **Platform** | Vercel (separate project) |
| **URL** | `https://admin.auxin.in` |
| **Framework** | Next.js 14 (App Router) |
| **Source** | `auxin-admin/` |
| **Deploy** | Auto from `main` branch |

### 4. Backend API
| Item | Value |
|------|-------|
| **Platform** | Render |
| **URL** | `https://api.auxin.in` |
| **Framework** | FastAPI + Uvicorn |
| **Source** | Project root (`main.py`) |
| **Runtime** | Python 3.11 |
| **Health check** | `GET /health` |
| **Tier** | Free (auto-sleep after 15min inactivity) |

> ⚠️ **Cold Start:** Render free tier sleeps after 15 minutes. First request takes 30-60 seconds. The frontend handles this with the `ColdStartLoader` component. Upgrade to Render Starter ($7/mo) for always-on service.

### 5. Database
| Item | Value |
|------|-------|
| **Platform** | Neon |
| **Region** | Singapore (ap-southeast-1) |
| **Engine** | PostgreSQL 16 |
| **Driver** | asyncpg (async) |
| **Migrations** | Alembic |

### 6. Authentication
| Item | Value |
|------|-------|
| **Platform** | Supabase |
| **Method** | Mobile number + password |
| **Sessions** | JWT (validated by backend using JWT secret) |
| **Roles** | Stored in `app_metadata.role` |

### 7. Payments
| Item | Value |
|------|-------|
| **Gateway** | Razorpay |
| **Currency** | INR |
| **Mode** | Test (`rzp_test_*`) → Live (`rzp_live_*`) |

---

## Deployment Steps

### Backend (Render)

```bash
# 1. Connect GitHub repo in Render dashboard
# 2. Create a new "Web Service"
# 3. Set:
#    Build Command:  pip install -r requirements.txt
#    Start Command:  uvicorn main:app --host 0.0.0.0 --port $PORT
#    Health Check:   /health

# 4. Set all env vars in Render dashboard (see environment_variables.md)

# 5. Run database migrations (one-time, via Render Shell or locally):
alembic upgrade head
```

### Frontend & Admin (Vercel)

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy frontend
cd auxin-frontend
vercel --prod

# Deploy admin (separate Vercel project)
cd auxin-admin
vercel --prod
```

Or connect GitHub in the Vercel dashboard for automatic deployments on push.

**Custom domains in Vercel:**
1. Vercel Dashboard → Project → Settings → Domains
2. Add `app.auxin.in` (frontend) / `admin.auxin.in` (admin)
3. Update DNS records as instructed by Vercel

---

## Environment Variable Flow

```
Supabase Dashboard
  ├── SUPABASE_URL ──────────────────► Backend (SUPABASE_URL)
  │                                    Frontend (NEXT_PUBLIC_SUPABASE_URL)
  │                                    Admin (NEXT_PUBLIC_SUPABASE_URL)
  ├── SUPABASE_ANON_KEY ─────────────► Frontend (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  │                                    Admin (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ├── SUPABASE_JWT_SECRET ───────────► Backend only (validates tokens)
  └── SUPABASE_SERVICE_ROLE_KEY ────► Backend only (admin operations)

Neon Dashboard
  ├── DATABASE_URL ──────────────────► Backend only
  └── DEMO_DATABASE_URL ─────────────► Backend only (demo mode)

Razorpay Dashboard
  ├── RAZORPAY_KEY_ID ───────────────► Backend + Frontend (NEXT_PUBLIC_RAZORPAY_KEY_ID)
  └── RAZORPAY_SECRET ───────────────► Backend only
```

---

## Render Configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: auxin-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    healthCheckPath: /health
    envVars:
      - key: APP_ENV
        value: production
      - key: DEBUG
        value: false
      - key: DATABASE_URL
        sync: false   # Set manually in Render dashboard
      - key: SUPABASE_JWT_SECRET
        sync: false
      # ... (all other secrets set manually)
```

---

## Security Headers

Both Vercel deployments apply these headers to every response:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Backend additionally sets via `SecurityHeadersMiddleware`:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-Frame-Options: DENY`

---

## Upgrading Render (Recommended for Production)

| Tier | Price | Cold Start | Memory | Recommendation |
|------|-------|------------|--------|----------------|
| Free | $0/mo | 30-60s | 512MB | Development/Demo only |
| Starter | $7/mo | None | 512MB | **Minimum for production** |
| Standard | $25/mo | None | 2GB | Recommended for scale |

To upgrade: Render Dashboard → Service → Settings → Instance Type.
