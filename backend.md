# Auxin Backend - Reference (current state)

Verified by reading `main.py`, `app/`, `alembic/`, `scripts/`, `tests/` on 2026-10-11. Test and boot results are in `deployment.md` section 2.
Architecture, auth flow, order flow and the consolidated risk list are in `architecture.md`. Schema is in `database.md`.
Env var names are in `architecture.md` section 8. No secret values appear here.

---

## 1. Layering

```
HTTP request
  -> main.py middleware stack (CORS, RequestLogging, SecurityHeaders)
  -> app/api/v1/router.py  (api_router, mounted at /api/v1)
  -> app/api/v1/endpoints/*.py   thin HTTP layer: Depends(...), path/body params, response_model
  -> app/services/*.py           business rules; raise AuxinException subclasses
  -> app/repositories/*.py       SQLAlchemy queries; flush() only, no commit
  -> app/models/*.py             SQLAlchemy 2.0 declarative models (Mapped[...])
  -> app/db/session.py           AsyncSession per request; get_db commits or rolls back
```

Supporting packages:
- `app/schemas/*.py`: Pydantic v2 request and response models. Phone numbers are validated with `phonenumbers` and rejected if the digits look fake (`app/core/security.py` `is_fake_phone_number`).
- `app/core/`: `config.py` (Settings), `dependencies.py` (auth and RBAC), `security.py` (JWT decode, delivery OTP hashing), `exceptions.py` (domain errors), `middleware.py`, `logging.py`, `encryption.py` (Fernet for bank numbers), `geolocation.py` (haversine, radius checks), `supabase.py` (re-exports `decode_supabase_jwt` only).
- `app/db/`: `base.py` (declarative Base only), `base_all.py` (imports every model so metadata is complete; used by `main.py` and `alembic/env.py`), `session.py` (engine, session factory, `get_db`), `engine_utils.py` (URL cleanup and SSL).
- Deviations from the layering: some endpoints hold logic (`profile.py` create, `orders.py` review validation, `milo.py` proxy), and `admin_service.reset_demo_environment` runs raw `text()` SQL DELETEs.

---

## 2. Entry point (`main.py`)

- App: `FastAPI(title="Auxin API", version="1.0.0")`. Docs (`/docs`, `/redoc`, `/openapi.json`) exist only when `DEBUG=true`.
- Lifespan:
  - Startup: `engine.begin()` then `Base.metadata.create_all`, run in every environment (the comment says dev and test only). A failure is logged and the server still starts (`/health` then reports `db=unreachable`).
  - Shutdown: `engine.dispose()`.
