# scripts/production_preflight.py
import sys
import os
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Add parent directory to path to load app settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

async def run_preflight_checks():
    print("=" * 60)
    print("          AUXIN PRODUCTION PREFLIGHT SANITY CHECK         ")
    print("=" * 60)
    
    failures = 0
    warnings = 0
    
    # 1. Environment Check
    print(f"[*] Target Environment: {settings.APP_ENV}")
    if settings.APP_ENV != "production":
        print("[WARNING] APP_ENV is not set to 'production'. Some production checks will be bypassed.")
        warnings += 1

    # 2. Database Connectivity
    print("[*] Checking Database Configuration...")
    if not settings.DATABASE_URL:
        print("[FAIL] DATABASE_URL is not configured!")
        failures += 1
    else:
        try:
            # Short timeout to fail fast
            engine = create_async_engine(settings.DATABASE_URL, connect_args={"timeout": 5} if "postgresql" in settings.DATABASE_URL else {})
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            print("[PASS] Database connectivity verified.")
            await engine.dispose()
        except Exception as e:
            print(f"[FAIL] Database connectivity failed: {e}")
            failures += 1

    # 3. Supabase Auth Secrets
    print("[*] Checking Supabase Auth Secrets...")
    if not settings.SUPABASE_URL:
        print("[FAIL] SUPABASE_URL is missing!")
        failures += 1
    else:
        print("[PASS] SUPABASE_URL configured.")

    if not settings.SUPABASE_JWT_SECRET:
        print("[FAIL] SUPABASE_JWT_SECRET is missing! JWT authentication will fail.")
        failures += 1
    elif len(settings.SUPABASE_JWT_SECRET) < 32:
        print("[WARNING] SUPABASE_JWT_SECRET is shorter than 32 characters. Consider using a stronger key.")
        warnings += 1
    else:
        print("[PASS] SUPABASE_JWT_SECRET configured securely.")

    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        print("[WARNING] SUPABASE_SERVICE_ROLE_KEY is missing. Admin sync actions may fail.")
        warnings += 1
    else:
        print("[PASS] SUPABASE_SERVICE_ROLE_KEY configured.")

    # 4. Super Admin Credentials
    print("[*] Checking Super Admin Credentials...")
    if not settings.SUPER_ADMIN_PASSWORD:
        print("[WARNING] SUPER_ADMIN_PASSWORD is empty. Make sure password authentication is disabled or set.")
        warnings += 1
    else:
        print("[PASS] SUPER_ADMIN_PASSWORD is set.")

    # 5. CORS Configurations
    print("[*] Checking CORS Configs...")
    if settings.ALLOWED_ORIGINS.strip() == "*":
        if settings.APP_ENV == "production":
            print("[FAIL] CORS ALLOWED_ORIGINS cannot be '*' (wildcard) in production environment!")
            failures += 1
        else:
            print("[WARNING] CORS ALLOWED_ORIGINS is '*' (wildcard). Acceptable for dev only.")
            warnings += 1
    else:
        print(f"[PASS] Allowed CORS origins: {settings.ALLOWED_ORIGINS}")

    # 6. Razorpay Integrations
    print("[*] Checking Payment Credentials...")
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_SECRET:
        print("[WARNING] Razorpay credentials missing. Simulated/Demo COD payment flow will be used.")
        warnings += 1
    else:
        print("[PASS] Razorpay integration credentials present.")

    # 7. Encryption Key
    print("[*] Checking bank encryption keys...")
    if not settings.BANK_ACCOUNT_ENCRYPTION_KEY:
        print("[WARNING] BANK_ACCOUNT_ENCRYPTION_KEY is empty. Bank details will be stored in plain text.")
        warnings += 1
    else:
        print("[PASS] BANK_ACCOUNT_ENCRYPTION_KEY is configured.")

    print("=" * 60)
    print(f"PREFLIGHT SUMMARY: {failures} Failures, {warnings} Warnings")
    print("=" * 60)
    
    if failures > 0:
        print("[RESULT] PREFLIGHT STATUS: FAILED. Please correct errors before deployment.")
        sys.exit(1)
    else:
        print("[RESULT] PREFLIGHT STATUS: PASSED. Launch configuration is ready!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(run_preflight_checks())
