# Auxin - Architecture (current state)

Scope: how the system is built and wired today, verified by reading the code on 2026-10-11.
Companion docs: `backend.md`, `frontend.md`, `database.md`.

Ground rules used for this document:
- No secret values, keys, passwords, or credential-bearing URLs are written here. Env vars are listed by NAME only.
- `.env`, `.env.*`, and `*.env.local` files were not read. Env var names come from `app/core/config.py`, `render.yaml`, and `process.env.*` references in the frontend source. The `.env.example` files were not opened, so cross-check them when convenient.
- This document was written from reading code. Execution results (tests, builds, local boot) are recorded separately in `deployment.md` §2. Anything not confirmed by reading code is marked `UNVERIFIED:`. The `admin` self-registration issue below was additionally reproduced with a throwaway test on 2026-10-11.
- Order-status note: `POST /orders/{id}/accept` and `PUT /orders/{id}/complete` are dead endpoints (always 409). The farmer UI does not call them; it uses `packing` and `ready-for-pickup`, so the live flow is unaffected.

---

## 1. System overview

Auxin is a farm-to-doorstep marketplace with four actor roles:

| Role | App | Main job |
|---|---|---|
| customer | auxin-frontend | browse catalogue, place and pay for orders, see delivery OTP, review |
| farmer | auxin-frontend | list stock (inventory), pack orders, see earnings |
| delivery | auxin-frontend | go on duty, claim or receive assignments, pick up, deliver with OTP |
| admin (incl. super admin flag) | auxin-admin | approve farmers and partners, manage users, orders, payments, disputes, demo data |

The backend is one FastAPI service (`main.py` -> `app/`) with a single REST surface under `/api/v1`. Identity is outsourced to Supabase Auth; payments to Razorpay; data lives in Supabase Postgres (production) or SQLite/in-memory (local and tests).

---

## 2. Components and ports

| Component | Location | Stack | Local port | Production target (per repo config) |
|---|---|---|---|---|
| Backend API | `main.py`, `app/` | FastAPI 0.111, SQLAlchemy 2.0 async, asyncpg, Python 3.12 (Dockerfile) / 3.11 (nixpacks) | 8000 | Render web service `auxin-api` (`render.yaml`); alt: Railway/Heroku via `Procfile` / `nixpacks.toml`; or Docker |
| Customer/farmer/delivery web app | `auxin-frontend/` | Next.js 16.2.4, React 19, Zustand, TanStack Query, axios, supabase-js | 3000 (Next default) | Vercel project (`auxin-frontend/vercel.json`) |
| Admin web app | `auxin-admin/` | Next.js 16.2.6, Zustand, axios, supabase-js | 3001 (`npm run dev` sets `-p 3001`) | Vercel project (`auxin-admin/vercel.json`) |
| Landing page | `auxin-landing/` | Next.js 16.2.4 (static marketing page, links to app and admin) | 3002 (`npm run dev` sets port) | Vercel project (`auxin-landing/vercel.json`) |
| Milo AI assistant | `Milo_AI/` (separate project, not reviewed in depth) | Python service expected at `/api/chat` | 8001 | No deploy config in this repo. UNVERIFIED how or where it is hosted |
| Supabase | external | Auth (email OTP for customers/farmers/delivery, password for admin) and Postgres | n/a | Supabase project; `DATABASE_URL` points at it |
| Razorpay | external | payment orders, HMAC signature verification, refunds | n/a | Razorpay API (called server-side from `payment_service.py`) |

Local orchestrator: `run_auxin.py` (repo root) starts backend 8000, Milo 8001, frontend 3000, admin 3001 and opens the browser. Landing is not part of it.

---

## 3. Diagram