- Middleware (added in this order; Starlette wraps the last-added one outermost, so the runtime order is CORS -> RequestLogging -> SecurityHeaders -> router; the comment in `main.py` lists the reverse):
  1. `SecurityHeadersMiddleware` (`app/core/middleware.py`): `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and CSP (`default-src 'none'` in prod; a permissive policy when DEBUG for Swagger).
  2. `RequestLoggingMiddleware`: sets `request.state.request_id` (uuid4), logs `http_request` JSON with method, path, status, `duration_ms`, `client_ip` (first `X-Forwarded-For` entry), echoes `X-Request-ID`. `/health` is logged at DEBUG.
  3. `CORSMiddleware`: origins from `ALLOWED_ORIGINS` (comma list; `*` allowed), methods GET/POST/PUT/PATCH/DELETE/OPTIONS, headers Authorization/Content-Type/X-Request-ID, credentials on.
- `app/api/v1/middleware.py` is empty. `SuspendedUserMiddleware` is mentioned in a docstring but does not exist.
- `GET /health`: `SELECT 1` through `AsyncSessionLocal`. Returns `{status: ok|degraded, version: "2.0.0", env, demo_mode, db: connected|unreachable, uptime_s}`. 503 when the DB is down. Used by `render.yaml` as `healthCheckPath`.
- Dev runner: `python main.py` -> `uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=DEBUG)`.
- Production server: `gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 --timeout 120` (Procfile, nixpacks, render, Dockerfile).

---

## 3. Routers and routes

All routes are under `/api/v1`. Router registration order is in `app/api/v1/router.py`. Total handlers: 100 (`@router.*` decorators under `app/api/v1/endpoints/`).

Auth column meanings: `public` = no dependency; `any authed` = `get_current_user` (status gate, any role); `profile` = `get_current_user_for_profile` or `require_roles_for_profile` (allows pending and rejected accounts; blocks suspended); `<role>` = `require_roles(...)`; `super` = `require_super_admin`.

### 3.1 auth (`/auth`, `endpoints/auth.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/sync-user` | Bearer JWT only (no status gate) | 201. Creates or links `users` row. Role comes from body (see architecture 4a and risks: `admin` accepted) |
| GET | `/auth/me` | profile | `UserOut` |

### 3.2 profile (`/profile`, `endpoints/profile.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/profile/me` | profile | |
| POST | `/profile` | profile | Sets name and phone on the user; then checks for a default address (rest of logic in `profile.py`) |
| PUT | `/profile` | profile | |
| POST | `/profile/resubmit` | profile | Resubmits the application for approval (exact status transition UNVERIFIED) |
| GET | `/profile/addresses` | profile | |
| POST | `/profile/addresses` | profile | |
| PUT | `/profile/addresses/{address_id}` | profile | |
| DELETE | `/profile/addresses/{address_id}` | profile | |
| PUT | `/profile/addresses/{address_id}/default` | profile | |

### 3.3 farmers (`/farmers`, `endpoints/farmers.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/farmers/profile` | farmer (profile dep) | Creates farmer profile; bank number is encrypted on write |
| GET | `/farmers/profile/me` | farmer (profile dep) | Returns decrypted bank fields |
| PUT | `/farmers/profile/me` | farmer (profile dep) | |
| GET | `/farmers/{farmer_id}` | any authed | Returns decrypted bank account number, IFSC, UPI, phone to any role (see risks) |
| POST | `/farmers/{farmer_id}/approve` | admin | Duplicates `PATCH /admin/farmers/{id}/approve` |
| POST | `/farmers/{farmer_id}/revoke` | admin | |

### 3.4 products (legacy, `/products`, `endpoints/products.py`; still mounted)
| Method | Path | Auth |
|---|---|---|
| POST | `/products` | farmer |
| GET | `/products` | public |
| GET | `/products/my` | farmer |
| GET | `/products/{product_id}` | public |
| PUT | `/products/{product_id}` | farmer (owner checked in `product_service`) |
| DELETE | `/products/{product_id}` | farmer (owner checked) |

### 3.5 catalogue (`/catalogue`, `endpoints/catalogue.py`; V3 master catalogue)
| Method | Path | Auth |
|---|---|---|
| GET | `/catalogue` | public (paginated browse) |
| GET | `/catalogue/suggest` | public |
| GET | `/catalogue/categories` | public |
| GET | `/catalogue/{product_id}` | public |
| GET | `/catalogue/{product_id}/suppliers` | public (farmer inventory listing per master product) |
| POST | `/catalogue/admin/categories` | admin |
| PUT | `/catalogue/admin/categories/{category_id}` | admin |
| POST | `/catalogue/admin/products` | admin |
| GET | `/catalogue/admin/products` | admin |
| PUT | `/catalogue/admin/products/{product_id}` | admin |

### 3.6 inventory (`/inventory`, `endpoints/inventory.py`; farmer stock)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/inventory` | farmer | Adds a `farmer_inventory` row for a master product. Price and quantity checks at the DB level |
| GET | `/inventory/my` | farmer | |
| PUT | `/inventory/{inventory_id}` | farmer | Ownership checked in `inventory_service` |
| DELETE | `/inventory/{inventory_id}` | farmer | Ownership checked |

### 3.7 orders (`/orders`, `endpoints/orders.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/orders` | customer | Creates `reserved` order, 5-minute reservation |
| GET | `/orders/my` | customer | Includes `delivery.otp` while out for delivery |
| GET | `/orders/farmer/incoming` | farmer | Optional `status` filter |
| GET | `/orders/{order_id}` | any authed | Farmer branch lacks ownership check (see risks). OTP shown to customer and admin |
| PUT | `/orders/{order_id}/cancel` | customer | From reserved, payment_pending, pending |
| PUT | `/orders/{order_id}/accept` | farmer | Always 409 today (transition map gap) |
| PUT | `/orders/{order_id}/reject` | farmer | Only from accepted |
| PUT | `/orders/{order_id}/packing` | farmer | accepted -> packing |
| PUT | `/orders/{order_id}/ready-for-pickup` | farmer | packing -> ready_for_pickup |
| PUT | `/orders/{order_id}/complete` | farmer | Always 409 today (transition map gap) |
| POST | `/orders/{order_id}/review` | any authed (service requires customer owner, order completed) | 201 |

