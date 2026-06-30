# Auxin v2.0 — Production Go-Live Checklist

Step-by-step guide to launching Auxin v2.0 in production.

> Complete items in order. Each section depends on the previous.

---

## Phase 1: Infrastructure Setup

### 1.1 Neon PostgreSQL (Database)

- [ ] Create a Neon account at [neon.tech](https://neon.tech)
- [ ] Create a new project in the **Singapore (ap-southeast-1)** region
- [ ] Copy the connection string (asyncpg format)
- [ ] Save it as `DATABASE_URL` (backend secret)

**Connection string format:**
```
postgresql+asyncpg://neondb_owner:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 1.2 Supabase (Authentication)

- [ ] Create a Supabase account at [supabase.com](https://supabase.com)
- [ ] Create a new project in the **Southeast Asia (Singapore)** region
- [ ] Navigate to: Project Settings → API
- [ ] Copy:
  - `Project URL` → `SUPABASE_URL` (backend + frontend)
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend + admin)
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- [ ] Navigate to: Project Settings → API → JWT Settings
- [ ] Copy `JWT Secret` → `SUPABASE_JWT_SECRET` (backend only, **critical**)

### 1.3 Razorpay (Payments)

- [ ] Create/log in to Razorpay at [dashboard.razorpay.com](https://dashboard.razorpay.com)
- [ ] Switch to **Live Mode** (not Test Mode)
- [ ] Navigate to: Settings → API Keys → Generate Key
- [ ] Copy:
  - `Key ID` → `RAZORPAY_KEY_ID` (backend + frontend)
  - `Key Secret` → `RAZORPAY_SECRET` (backend only)
- [ ] Set webhook URL: `https://api.auxin.in/api/v1/payments/webhook`

---

## Phase 2: Backend Deployment (Render)

### 2.1 Create Render Service

- [ ] Go to [render.com](https://render.com) and create an account
- [ ] Click **New** → **Web Service**
- [ ] Connect your GitHub repository
- [ ] Configure:
  - **Name:** `auxin-api`
  - **Runtime:** Python 3
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`
  - **Health Check Path:** `/health`

### 2.2 Set Backend Environment Variables (Render Dashboard)

Navigate to your service → **Environment** tab and add:

| Variable | Value |
|----------|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `LOG_LEVEL` | `INFO` |
| `ALLOWED_ORIGINS` | `https://app.auxin.in,https://admin.auxin.in` |
| `DATABASE_URL` | *(your Neon connection string)* |
| `SUPABASE_URL` | *(your Supabase project URL)* |
| `SUPABASE_JWT_SECRET` | *(your Supabase JWT secret)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key)* |
| `RAZORPAY_KEY_ID` | *(your live Razorpay key)* |
| `RAZORPAY_SECRET` | *(your Razorpay secret)* |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | *(generate with: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)* |

### 2.3 Run Database Migrations

```bash
# Option A: Via Render Shell (Render Dashboard → Shell tab)
alembic upgrade head

# Option B: Locally with production DATABASE_URL
DATABASE_URL="<your neon url>" alembic upgrade head
```

- [ ] Confirm: `INFO  [alembic.runtime.migration] Running upgrade ... -> ...`
- [ ] Confirm: `INFO  [alembic.runtime.migration] Running upgrade ... -> head`

### 2.4 Verify Backend Health

```bash
curl https://api.auxin.in/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "env": "production",
  "demo_mode": false,
  "db": "connected",
  "uptime_s": 12.3
}
```

- [ ] Status is `"ok"`
- [ ] DB is `"connected"`
- [ ] `demo_mode` is `false`

---

## Phase 3: Frontend Deployment (Vercel)

### 3.1 Deploy Frontend

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Import the repository
- [ ] Set **Root Directory** to `auxin-frontend`
- [ ] Set environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.auxin.in/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | *(your Supabase project URL)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your Supabase anon key)* |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | *(your live Razorpay key ID)* |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

- [ ] Deploy and verify build passes (0 TypeScript errors)
- [ ] Set custom domain: `app.auxin.in`

### 3.2 Deploy Admin Portal

- [ ] Create a **separate** Vercel project
- [ ] Set **Root Directory** to `auxin-admin`
- [ ] Set same Supabase variables + API URL
- [ ] Set `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] Deploy and verify build passes
- [ ] Set custom domain: `admin.auxin.in`

---

## Phase 4: Create First Admin User

### 4.1 Create Admin in Supabase Auth

```bash
# Via Supabase Dashboard → Authentication → Users → Add User
# Or via Supabase service role API:
curl -X POST https://<your-project>.supabase.co/auth/v1/admin/users \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919999999999",
    "password": "SecurePassword123!",
    "app_metadata": { "role": "super_admin" }
  }'
```

### 4.2 Create Admin Profile in Database

```sql
-- Run this in Neon SQL editor or via psql
INSERT INTO users (
  supabase_uid,
  phone,
  name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '<supabase_user_uid_from_step_4.1>',
  '+919999999999',
  'Admin User',
  'super_admin',
  'approved',
  NOW(),
  NOW()
);
```

---

## Phase 5: Verification

### 5.1 Auth Flow

- [ ] Visit `https://app.auxin.in/auth`
- [ ] Sign up as a new customer (mobile + password)
- [ ] Confirm you land on pending approval page (if approval required)
- [ ] Sign in as admin at `https://admin.auxin.in/auth`
- [ ] Confirm admin dashboard loads

### 5.2 Order Flow

- [ ] As a farmer: log in, create a product
- [ ] As a customer: browse and place an order
- [ ] Confirm order appears in admin dashboard

### 5.3 Payment Flow (Test Mode First)

- [ ] Use test Razorpay key (`rzp_test_*`) for first verification
- [ ] Complete a test payment using Razorpay test card: `4111 1111 1111 1111`
- [ ] Confirm payment status updates to "paid" in admin payments page
- [ ] Switch to live keys only after test flow is confirmed

### 5.4 Health Check

- [ ] `GET https://api.auxin.in/health` → 200 OK
- [ ] `GET https://app.auxin.in/api/health` → 200 OK (frontend proxy)

---

## Phase 6: Post-Launch

- [ ] **Set up uptime monitoring:** [UptimeRobot](https://uptimerobot.com) → monitor `https://api.auxin.in/health` every 5 minutes
- [ ] **Upgrade Render:** Consider Starter ($7/mo) to eliminate cold starts for users
- [ ] **Error tracking:** Set up [Sentry](https://sentry.io) for both Next.js apps and FastAPI
- [ ] **Vercel Analytics:** Enable in Vercel Dashboard → Analytics for frontend performance metrics
- [ ] **Backup strategy:** Enable Neon branching for point-in-time recovery

---

## Rollback Plan

If something goes wrong after deployment:

```bash
# Rollback to previous Alembic migration
alembic downgrade -1

# Rollback Vercel deployment
vercel rollback [deployment-id]

# Rollback Render: Render Dashboard → Deploys → Previous Deploy → Rollback
```
