# app/services/milo/configuration/settings.py
from app.core.config import settings

def validate_milo_config() -> dict:
    """
    Utility helper to inspect and parse the current environment variables.
    Ensures safe operation boundaries for future updates.
    """
    return {
        "enabled": settings.MILO_ENABLED,
        "provider": settings.MILO_PROVIDER,
        "model": settings.MILO_MODEL,
        "temperature": settings.MILO_TEMPERATURE,
        "has_api_key": bool(settings.MILO_API_KEY),
    }