### 3.8 delivery (`/delivery`, `endpoints/delivery.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/delivery/profile` | delivery (profile dep) | Creates partner profile |
| GET | `/delivery/profile/me` | delivery (profile dep) | |
| PUT | `/delivery/profile/me` | delivery (profile dep) | Bank number encrypted on write |
| PUT | `/delivery/availability?is_available=` | delivery | Go on or off duty |
| PUT | `/delivery/location` | delivery | `{latitude, longitude, accuracy}` |
| GET | `/delivery/available` | delivery | Pending unassigned deliveries within 25 km; empty when off duty or busy |
| POST | `/delivery/{delivery_id}/claim` | delivery | Atomic claim of pending delivery |
| POST | `/delivery` | admin | Route wrapper around `DeliveryService.create_delivery`. Payment verify and order accept call the service directly, not this route |
| POST | `/delivery/assign/{delivery_id}` | admin | Re-run auto-assign for pending delivery |
| GET | `/delivery/assigned` | delivery | Paginated (page, page_size<=100) |
| GET | `/delivery/by-order/{order_id}` | any authed (service-scoped) | |
| GET | `/delivery/{delivery_id}` | any authed (service-scoped) | |
| PUT | `/delivery/{delivery_id}/status` | delivery (must be assigned partner) | assigned -> accepted -> picked_up -> out_for_delivery (OTP) or failed |
| POST | `/delivery/{delivery_id}/verify-otp` | delivery (must be assigned partner) | `{otp, latitude, longitude}`; geofence then bcrypt verify |

### 3.9 payments (`/payments`, `endpoints/payments.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/payments/create` | customer | Creates Razorpay order (or COD for demo users). Idempotent for unpaid order |
| POST | `/payments/verify` | any authed | Razorpay signature and amount check; sets payment paid, order accepted, creates delivery |
| POST | `/payments/refund` | admin | Full refund of a paid payment |
| GET | `/payments/{order_id}` | customer, farmer, admin (service-scoped) | Returns payment and transactions |

### 3.10 disputes (`/disputes`, `endpoints/disputes.py`)
| Method | Path | Auth |
|---|---|---|
| POST | `/disputes` | customer or farmer (involved party checked in `dispute_service`) |
| GET | `/disputes/my` | customer, farmer, admin |

### 3.11 admin (`/admin`, `endpoints/admin.py`; all admin role unless marked super)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/admin/users` | admin | |
| PUT | `/admin/users/{user_id}/suspend` | admin | Body has reason |
| PUT | `/admin/users/{user_id}/reinstate` | admin | |
| GET | `/admin/farmers/pending` | admin | |
| PATCH | `/admin/farmers/{id}/approve` | admin | |
| PATCH | `/admin/farmers/{id}/reject` | admin | `rejection_reason` |
| GET | `/admin/delivery/pending` | admin | |
| PATCH | `/admin/delivery/{id}/approve` | admin | |
| PATCH | `/admin/delivery/{id}/reject` | admin | |
| GET | `/admin/orders` | admin | |
| PUT | `/admin/orders/{order_id}/cancel` | admin | |
| GET | `/admin/payments` | admin | |
| GET | `/admin/disputes` | admin | |
| PUT | `/admin/disputes/{dispute_id}` | admin | Resolve or reject; note required |
| GET | `/admin/stats` | admin | Dashboard counters (`is_demo` filter) |
| GET | `/admin/products` | admin | |
| PUT | `/admin/products/{product_id}/deactivate` | admin | |
| PUT | `/admin/products/{product_id}/activate` | admin | |
| GET | `/admin/deliveries` | admin | |
| GET | `/admin/admins` | super | |
| POST | `/admin/admins` | super | Creates admin user |
| PUT | `/admin/admins/{admin_id}/disable` | super | |
| PUT | `/admin/admins/{admin_id}/activate` | super | |
| DELETE | `/admin/admins/{admin_id}` | super | Hard delete (`admin_service` line ~1016) |
| GET | `/admin/activity-logs` | super | All admin actions |
| GET | `/admin/my-activity-logs` | admin | Own actions |
| POST | `/admin/settings` | super | Only writes an audit row (no real setting change) |
| POST | `/admin/demo/reset` | admin | Body `{password_confirm?}`; password check skipped when omitted (see risks) |
| GET | `/admin/reviews/analytics` | admin | |
| GET | `/admin/system/health` | admin | DB ping and service status |

