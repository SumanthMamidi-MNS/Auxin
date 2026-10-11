# Auxin Database - Reference (current state)

Verified by reading `app/models/*.py`, `app/db/*.py`, `alembic/versions/*.py` on 2026-10-11.
Connection and SSL handling: `backend.md` section 7. Migration chain: `backend.md` section 8.

---

## 1. Engines, source of truth, conventions

| Environment | Engine | How the schema gets there |
|---|---|---|
| Production | Supabase Postgres (asyncpg) | `alembic upgrade head` at each start (Render, Docker) or at build (nixpacks). `Base.metadata.create_all` also runs at app startup (creates missing tables only) |
| Local dev | SQLite `auxin.db` at repo root (git-ignored) | `create_all` at startup; one-off scripts for older changes |
| Tests | in-memory SQLite (`aiosqlite`) | `create_all` / `drop_all` per test |
| Demo | separate Postgres when `DEMO_MODE=true` | `DEMO_DATABASE_URL` |

Source of truth: ORM models define the intended schema; Alembic defines what production has. The root `schema.sql` and `docs/DATABASE_SCHEMA.md` predate current models and are not authoritative.

Conventions:
- Primary keys: `Integer` with index. No UUID keys.
- Money: `Numeric(10,2)` unit prices; `Numeric(12,2)` totals, payments, ledger. Python uses `Decimal`; Razorpay amounts are converted to paise in code.
- Timestamps: `DateTime(timezone=True)`, UTC defaults from Python. Some delivery code strips tzinfo before comparing.
- Demo flag: most business tables have `is_demo` (boolean). Demo reset deletes rows where it is true.
- Sensitive: bank numbers are Fernet-encrypted when `BANK_ACCOUNT_ENCRYPTION_KEY` is set, else stored as `plain:<value>`. The delivery OTP is bcrypt-hashed in `deliveries.otp_code`, but a plaintext copy also sits in `deliveries.plain_otp` (see section 8).

---

## 2. Table index

| Table | Model file | Created / changed by migration | Purpose |
|---|---|---|---|
| `users` | `user.py` | 001; changes 005, 006, 5a95, 7a95, 8a95, 3167 | Every account; links to Supabase via `supabase_uid` |
| `farmers` | `farmer.py` | 001; bank fields 8a95 | Farmer profile (one per user) |
| `delivery_partners` | `delivery.py` | 001; bank fields 8a95 | Partner profile, live GPS |
| `products` | `product.py` | 001; `stock`->`quantity` in 004; is_demo 3167 | Legacy listings (`/products`) |
| `orders` | `order.py` | 001; is_demo 3167 | Customer orders, one farmer each |
| `order_items` | `order.py` | 001; inventory and master links in 009 | Order lines |
| `deliveries` | `delivery.py` | 001; `plain_otp` ddaf; is_demo 3167 | One delivery per order |
| `payments` | `payment.py` | 002; is_demo 3167 | Razorpay payment per order |
| `transactions` | `payment.py` | 002; is_demo 3167 | Ledger: payment, release, refund |
| `admin_actions` | `admin.py` | 003 | Admin audit log |
| `disputes` | `admin.py` | 003 | Disputes on orders |
| `addresses` | `address.py` | 6a95; is_demo 3167 | Saved addresses |
| `reviews` | `review.py` | ddaf; is_demo 3167 | One review per order |
| `master_categories` | `catalogue.py` | 009 | Category tree |
| `master_products` | `catalogue.py` | 009 | Platform catalogue |
| `farmer_inventory` | `catalogue.py` | 009 | Farmer stock of a master product |

Dropped by migrations (not in models): `otps`, `refresh_tokens` (created in 001, dropped in 005). Dropped from `users`: `is_verified` (005), `is_suspended`, `is_active` (006).

---

## 3. Enum types

| Postgres type | Values |
|---|---|
| `userrole` | farmer, customer, delivery, admin |
| `userstatus` | pending, approved, rejected, suspended |
| `orderstatus` | pending, reserved, payment_pending, payment_confirmed, accepted, packing, ready_for_pickup, picked_up, out_for_delivery, completed, cancelled, rejected, refund_pending, refund_completed |
| `deliverystatus` | pending, assigned, accepted, picked_up, out_for_delivery, delivered, failed |
| `paymentstatus` | created, paid, failed, refunded |
| `transactiontype` | payment, release, refund |
| `transactionstatus` | success, failed |
| `disputestatus` | open, in_review, resolved, rejected |
| `adminactiontype` | approve_farmer, reject_farmer, suspend_user, reinstate_user, resolve_dispute, reject_dispute, approve_delivery, reject_delivery, deactivate_product, update_product, create_admin, disable_admin, activate_admin, remove_admin, order_status_updated, order_cancelled, remove_product, reset_demo_data, reset_demo_environment |

