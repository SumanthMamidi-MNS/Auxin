# Auxin v2.0 — Demo Mode Architecture

Investor-safe sandboxed mode that lets stakeholders interact with the full Auxin platform without any risk to production data.

---

## Design Principles

1. **Zero code duplication** — Same UI, same API, same business logic. Only the database differs.
2. **Same authentication** — Supabase Auth is shared (auth is read-only from a data perspective).
3. **Visually obvious** — The admin portal displays a permanent amber "SANDBOX" banner. There is no way to miss that demo mode is active.
4. **One-switch activation** — Set two env vars, redeploy. That's it.
5. **Guaranteed isolation** — Production `DATABASE_URL` is never referenced when `DEMO_MODE=true`.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    DEMO MODE = true                       │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐                      │
│  │  Frontend   │    │    Admin    │                      │
│  │  (Vercel)   │    │   (Vercel)  │◄── Amber SANDBOX     │
│  └──────┬──────┘    └──────┬──────┘    banner visible    │
│         │                  │                             │
│         └──────────┬───────┘                             │
│                    ▼                                      │
│           ┌────────────────┐                             │
│           │  FastAPI       │                             │
│           │  Backend       │                             │
│           │  (Render)      │                             │
│           │                │                             │
│           │  DEMO_MODE=true│                             │
│           └───────┬────────┘                             │
│                   │                                      │
│         ┌─────────▼──────────────────────────────┐      │
│         │                                        │      │
│    ┌────▼────┐                           ┌───────▼───┐  │
│    │  PROD   │                           │  SANDBOX  │  │
│    │  Neon   │ ◄── NEVER TOUCHED         │   Neon    │  │
│    │   DB    │    in demo mode           │    DB     │◄─┤
│    └─────────┘                           └───────────┘  │
│                                                          │
│  Same Supabase Auth (read-only, safe for both modes)    │
└──────────────────────────────────────────────────────────┘
```

---

## How It Works

### Backend (`app/db/session.py`)

At server startup, the database engine is created conditionally:

```python
if settings.DEMO_MODE and settings.DEMO_DATABASE_URL:
    _active_db_url = settings.DEMO_DATABASE_URL
    logging.warning("DEMO MODE ACTIVE — connected to sandbox database.")
else:
    _active_db_url = settings.DATABASE_URL

engine = create_async_engine(_active_db_url, ...)
```

This means:
- When `DEMO_MODE=false` → production `DATABASE_URL` is used (normal operation)
- When `DEMO_MODE=true` + `DEMO_DATABASE_URL` is set → sandbox DB is used exclusively
- The production `DATABASE_URL` is never accessed in demo mode

### Admin Portal (`DemoBanner.tsx`)

When `NEXT_PUBLIC_DEMO_MODE=true`, the admin shell renders a permanent amber banner at the top of every page:

```
⚠ DEMO MODE — All actions affect sandbox data only. Production data is completely isolated and untouched.  [SANDBOX]
```

The banner:
- Is rendered above all content (even the sidebar)
- Cannot be dismissed
- Has `role="alert"` for accessibility
- Disappears automatically when `NEXT_PUBLIC_DEMO_MODE=false`

---

## Activation Guide

### Step 1: Create Sandbox Database

In the Neon dashboard:
1. Create a new project (or branch) for the sandbox
2. Copy the sandbox connection string

### Step 2: Run Migrations on Sandbox

```bash
# Set sandbox URL and run migrations
DEMO_DATABASE_URL="postgresql+asyncpg://..." alembic upgrade head
```

### Step 3: Seed Demo Data

Create realistic data in the sandbox so investors can explore the full platform:

```sql
-- Example: Insert a demo farmer
INSERT INTO users (phone, name, role, status, supabase_uid, created_at, updated_at)
VALUES ('+919876543210', 'Ravi Kumar', 'farmer', 'approved', 'demo-farmer-uid', NOW(), NOW());

-- Example: Insert demo products
INSERT INTO products (farmer_id, name, description, price_per_unit, unit, stock_quantity, is_active, created_at, updated_at)
VALUES (1, 'Fresh Tomatoes', 'Farm fresh tomatoes', 40.00, 'kg', 500, true, NOW(), NOW());
```

Or create a seed script at `scripts/seed_demo.py`.

### Step 4: Set Backend Environment Variables (Render)

In Render Dashboard → Environment:
```
DEMO_MODE=true
DEMO_DATABASE_URL=postgresql+asyncpg://<sandbox connection string>
```

### Step 5: Set Admin Environment Variable (Vercel)

In Vercel Dashboard → Admin project → Environment Variables:
```
NEXT_PUBLIC_DEMO_MODE=true
```

### Step 6: Redeploy Both Services

```bash
# Trigger Render redeploy: Render Dashboard → Manual Deploy
# Trigger Vercel redeploy: Vercel Dashboard → Deployments → Redeploy
```

### Step 7: Verify

1. Check backend: `GET /health` → `"demo_mode": true`
2. Check admin portal: amber "DEMO MODE" banner should be visible
3. Create a test order → confirm it appears in sandbox, NOT in production

---

## Deactivation

To return to production mode:

1. Set `DEMO_MODE=false` in Render env vars
2. Set `NEXT_PUBLIC_DEMO_MODE=false` in Vercel env vars
3. Redeploy both services

```
GET /health → "demo_mode": false  ✅
Admin portal → no amber banner    ✅
```

---

## Safety Guarantees

| Guarantee | How It's Enforced |
|-----------|-------------------|
| Production DB never touched during demo | `session.py` switches DB at startup; production URL is never passed to the engine |
| Always visible indicator in admin | `DemoBanner.tsx` is non-dismissible, rendered at top of every admin page |
| Backend confirms demo mode in health check | `GET /health` returns `"demo_mode": true/false` |
| Startup warning in logs | `"DEMO MODE ACTIVE"` warning logged at server startup |
| Same auth (safe) | Supabase Auth is read-only: creating sessions doesn't mutate data |

---

## Limitations

| Limitation | Notes |
|------------|-------|
| Payments | Razorpay test mode should be used during demos. Real payment processing is not appropriate for demo data. |
| SMS/Push notifications | Any SMS/notification service will send real messages unless also sandboxed. |
| File uploads | If Supabase Storage is used, uploads go to the same bucket unless storage is also separated. |

---

## Future Enhancement

For a fully isolated demo, consider:
- A separate Supabase project (isolated auth + storage)
- A separate Razorpay test account
- A feature flag system for toggling specific features

For MVP investor demos, the current database-only isolation is sufficient.