### 3.12 milo (`/milo`, `endpoints/milo.py`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/milo/status` | public | Returns `enabled`, `status: coming_soon`, `provider` |
| POST | `/milo/chat` | public (optional Bearer) | Resolves role from token, falls back to customer; forwards to `http://127.0.0.1:8001/api/chat`; 15 s timeout |

`app/services/milo/` contains provider adapters (`claude`, `gemini`, `openai`, `ollama`, base class). Nothing outside that package imports them. The live path is the HTTP proxy above.

---

## 4. Auth and RBAC dependencies (`app/core/dependencies.py`)

| Dependency | Used for | Behaviour |
|---|---|---|
| `get_current_user` | most authenticated routes | Bearer JWT, user lookup by `supabase_uid`, status gate (suspended, rejected, pending, other -> 403) |
| `get_current_user_for_profile` | profile and onboarding routes | Same lookup; only suspended is blocked |
| `require_roles(*roles)` | role-restricted routes | `get_current_user` then `user.role in roles`, else 403 |
| `require_roles_for_profile(*roles)` | profile routes that need a role | Profile lookup then role check |
| `require_super_admin` | super-only admin routes | `role == admin` and `users.is_super_admin` |

`decode_supabase_jwt` (in `app/core/security.py`) accepts HS256 (secret `SUPABASE_JWT_SECRET`) or ES256 (JWKS from `SUPABASE_URL`). Audience is not verified. The JWKS result is cached for the process lifetime. `SUPABASE_SERVICE_ROLE_KEY` is sent as the `apikey` header on the JWKS request.

Super admin: the partial unique index `unique_super_admin` allows only one row with `is_super_admin = true`. `before_update` and `before_delete` listeners in `app/models/user.py` block demotion, suspension and deletion of that row.

Default approval status by role (`app/models/user.py`): customer and admin -> `approved`; farmer and delivery -> `pending`.

---

## 5. Exceptions and error envelope

`app/core/exceptions.py`: `AuxinException(status_code, detail)` and about 70 subclasses grouped by domain (tokens, users, farmers, products, orders, delivery partners, deliveries, payments, admin, disputes, addresses, user status transitions). Status codes are set per class (401, 403, 404, 409, 422, 400, 502, 503).

`app/api/v1/router.py` registers handlers:
- `AuxinException` -> `{success: false, error: detail, code: "<CLASSNAME_UPPER with ERROR -> _ERROR>", request_id}`. Examples: `TokenMissingError` -> `TOKENMISSING_ERROR`, `PermissionDeniedError` -> `PERMISSIONDENIED_ERROR`, `DeliveryOTPInvalidError` -> `DELIVERYOTPINVALID_ERROR`.
- `RequestValidationError` -> 422 `VALIDATION_ERROR`; `error` joins `loc: msg` pairs.
- Starlette `HTTPException` -> `HTTP_<status>` (includes FastAPI 404 and 405 and manual raises).
- `Exception` -> 500 `INTERNAL_SERVER_ERROR`; message is the exception text only when DEBUG.

Logging: `app/core/logging.py` writes one JSON line per record to stdout (`ts`, `level`, `logger`, `message`, extras). DEBUG level when `DEBUG=true`, otherwise INFO. Named loggers: `auxin.main`, `auxin.router`, `auxin.http`, `auxin.auth`, `auxin.payment`, `auxin.order`, `auxin.delivery`, `auxin.admin`, `auxin.dispute`, `auxin.security`. Domain 401 and 403 errors log at WARNING on `auxin.security`.

---

## 6. Configuration (`app/core/config.py`)

- `Settings(BaseSettings)` with `case_sensitive=False`, `extra="ignore"`.
- `env_file` is chosen at import: `APP_ENV=development` -> `.env.development`; `APP_ENV=production` -> `.env.production`; anything else -> `.env`. The chosen file falls back to `.env` if missing. Real environment variables override file values.
- Single cached instance: `settings = get_settings()` (lru_cache). Import it, don't re-create it.
- `DATABASE_URL` has no default, so importing `app.core.config` fails without it. This affects `pytest` too.
- Fields and their purposes are listed in `architecture.md` section 8.
- Known unused fields: `LOG_LEVEL`, `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES`.
- `DEBUG` drives several behaviours at once: docs visibility, SQL echo, CSP choice, logger level, 500 detail, and the fixed bypass OTP in `verify_delivery_otp`.

