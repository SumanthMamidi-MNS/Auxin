# config/environment.py
# Auxin AI v9.0 — Environment Verification Utility

import os

def check_environment():
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "GEMINI_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    return {
        "status": "PASS" if not missing else "WARNING",
        "missing_vars": missing,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    res = check_environment()
    print(f"Environment Status: {res['status']}")
    if res['missing_vars']:
        print(f"Missing Variables: {res['missing_vars']}")