```
  Customer / Farmer / Delivery browser                 Admin browser
            |                                                 |
   auxin-frontend (Vercel, :3000 dev)                auxin-admin (Vercel, :3001 dev)
   supabase-js: email OTP sign-in                    supabase-js: email+password sign-in
            |                                                 |
            +------------------>  Supabase Auth  <------------+
                                  issues access JWT
                                  (sub = supabase_uid)
            |                                                 |
            |  Authorization: Bearer <JWT>                    |
            v                                                 v
  +--------------------------------------------------------------------------+
  |  FastAPI backend  (Render: gunicorn + 2 uvicorn workers; /health)        |
  |                                                                          |
  |  middleware: CORS -> RequestLogging -> SecurityHeaders -> router         |
  |  /api/v1/*  endpoints -> services -> repositories -> SQLAlchemy (async)  |
  |  deps: decode JWT -> users.supabase_uid lookup -> status gate -> role    |
  +--------------------------------------------------------------------------+
        |                         |                              |
        v                         v                              v
  Supabase Postgres        Razorpay API                 Milo AI (127.0.0.1:8001)
  (DATABASE_URL, SSL)      create order, verify HMAC,   reached by backend /milo/chat
                           refunds                      proxy AND directly by the
                                                        browser (see risks)
```

Payments in the browser: the frontend opens Razorpay Checkout with the order returned by `POST /payments/create`, then posts the Razorpay response to `POST /payments/verify`. The backend recomputes the HMAC signature and amount before marking the payment `paid`.

---

## 4. Auth flow (Supabase JWT -> FastAPI)

1. Client signs in with Supabase.
   - customer/farmer/delivery: `signInWithOtp` (email OTP, `shouldCreateUser: true`) in `auxin-frontend/src/lib/auth.ts`.
   - admin: `signInWithPassword` in `auxin-admin/src/lib/auth.ts`.
2. The client calls `POST /api/v1/auth/sync-user` once after sign-up (frontend `syncUser`). This creates or links the application `users` row (see 4a).
3. Every API call sends `Authorization: Bearer <supabase access token>`. The frontend axios interceptor (`auxin-frontend/src/lib/api.ts`, `auxin-admin/src/lib/api.ts`) reads the token from the Supabase session and retries once after `refreshSession()` on 401.
4. Backend `get_current_user` (`app/core/dependencies.py`):
   a. `HTTPBearer(auto_error=False)`; missing token -> 401 `TOKENMISSING_ERROR`.
   b. `decode_supabase_jwt` (`app/core/security.py`): reads the unverified header `alg`. `ES256` -> verify with JWKS fetched from `SUPABASE_URL/auth/v1/.well-known/jwks.json` (cached in-process). Anything else -> HS256 verify with `SUPABASE_JWT_SECRET`. `verify_aud` is disabled. Expired -> 401 expired; other failures -> 401 invalid.
   c. `sub` claim -> `UserRepository.get_by_supabase_uid` against `users.supabase_uid`.
   d. No row -> `UserNotFoundError` (404) telling the client to call `/auth/sync-user`.
   e. Status gate: `suspended` -> 403; `rejected` -> 403; `pending` -> 403 (awaiting approval); any other non-`approved` -> 403.
5. Role gate: `require_roles(*roles)` checks `user.role`; mismatch -> 403 `PERMISSIONDENIED_ERROR`. `require_super_admin` additionally requires `users.is_super_admin`.
6. Profile endpoints use `get_current_user_for_profile` / `require_roles_for_profile` instead. These let `pending` and `rejected` users through so they can complete or fix their profile. Only `suspended` is still blocked.
7. Frontends also gate routes client-side (layouts redirect by role and by `status` = pending/rejected to `/pending-approval`). That is UX only. The backend checks above are the enforcement.

### 4a. sync-user (first login provisioning)

- Role is taken from the request body and status from `default_status_for_role` (`app/models/user.py`): `customer` and `admin` -> `approved`; `farmer` and `delivery` -> `pending`.
- Existing row lookup order on first sync: by `phone` from body, then by `email` from body, then the row is linked by setting `supabase_uid`. The phone and email come from the client body, not from verified JWT claims.
- **Known issue (critical):** `role` accepts `admin` (`SyncUserRequest.role: UserRole`), so a self-registered user can become an approved admin. See section 10.

### 4b. Admin sign-in

`auxin-admin` calls `GET /auth/me` after password sign-in and accepts roles `admin`, `super_admin`, `support_admin`, `operations_admin`, `logistics_admin` on the client. The backend `UserRole` enum only defines `farmer | customer | delivery | admin`; the sub-role names never come back from the API. Super-admin powers come from `users.is_super_admin`.

