-- ============================================================
-- AUXIN v2.0 — Complete Database Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/snjqxpelsbsvytxezwne/sql/new
-- 
-- This script is idempotent — safe to run multiple times.
-- It creates all tables, enums, indexes, and seeds users.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: ENUM TYPES
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('farmer', 'customer', 'delivery', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE userstatus AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE farmerstatus AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE orderstatus AS ENUM (
        'pending', 'confirmed', 'packed', 'dispatched',
        'delivered', 'cancelled', 'refund_requested', 'refunded'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE deliverystatus AS ENUM (
        'unassigned', 'assigned', 'picked_up', 'delivered', 'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE paymentstatus AS ENUM (
        'pending', 'authorized', 'captured', 'failed', 'refunded', 'partial_refund'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transactiontype AS ENUM (
        'payment', 'escrow_hold', 'escrow_release',
        'refund', 'platform_fee', 'farmer_payout'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transactionstatus AS ENUM ('pending', 'completed', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE adminactiontype AS ENUM (
        'approve_farmer', 'reject_farmer', 'suspend_user',
        'reinstate_user', 'resolve_dispute', 'reject_dispute'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE disputestatus AS ENUM ('open', 'in_review', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: USERS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255)        NOT NULL,
    phone           VARCHAR(20)         NOT NULL UNIQUE,
    role            userrole            NOT NULL,
    status          userstatus          NOT NULL DEFAULT 'approved',
    supabase_uid    VARCHAR(36)         UNIQUE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_id          ON users (id);
CREATE INDEX IF NOT EXISTS ix_users_phone       ON users (phone);
CREATE INDEX IF NOT EXISTS ix_users_supabase_uid ON users (supabase_uid);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: FARMERS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farmers (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_name               VARCHAR(255)    NOT NULL,
    farm_address            TEXT            NOT NULL,
    farm_size_acres         NUMERIC(10,2),
    crops_grown             TEXT,
    bank_account_number     VARCHAR(255),
    bank_ifsc_code          VARCHAR(20),
    bank_account_name       VARCHAR(255),
    status                  farmerstatus    NOT NULL DEFAULT 'pending',
    rejection_reason        TEXT,
    approved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_farmers_id      ON farmers (id);
CREATE INDEX IF NOT EXISTS ix_farmers_user_id ON farmers (user_id);
CREATE INDEX IF NOT EXISTS ix_farmers_status  ON farmers (status);

-- ─────────────────────────────────────────────────────────────
-- STEP 4: PRODUCTS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    farmer_id       INTEGER         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    price_per_unit  NUMERIC(10,2)   NOT NULL,
    unit            VARCHAR(50)     NOT NULL,
    quantity        INTEGER         NOT NULL DEFAULT 0,
    is_available    BOOLEAN         NOT NULL DEFAULT true,
    image_url       TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_products_id         ON products (id);
CREATE INDEX IF NOT EXISTS ix_products_farmer_id  ON products (farmer_id);
CREATE INDEX IF NOT EXISTS ix_products_is_available ON products (is_available);

-- ─────────────────────────────────────────────────────────────
-- STEP 5: ORDERS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL PRIMARY KEY,
    customer_id         INTEGER         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    farmer_id           INTEGER         NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    status              orderstatus     NOT NULL DEFAULT 'pending',
    total_amount        NUMERIC(12,2)   NOT NULL,
    delivery_address    TEXT            NOT NULL,
    delivery_notes      TEXT,
    estimated_delivery  TIMESTAMPTZ,
    actual_delivery     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_orders_id          ON orders (id);
CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS ix_orders_farmer_id   ON orders (farmer_id);
CREATE INDEX IF NOT EXISTS ix_orders_status      ON orders (status);

-- ─────────────────────────────────────────────────────────────
-- STEP 6: ORDER ITEMS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        INTEGER         NOT NULL,
    price_per_unit  NUMERIC(10,2)   NOT NULL,
    subtotal        NUMERIC(12,2)   NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_order_items_id         ON order_items (id);
CREATE INDEX IF NOT EXISTS ix_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items (product_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 7: DELIVERIES TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deliveries (
    id                      SERIAL PRIMARY KEY,
    order_id                INTEGER             NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    delivery_partner_id     INTEGER             REFERENCES users(id) ON DELETE SET NULL,
    status                  deliverystatus      NOT NULL DEFAULT 'unassigned',
    pickup_otp              VARCHAR(255),
    pickup_otp_expires_at   TIMESTAMPTZ,
    delivery_otp            VARCHAR(255),
    delivery_otp_expires_at TIMESTAMPTZ,
    picked_up_at            TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    failure_reason          TEXT,
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_deliveries_id                  ON deliveries (id);
CREATE INDEX IF NOT EXISTS ix_deliveries_order_id            ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS ix_deliveries_delivery_partner_id ON deliveries (delivery_partner_id);
CREATE INDEX IF NOT EXISTS ix_deliveries_status              ON deliveries (status);

-- ─────────────────────────────────────────────────────────────
-- STEP 8: PAYMENTS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
    id                      SERIAL PRIMARY KEY,
    order_id                INTEGER         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    razorpay_order_id       VARCHAR(100)    UNIQUE,
    razorpay_payment_id     VARCHAR(100)    UNIQUE,
    amount                  NUMERIC(12,2)   NOT NULL,
    currency                VARCHAR(10)     NOT NULL DEFAULT 'INR',
    status                  paymentstatus   NOT NULL DEFAULT 'pending',
    gateway_response        JSONB           NOT NULL DEFAULT '{}',
    refund_amount           NUMERIC(12,2),
    refund_reason           TEXT,
    refunded_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_payments_id                  ON payments (id);
CREATE INDEX IF NOT EXISTS ix_payments_order_id            ON payments (order_id);
CREATE INDEX IF NOT EXISTS ix_payments_status              ON payments (status);
CREATE INDEX IF NOT EXISTS ix_payments_razorpay_order_id   ON payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS ix_payments_razorpay_payment_id ON payments (razorpay_payment_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 9: TRANSACTIONS TABLE (ESCROW)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
    id              SERIAL PRIMARY KEY,
    payment_id      INTEGER             NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    type            transactiontype     NOT NULL,
    amount          NUMERIC(12,2)       NOT NULL,
    status          transactionstatus   NOT NULL DEFAULT 'pending',
    reference_id    VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_transactions_id          ON transactions (id);
CREATE INDEX IF NOT EXISTS ix_transactions_payment_id  ON transactions (payment_id);
CREATE INDEX IF NOT EXISTS ix_transactions_type_status ON transactions (type, status);

-- ─────────────────────────────────────────────────────────────
-- STEP 10: ADMIN ACTIONS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_actions (
    id              SERIAL PRIMARY KEY,
    admin_user_id   INTEGER             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action_type     adminactiontype     NOT NULL,
    target_user_id  INTEGER             REFERENCES users(id) ON DELETE SET NULL,
    action_metadata JSONB               NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_admin_actions_id             ON admin_actions (id);
CREATE INDEX IF NOT EXISTS ix_admin_actions_admin_user_id  ON admin_actions (admin_user_id);
CREATE INDEX IF NOT EXISTS ix_admin_actions_action_type    ON admin_actions (action_type);
CREATE INDEX IF NOT EXISTS ix_admin_actions_target_user_id ON admin_actions (target_user_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 11: DISPUTES TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disputes (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    raised_by       INTEGER         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason          TEXT            NOT NULL,
    status          disputestatus   NOT NULL DEFAULT 'open',
    resolution_note TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_disputes_id        ON disputes (id);
CREATE INDEX IF NOT EXISTS ix_disputes_order_id  ON disputes (order_id);
CREATE INDEX IF NOT EXISTS ix_disputes_status    ON disputes (status);
CREATE INDEX IF NOT EXISTS ix_disputes_raised_by ON disputes (raised_by);

-- ─────────────────────────────────────────────────────────────
-- STEP 12: ALEMBIC VERSION TABLE
-- (Marks this DB as being at migration HEAD so Alembic won't re-run)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Mark as already at migration head (006_add_user_status)
INSERT INTO alembic_version (version_num)
VALUES ('006_add_user_status')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 13: SEED DEMO USERS
-- These match the Supabase Auth users already created.
-- Supabase UIDs will be updated after fetching from Auth API.
-- ─────────────────────────────────────────────────────────────

-- Admin (+919999999999) — Supabase UID: 038013db-3e43-42ef-a140-4746246cd341
INSERT INTO users (name, phone, role, status, supabase_uid)
VALUES ('Admin User', '+919999999999', 'admin', 'approved', '038013db-3e43-42ef-a140-4746246cd341')
ON CONFLICT (phone) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        supabase_uid = EXCLUDED.supabase_uid;

-- Farmer (+918888888888) — Supabase UID: 266fa89b-3ffe-4719-808d-93346f3fe69b
INSERT INTO users (name, phone, role, status, supabase_uid)
VALUES ('Demo Farmer', '+918888888888', 'farmer', 'approved', '266fa89b-3ffe-4719-808d-93346f3fe69b')
ON CONFLICT (phone) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        supabase_uid = EXCLUDED.supabase_uid;

-- Delivery Partner (+917777777777) — Supabase UID: ca3a8bdb-c978-474f-b7e6-64b4e081c2e2
INSERT INTO users (name, phone, role, status, supabase_uid)
VALUES ('Demo Delivery', '+917777777777', 'delivery', 'approved', 'ca3a8bdb-c978-474f-b7e6-64b4e081c2e2')
ON CONFLICT (phone) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        supabase_uid = EXCLUDED.supabase_uid;

-- Customer (+916666666666) — Supabase UID: fcf5bf3c-8f71-4283-9166-9500e5759c3b
INSERT INTO users (name, phone, role, status, supabase_uid)
VALUES ('Demo Customer', '+916666666666', 'customer', 'approved', 'fcf5bf3c-8f71-4283-9166-9500e5759c3b')
ON CONFLICT (phone) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        supabase_uid = EXCLUDED.supabase_uid;

-- ─────────────────────────────────────────────────────────────
-- STEP 14: CREATE FARMER PROFILE FOR DEMO FARMER
-- ─────────────────────────────────────────────────────────────

INSERT INTO farmers (user_id, farm_name, farm_address, status)
SELECT id, 'Green Valley Farm', 'Village Road, Karnataka 560001', 'approved'
FROM users WHERE phone = '+918888888888'
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 15: VERIFY TABLES CREATED
-- ─────────────────────────────────────────────────────────────

SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