---

## 7. Database session and engine (`app/db/`)

- `session.py`: picks `DEMO_DATABASE_URL` when `DEMO_MODE=true` and that URL is set, otherwise `DATABASE_URL`. Logs a warning in demo mode.
- `engine_utils.build_asyncpg_url(url)`:
  - SQLite URLs pass through unchanged.
  - Strips `sslmode` and `channel_binding` from the query. Maps `sslmode` to asyncpg `ssl`: `require`, `verify-ca`, `verify-full` -> `require`; `prefer`, `allow` -> `prefer`; `disable` -> no SSL.
  - Without `sslmode`, sets `ssl=require` for any non-local host (`localhost`, `127.0.0.1`, `::1` are exempt).
- Engine kwargs: `connect_args` (asyncpg, `timeout=8.0`), `echo=DEBUG`, `pool_pre_ping=True`. For non-SQLite: `pool_size=10`, `max_overflow=20`, `pool_recycle=3600`.
- Session factory: `expire_on_commit=False`, `autoflush=False`.
- `get_db`: opens a session per request, commits after the endpoint returns, rolls back on exception.
- Note: repositories call `flush()`, and commits happen in `get_db` or explicitly in a few services (`auth.sync_user`, `payment_service`, `order_service.release_expired_reservations`).

---

## 8. Alembic migrations

`alembic/env.py` reads `DATABASE_URL` from `settings`, converts `+asyncpg` to a sync URL for offline mode, and uses `Base.metadata` from `app.db.base_all` for autogenerate. `alembic.ini` is a template.

Chain, in order (each `down_revision` points at the previous one; single linear history):

| # | File | Revision id | What it does |
|---|---|---|---|
| 1 | `001_initial_schema.py` | `001_initial_schema` | Creates core tables (users, farmers, products, orders, order_items, delivery_partners, deliveries, plus `otps` and `refresh_tokens` which are removed later) and indexes |
| 2 | `002_add_payment_escrow_tables.py` | `002_payment_escrow` | `payments`, `transactions` with indexes |
| 3 | `003_add_admin_dispute_tables.py` | `003_admin_dispute` | `admin_actions`, `disputes` with indexes (uses `op.execute` too) |
| 4 | `004_rename_products_stock_to_quantity.py` | `004_fix_products_quantity` | `products.stock` renamed to `quantity` |
| 5 | `005_supabase_auth_migration.py` | `005_supabase_auth` | Adds `users.supabase_uid` (+ index); drops `users.is_verified`, `otps`, `refresh_tokens` |
| 6 | `006_add_user_status.py` | `006_add_user_status` | Adds `users.status` (enum) using raw `op.execute` plus add_column; drops `is_suspended`, `is_active` |
| 7 | `20260623_1637_5a954a77667e_add_user_address.py` | `5a954a77667e` | `users.address` (String 500) |
| 8 | `6a954a77667f_create_addresses_table.py` | `6a954a77667f` | `addresses` table with `user_id` and `id` indexes |
| 9 | `7a954a77667f_add_approval_fields.py` | `7a954a77667f` | `users.approved_by`, `approved_at`, `rejected_at`, `rejection_reason` |
| 10 | `8a954a77667f_add_phase_2_1a_fields.py` | `8a954a77667f` | `users.is_super_admin`; bank fields on `farmers` and `delivery_partners` (`bank_name`, `account_holder_name`, `upi_id`, and more) |
| 11 | `20260710_0528_ddafef325bad_add_reviews_and_super_admin_index.py` | `ddafef325bad` | `reviews` table; `deliveries.plain_otp` (String 6); unique partial index on `users.is_super_admin` |
| 12 | `20260710_1733_31675d11771f_add_is_demo_columns.py` | `31675d11771f` | `is_demo` boolean on users, orders, products, reviews, deliveries, payments, transactions, addresses |
| 13 | `009_master_catalogue.py` | `009_master_catalogue` | `master_categories`, `master_products`, `farmer_inventory` (with CHECK constraints); adds order_items link columns (`inventory_id`, `master_product_id`) |

