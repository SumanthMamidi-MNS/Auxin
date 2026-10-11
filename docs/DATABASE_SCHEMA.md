# Database Schema Reference — Auxin V3.0

The following database tables are defined using SQLAlchemy declarative ORM models and migrations.

---

## 1. Core Users (`users`)
Stores the authenticated profile reference. Linked to Supabase authentication ID.
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `name` (VARCHAR)
- `phone` (VARCHAR, Unique)
- `role` (ENUM: `customer`, `farmer`, `courier`, `admin`)
- `status` (ENUM: `pending`, `active`, `suspended`)
- `is_super_admin` (BOOLEAN, Default: `false`)

---

## 2. Farmer Profiles (`farmers`)
- `id` (UUID, Primary Key) -> Foreign Key `users.id`
- `farm_name` (VARCHAR)
- `farm_category` (VARCHAR)
- `location` (VARCHAR)
- `bank_name` (VARCHAR)
- `account_holder_name` (VARCHAR)
- `bank_account_number` (VARCHAR, Encrypted)
- `ifsc_code` (VARCHAR)
- `upi_id` (VARCHAR)

---

## 3. Products Catalogue (`products`)
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `category` (VARCHAR)
- `price` (INTEGER, Price in paisa)
- `quantity` (INTEGER, Available stock)
- `farmer_id` (UUID) -> Foreign Key `farmers.id`

---

## 4. Orders & Items (`orders`, `order_items`)
- **Orders**:
  - `id` (UUID, Primary Key)
  - `customer_id` (UUID)
  - `status` (ENUM: `pending`, `confirmed`, `packed`, `dispatched`, `delivered`, `cancelled`)
  - `total_amount` (INTEGER, Paisa)
  - `payment_method` (ENUM: `cod`, `razorpay`)
  - `payment_status` (ENUM: `unpaid`, `paid`, `refunded`, `escrow`)
  - `delivery_partner_id` (UUID)

- **Order Items**:
  - `id` (UUID, Primary Key)
  - `order_id` (UUID) -> Foreign Key `orders.id`
  - `product_id` (UUID) -> Foreign Key `products.id`
  - `quantity` (INTEGER)
  - `price` (INTEGER, Snapshot price in paisa)