---

## 5. Data flow (summary)

- Reads and writes go Browser -> FastAPI -> services -> repositories -> Postgres. The frontend never queries Supabase tables directly (only Supabase Auth is used client-side).
- `get_db` (`app/db/session.py`) opens one `AsyncSession` per request, commits after the endpoint returns, and rolls back on exception.
- Money is `Numeric(12,2)` in the DB and `Decimal` in code; Razorpay amounts are converted to paise.
- Delivery OTP: generated server-side, shown once in the `out_for_delivery` response to the partner, and also readable by the customer through the order payload while the delivery is `out_for_delivery` (see section 6, step 9). bcrypt hash is stored in `deliveries.otp_code`; a plaintext copy is stored in `deliveries.plain_otp`.
- Live GPS: partners `PUT /delivery/location`; order payloads expose partner coordinates only while `out_for_delivery`.

---

## 6. Core order flow (as implemented)

Actors: F = farmer, C = customer, D = delivery partner, A = admin, S = system (payment service).

| # | Actor | Endpoint | What happens | Order status after | Delivery status after | Code |
|---|---|---|---|---|---|---|
| 1 | F | `POST /inventory` (legacy: `POST /products`) | Creates `farmer_inventory` row (master product, price, quantity, harvest_date) | n/a | n/a | `app/services/inventory_service.py` |
| 2 | C | `POST /orders` | Validates: one farmer per order, product active, harvest within 30 days (inventory) or `PRODUCT_EXPIRY_DAYS` (legacy), farmer approved, <=25 km when both have coordinates. Decrements stock atomically (rolls back on any failure). Starts 5-minute reservation. | `reserved` | none | `order_service.create_order` |
| 3a | C | `POST /payments/create` | Creates Razorpay order (`COD` only for `is_demo` users, marked paid immediately) | `payment_pending` | none | `payment_service.create_payment` |
| 3b | C | Razorpay Checkout in browser -> `POST /payments/verify` (any logged-in user; signature decides) | HMAC check and amount check; payment `paid` (funds held in escrow) | `accepted` | created by S (step 4) | `payment_service.verify_payment` |
| 4 | S | (inside step 3b) | `DeliveryService.create_delivery`: delivery row, auto-assigns closest available partner (by distance to destination) or leaves `pending` if none | `accepted` | `assigned` or `pending` | `delivery_service.create_delivery` |
| 5 | F | `PUT /orders/{id}/packing` then `PUT /orders/{id}/ready-for-pickup` | Farmer prepares the order | `packing` -> `ready_for_pickup` | unchanged | `order_service.mark_packing`, `mark_ready_for_pickup` |
| 6 | D | `GET /delivery/available` then `POST /delivery/{id}/claim` (or A: `POST /delivery/assign/{id}`) | Only for deliveries still `pending` (no partner). Claim requires on duty, no active run, and an unassigned pending row (atomic conditional update) | unchanged | `assigned` | `delivery_service.claim_delivery` |
| 7 | D | `PUT /delivery/{id}/status` with `accepted`, then `picked_up` | Partner confirms and collects | `picked_up` (set when moving to `picked_up`) | `accepted` -> `picked_up` | `delivery_service.update_status` |
| 8 | D | `PUT /delivery/{id}/status` with `out_for_delivery` | Generates 6-digit OTP, stores bcrypt hash + plaintext + expiry (`DELIVERY_OTP_EXPIRY_MINUTES`, default 10). OTP returned once in the response | `out_for_delivery` | `out_for_delivery` | `delivery_service.update_status` |
| 9 | C | `GET /orders/my` or `GET /orders/{id}` | Customer (and admin) payload includes `delivery.otp` while `out_for_delivery`. Customer UI shows it at `customer/orders` | unchanged | unchanged | `order_service._order_to_out`, `get_order` |
| 10 | D | `POST /delivery/{id}/verify-otp` with `{otp, latitude, longitude}` | Checks: assigned partner; status `out_for_delivery`; not expired; geofence (only if delivery has destination coords; radius `DELIVERY_GEOFENCE_RADIUS_METERS`, default 100 m, haversine); bcrypt verify. On success: delivery `delivered`, OTP fields cleared, order `completed`, `PaymentService.release_escrow` (errors swallowed) | `completed` | `delivered` | `delivery_service.verify_otp` |
| 11 | C | `POST /orders/{id}/review` | Allowed only when order `completed`; one review per order (`reviews.order_id` unique) | unchanged | unchanged | `review_service.submit_review` |
| 12 | C or F | `POST /disputes` | Dispute on an order (customer or farmer involved). Admin resolves via `PUT /admin/disputes/{id}` | unchanged | unchanged | `dispute_service` |
| 13 | A | `POST /payments/refund` | Full Razorpay refund on a `paid` payment; payment -> `refunded` (see `payment_service.refund_payment`; exact order-status effect UNVERIFIED) | UNVERIFIED | n/a | `payment_service.refund_payment` |

