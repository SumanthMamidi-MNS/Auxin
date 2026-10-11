# Auxin — Farm-to-doorstep marketplace

> Template for the **public** showcase repository. The source code is private.

**▶ Live demo:** `https://<your-demo-app>.vercel.app` &nbsp;·&nbsp; **Admin demo:** `https://<your-demo-admin>.vercel.app`
&nbsp;·&nbsp; **Walkthrough video:** `<link>`

> The demo runs on free hosting: the first load after idle can take about a minute to wake up.
> Use the one-click Customer / Farmer / Courier buttons on the sign-in page. All data is sample data and
> is reset regularly.

## What it is
Auxin connects farmers, customers and delivery partners:

1. **Farmer** lists produce from a master catalogue and fulfils orders (accept → pack → ready for pickup).
2. **Customer** discovers produce, builds a cart and places an order; sees live status and a doorstep OTP.
3. **Delivery partner** discovers jobs within **25 km**, claims one, and completes it by entering the
   customer's OTP while inside a delivery geofence.
4. **Admin** approves farmers and partners, monitors orders and payments, and resolves disputes.
5. **Milo**, an AI assistant, answers role-aware questions using a curated knowledge base.

## Screenshots
| Customer | Farmer | Delivery | Admin |
|---|---|---|---|
| `![](images/customer.png)` | `![](images/farmer.png)` | `![](images/delivery.png)` | `![](images/admin.png)` |

## Architecture
```
Browser ─► Next.js apps (customer/farmer/delivery · admin)
              │  Supabase Auth JWT
              ▼
        FastAPI core API ──► Postgres (SQLite locally)
              ├──► Razorpay (payments)
              └──► Milo AI (RAG, role-aware)
```

## Technology
FastAPI · SQLAlchemy 2 (async) · Alembic · PostgreSQL / SQLite · Supabase Auth · Next.js 16 · React 19 ·
Tailwind CSS 4 · Zustand · TanStack Query · Leaflet · Razorpay · Gemini + vector retrieval (Milo).

## Engineering highlights
- Role-based access control enforced server-side; account approval workflow.
- Delivery matching by distance, atomic claim, OTP + geofence completion with bounded retries.
- Reproducible setup: migrations, seed scripts, one-click Windows launcher, 70+ automated tests.
- Row Level Security and least-privilege access on the hosted database.

## Run it locally
Available to recruiters and clients on request: `start.bat` installs everything and starts all four
services on a Windows machine with Python 3.11+ and Node 18+.

**Author:** Sumanth Mamidi — AI & ML Engineer · Full-stack developer
