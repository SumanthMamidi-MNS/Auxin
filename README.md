# Auxin — Farm-to-doorstep marketplace

Farmers list fresh produce, customers order it, and delivery partners deliver it with a
doorstep OTP. Four services, one repository.

| Service | Folder | Stack | Local port |
|---|---|---|---|
| **Core API** | `main.py`, `app/` | FastAPI, SQLAlchemy (async), Alembic | 8000 |
| **Milo AI & RAG engine** | `Milo_AI/` | FastAPI, retrieval + optional Gemini | 8001 |
| **Main app** (customer / farmer / delivery) | `auxin-frontend/` | Next.js 16, React 19, Tailwind 4 | 3000 |
| **Super admin portal** | `auxin-admin/` | Next.js 16, desktop-first | 3001 |
| Landing page (optional) | `auxin-landing/` | Next.js 16 | 3002 |

Identity is Supabase Auth (email OTP for customers, farmers and couriers; password for admins).
Data lives in SQLite locally and Supabase Postgres when hosted. Payments use Razorpay (COD works without it).

```
 browser ──► auxin-frontend / auxin-admin ──► Supabase Auth (JWT)
                     │  Bearer JWT                    │
                     ▼                                │ verifies
                Core API (FastAPI) ◄──────────────────┘
                 │        │    └──► Milo AI (authenticated proxy)
                 ▼        ▼
            SQLite / Postgres   Razorpay
```

## Quick start (Windows)

Prerequisites: **Python 3.11 or 3.12** (not 3.13+) and **Node.js 18+** (nothing else is installed system-wide).

```bat
git clone <your-private-repo-url> auxin
cd auxin
start.bat
```

`start.bat` creates the local virtual environments, installs dependencies, creates the SQLite
database and seeds the 120-item produce catalogue, then starts all four services, waits for their
health checks and opens the app. Press **Ctrl+C** in that window to stop everything. It never kills
programs it did not start; if a port is taken it tells you and starts nothing.

First run only: copy the Supabase **URL** and **anon key** into `auxin-frontend\.env.local` and
`auxin-admin\.env.local`, and the three Supabase values into `.env.development` — see
[docs/RECOVERY.md](docs/RECOVERY.md).

## Demo workspace and demo accounts

Exactly five special accounts exist next to the real users:

| Account | Kind | State after every reset |
|---|---|---|
| your super admin (`SUPER_ADMIN_EMAIL`) | the one super admin | never touched |
| `demo.admin@auxin.app` | the one normal admin | never touched |
| `demo.customer@auxin.app` | demo account | approved, **no address** (normal profile onboarding on login) |
| `demo.farmer@auxin.app` | demo account | **pending** - an approval request appears under Approvals |
| `demo.delivery@auxin.app` | demo account | **pending** - an approval request appears under Approvals |

- **First run:** `start.bat` creates them (plus a demo farm, a demo courier and 6 baseline listings) in the local
  database. Existing demo data is never overwritten on later runs.
- **Reset:** admin portal → **Demo Workspace** → **Reset Sandbox** (super admin, one click). It deletes only demo
  orders, payments, deliveries, reviews and listings (rows flagged `is_demo`) and returns the three demo accounts to
  the fresh state above. The dashboard counters return to baseline; real users and real orders are untouched.
- **Demo walkthrough:** Reset → Approvals → approve the demo Farmer and Courier → customer sees the produce →
  order → farmer packs → courier delivers with the customer's 6-digit code.
- **One-click sign-in:** the main app's login page shows Customer / Farmer / Courier buttons when
  `NEXT_PUBLIC_DEMO_PASSWORD` is set in `auxin-frontend\.env.local` (the launcher turns demo mode on for that app).
  Real sign-up, sign-in and approval requests work exactly as before.

## What works offline vs. what needs the internet

| Capability | Offline | Needs |
|---|---|---|
| API, SQLite database, catalogue, orders, delivery matching (25 km), OTP completion | ✅ | — |
| Both web apps (build and run) | ✅ | — |
| Automated tests (`pytest`) | ✅ | — |
| **Sign-in** (email OTP / admin password) | ❌ | Internet + a Supabase project |
| Online payments | ❌ | Razorpay keys (COD works offline) |
| Milo answers | ⚠️ retrieval only | Internet + `GEMINI_API_KEY` for generated answers; `requirements-ml.txt` for best retrieval |
| Map tiles, address geocoding | ❌ | Internet (OpenStreetMap) |

## Development

```bat
venv\Scripts\python.exe -m pytest tests -q           :: 72 backend tests, in-memory SQLite
cd auxin-frontend && npm run build                   :: production build
cd auxin-admin    && npm run build
venv\Scripts\python.exe -m alembic heads             :: must show one head
```

## Documentation

| File | Contents |
|---|---|
| [architecture.md](architecture.md) | System overview, auth flow, the order → delivery → OTP flow, risks |
| [backend.md](backend.md) · [frontend.md](frontend.md) · [database.md](database.md) | Per-layer reference |
| [docs/RECOVERY.md](docs/RECOVERY.md) | Restore and run from a clean clone; external assets |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable |
| [docs/DEMO_DEPLOYMENT.md](docs/DEMO_DEPLOYMENT.md) | Public portfolio demo: design, limits, steps |
| [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) | What is not done, and the production checklist |
| [deployment.md](deployment.md) | Render / Vercel / Supabase deployment and the live-database audit |
| [decisions.md](decisions.md) · [phases.md](phases.md) | Decision log and status |

## License and credit

MIT — see [LICENSE](LICENSE). Designed and engineered by **Sumanth Mamidi**.
