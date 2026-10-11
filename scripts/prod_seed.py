#!/usr/bin/env python3
import asyncio
import os
import json
import sys
import urllib.request
from datetime import datetime, date, timezone

sys.path.append(os.getcwd())
if "APP_ENV" not in os.environ:
    os.environ["APP_ENV"] = "development"

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole, UserStatus
from app.models.farmer import Farmer
from app.models.delivery import DeliveryPartner, Delivery
from app.models.product import Product
from app.models.address import Address
from app.models.order import Order, OrderItem
from app.models.payment import Payment, Transaction
from app.models.review import Review
from app.models.admin import AdminAction, Dispute
from app.core.encryption import encrypt_field
from sqlalchemy import text

# The shared sandbox password is supplied at run time, never stored in source.
DEMO_PASSWORD = os.environ.get("DEMO_SEED_PASSWORD", "")

USERS_TO_SEED = [
    {
        "email": settings.SUPER_ADMIN_EMAIL,
        "phone": settings.SUPER_ADMIN_PHONE,
        "name": "Sumanth Mamidi",
        "role": UserRole.admin,
        "is_super_admin": True,
        "password": settings.SUPER_ADMIN_PASSWORD,
        "address": "Auxin Headquarters, Hitec City, Hyderabad, Telangana - 500081",
        "is_demo": False
    },
    {
        "email": "demo.customer@auxin.app",
        "phone": "+919999999991",
        "name": "Demo Customer",
        "role": UserRole.customer,
        "is_super_admin": False,
        "password": DEMO_PASSWORD,
        "address": "Flat 304, Green Meadows Apartment, Lotus Road, Koramangala, Bengaluru, Karnataka - 560034",
        "is_demo": True
    },
    {
        "email": "demo.farmer@auxin.app",
        "phone": "+919999999992",
        "name": "Demo Farmer",
        "role": UserRole.farmer,
        "is_super_admin": False,
        "password": DEMO_PASSWORD,
        "address": "Farm No. 42, Auxin Green Farm, Siddhagatta Road, Chikballapur, Bengaluru Rural, Karnataka - 562101",
        "is_demo": True
    },
    {
        "email": "demo.delivery@auxin.app",
        "phone": "+919999999993",
        "name": "Demo Delivery Partner",
        "role": UserRole.delivery,
        "is_super_admin": False,
        "password": DEMO_PASSWORD,
        "address": "Plot 88, Delivery Logistics Hub, Indiranagar, Bengaluru, Karnataka - 560038",
        "is_demo": True
    },
    {
        "email": "demo.admin@auxin.app",
        "phone": "+919999999994",
        "name": "Demo Admin",
        "role": UserRole.admin,
        "is_super_admin": False,
        "password": DEMO_PASSWORD,
        "address": "Auxin Operations Centre, Indiranagar, Bengaluru, Karnataka - 560038",
        "is_demo": True
    }
]

def delete_user_from_supabase_by_email(email: str):
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        print("Supabase credentials not configured, skipping Supabase delete.")
        return None
    
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            users = data.get("users", [])
            for u in users:
                if u.get("email") == email:
                    uid = u["id"]
                    del_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{uid}"
                    del_req = urllib.request.Request(del_url, headers=headers, method="DELETE")
                    with urllib.request.urlopen(del_req, timeout=10) as del_resp:
                        print(f"Deleted user {email} ({uid}) from Supabase Auth.")
                    return
    except Exception as e:
        print(f"Error checking/deleting {email} in Supabase: {e}")

