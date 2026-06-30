"""
app/core/config.py
==================
Centralised settings loader.  All configuration is read from environment
variables (or a .env file at project root) via pydantic-settings.

Rules:
  • No value has a hard-coded secret.
  • Every field has a documented purpose.
  • Sensitive fields are never logged.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_env_file() -> str:
    """
    Resolve which .env file to load based on the APP_ENV environment variable.
    Priority:
      APP_ENV=development → .env.development
      APP_ENV=production  → .env.production
      (unset or other)    → .env  (backward compat)
    """
    env = os.environ.get("APP_ENV", "").lower()
    candidates = {
        "development": ".env.development",
        "production":  ".env.production",
    }
    chosen = candidates.get(env, ".env")
    # Fall back to .env if the specific file doesn't exist
    if not os.path.exists(chosen):
        chosen = ".env"
    return chosen


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False
    # Comma-separated list of allowed CORS origins, or "*" for dev
    ALLOWED_ORIGINS: str = "*"
    LOG_LEVEL: str = "INFO"   # DEBUG | INFO | WARNING | ERROR

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DATABASE_URL: str  # Required – no default to force explicit config

    # ------------------------------------------------------------------
    # Demo Mode (investor sandbox)
    # ------------------------------------------------------------------
    # Set DEMO_MODE=true to route all DB writes to DEMO_DATABASE_URL.
    # Production data remains completely untouched.
    # DEMO_DATABASE_URL must point to a separate Supabase project or Postgres sandbox.
    DEMO_MODE: bool = False
    DEMO_DATABASE_URL: str = ""  # Required when DEMO_MODE=true

    # ------------------------------------------------------------------
    # Supabase Auth
    # ------------------------------------------------------------------
    # SUPABASE_URL:              https://xxxx.supabase.co
    # SUPABASE_JWT_SECRET:       Project Settings → API → JWT Secret
    # SUPABASE_SERVICE_ROLE_KEY: Project Settings → API → service_role key
    SUPABASE_URL: str = ""             # Required in production
    SUPABASE_JWT_SECRET: str = ""      # Required – must be set before first request
    SUPABASE_SERVICE_ROLE_KEY: str = ""  # Required for backend admin operations


    # ------------------------------------------------------------------
    # Encryption (bank account numbers)
    # Fernet symmetric key – generate with: Fernet.generate_key().decode()
    # ------------------------------------------------------------------
    BANK_ACCOUNT_ENCRYPTION_KEY: str = ""  # Optional; if blank, field is stored as-is (dev only)

    # ------------------------------------------------------------------
    # Delivery
    # ------------------------------------------------------------------
    PRODUCT_EXPIRY_DAYS: int = 30               # Number of days before a product listing is hidden
    DELIVERY_OTP_EXPIRY_MINUTES: int = 10       # OTP lifetime for delivery confirmation
    DELIVERY_ASSIGNMENT_TIMEOUT_MINUTES: int = 30  # SLA: flag if unassigned longer than this
    DELIVERY_GEOFENCE_RADIUS_METERS: float = 100.0  # Max allowed distance for delivery completion

    # ------------------------------------------------------------------
    # Razorpay
    # ------------------------------------------------------------------
    RAZORPAY_KEY_ID: str = ""      # Required in production; blank = payment disabled
    RAZORPAY_SECRET: str = ""      # Required in production; blank = payment disabled


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached singleton Settings instance.
    Using lru_cache means the .env file is read exactly once.
    """
    return Settings()


# Module-level singleton – use this throughout the codebase
settings: Settings = get_settings()