Enums use `create_constraint=True`. `orderstatus` values `pending`, `payment_confirmed`, `rejected` have no live entry path except `rejected` via `accepted`.

---

## 4. Tables

Legend: NN = not null; PK; FK (ON DELETE); UQ = unique; IX = indexed; CK = check.

### 4.1 users
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| name | String(255) NN | |
| phone | String(20) NN | UQ, IX (E.164) |
| email | String(255) | UQ, IX |
| role | enum userrole NN | model default customer |
| status | enum userstatus NN | set on create by role (customer/admin approved; farmer/delivery pending) |
| supabase_uid | String(36) | UQ, IX; set by sync-user |
| is_super_admin | Boolean NN | default false |
| is_demo | Boolean NN | server default '0' |
| address | String(500) | legacy free text (structured addresses in `addresses`) |
| approved_by | String(255) | admin identifier (text) |
| approved_at, rejected_at | DateTime tz | |
| rejection_reason | String(500) | |
| created_at | DateTime tz NN | |

Partial unique index `unique_super_admin` on `is_super_admin` WHERE true (`= 1` on SQLite): at most one super admin row. ORM listeners block demoting, suspending or deleting that row.

### 4.2 farmers
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| user_id | Integer NN | FK users CASCADE; UQ, IX |
| full_name | String(255) NN | |
| phone | String(20) NN | |
| location | Text NN | |
| farm_name | String(255) | |
| farm_category | String(100) | |
| bank_account_number | String(512) NN | encrypted or `plain:` |
| ifsc_code | String(20) NN | |
| bank_name | String(100) | |
| account_holder_name | String(255) | |
| upi_id | String(100) | |
| is_approved | Boolean NN | default false; set by `farmer_repository` |
| created_at | DateTime tz NN | |

### 4.3 delivery_partners
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| user_id | Integer NN | FK users CASCADE; UQ, IX |
| full_name, phone | String(255), String(20) NN | |
| is_active | Boolean NN | default true; set by admin flows (endpoint UNVERIFIED) |
| is_available | Boolean NN | default false; on duty toggle |
| bank_name, account_holder_name | String(100), String(255) | |
| bank_account_number | String(512) | encrypted or `plain:` |
| ifsc_code | String(20) | |
| upi_id | String(100) | |
| vehicle_type, vehicle_number, driving_license | String(50), String(50), String(100) | |
| current_latitude, current_longitude | Float | updated by `PUT /delivery/location` |
| location_updated_at | DateTime tz | |
| location_accuracy | Float | |
| created_at | DateTime tz NN | |

### 4.4 products (legacy)
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| farmer_id | Integer NN | FK farmers CASCADE; IX `(farmer_id, is_active)` |
| name | String(255) NN | |
| description | Text | |
| price | Numeric(10,2) NN | |
| quantity | Integer NN | renamed from `stock` (004) |
| unit | String(50) NN | |
| harvest_date | Date NN | freshness cutoff uses `PRODUCT_EXPIRY_DAYS` |
| image_url | String(2048) NN | |
| is_active | Boolean NN | default true; IX |
| is_demo | Boolean NN | |
| created_at, updated_at | DateTime tz NN | |

### 4.5 orders
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| customer_id | Integer NN | FK users RESTRICT; IX |
| farmer_id | Integer NN | FK **farmers** RESTRICT; IX (not users) |
| total_amount | Numeric(12,2) NN | |
| is_demo | Boolean NN | |
| status | enum orderstatus NN | model default pending; live orders start `reserved`; IX |
| reservation_expires_at | DateTime tz | now + 5 min at create; cleared on payment |
| payment_method | String(50) | client string, e.g. `razorpay`, `cod` |
| created_at, updated_at | DateTime tz NN | |

IX: `(customer_id, status)`, `(farmer_id, status)`.

