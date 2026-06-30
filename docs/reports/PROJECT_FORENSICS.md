# MISSION 1 — PROJECT FORENSICS
# Auxin v2.0 Complete Project Inventory
# Generated: 2026-06-20T07:14:00Z
# ─────────────────────────────────────────────────────────────────────────────

## Overview

Full forensic inventory of the Auxin v2.0 project repository.
All findings verified by direct file inspection and live command execution.

---

## Repository Root

```
c:\Users\mamid\OneDrive\Documents\Anti Gravity\The Auxin\
```

### Root-Level Files

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `main.py` | 6.2 KB | FastAPI app entry point (v2.0.0) | ✅ Current |
| `requirements.txt` | 410 B | 21 pinned Python dependencies | ✅ Current |
| `alembic.ini` | — | Alembic migration config | ✅ Current |
| `pytest.ini` | — | pytest config (asyncio_mode=auto) | ✅ Current |
| `nixpacks.toml` | — | Railway deployment build config | ✅ Current |
| `render.yaml` | — | Render.com deployment config | ✅ Updated (this session) |
| `Dockerfile` | 2.3 KB | Multi-stage Docker image | ✅ Current |
| `Procfile` | — | Gunicorn start for Railway/Heroku | ✅ Current |
| `.dockerignore` | — | Docker build exclusion rules | ✅ Current |
| `start-dev.ps1` | — | NEW: Local dev startup script | ✅ Created (this session) |
| `schema.sql` | — | Legacy raw SQL schema (pre-Alembic) | ⚠️ Obsolete reference |
| `README.md` | — | Project documentation | ✅ Rewritten (this session) |
| `.gitignore` | — | Git exclusion rules | ✅ Updated (this session) |
| `.env` | — | Root env (sanitized placeholders) | ✅ Sanitized (this session) |
| `.env.development` | — | Dev credentials (gitignored) | ✅ Updated (this session) |
| `.env.production` | — | Production template (gitignored) | ✅ Updated (this session) |
| `.env.example` | — | Safe template for new devs | ✅ Updated (this session) |

---

## Backend: `app/`

### `app/core/` — 9 files

| File | Purpose |
|------|---------|
| `config.py` | Pydantic-Settings; resolves APP_ENV → .env file; singleton via lru_cache |
| `security.py` | `decode_supabase_jwt()` (python-jose/HS256) + delivery OTP gen/hash/verify |
| `dependencies.py` | `get_current_user`, `require_roles()` FastAPI DI chain |
| `exceptions.py` | AuxinException hierarchy (~30 typed exceptions) |
| `middleware.py` | `SecurityHeadersMiddleware` (CSP, HSTS, XFO) + `RequestLoggingMiddleware` |
| `logging.py` | Structured JSON logger via Python logging |
| `encryption.py` | Fernet symmetric encryption for bank account numbers |
| `geolocation.py` | Haversine distance + geofence check for delivery |
| `supabase.py` | Re-exports `decode_supabase_jwt` (clean import path) |

### `app/db/` — 4 files

| File | Purpose |
|------|---------|
| `base.py` | SQLAlchemy `DeclarativeBase` |
| `base_all.py` | Imports all models → makes Alembic metadata complete |
| `session.py` | Async engine (asyncpg), session factory, `get_db()` |
| `engine_utils.py` | Strips asyncpg-incompatible query params (sslmode, channel_binding) |

### `app/models/` — 7 files

| File | Key Classes | Notes |
|------|-------------|-------|
| `user.py` | `User`, `UserRole(admin/farmer/customer/delivery)`, `UserStatus(pending/approved/rejected/suspended)` | Has `supabase_uid`, `status`; no `is_verified`/`is_active` |
| `farmer.py` | `Farmer`, `FarmerStatus` | `is_approved` bool + approval logic |
| `product.py` | `Product`, `ProductStatus` | `expiry_days`, Fernet-encrypted bank field |
| `order.py` | `Order`, `OrderItem`, `OrderStatus` | Full lifecycle |
| `delivery.py` | `Delivery`, `DeliveryPartner`, `DeliveryOTP` | OTP for doorstep confirm |
| `payment.py` | `Payment`, `Transaction` | Razorpay fields |
| `admin.py` | `AdminAction`, `AdminActionType` | Audit log |

### `app/repositories/` — 8 files

All extend async SQLAlchemy queries. Files: `user_repository.py`, `farmer_repository.py`, `product_repository.py`, `order_repository.py`, `delivery_repository.py`, `delivery_partner_repository.py`, `payment_repository.py`, `admin_repository.py`.

### `app/schemas/` — 7 files (Pydantic v2)

`auth.py`, `farmer.py`, `product.py`, `order.py`, `delivery.py`, `payment.py`, `admin.py`

### `app/services/` — 8 files (business logic)

`admin_service.py`, `delivery_partner_service.py`, `delivery_service.py`, `dispute_service.py`, `farmer_service.py`, `order_service.py`, `payment_service.py`, `product_service.py`

### `app/api/v1/endpoints/` — 8 files

