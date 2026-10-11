"""
Script to make product_id column nullable in order_items sqlite table.
SQLite doesn't support directly altering column nullability, so we recreate the table.
"""

import sqlite3

DB_PATH = "auxin.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Start transaction
cur.execute("PRAGMA foreign_keys = OFF")

# Get schema of old order_items
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='order_items'")
old_sql = cur.fetchone()[0]
print("Old schema:\n", old_sql)

# Recreate order_items with product_id nullable
# Let's inspect the columns
# We want:
# CREATE TABLE order_items (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
#     product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
#     quantity INTEGER NOT NULL CHECK (quantity > 0),
#     price_at_order_time NUMERIC(10, 2) NOT NULL,
#     subtotal NUMERIC(12, 2) NOT NULL,
#     inventory_id INTEGER REFERENCES farmer_inventory(id) ON DELETE RESTRICT,
#     master_product_id INTEGER REFERENCES master_products(id) ON DELETE RESTRICT
# )

cur.execute("ALTER TABLE order_items RENAME TO _order_items_old")

cur.execute("""
    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price_at_order_time NUMERIC(10, 2) NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL,
        inventory_id INTEGER REFERENCES farmer_inventory(id) ON DELETE RESTRICT,
        master_product_id INTEGER REFERENCES master_products(id) ON DELETE RESTRICT
    )
""")

# Copy data back
cur.execute("""
    INSERT INTO order_items (id, order_id, product_id, quantity, price_at_order_time, subtotal, inventory_id, master_product_id)
    SELECT id, order_id, product_id, quantity, price_at_order_time, subtotal, inventory_id, master_product_id
    FROM _order_items_old
""")

# Recreate indexes
cur.execute("CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON order_items (order_id)")
cur.execute("CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items (product_id)")

cur.execute("DROP TABLE _order_items_old")

conn.commit()
cur.execute("PRAGMA foreign_keys = ON")
conn.close()
print("Successfully modified order_items product_id to be nullable!")