### 4.6 order_items
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| order_id | Integer NN | FK orders CASCADE; IX |
| product_id | Integer | FK products RESTRICT; IX; legacy line (nullable) |
| inventory_id | Integer | FK farmer_inventory RESTRICT; catalogue line |
| master_product_id | Integer | FK master_products RESTRICT; catalogue line |
| quantity | Integer NN | |
| price_at_order_time | Numeric(10,2) NN | price snapshot |
| subtotal | Numeric(12,2) NN | |

Each line uses either `product_id` (legacy) or `inventory_id` + `master_product_id` (catalogue).

### 4.7 deliveries
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| order_id | Integer NN | FK orders RESTRICT; UQ `uq_deliveries_order_id`; IX |
| delivery_partner_id | Integer | FK delivery_partners SET NULL; IX |
| status | enum deliverystatus NN | default pending; IX |
| is_demo | Boolean NN | |
| otp_code | String(255) | bcrypt hash; cleared on delivery |
| plain_otp | String(6) | **plaintext OTP**; set while out for delivery, cleared on delivery (see section 8) |
| otp_expires_at | DateTime tz | now + `DELIVERY_OTP_EXPIRY_MINUTES` |
| destination_latitude, destination_longitude | Float | copied from customer default address at create; partner may update |
| assigned_at, picked_up_at, delivered_at | DateTime tz | no timestamps for accepted, out-for-delivery or failed |
| created_at | DateTime tz NN | |

IX: `status`, `(delivery_partner_id, status)`.

### 4.8 payments
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| order_id | Integer NN | FK orders RESTRICT; UQ `uq_payments_order_id`; IX |
| razorpay_order_id | String NN | UQ `uq_payments_razorpay_order_id`; IX. COD demo uses a synthetic `demo_cod_*` value |
| razorpay_payment_id | String | IX; set on verify |
| amount | Numeric(12,2) NN | |
| is_demo | Boolean NN | |
| currency | String(3) NN | |
| status | enum paymentstatus NN | IX |
| created_at, updated_at | DateTime tz NN | |

### 4.9 transactions
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| payment_id | Integer NN | FK payments CASCADE; IX |
| type | enum transactiontype NN | payment, release, refund |
| amount | Numeric(12,2) NN | |
| is_demo | Boolean NN | |
| status | enum transactionstatus NN | |
| note | String(500) | free text |
| created_at | DateTime tz NN | |

IX: `(type, status)`.

### 4.10 admin_actions
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| admin_user_id | Integer NN | FK users RESTRICT; IX |
| action_type | enum adminactiontype NN | IX |
| target_user_id | Integer | FK users SET NULL; IX |
| action_metadata | JSON NN | free-form details |
| created_at | DateTime tz NN | |

Written by `admin_repository.log_action`; read by the activity-log endpoints.

### 4.11 disputes
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| order_id | Integer NN | FK orders RESTRICT; IX |
| raised_by | Integer NN | FK users RESTRICT; IX |
| reason | Text NN | |
| status | enum disputestatus NN | default open; IX |
| resolution_note | Text | required when resolving or rejecting (422 otherwise) |
| created_at, updated_at | DateTime tz NN | |

### 4.12 addresses
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| user_id | Integer NN | FK users CASCADE; IX |
| house_flat, street, area, city, state | String(255/255/255/100/100) NN | |
| building, landmark | String(255) | |
| pin_code | String(6) NN | |
| address_type | String(50) NN | default `Home` |
| is_default | Boolean NN | default false |
| is_demo | Boolean NN | |
| latitude, longitude | Float | used for destination and 25 km checks |
| created_at, updated_at | DateTime tz NN | |

No DB constraint enforces one default per user (UNVERIFIED whether every service write path does).

### 4.13 reviews
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| order_id | Integer NN | FK orders CASCADE; UNIQUE (one review per order) |
| customer_id | Integer NN | FK users CASCADE |
| farmer_id | Integer NN | FK farmers CASCADE |
| delivery_partner_id | Integer | FK delivery_partners SET NULL |
| farmer_rating | Integer NN | 1 to 5 range UNVERIFIED at DB level |
| farmer_review | Text | |
| delivery_rating | Integer | |
| delivery_review | Text | |
| is_demo | Boolean NN | |
| created_at | DateTime tz NN | |

### 4.14 master_categories
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| name | String(100) NN | UQ |
| slug | String(100) NN | UQ, IX |
| parent_id | Integer | FK master_categories SET NULL (tree) |
| icon_emoji | String(10) | |
| image_url | String(2048) | |
| display_order | Integer NN | default 0 |
| is_active | Boolean NN | default true |
| created_at | DateTime tz NN | |

