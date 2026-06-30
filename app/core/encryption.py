"""
app/core/encryption.py
=======================
Symmetric encryption for sensitive fields (e.g. bank account numbers).

Algorithm: Fernet (AES-128-CBC + HMAC-SHA256) from the `cryptography` package.

Behaviour:
  - If BANK_ACCOUNT_ENCRYPTION_KEY is set in env, encrypt/decrypt transparently.
  - If the key is blank (dev / test), the value is stored as plain text with a
    "plain:" prefix so decryption is still well-defined.

This approach keeps the code path identical in both modes and lets you migrate
to encrypted storage simply by setting the env var.

Key generation (run once):
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


_PLAIN_PREFIX = "plain:"
_fernet: Fernet | None = None


def _get_fernet() -> Fernet | None:
    global _fernet
    if _fernet is not None:
        return _fernet
    key = settings.BANK_ACCOUNT_ENCRYPTION_KEY.strip()
    if not key:
        return None
    _fernet = Fernet(key.encode())
    return _fernet


def encrypt_field(value: str) -> str:
    """
    Encrypt `value` with Fernet.  Returns a URL-safe base64 token.
    Falls back to "plain:<value>" when no key is configured.
    """
    fernet = _get_fernet()
    if fernet is None:
        return f"{_PLAIN_PREFIX}{value}"
    return fernet.encrypt(value.encode()).decode()


def decrypt_field(stored: str) -> str:
    """
    Decrypt a previously encrypted field value.

    Handles both:
      - Fernet tokens (when key is present)
      - "plain:<value>" fallback (when key was absent during write)

    Raises:
        ValueError – if decryption fails (tampered / wrong key)
    """
    if stored.startswith(_PLAIN_PREFIX):
        return stored[len(_PLAIN_PREFIX):]

    fernet = _get_fernet()
    if fernet is None:
        # Stored value looks encrypted but we have no key – surface a clear error
        raise ValueError(
            "BANK_ACCOUNT_ENCRYPTION_KEY is not set but the stored value appears encrypted."
        )
    try:
        return fernet.decrypt(stored.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt field: invalid token or wrong key.") from exc
