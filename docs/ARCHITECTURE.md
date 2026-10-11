# Platform Architecture — Auxin V3.0

This document describes the high-level architecture of the Auxin farm-to-doorstep marketplace.

---

## 1. System Overview

Auxin connects three primary users:
1. **Farmers**: List crops, manage inventory, coordinate pick-ups, track earnings.
2. **Customers**: Browse fresh items, configure addresses, order delivery, pay using Razorpay.
3. **Delivery Partners**: Accept orders, navigate via geofenced routes, confirm drop-off via OTP handshakes.

An **Admin Portal** acts as the system telemetry, monitoring, cataloguing, and compliance oversight panel.

---

## 2. Component Design

```
                          ┌───────────────────────────┐
                          │    Next.js Client Apps    │
                          │   (Customer/Farmer/Rider) │
                          └─────────────┬─────────────┘
                                        │ JWT Authentication
                          ┌─────────────▼─────────────┐
                          │    FastAPI API Gateway    │
                          │   (RBAC & Routing logic)  │
                          └─────────────┬─────────────┘
                                        │ SQL Queries (asyncpg)
                          ┌─────────────▼─────────────┐
                          │    PostgreSQL Database    │
                          │   (Supabase / RDS Host)   │
                          └───────────────────────────┘
```

- **Backend**: Python 3.12 with FastAPI, SQLAlchemy, Pydantic, python-jose, and aiosqlite/asyncpg.
- **Frontend**: Next.js (TypeScript) utilizing TailwindCSS, Lucide Icons, and Zustand state management.
- **Milo AI Integration**: An intelligent right-drawer assistant loaded via shared widgets in client portals.