### 4.15 master_products
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| category_id | Integer NN | FK master_categories RESTRICT; IX `(category_id, is_active)` |
| name | String(255) NN | |
| slug | String(255) NN | UQ, IX |
| description, storage_info, tags | Text | `tags` format UNVERIFIED |
| default_unit | String(20) NN | default `kg` |
| image_url | String(2048) | |
| shelf_life_days | Integer | |
| is_seasonal, is_active | Boolean NN | default false, true |
| display_order | Integer NN | default 0; IX `(display_order, is_active)` |
| created_by | Integer | FK users SET NULL |
| created_at, updated_at | DateTime tz NN | |

### 4.16 farmer_inventory
| Column | Type | Notes |
|---|---|---|
| id | Integer NN | PK |
| master_product_id | Integer NN | FK master_products CASCADE; IX `(master_product_id, is_active)` |
| farmer_id | Integer NN | FK farmers CASCADE; IX `(farmer_id, is_active)` |
| price | Numeric(10,2) NN | CK `price > 0` |
| quantity | Integer NN | default 0; CK `quantity >= 0` |
| unit | String(20) NN | default `kg` |
| is_organic | Boolean NN | default false |
| harvest_date | Date NN | 30-day freshness check in inventory flow |
| notes | Text | |
| is_active, is_demo | Boolean NN | |
| created_at, updated_at | DateTime tz NN | |

UQ `uq_inventory_product_farmer` on `(master_product_id, farmer_id)`: one listing per farmer per product.

---

## 5. Relationships

```
users 1 -- 0..1 farmers              (user_id UQ)
users 1 -- 0..1 delivery_partners    (user_id UQ)
users 1 -- N    addresses            (CASCADE)
users 1 -- N    orders               (customer_id, RESTRICT)
users 1 -- N    disputes             (raised_by, RESTRICT)
users 1 -- N    admin_actions        (admin_user_id RESTRICT; target_user_id SET NULL)
farmers 1 -- N  products, farmer_inventory, reviews   (CASCADE)
farmers 1 -- N  orders               (farmer_id, RESTRICT)
master_categories 1 -- N master_categories (parent_id, SET NULL)
master_categories 1 -- N master_products   (RESTRICT)
master_products 1 -- N farmer_inventory    (CASCADE)
master_products 1 -- N order_items         (RESTRICT)
farmer_inventory 1 -- N order_items        (inventory_id, RESTRICT)
products 1 -- N order_items                (product_id, RESTRICT, legacy)
orders 1 -- N order_items            (CASCADE)
orders 1 -- 0..1 deliveries          (order_id UQ, RESTRICT)
orders 1 -- 0..1 payments            (order_id UQ, RESTRICT)
orders 1 -- 0..1 reviews             (order_id UQ, CASCADE)
orders 1 -- N disputes               (RESTRICT)
payments 1 -- N transactions         (CASCADE)
delivery_partners 1 -- N deliveries  (SET NULL)
delivery_partners 1 -- N reviews     (SET NULL)
```

ORM cascades (`delete-orphan`): `users.addresses`, `users.farmer_profile`, `users.delivery_profile`, `orders.items`.

---

## 6. State machines

### 6.1 Order (`ALLOWED_TRANSITIONS` in `order.py`, plus direct sets in services)
Live path: `reserved` -> `payment_pending` -> `accepted` -> `packing` -> `ready_for_pickup` -> `picked_up` -> `out_for_delivery` -> `completed` -> `refund_pending` -> `refund_completed`. `cancelled` from reserved, payment_pending (customer or expiry), accepted, packing, ready_for_pickup. `rejected` from accepted (farmer).

| Set by | Transition |
|---|---|
| `order_service.create_order` | (new) -> reserved |
| `payment_service.create_payment` | reserved -> payment_pending |
| `payment_service.verify_payment` (and COD path) | payment_pending -> accepted |
| farmer endpoints (map-checked) | accepted -> packing -> ready_for_pickup; accepted -> rejected |
| `delivery_service.update_status` (direct) | -> picked_up; -> out_for_delivery; failed -> cancelled |
| `delivery_service.verify_otp` (direct) | -> completed |
| customer cancel, `release_expired_reservations` | -> cancelled |
| refund paths in `payment_service` | refund_pending, refund_completed (UNVERIFIED exact calls) |