Other paths:
- Cancel: `PUT /orders/{id}/cancel` (customer) allowed from `reserved`, `payment_pending` or `pending`; restores stock.
- Reservation expiry: `release_expired_reservations` runs lazily on order reads and on create. Expired `reserved` or `payment_pending` orders become `cancelled` and stock is restored.
- Farmer reject: `PUT /orders/{id}/reject` is only possible from `accepted` (see known issues: transition map gaps).
- Delivery failure: `PUT /delivery/{id}/status` with `failed` sets the order to `cancelled`. No refund is triggered here (see known issues).

### 6.1 Order status machine (as the code enforces it)

```
reserved --(system)--> payment_pending --(system, payment verified)--> accepted
   |                        |                                             |
   +--(customer/expiry)--> cancelled <--(cancel rules)-- packing <--(farmer)-- accepted
                                                          |
                                             ready_for_pickup --(farmer/delivery)--> picked_up
                                                                                       |
                                                              out_for_delivery <--(delivery)
                                                                     |
                                                                 completed --(admin)--> refund_pending --(system)--> refund_completed
```

Enum values that exist but have no live transitions: `pending`, `payment_confirmed`, `rejected` (reached only via `accepted` -> `rejected`).

### 6.2 Delivery status machine (`DELIVERY_TRANSITIONS`, `app/models/delivery.py`)

`pending -> assigned -> accepted -> picked_up -> out_for_delivery -> delivered`. From any non-terminal state -> `failed`. `pending` also goes to `assigned` via auto-assign or claim.

---

## 7. Deployment topology

```
GitHub repo ──> Render web service "auxin-api" (render.yaml)
                  build:  pip install -r requirements.txt
                  start:  alembic upgrade head && gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT
                  health: GET /health (503 when DB unreachable)
                  region: singapore

GitHub repo ──> Vercel project auxin-frontend   (customer/farmer/delivery)   default app URL: app.auxin.in (code default)
GitHub repo ──> Vercel project auxin-admin      (admin)                       default admin URL: admin.auxin.in (code default)
GitHub repo ──> Vercel project auxin-landing    (marketing)                   links to app and admin URLs

Supabase project  -> Auth (email OTP, password) + Postgres (DATABASE_URL)
Razorpay          -> payments
```

Other build definitions present but not the primary path:
- `Dockerfile`: `python:3.12-slim`, multi-stage, non-root `auxin` user, `CMD alembic upgrade head && gunicorn ...`, `APP_ENV=production` default.
- `Procfile`: `web: gunicorn main:app ... --bind 0.0.0.0:$PORT` (Railway/Heroku).
- `nixpacks.toml`: Python 3.11, install, build phase runs `alembic upgrade head`, start gunicorn.

Frontend security headers: `auxin-frontend/next.config.ts` adds CSP, HSTS and others when `NEXT_PUBLIC_APP_ENV=production`. `vercel.json` in each app adds a few headers. `auxin-admin` and `auxin-landing` have no CSP.

---

## 8. Environment variables (names only)

Backend (`app/core/config.py` Settings, pydantic-settings, case-insensitive; `env_file` chosen by `APP_ENV`: `development` -> `.env.development`, `production` -> `.env.production`, otherwise `.env`, falling back to `.env` if the chosen file is missing):