- **Head: `009_master_catalogue`.** No file revises it.
- Numbers 007 and 008 do not exist (gap).
- Deploy start commands run `alembic upgrade head` on every boot (Render, Docker, nixpacks). `main.py` also runs `create_all` on startup (see section 2).
- Scripts that edit `auxin.db` directly (SQLite only) are listed in section 10 and bypass Alembic.

---

## 9. Tests (`tests/`, `pytest.ini`)

Layout:
- `tests/conftest.py`: in-memory SQLite (`sqlite+aiosqlite:///:memory:`) engine and session factory; overrides `get_db`; autouse fixture drops and recreates all tables per test; HTTP client is `httpx.AsyncClient` with `ASGITransport` on `main.app`; `create_mock_supabase_token()` signs HS256 tokens with `settings.SUPABASE_JWT_SECRET`.
- Modules: `test_auth.py` (sync-user, /auth/me, validation, RBAC, invalid tokens), `test_catalogue_orders.py`, `test_commerce_engine.py`, `test_delivery_location_and_matching.py`, `test_delivery_otp_eta_and_mission.py`, `test_functional_workflows.py`, `test_milo.py`, `test_orders.py`, `test_payment_unit.py`, `test_security.py`, `test_super_admin.py`.
- `pytest.ini`: `asyncio_mode = auto`, `testpaths = tests`, `python_files = test_*.py`, `addopts = -v --tb=short`.

Run (from repo root, after `pip install -r requirements.txt`):

```
pytest
```

Prerequisite: `DATABASE_URL` must be set in the environment or `.env` (Settings requires it at import). `SUPABASE_JWT_SECRET` must be set for token-based tests. Gap noted: no test covers `sync-user` with `role=admin` (see risks).

UNVERIFIED: I did not run the suite, so pass or fail status is unknown.

`root pytest.ini` duplicates `pytest.ini` contents (both exist).

Test-only dependency: `pytest-httpx` and `pytest-asyncio` are listed in `requirements.txt`.

---

## 10. Scripts (`scripts/`)

| File | Purpose (from file header) | Notes |
|---|---|---|
| `db_setup.py` | `check` (DB connect), `migrate` (Alembic), `seed` (demo admin), `setup` | Seeding is skipped when `APP_ENV=production` |
| `production_preflight.py` | Sanity checks: 1 environment, 2 DB config and connectivity, 3 Supabase secrets, 4 super admin credentials, 5 CORS, 6 Razorpay credentials, 7 bank encryption key | Prints WARNING and FAILED lines; run before a production deploy |
| `check_schema.py` | asyncpg schema audit against `DATABASE_URL` | Loads `.env` directly |
| `prod_seed.py` | Seeds Supabase auth users and DB rows through the Supabase admin REST API | Destructive: deletes existing Supabase users matching seed emails first. Contains hard-coded seed passwords. Read before running |
| `apply_009_migration.py` | One-off SQLite migration for master catalogue; seeds 120 master products | Targets `auxin.db`. Not Alembic |
| `make_order_items_product_id_nullable.py` | One-off SQLite table rebuild to make `order_items.product_id` nullable | Targets `auxin.db` |
| `migrate_010_commerce_engine.py` | One-off SQLite rebuild of `orders` (status CHECK, new columns) | Targets `auxin.db` |

Other root-level Python: `run_auxin.py` (local orchestrator, see architecture section 2). `main.py` is the app. `__pycache__/` and `venv/` are local.

---

## 11. Gaps and observations for the backend

- Several services use `print()` for warnings instead of the logger (order, delivery, payment).
- Escrow release on delivery is best-effort with swallowed errors; there is no retry job in this repo.
- Partial implementation: `DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES` is not read; the SLA flag is not built.
- `review`, `disputes`, and `payments/{order_id}` enforce ownership in services. `orders/{id}` (farmer branch), `delivery/{id}` and `delivery/by-order` rely on service checks; the farmer branch of order visibility is missing its check (see architecture risks).
- Public catalogue endpoints (including `/catalogue/{id}/suppliers`) return farmer-facing listing data without login. Confirm this is intended.
- Pagination: most list endpoints cap `page_size` at 100. The available-deliveries query fetches at most 100 unassigned deliveries before filtering by distance, so a far-away backlog can hide nearby jobs (UNVERIFIED at scale).
- Rate limiting: none in the app. The module docstring assumes the reverse proxy.