Dead: farmer `accept` and `complete` endpoints (no map entry, always 409). See architecture risks.

### 6.2 Delivery (`DELIVERY_TRANSITIONS`)
`pending -> assigned -> accepted -> picked_up -> out_for_delivery -> delivered`; any non-terminal -> `failed`. Auto-assign and claim both set `assigned`, `delivery_partner_id` and `assigned_at`.

### 6.3 Payment
`created` -> `paid` (verify; escrow) -> `refunded` (admin refund). `created` -> `failed` (verify rejects). Re-create is blocked when `failed` or `refunded`. COD demo goes straight to `paid`.

### 6.4 User status
| From | To | Trigger |
|---|---|---|
| (new) | approved | customer or admin on sync-user |
| (new) | pending | farmer or delivery on sync-user |
| pending | approved | admin approve (`admin_repository`) |
| pending | rejected | admin reject (sets `rejected_at`, `rejection_reason`) |
| approved | suspended | admin suspend |
| suspended | approved | admin reinstate |
| any | pending | profile edit or resubmit (`profile.py` lines 172, 225, 265; guard UNVERIFIED) |

Farmer approval is also `farmers.is_approved` (set by `farmer_repository`).

### 6.5 Dispute
`open` -> `in_review` -> `resolved` or `rejected`. Resolving with `trigger_refund` runs the refund path (`dispute_service` near line 249).

---

## 7. Indexes of note

- `unique_super_admin` (partial UQ): one super admin.
- `uq_deliveries_order_id`: one delivery per order. `atomic_claim_delivery` locks with `FOR UPDATE` on PostgreSQL only.
- `ix_deliveries_partner_id_status`: partner's active run lookup.
- `uq_payments_order_id`, `uq_payments_razorpay_order_id`: idempotent payment create.
- `uq_inventory_product_farmer`: one listing per farmer per product.
- Admin and dispute indexes (`ix_admin_actions_*`, `ix_disputes_*`) back admin filters.

---

## 8. Sensitive and derived data

| Data | Handling today |
|---|---|
| `users.phone`, `users.email` | plain text; used for account linking in sync-user (see architecture risks) |
| bank account numbers, IFSC, UPI (farmers, delivery_partners) | Fernet if key set, else `plain:`. `GET /farmers/{id}` returns them decrypted to any logged-in user (risk) |
| `deliveries.otp_code` | bcrypt, 12 rounds |
| `deliveries.plain_otp` | plain text while out for delivery; customer sees it by design; should not persist (risk) |
| `payments.razorpay_*` | plain identifiers; signature verified server-side |
| partner GPS, `location_updated_at` | plain; exposed to customer and admin while out for delivery |
| address coordinates | plain; used for matching and ETA |

---

## 9. Discrepancies and open points

- `deliveries.plain_otp` contradicts the `app/models/delivery.py` docstring ("never stored in plain text").
- `users.address` (legacy text) and the `addresses` table both exist. Which one each screen reads is UNVERIFIED.
- `products` (legacy) and `farmer_inventory` (catalogue) coexist; `order_items` supports both.
- `order_items.product_id` is nullable (SQLite scripts did this); the Alembic history for that change is UNVERIFIED.
- Model default for `orders.status` is `pending`, but `create_order` always writes `reserved`.
- Migrations 007 and 008 do not exist; the chain is linear with head `009_master_catalogue`.
- `create_all` at startup can create model tables that the migrated database lacks, so a database built that way can drift from Alembic. UNVERIFIED which model tables or columns have no matching migration; run `alembic check` (not run for this document).

---

## 10. Operational notes

- Demo reset (`POST /admin/demo/reset`) deletes, in order: disputes, reviews, deliveries, transactions, payments, order_items, orders, products, farmer_inventory, addresses (all `is_demo = true`), then demo farmer, partner and address rows. Raw SQL via `text()`.
- Expired reservations are cancelled lazily on order endpoints; stock is restored in the same transaction.
- `scripts/prod_seed.py` and `scripts/db_setup.py seed` create users. Read `backend.md` section 10 before running either.
- Do not run the SQLite-only scripts (`scripts/apply_009_migration.py`, `make_order_items_product_id_nullable.py`, `migrate_010_commerce_engine.py`) against Postgres.