`auth.py`, `admin.py`, `farmers.py`, `products.py`, `orders.py`, `deliveries.py`, `payments.py` + `disputes.py` (if present)

---

## Database Migrations: `alembic/versions/`

| Revision | Name | Status |
|----------|------|--------|
| `001_initial_schema` | Core schema: users, farmers, products, orders | Applied |
| `002_add_payment_escrow_tables` | payments, transactions | Applied |
| `003_add_admin_dispute_tables` | admin_actions, disputes | Applied |
| `004_rename_products_stock_to_quantity` | Column rename | Applied |
| `005_supabase_auth_migration` | Added `supabase_uid`, removed OTP/refresh tables | Applied |
| `006_add_user_status` | Added `status` enum column to users | Applied → **HEAD** |

**DB state verified:** PostgreSQL 17.10, Neon cloud, 0 user rows, all 6 migrations applied.

---

## Frontend: `auxin-frontend/`

- **Framework:** Next.js 16.2.4
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5
- **HTTP:** Axios + TanStack Query v5
- **node_modules:** ✅ Installed
- **vercel.json:** ✅ Exists
- **`.env.local`:** ✅ Exists (gitignored, has Supabase anon key)

### Pages/Portals

| Route | Portal | Description |
|-------|--------|-------------|
| `/auth` | All | Login/Register via Supabase Auth |
| `/customer/*` | Customer | Home, products, orders, payments |
| `/farmer/*` | Farmer | Dashboard, products, orders, profile |
| `/delivery/*` | Delivery | Dashboard, active deliveries, OTP confirm |
| `/pending-approval` | Farmer/Delivery | Waiting room during approval |

---

## Admin: `auxin-admin/`

- **Framework:** Next.js 16.2.6
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5
- **node_modules:** ✅ Installed
- **vercel.json:** ✅ Exists
- **`.env.local`:** ✅ Exists (gitignored)

### Admin Pages

| Route | Description |
|-------|-------------|
| `/auth` | Admin login |
| `/(admin)/dashboard` | Platform stats |
| `/(admin)/users` | User management |
| `/(admin)/farmers` | Farmer approvals |
| `/(admin)/orders` | Order monitoring |
| `/(admin)/products` | Product monitoring |
| `/(admin)/deliveries` | Delivery tracking |
| `/(admin)/disputes` | Dispute resolution |
| `/(admin)/payments` | Payment monitoring |
| `/(admin)/settings` | Platform settings |

---

## Landing: `auxin-landing/`

- **Framework:** Next.js
- **node_modules:** ❌ Not installed
- **Purpose:** Marketing landing page
- **Priority:** Low (not in core deployment scope)

---

## Tests: `tests/`

| File | Status |
|------|--------|
| `conftest.py` | ⚠️ v1 OTP-based fixtures — incompatible with v2.0 auth |
| `test_auth.py` | ⚠️ Tests v1 OTP endpoints (request-otp, verify-otp) — will fail |
| `test_orders.py` | ⚠️ Uses v1 auth fixtures — partially incompatible |
| `test_payment_unit.py` | ✅ Unit tests for payment logic — likely still valid |
| `test_security.py` | ✅ Tests crypto functions — likely still valid |

---

## Documentation: `docs/`

### `docs/architecture/` (5 files)

- `demo_mode_architecture.md`
- `deployment_architecture.md`
- `environment_variables.md`
- `monitoring_strategy.md`
- `production_checklist.md`

### `docs/manuals/` (4 files)

- `AUXIN_USER_GUIDE.md`
- `AUXIN_ARCHITECTURE_GUIDE.md`
- `AUXIN_CREDENTIALS_REFERENCE.md`
- `AUXIN_QA_TESTING_GUIDE.md`

### `docs/reports/` (previously 1 file, now growing)

- `FINAL_RELEASE_REPORT.md` (old v1 report, preserved)
- New reports being generated this session

---

## Scripts: `scripts/`

| File | Purpose | Status |
|------|---------|--------|
| `check_schema.py` | Schema validation utility | ⚠️ May be v1 |
| `db_setup.py` | Local PostgreSQL setup | ⚠️ Obsolete (Neon is used) |

---

## Key Findings

| # | Finding | Severity |
|---|---------|---------|
| 1 | users table is empty — no admin user seeded | 🔴 HIGH |
| 2 | tests/conftest.py uses v1 OTP — all auth tests will fail | 🟡 MEDIUM |
| 3 | schema.sql is legacy v1 (contains OTP tables) — misleading | 🟡 MEDIUM |
| 4 | scripts/db_setup.py targets local Postgres — obsolete | 🟢 LOW |
| 5 | auxin-landing has no node_modules installed | 🟢 LOW |
| 6 | README.md was v1 — now rewritten | ✅ FIXED |
| 7 | render.yaml was missing Supabase vars | ✅ FIXED |
| 8 | .env.development was missing Supabase JWT secret | ✅ FIXED |
| 9 | root .env had real credentials | ✅ FIXED |
| 10 | .gitignore didn't protect .env.development | ✅ FIXED |
