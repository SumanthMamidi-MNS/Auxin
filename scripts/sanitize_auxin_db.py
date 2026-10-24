"""
scripts/sanitize_auxin_db.py
Database Sanitization & Pristine Seed Script for Auxin V3.0
Purges all 'asdf' dummy residues and seeds pristine realistic data.
"""

import sqlite3
from datetime import datetime

DB_PATH = 'auxin.db'

def sanitize_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    print("Beginning auxin.db sanitization...")

    # 1. Purge invalid test users
    c.execute("DELETE FROM users WHERE name LIKE '%asdf%' OR email LIKE '%asdf%' OR phone LIKE '%1234234343%'")
    c.execute("DELETE FROM addresses WHERE house_flat LIKE '%asdf%' OR city LIKE '%asdf%' OR building LIKE '%asdf%'")

    # 2. Update Core Users
    today_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # User 1: Sumanth Mamidi (Admin)
    c.execute("""
        UPDATE users 
        SET address = 'Auxin Headquarters, Cyber City, Phase II, Gurugram, Haryana - 122002',
            phone = '+917661920205',
            status = 'approved'
        WHERE id = 1
    """)

    # User 2: Ananya Sharma (Customer)
    c.execute("""
        UPDATE users 
        SET address = 'Villa 14, Palm Grove Enclave, Golf Course Extension Road, Sector 65, Gurugram, Haryana - 122018',
            phone = '+919810482103',
            name = 'Ananya Sharma',
            status = 'approved'
        WHERE id = 2
    """)

    # User 3: Ramesh Kumar (Farmer)
    c.execute("""
        UPDATE users 
        SET address = 'Auxin Green Harvest Farms, Survey No. 42, Sohna Rural Belt, Gurugram, Haryana - 122103',
            phone = '+919876543210',
            name = 'Ramesh Kumar',
            status = 'approved'
        WHERE id = 3
    """)

    # User 4: Vikram Singh (Courier)
    c.execute("""
        UPDATE users 
        SET address = 'Auxin EV Logistics Hub, Transit Bay 3, Vatika Chowk, Badshahpur, Gurugram, Haryana - 122101',
            phone = '+919818765432',
            name = 'Vikram Singh',
            status = 'approved'
        WHERE id = 4
    """)

    # 3. Clean Addresses Table
    c.execute("DELETE FROM addresses")
    c.execute("""
        INSERT INTO addresses (id, user_id, house_flat, building, street, area, landmark, city, state, pin_code, address_type, is_default, is_demo, latitude, longitude, created_at, updated_at)
        VALUES 
        (1, 2, 'Villa 14', 'Palm Grove Enclave', 'Golf Course Ext Road', 'Sector 65', 'Opposite Heritage Club', 'Gurugram', 'Haryana', '122018', 'home', 1, 1, 28.4015, 77.0678, ?, ?),
        (2, 3, 'Farm House 1', 'Auxin Green Harvest', 'Sohna Rural Road', 'Sohna', 'Near Aravalli foothills', 'Gurugram', 'Haryana', '122103', 'work', 1, 1, 28.2450, 77.0620, ?, ?),
        (3, 4, 'Transit Bay 3', 'Auxin EV Hub', 'Vatika Chowk', 'Badshahpur', 'Near Rapid Metro', 'Gurugram', 'Haryana', '122101', 'work', 1, 1, 28.3850, 77.0420, ?, ?)
    """, (today_str, today_str, today_str, today_str, today_str, today_str))

    # 4. Clean Farmers Table
    c.execute("""
        UPDATE farmers 
        SET full_name = 'Ramesh Kumar',
            farm_name = 'Auxin Green Harvest Farms',
            location = 'Survey No. 42, Sohna Rural Belt, Gurugram, Haryana - 122103',
            farm_category = 'Certified NPOP Organic Cultivator',
            phone = '+919876543210',
            is_approved = 1
        WHERE user_id = 3
    """)

    # 5. Clean Delivery Partners Table
    c.execute("""
        UPDATE delivery_partners 
        SET full_name = 'Vikram Singh',
            vehicle_type = 'Electric Cargo Bike',
            vehicle_number = 'HR-26-EQ-4821',
            driving_license = 'DL-HR262024009842',
            phone = '+919818765432',
            current_latitude = 28.3910,
            current_longitude = 77.0540,
            is_active = 1,
            is_available = 1
        WHERE user_id = 4
    """)

    # 6. Update inventory dates to today
    today_date = datetime.now().strftime('%Y-%m-%d')
    c.execute("UPDATE farmer_inventory SET harvest_date = ?", (today_date,))

    # 7. Update Deliveries Table
    c.execute("""
        UPDATE deliveries 
        SET plain_otp = '482103',
            otp_code = '482103',
            destination_latitude = 28.4015,
            destination_longitude = 77.0678,
            status = 'out_for_delivery'
        WHERE order_id = 1
    """)

    conn.commit()
    print("auxin.db sanitized successfully!")

    # Verify
    print("\nVerified Users:")
    for r in c.execute("SELECT id, name, email, phone, address FROM users").fetchall():
        print(" ", r)

    print("\nVerified Delivery Partner:")
    for r in c.execute("SELECT full_name, vehicle_type, vehicle_number FROM delivery_partners").fetchall():
        print(" ", r)

    conn.close()

if __name__ == '__main__':
    sanitize_db()