| Name | Required | Default in code | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes (no default) | none | Postgres URL (asyncpg) or SQLite URL |
| `APP_ENV` | no | `development` | environment label; selects env file |
| `APP_HOST`, `APP_PORT` | no | `0.0.0.0`, `8000` | dev runner bind (`python main.py`) |
| `DEBUG` | no | `false` | docs on, SQL echo, DEBUG logging, relaxed CSP, QA OTP bypass, error details |
| `ALLOWED_ORIGINS` | no | `*` | comma list for CORS (see risks) |
| `LOG_LEVEL` | no | `INFO` | declared but never read |
| `DEMO_MODE`, `DEMO_DATABASE_URL` | no | `false`, `""` | route all DB access to sandbox DB when `DEMO_MODE=true` and URL set |
| `SUPABASE_URL` | yes in prod | `""` | JWKS and admin REST calls |
| `SUPABASE_JWT_SECRET` | yes in prod | `""` | HS256 JWT verification |
| `SUPABASE_SERVICE_ROLE_KEY` | yes in prod | `""` | backend admin calls; also sent as `apikey` to JWKS fetch |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_PASSWORD` | no | hard-coded email/phone defaults, password `""` | super-admin bootstrap and demo-reset password fallback |
| `BANK_ACCOUNT_ENCRYPTION_KEY` | recommended | `""` | Fernet key; blank = `plain:` storage |
| `PRODUCT_EXPIRY_DAYS` | no | `30` | listing age cutoff (legacy products) |
| `DELIVERY_OTP_EXPIRY_MINUTES` | no | `10` | OTP lifetime |
| `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` | no | `30` | declared but never read |
| `DELIVERY_GEOFENCE_RADIUS_METERS` | no | `100.0` | completion geofence |
| `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` | yes for payments | `""` | Razorpay API |
| `MILO_ENABLED`, `MILO_PROVIDER`, `MILO_MODEL`, `MILO_API_KEY`, `MILO_TEMPERATURE` | no | off / `None` / `0.7` | Milo status shows these; `/milo/chat` does not check `MILO_ENABLED` |
| `PORT` | platform | none | read by gunicorn bind in `Procfile` and `render.yaml` |

Frontend apps (Next.js, values inlined at build time):

| App | Names |
|---|---|
| auxin-frontend | `NEXT_PUBLIC_API_URL` (code default `http://localhost:8000/api/v1`), `NEXT_PUBLIC_SUPABASE_URL` (required; module throws if missing), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required), `NEXT_PUBLIC_APP_URL` (default `https://app.auxin.in`), `NEXT_PUBLIC_ADMIN_URL` (default `https://admin.auxin.in`), `NEXT_PUBLIC_APP_ENV` (`production` enables standalone output and headers) |
| auxin-admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_DEMO_MODE` (`"true"` shows demo banner) |
| auxin-landing | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL` |

Env files are git-ignored (`.gitignore`): `.env`, `.env.development`, `.env.production`, `.env.local`, `auxin-*/.env*`.

---

## 9. Cross-cutting behaviour

- Error envelope: `{ "success": false, "error": "<message>", "code": "<CODE>", "request_id": "<uuid>" }`. Domain code = class name upper-cased with `ERROR` replaced by `_ERROR` (e.g. `TokenMissingError` -> `TOKENMISSING_ERROR`). Validation -> `VALIDATION_ERROR` (422). Other HTTP errors -> `HTTP_<status>`. Unhandled -> `INTERNAL_SERVER_ERROR` (500; detail only when `DEBUG`).
- Request IDs: `RequestLoggingMiddleware` sets `X-Request-ID` and logs one JSON line per request (`client_ip` taken from `X-Forwarded-For`).
- Health: `GET /health` runs `SELECT 1`; 200 `status=ok` or 503 `status=degraded` with `db=unreachable`. Startup DB failure is non-fatal.
- Time zones: DB timestamps are timezone-aware; some delivery code strips tzinfo to compare with UTC.

---

## 10. Known issues / risks