def create_user_in_supabase(email: str, password: str, phone: str, name: str, role: str):
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        print("Supabase credentials not configured, skipping Supabase create.")
        return None
    
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    body = {
        "email": email,
        "password": password,
        "phone": phone,
        "email_confirm": True,
        "phone_confirm": True,
        "user_metadata": {
            "name": name,
            "role": role
        }
    }
    
    try:
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
        req = urllib.request.Request(url, headers=headers, data=json.dumps(body).encode("utf-8"), method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            uid = data["id"]
            print(f"Created user {email} ({uid}) in Supabase Auth.")
            return uid
    except Exception as e:
        print(f"Error creating user {email} in Supabase: {e}")
        try:
            url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for u in data.get("users", []):
                    if u.get("email") == email:
                        return u["id"]
        except Exception:
            pass
        return None

def _safety_gate() -> None:
    """
    This script WIPES every application table and re-creates demo users in
    Supabase Auth (deleting existing auth users with the same emails).
    It must only ever run against a disposable sandbox.
    """
    if "--yes-wipe" not in sys.argv:
        sys.exit(
            "Refusing to run: this script deletes ALL application data and recreates demo auth users. "
            "Re-run with --yes-wipe against a sandbox database only."
        )
    if not DEMO_PASSWORD:
        sys.exit("Set DEMO_SEED_PASSWORD (the shared sandbox password) before seeding.")
    if settings.APP_ENV.lower() == "production" and not settings.DEMO_MODE:
        sys.exit("Refusing: APP_ENV=production without DEMO_MODE. Point DATABASE_URL at a sandbox first.")
    print(f"[Seed] Target environment: {settings.APP_ENV}  demo_mode={settings.DEMO_MODE}")


async def run_seed():
    _safety_gate()
    from app.db.base_all import Base
    from app.db.session import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[Clean] Cleaning database tables...")
        await db.execute(text("DELETE FROM admin_actions;"))
        await db.execute(text("DELETE FROM disputes;"))
        await db.execute(text("DELETE FROM reviews;"))
        await db.execute(text("DELETE FROM payments;"))
        await db.execute(text("DELETE FROM transactions;"))
        await db.execute(text("DELETE FROM deliveries;"))
        await db.execute(text("DELETE FROM order_items;"))
        await db.execute(text("DELETE FROM orders;"))
        await db.execute(text("DELETE FROM products;"))
        await db.execute(text("DELETE FROM farmers;"))
        await db.execute(text("DELETE FROM delivery_partners;"))
        await db.execute(text("DELETE FROM addresses;"))
        await db.execute(text("DELETE FROM users;"))
        await db.commit()
        print("[Success] Database cleaned successfully.")
        
        print("[Seed] Seeding Users...")
        for u_data in USERS_TO_SEED:
            email = u_data["email"]
            print(f"Processing user {email}...")
            
            delete_user_from_supabase_by_email(email)
            
            uid = create_user_in_supabase(
                email=email,
                password=u_data["password"],
                phone=u_data["phone"],
                name=u_data["name"],
                role=u_data["role"].value
            )
            if not uid:
                import hashlib
                uid = str(hashlib.md5(email.encode("utf-8")).hexdigest())
            
            user = User(
                name=u_data["name"],
                phone=u_data["phone"],
                email=email,
                role=u_data["role"],
                status=UserStatus.approved,
                is_super_admin=u_data["is_super_admin"],
                is_demo=u_data["is_demo"],
                address=u_data.get("address"),
                supabase_uid=uid
            )
            db.add(user)
            await db.flush()
            
            if u_data["role"] == UserRole.farmer:
                farmer_profile = Farmer(
                    user_id=user.id,
                    full_name=u_data["name"],
                    phone=u_data["phone"],
                    location="Bengaluru Rural, Karnataka",
                    bank_account_number=encrypt_field("123456789012"),
                    ifsc_code="SBIN0001234",
                    is_approved=True,
                    bank_name="State Bank of India",
                    account_holder_name="Demo Farmer",
                    upi_id="demofarmer@okaxis"
                )
                db.add(farmer_profile)
                await db.flush()

                
            elif u_data["role"] == UserRole.delivery:
                dp_profile = DeliveryPartner(
                    user_id=user.id,
                    full_name="Ramu Delivery",
                    phone=u_data["phone"],
                    is_active=True,
                    is_available=True,
                    current_latitude=12.9716,
                    current_longitude=77.5946,
                    bank_name="HDFC Bank",
                    account_holder_name="Ramu Delivery",
                    bank_account_number=encrypt_field("987654321098"),
                    ifsc_code="HDFC0000001",
                    upi_id="ramudelivery@okhdfc",
                    vehicle_type="Motorcycle",
                    vehicle_number="KA-01-EF-1234",
                    driving_license="DL-123456789"
                )
                db.add(dp_profile)
                
            elif u_data["role"] == UserRole.customer:
                addr = Address(
                    user_id=user.id,
                    house_flat="Flat 304",
                    building="Green Meadows Apartment",
                    street="Lotus Road",
                    area="Koramangala",
                    city="Bengaluru",
                    state="Karnataka",
                    pin_code="560034",
                    latitude=12.9352,
                    longitude=77.6244,
                    address_type="Home",
                    is_default=True
                )
                db.add(addr)
                
        await db.commit()
        print("[Done] Seeding complete!")

if __name__ == "__main__":
    asyncio.run(run_seed())
