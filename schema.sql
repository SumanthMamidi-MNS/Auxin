-- =============================================================
-- Auxin Foundation Module – Database Schema
-- Engine: PostgreSQL 15+
-- =============================================================

-- ---------------------------------------------------------------
-- ENUM type for user roles
-- ---------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('farmer', 'customer', 'delivery', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    phone       VARCHAR(20)     NOT NULL UNIQUE,
    email       VARCHAR(255)    UNIQUE,
    role        userrole        NOT NULL DEFAULT 'customer',
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ---------------------------------------------------------------
-- otps
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
    id              SERIAL PRIMARY KEY,
    phone           VARCHAR(20)     NOT NULL,
    otp_code        VARCHAR(255)    NOT NULL,   -- bcrypt hash, NOT plain text
    expires_at      TIMESTAMPTZ     NOT NULL,
    attempts_count  INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_otps_phone ON otps (phone);

-- ---------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(128)    NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token   ON refresh_tokens (token);

-- ---------------------------------------------------------------
-- farmers
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name            VARCHAR(255)    NOT NULL,
    phone                VARCHAR(20)     NOT NULL,
    location             TEXT            NOT NULL,
    bank_account_number  VARCHAR(512)    NOT NULL,    -- Fernet-encrypted
    ifsc_code            VARCHAR(20)     NOT NULL,
    is_approved          BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farmers_user_id ON farmers (user_id);

-- ---------------------------------------------------------------
-- products
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id            SERIAL PRIMARY KEY,
    farmer_id     INTEGER         NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name          VARCHAR(255)    NOT NULL,
    description   TEXT,
    price         NUMERIC(10, 2)  NOT NULL CHECK (price > 0),
    quantity      INTEGER         NOT NULL CHECK (quantity >= 0),
    unit          VARCHAR(50)     NOT NULL,
    harvest_date  DATE            NOT NULL,
    image_url     VARCHAR(2048)   NOT NULL,
    is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_products_farmer_id          ON products (farmer_id);
CREATE INDEX IF NOT EXISTS ix_products_is_active          ON products (is_active);
CREATE INDEX IF NOT EXISTS ix_products_farmer_id_is_active ON products (farmer_id, is_active);

-- ---------------------------------------------------------------
-- Order status enum
-- ---------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE orderstatus AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    farmer_id       INTEGER         NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
    total_amount    NUMERIC(12, 2)  NOT NULL CHECK (total_amount > 0),
    status          orderstatus     NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_orders_customer_id        ON orders (customer_id);
CREATE INDEX IF NOT EXISTS ix_orders_farmer_id          ON orders (farmer_id);
CREATE INDEX IF NOT EXISTS ix_orders_status             ON orders (status);
CREATE INDEX IF NOT EXISTS ix_orders_customer_id_status ON orders (customer_id, status);
CREATE INDEX IF NOT EXISTS ix_orders_farmer_id_status   ON orders (farmer_id, status);

-- ---------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id                      SERIAL PRIMARY KEY,
    order_id                INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id              INTEGER         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity                INTEGER         NOT NULL CHECK (quantity > 0),
    price_at_order_time     NUMERIC(10, 2)  NOT NULL,
    subtotal                NUMERIC(12, 2)  NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items (product_id);

-- ---------------------------------------------------------------
-- Delivery status enum
-- ---------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE deliverystatus AS ENUM (
        'pending',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
        'failed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------
-- delivery_partners
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_partners (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name           VARCHAR(255)    NOT NULL,
    phone               VARCHAR(20)     NOT NULL,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_available        BOOLEAN         NOT NULL DEFAULT FALSE,
    current_latitude    DOUBLE PRECISION,           -- nullable until first update
    current_longitude   DOUBLE PRECISION,           -- nullable until first update
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_delivery_partners_user_id      ON delivery_partners (user_id);
CREATE INDEX IF NOT EXISTS ix_delivery_partners_is_available ON delivery_partners (is_available) WHERE is_active = TRUE;

-- ---------------------------------------------------------------
-- deliveries
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id                      SERIAL PRIMARY KEY,
    order_id                INTEGER         NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    delivery_partner_id     INTEGER         REFERENCES delivery_partners(id) ON DELETE SET NULL,
    status                  deliverystatus  NOT NULL DEFAULT 'pending',
    otp_code                VARCHAR(255),               -- bcrypt hash, NOT plain text
    otp_expires_at          TIMESTAMPTZ,
    destination_latitude    DOUBLE PRECISION,
    destination_longitude   DOUBLE PRECISION,
    assigned_at             TIMESTAMPTZ,
    picked_up_at            TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_deliveries_order_id              ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS ix_deliveries_delivery_partner_id   ON deliveries (delivery_partner_id);
CREATE INDEX IF NOT EXISTS ix_deliveries_status                ON deliveries (status);
CREATE INDEX IF NOT EXISTS ix_deliveries_partner_id_status     ON deliveries (delivery_partner_id, status);