Severity tags: C = critical, H = high, M = medium, L = low. Each line gives the file and the issue. **Status (2026-10-11): the critical items and several high/medium items below were fixed afterwards; see `docs/KNOWN_LIMITATIONS.md` for the fixed list and what remains open.** The text below is the original audit.

**Critical**
- C `app/api/v1/endpoints/auth.py` and `app/schemas/auth.py` (`SyncUserRequest.role: UserRole`): `POST /auth/sync-user` accepts `role=admin` and creates the row as `approved`. Combined with email OTP sign-up (`shouldCreateUser: true`, `auxin-frontend/src/lib/auth.ts`), any person with an email can self-provision an admin. No test covers this path (`tests/test_auth.py`). Fix: restrict self-service roles to customer, farmer, delivery.
- C `auxin-frontend/src/lib/auth.ts`: hard-coded shared password and fixed bypass codes for demo emails. The bypass is not gated by `NODE_ENV` (only the test-user list is), so it ships in the production bundle, and `auxin-frontend/src/app/auth/page.tsx` renders a one-click demo login. Rotate the demo passwords and remove the production bypass.

**High**
- H `app/services/order_service.py` `_assert_can_view`: the farmer branch returns without checking `order.farmer_id`, so any farmer can read any order via `GET /orders/{id}` (items, totals, assigned partner, live GPS while out for delivery).
- H `app/api/v1/endpoints/farmers.py` (`GET /farmers/{farmer_id}`) and `app/services/farmer_service.py` `_to_out`: any logged-in user gets the farmer's decrypted bank account number, IFSC, UPI and phone.
- H `app/services/admin_service.py` `reset_demo_environment` with `app/schemas/admin.py` `DemoResetRequest.password_confirm: Optional`: omitting the field skips the password check; the reset is not gated by `DEMO_MODE` and deletes all `is_demo=true` rows plus demo partner and farmer profiles.
- H `app/services/delivery_service.py` `verify_otp`: no attempt counter or lockout on the 6-digit OTP within its 10-minute window; no app-level rate limit exists (`app/core/middleware.py` says the proxy handles it).
- H `app/models/delivery.py` (`plain_otp`) and `app/repositories/delivery_repository.py` `set_status`: OTP is stored in plaintext, contradicting the model docstring ("never stored in plain text"). The customer payload exposes it by design.
- H `app/models/order.py` `ALLOWED_TRANSITIONS`: no `(pending|reserved|payment_pending, farmer) -> accepted` and no `(accepted, farmer) -> completed`. `POST /orders/{id}/accept` and `PUT /orders/{id}/complete` therefore always return 409. Acceptance only happens through payment verification. Delivery code sets order statuses directly and bypasses the map.
- H `app/services/delivery_service.py` `_try_auto_assign` with `app/repositories/delivery_partner_repository.py` `find_all_available`: partners with an active run are not excluded, so auto-assign can stack deliveries on one partner. `claim_delivery` checks "busy" without a lock (check-then-act race).
- H `app/services/delivery_service.py` `list_available_deliveries`: before claiming, any on-duty partner within 25 km sees the customer's name, phone and full address.
- H `app/services/delivery_service.py` `verify_otp`: escrow release errors are swallowed (`except Exception: pass`), so a completed delivery can leave funds in escrow with no alert or retry job.
- H `app/services/delivery_service.py` `update_status` (`failed` branch): sets the order to `cancelled` but never refunds or releases a paid payment.
- H `app/api/v1/endpoints/milo.py` `POST /milo/chat`: no auth required (falls back to an anonymous customer role), ignores `MILO_ENABLED`, and forwards to hard-coded `http://127.0.0.1:8001/api/chat`.
- H `auxin-frontend/src/components/ui/MiloAssistant.tsx`: the browser calls `http://127.0.0.1:8001` directly. This bypasses backend auth and only works on a developer machine. `auxin-admin/src/components/ui/MiloAssistant.tsx` exists too (UNVERIFIED that it has the same URL).

