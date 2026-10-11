"""
Script to migrate SQLite database for Phase 3.11 Commerce Engine.
Recreates the `orders` table to update the `status` CHECK constraint and add new columns.
"""

import sqlite3

DB_PATH = "auxin.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Start transaction
cur.execute("PRAGMA foreign_keys = OFF")

# Rename old table
cur.execute("ALTER TABLE orders RENAME TO _orders_old")

# Create new orders table with updated status constraints and new columns
cur.execute("""
    CREATE TABLE orders (
        id INTEGER NOT NULL, 
        customer_id INTEGER NOT NULL, 
        farmer_id INTEGER NOT NULL, 
        total_amount NUMERIC(12, 2) NOT NULL, 
        is_demo BOOLEAN DEFAULT '0' NOT NULL, 
        status VARCHAR(30) NOT NULL, 
        created_at DATETIME NOT NULL, 
        updated_at DATETIME NOT NULL,
        reservation_expires_at DATETIME,
        payment_method VARCHAR(50),
        PRIMARY KEY (id), 
        FOREIGN KEY(customer_id) REFERENCES users (id) ON DELETE RESTRICT, 
        FOREIGN KEY(farmer_id) REFERENCES farmers (id) ON DELETE RESTRICT, 
        CONSTRAINT orderstatus CHECK (status IN (
            'pending', 'reserved', 'payment_pending', 'payment_confirmed', 
            'accepted', 'packing', 'ready_for_pickup', 'picked_up', 
            'out_for_delivery', 'completed', 'delivered', 'cancelled', 
            'rejected', 'refund_pending', 'refund_completed'
        ))
    )
""")

# Copy existing data, defaults payment_method to 'razorpay'
cur.execute("""
    INSERT INTO orders (id, customer_id, farmer_id, total_amount, is_demo, status, created_at, updated_at, reservation_expires_at, payment_method)
    SELECT id, customer_id, farmer_id, total_amount, is_demo, status, created_at, updated_at, NULL, 'razorpay'
    FROM _orders_old
""")

# Recreate indexes
cur.execute("CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON orders (customer_id)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_orders_farmer_id ON orders (farmer_id)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (status)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_orders_customer_id_status ON orders (customer_id, status)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_orders_farmer_id_status ON orders (farmer_id, status)")

# Drop old table
cur.execute("DROP TABLE _orders_old")

conn.commit()
cur.execute("PRAGMA foreign_keys = ON")
conn.close()

print("Successfully migrated orders table for Phase 3.11 Commerce Engine!")
