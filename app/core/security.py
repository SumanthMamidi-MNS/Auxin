"""
app/core/security.py
=====================
Cryptographic operations for Auxin v2.0.

  - Delivery OTP generation & hashing (delivery confirmation – NOT auth)
  - Supabase JWT decoding & validation

Auth OTP (request-otp / verify-otp) has been removed.
JWT issuance has been removed – Supabase Auth issues tokens.
"""

import secrets
import string

from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# ---------------------------------------------------------------------------
# Passlib context – bcrypt for delivery OTP hashing
# ---------------------------------------------------------------------------

# Fixed 12 rounds – appropriate for short-lived delivery OTPs.
# Not configurable because BCRYPT_ROUNDS was removed from config
# (it was only needed for auth OTPs which are gone).
_DELIVERY_OTP_ROUNDS = 12

_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=_DELIVERY_OTP_ROUNDS,
)


# ---------------------------------------------------------------------------
# Delivery OTP helpers
# ---------------------------------------------------------------------------
# These are used for the physical delivery confirmation handshake
# (partner → customer OTP at doorstep), completely separate from
# authentication.

_DELIVERY_OTP_LENGTH = 6
_OTP_ALPHABET = string.digits


def generate_delivery_otp() -> str:
    """
    Generate a cryptographically secure 6-digit numeric OTP for
    delivery confirmation.

    secrets.choice is used (not random.choice) to ensure uniform
    distribution from a CSPRNG.
    """
    return "".join(secrets.choice(_OTP_ALPHABET) for _ in range(_DELIVERY_OTP_LENGTH))


def hash_delivery_otp(plain_otp: str) -> str:
    """Hash a plain delivery OTP string using bcrypt."""
    return _pwd_context.hash(plain_otp)


def verify_delivery_otp(plain_otp: str, hashed_otp: str) -> bool:
    """
    Constant-time comparison of plain delivery OTP vs stored bcrypt hash.
    Returns True only when the OTP matches.
    """
    return _pwd_context.verify(plain_otp, hashed_otp)


# ---------------------------------------------------------------------------
# Supabase JWT decoder
# ---------------------------------------------------------------------------

_ALGORITHM = "HS256"
_jwks_cache = None


def get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    import urllib.request
    import json

    url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_JWT_SECRET
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            _jwks_cache = json.loads(response.read().decode("utf-8"))
            return _jwks_cache
    except Exception as e:
        raise JWTError(f"Failed to fetch JWKS from Supabase: {e}") from e


def decode_supabase_jwt(token: str) -> dict:
    """
    Decode and validate a JWT issued by Supabase Auth.

    Uses the SUPABASE_JWT_SECRET from config for HS256, or fetches JWKS from
    the Supabase project for ES256.

    Raises:
        ExpiredSignatureError – JWT has expired
        JWTError              – malformed token, bad signature, or any other
                                verification failure

    Returns:
        The decoded payload dict.  Relevant claims:
          sub  – Supabase user UUID (string)
          role – Supabase role ("authenticated" for normal users)
          email – user email if set in Supabase
          phone – user phone if set in Supabase
          exp   – expiry timestamp
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            jwks = get_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
        else:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
    except ExpiredSignatureError:
        raise
    except Exception as exc:
        raise JWTError(f"Signature verification failed: {exc}") from exc

    return payload