**Medium**
- M `app/core/security.py` `verify_delivery_otp`: a fixed bypass code is accepted whenever `DEBUG` is true. `DEBUG` also enables `/docs`, SQL echo and error detail in 500 responses. `DEBUG` must never be set in production.
- M `main.py` `_get_cors_origins`: `ALLOWED_ORIGINS` default `*` is returned even when `DEBUG` is false (only a warning is logged), contradicting the function docstring. Combined with `allow_credentials=True`.
- M `render.yaml`: `ALLOWED_ORIGINS` still holds placeholder values (`YOUR_MAIN_APP_DOMAIN`, `YOUR_ADMIN_DOMAIN`).
- M `app/core/security.py` `decode_supabase_jwt`: the HS256 path uses `SUPABASE_JWT_SECRET` whose default is empty. No startup check exists. UNVERIFIED whether python-jose rejects an empty HMAC key; it should fail closed.
- M `app/core/encryption.py`: when `BANK_ACCOUNT_ENCRYPTION_KEY` is blank, bank account numbers are stored as `plain:<value>`.
- M `main.py` lifespan: `Base.metadata.create_all` runs on every start in every environment; the Render, Docker and nixpacks start paths also run `alembic upgrade head` on each boot with 2 workers. Risk of schema drift and startup races.
- M `app/core/middleware.py`: no rate limiting in the app for `/auth/sync-user`, `/payments/verify`, or OTP verification; the module docstring assumes the reverse proxy handles it.
- M `auxin-frontend/next.config.ts`: CSP `connect-src` hard-codes `https://api.auxin.in`. If `NEXT_PUBLIC_API_URL` points elsewhere in production, API calls are blocked. UNVERIFIED which host prod uses.
- M `scripts/prod_seed.py`: hard-coded seed passwords for seed users, and it deletes existing Supabase auth users matching seed emails before recreating them.
- M `app/core/config.py`: hard-coded personal defaults for `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PHONE` (values not repeated here).
- M `.dockerignore`: does not exclude `venv/`, `Milo_AI/`, `Dataset/`, `auxin.db`, `scratch/`, `Reports/`, so images carry local data and large folders.
- M `requirements.txt`: `pytest`, `pytest-asyncio`, `pytest-httpx` are in the runtime requirements, so they ship in the production image.
- M `app/api/v1/endpoints/farmers.py` (`POST /farmers/{id}/approve`, `/revoke`) duplicates `app/api/v1/endpoints/admin.py` (`PATCH /admin/farmers/{id}/approve`, `/reject`). Two approval paths with separate audit behaviour; the admin UI calls the PATCH route.

**Low**
- L `app/core/config.py`: `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` and `LOG_LEVEL` are declared but never read; the SLA timeout is not implemented.
- L `app/services/admin_service.py` `update_settings`: returns `success: true` but only writes an audit row; nothing changes.
- L `app/services/order_service.py`, `delivery_service.py`, `payment_service.py`: warnings go to `print()` instead of the structured logger.
- L `app/api/v1/middleware.py`: empty file. `app/core/middleware.py` docstring lists a `SuspendedUserMiddleware` that does not exist.
- L `main.py` comment lists middleware outermost-first in the opposite order to runtime. Starlette wraps the last-added middleware outermost, so CORS is outermost.
- L `Dockerfile` uses Python 3.12 while `nixpacks.toml` uses 3.11.
- L `app/core/security.py.bak`, root `schema.sql`, and `docs/` reports are stale and not authoritative. `docs/ARCHITECTURE.md` and `docs/DATABASE_SCHEMA.md` were not reconciled against code.
- L `auxin-admin/src/types` and `auxin-admin/src/lib/auth.ts`: admin sub-roles accepted client-side that the backend `UserRole` never returns.
- L `auxin-frontend/src/lib/catalogue.ts`: admin catalogue write helpers ship in the customer bundle (server enforces role).
- L `alembic/versions/`: no `007` or `008` files (numbering gap, cosmetic). Migration `009_master_catalogue` is the head.
- L Several one-off SQLite scripts (`scripts/apply_009_migration.py`, `make_order_items_product_id_nullable.py`, `migrate_010_commerce_engine.py`) edit `auxin.db` outside Alembic and must not be run against Postgres.
