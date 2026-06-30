# Auxin v2.0 — Farm-fresh Marketplace

> **Farm-to-doorstep marketplace connecting farmers, customers, and delivery partners**  
> Full-stack platform: FastAPI backend · Next.js frontends · Supabase Auth · Supabase PostgreSQL · Razorpay

[![Backend](https://img.shields.io/badge/Backend-FastAPI%200.111-009688)](https://fastapi.tiangolo.com)
[![Auth](https://img.shields.io/badge/Auth-Supabase-3ECF8E)](https://supabase.com)
[![DB](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E)](https://supabase.com)
[![Payments](https://img.shields.io/badge/Payments-Razorpay-02042B)](https://razorpay.com)

---

## 🏗️ Architecture Overview

```
                    ┌─────────────────────────────────────────────────┐
                    │                Supabase Auth                     │
                    │   Phone+Password → JWT tokens → session mgmt    │
                    └───────────────────┬─────────────────────────────┘
                                        │ JWT
              ┌─────────────────────────▼─────────────────────────────┐
              │              FastAPI Backend (port 8000)               │
              │   JWT decode → DB user lookup → RBAC → business logic │
              │   Supabase PostgreSQL (asyncpg) · Razorpay · Alembic  │
              └────────────┬──────────────────────────┬───────────────┘
                           │                          │
        ┌──────────────────▼──────┐    ┌──────────────▼──────────────┐
        │  auxin-frontend         │    │  auxin-admin                │
        │  Next.js 16.2.4         │    │  Next.js 16.2.6             │
        │  Customer / Farmer /    │    │  Admin Dashboard            │
        │  Delivery portals       │    │  Governance & Monitoring    │
        │  port 3000              │    │  port 3001                  │
        └─────────────────────────┘    └─────────────────────────────┘
```

---

## 📁 Project Structure

```
The Auxin/
├── main.py                        # FastAPI application entry point
├── requirements.txt               # Pinned Python dependencies (21 packages)
├── alembic.ini                    # Database migration configuration
├── nixpacks.toml                  # Railway deployment config
├── render.yaml                    # Render.com deployment config
├── Dockerfile                     # Multi-stage Docker image
├── Procfile                       # Gunicorn startup for Railway/Heroku
├── start-dev.ps1                  # Local development startup script
├── pytest.ini                     # Test runner configuration
├── .env.example                   # Safe configuration template
│
├── alembic/
│   └── versions/                  # 6 migration files (001–006)
│       ├── 001_initial_schema.py
│       ├── 002_add_payment_escrow_tables.py
│       ├── 003_add_admin_dispute_tables.py
│       ├── 004_rename_products_stock_to_quantity.py
│       ├── 005_supabase_auth_migration.py
│       └── 006_add_user_status.py  ← CURRENT HEAD
│
├── app/
│   ├── core/
│   │   ├── config.py              # Pydantic-Settings: all env vars
│   │   ├── security.py            # JWT decode (python-jose) + delivery OTP
│   │   ├── dependencies.py        # get_current_user, require_roles DI
│   │   ├── exceptions.py          # AuxinException hierarchy (30+ types)
│   │   ├── middleware.py          # SecurityHeadersMiddleware + logging
│   │   ├── logging.py             # Structured JSON logger
│   │   ├── encryption.py          # Fernet encryption for bank accounts
│   │   ├── geolocation.py         # Geofence helpers
│   │   └── supabase.py            # Supabase JWT re-export
│   ├── db/
│   │   ├── base.py                # SQLAlchemy DeclarativeBase
│   │   ├── base_all.py            # Import all models → Alembic metadata
│   │   ├── session.py             # Async engine + session factory
│   │   └── engine_utils.py        # asyncpg URL builder
│   ├── models/                    # SQLAlchemy ORM models (7 files)
│   ├── repositories/              # Database query layer (8 files)
│   ├── schemas/                   # Pydantic v2 request/response schemas (7 files)
│   ├── services/                  # Business logic layer (8 services)
│   └── api/v1/
│       ├── router.py              # All routers + exception handlers
│       └── endpoints/             # 8 endpoint files
│
├── tests/                         # Test suite (pytest-asyncio)
├── scripts/                       # Utility scripts
├── docs/
│   ├── architecture/              # 5 architecture documents
│   ├── manuals/                   # User guide, credentials reference, QA guide
│   └── reports/                   # Release and audit reports
│
├── auxin-frontend/                # Next.js 16.2.4 — Customer/Farmer/Delivery
├── auxin-admin/                   # Next.js 16.2.6 — Admin Dashboard
└── auxin-landing/                 # Next.js — Marketing page
```

---

## ✨ Features

### Authentication (Supabase Auth)
- Mobile number + password authentication
- JWT session management (auto-refresh)
- Role-based access: `customer` | `farmer` | `delivery` | `admin`
- Account lifecycle: `pending` → `approved` | `rejected` | `suspended`
- Farmers and delivery partners require admin approval before access

### Customer Portal
- Browse and search farm-fresh products
- Place and track orders
- Razorpay payment integration (escrow model)
- Dispute filing

### Farmer Portal
- Product listings and inventory management
- Order management and acceptance
- Earnings dashboard
- Profile and bank account management

### Delivery Portal
- Order assignment and delivery tracking
- OTP-based delivery confirmation (separate from auth OTP)
- Earnings tracking

### Admin Dashboard
- Platform-wide user management (suspend/reinstate)
- Farmer approval workflow
- Order and payment monitoring
- Dispute resolution with optional Razorpay refund
- Audit log (all admin actions recorded)

---

## 🗄️ Database Schema

**Current Alembic head:** `006_add_user_status`

### `users` table
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| name | VARCHAR | NOT NULL |
| phone | VARCHAR | NOT NULL, UNIQUE |
| email | VARCHAR | NULLABLE |
| role | userrole enum | `customer\|farmer\|delivery\|admin` |
| status | userstatus enum | `pending\|approved\|rejected\|suspended` |
| supabase_uid | VARCHAR | Supabase Auth user UUID |
| created_at | TIMESTAMPTZ | NOT NULL |

All other tables: `farmers`, `products`, `orders`, `order_items`, `deliveries`, `delivery_partners`, `payments`, `transactions`, `disputes`, `admin_actions`

---

## ⚙️ Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase project (provides both Auth and PostgreSQL database)

### 1. Clone and set up Python environment

```powershell
# Create virtual environment
python -m venv venv

# Activate (PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure environment

```powershell
# Copy the example
Copy-Item .env.example .env.development

# Edit .env.development and fill in your real values
notepad .env.development
```

Required variables:
```env
# Get from: Supabase Dashboard → Project Settings → Database → URI
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_JWT_SECRET=<from Supabase Dashboard → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_SECRET=your_razorpay_test_secret
```

### 3. Run database migrations

```powershell
$env:APP_ENV = "development"
.\venv\Scripts\python.exe -m alembic upgrade head
```

### 4. Start the backend

```powershell
# Option A: Startup script (recommended)
.\start-dev.ps1

# Option B: Manual
$env:APP_ENV = "development"
.\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000
```

Backend available at: **http://localhost:8000**  
Swagger docs (dev only): **http://localhost:8000/docs**  
Health check: **http://localhost:8000/health**

### 5. Configure frontends

```powershell
# auxin-frontend
Copy-Item auxin-frontend\.env.example auxin-frontend\.env.local
notepad auxin-frontend\.env.local   # Fill in Supabase URL + anon key

# auxin-admin
Copy-Item auxin-admin\.env.example auxin-admin\.env.local
notepad auxin-admin\.env.local   # Fill in Supabase URL + anon key
```

### 6. Start frontends

```powershell
# Customer/Farmer/Delivery portal (port 3000)
cd auxin-frontend
npm install
npm run dev

# Admin dashboard (port 3001)
cd auxin-admin
npm install
npm run dev -- --port 3001
```

Or use the startup script to start everything:
```powershell
.\start-dev.ps1 -all
```

---

## 🔌 API Reference

### Base URL
- **Development:** `http://localhost:8000/api/v1`
- **Production:** `https://api.auxin.in/api/v1` *(when deployed)*

### Auth Endpoints (public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/sync-user` | Register/link user after Supabase signup |
| `GET` | `/auth/me` | Get current user profile |

### Customer Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | Browse products |
| `POST` | `/orders` | Place an order |
| `GET` | `/orders` | List my orders |
| `POST` | `/payments/create` | Initiate Razorpay payment |
| `POST` | `/payments/verify` | Verify payment signature |
| `POST` | `/disputes` | File a dispute |

### Farmer Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/farmers/profile` | Create farmer profile |
| `GET/PUT` | `/farmers/profile` | Manage profile |
| `POST` | `/farmers/products` | List a product |
| `GET` | `/farmers/orders` | View incoming orders |
| `PUT` | `/farmers/orders/{id}` | Accept/reject order |

### Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | List all users (paginated) |
| `PUT` | `/admin/users/{id}/suspend` | Suspend user |
| `PUT` | `/admin/users/{id}/reinstate` | Reinstate user |
| `GET` | `/admin/farmers/pending` | List pending farmer approvals |
| `PUT` | `/admin/farmers/{id}/approve` | Approve farmer |
| `PUT` | `/admin/farmers/{id}/reject` | Reject farmer |
| `GET` | `/admin/orders` | All orders (paginated) |
| `GET` | `/admin/payments` | All payments (paginated) |
| `GET` | `/admin/disputes` | All disputes (paginated) |
| `PUT` | `/admin/disputes/{id}` | Resolve/reject dispute |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness + DB connectivity check |

---

## 🛡️ Security Architecture

| Layer | Mechanism |
|---|---|
| **Authentication** | Supabase Auth (phone+password, JWT HS256) |
| **JWT validation** | `python-jose` decodes against `SUPABASE_JWT_SECRET` |
| **RBAC** | `require_roles()` FastAPI dependency injection |
| **Account gating** | `status` check: pending/rejected/suspended → 403 |
| **CORS** | Strict allowed origins, configured per environment |
| **Security headers** | CSP, HSTS, X-Frame-Options via middleware |
| **Data encryption** | Bank account numbers: Fernet symmetric encryption |
| **Delivery OTP** | bcrypt-hashed, 6-digit numeric, 60-min expiry |
| **Payment verification** | Razorpay HMAC signature validation |
| **SQL injection** | SQLAlchemy ORM with parameterized queries only |

---

## 🚀 Deployment

### Backend → Render.com

1. Create a new **Web Service** on Render
2. Connect to the repository
3. Set **Build command:** `pip install -r requirements.txt`
4. Set **Start command:** `alembic upgrade head && gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:$PORT --timeout 120`
5. Add these **Environment Variables** from the Render dashboard:

| Variable | Source |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Supabase Dashboard → Project Settings → Database → URI (asyncpg format) |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `ALLOWED_ORIGINS` | Your frontend + admin URLs |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard |
| `RAZORPAY_SECRET` | Razorpay Dashboard |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | Generate with Fernet |

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd auxin-frontend && vercel --prod
```

Add environment variables in the Vercel dashboard matching `auxin-frontend/.env.example`.

### Database → Supabase

Migrations run automatically on backend startup (`alembic upgrade head`).  
Manual run: `$env:APP_ENV="production"; python -m alembic upgrade head`

> **First-time setup:** Run the SQL in `docs/reports/SUPABASE_MIGRATION.sql` via the  
> [Supabase SQL Editor](https://supabase.com/dashboard/project/snjqxpelsbsvytxezwne/sql/new)  
> to create all tables and seed demo users before starting the backend.

---

## 🧪 Testing

```powershell
$env:APP_ENV = "development"
.\venv\Scripts\python.exe -m pytest tests/ -v
```

> **Note:** The test suite uses SQLite in-memory for isolation. Some tests (auth-related) are currently written for the v1 OTP architecture and are marked for update to v2.0 Supabase auth.

---

## 📦 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | FastAPI | 0.111.0 |
| ASGI server | Uvicorn + Gunicorn | 0.29.0 / 22.0.0 |
| ORM | SQLAlchemy (async) | 2.0.30 |
| DB driver | asyncpg | 0.29.0 |
| Migrations | Alembic | 1.13.1 |
| Schema validation | Pydantic | 2.7.1 |
| Auth | Supabase + python-jose | v2.50 / 3.3.0 |
| Payments | Razorpay | 1.4.2 |
| Database | Supabase PostgreSQL | 17.x |
| Frontend | Next.js | 16.2.x |
| Styling | Tailwind CSS | v4 |
| State | Zustand | v5 |
| HTTP client | Axios + React Query | 1.16 / v5 |

---

## 🔜 Roadmap

- [ ] SMS notifications for order status changes (Fast2SMS / MSG91)
- [ ] Push notifications (Firebase FCM)
- [ ] Advanced product search (full-text search)
- [ ] Farmer analytics dashboard
- [ ] Delivery partner real-time tracking (WebSocket)
- [ ] Admin financial reports and CSV exports
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Mobile apps (React Native)
- [ ] Bulk order support for institutions
- [ ] Automated dispute resolution (AI-assisted)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Auxin v2.0 — Built with ❤️ by the Anti Gravity team*
