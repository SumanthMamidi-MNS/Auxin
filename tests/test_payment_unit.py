"""
tests/test_payment_unit.py
===========================
Unit tests for payment signature verification and amount conversion helpers.
These test the pure functions, not the full HTTP stack.
"""

import hashlib
import hmac

import pytest

from app.services.payment_service import _to_paisa, _from_paisa, _verify_razorpay_signature
from decimal import Decimal


# ---------------------------------------------------------------------------
# 1. Paisa conversion — precision
# ---------------------------------------------------------------------------

def test_to_paisa_whole():
    assert _to_paisa(Decimal("100.00")) == 10000


def test_to_paisa_fractional():
    assert _to_paisa(Decimal("99.50")) == 9950


def test_to_paisa_rounding():
    # 100.005 → rounds half-up → 10001
    assert _to_paisa(Decimal("100.005")) == 10001


def test_from_paisa():
    assert _from_paisa(10000) == Decimal("100.00")


def test_roundtrip():
    """to_paisa → from_paisa must equal original (within 2dp precision)."""
    original = Decimal("847.50")
    assert _from_paisa(_to_paisa(original)) == original


# ---------------------------------------------------------------------------
# 2. HMAC signature verification
# ---------------------------------------------------------------------------

def _make_signature(order_id: str, payment_id: str, secret: str) -> str:
    """Compute expected Razorpay signature (matches _verify_razorpay_signature)."""
    message = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def test_valid_signature(monkeypatch):
    """Correct signature must return True."""
    secret = "test_secret_key_1234567890abcdef"
    order_id   = "order_TestABC123"
    payment_id = "pay_TestXYZ789"
    sig = _make_signature(order_id, payment_id, secret)

    # Patch settings
    import app.services.payment_service as svc_module
    monkeypatch.setattr(svc_module.settings, "RAZORPAY_SECRET", secret)

    assert _verify_razorpay_signature(order_id, payment_id, sig) is True


def test_invalid_signature(monkeypatch):
    """Tampered signature must return False."""
    import app.services.payment_service as svc_module
    monkeypatch.setattr(svc_module.settings, "RAZORPAY_SECRET", "real_secret")

    result = _verify_razorpay_signature(
        "order_TestABC123",
        "pay_TestXYZ789",
        "completely_wrong_signature",
    )
    assert result is False


def test_empty_signature(monkeypatch):
    """Empty signature must return False without exception."""
    import app.services.payment_service as svc_module
    monkeypatch.setattr(svc_module.settings, "RAZORPAY_SECRET", "real_secret")

    result = _verify_razorpay_signature("order_X", "pay_Y", "")
    assert result is False


def test_signature_different_secret(monkeypatch):
    """Signature computed with wrong secret must fail verification."""
    real_secret  = "real_secret_key_abc"
    wrong_secret = "wrong_secret_key_xyz"

    sig_with_wrong = _make_signature("order_X", "pay_Y", wrong_secret)

    import app.services.payment_service as svc_module
    monkeypatch.setattr(svc_module.settings, "RAZORPAY_SECRET", real_secret)

    assert _verify_razorpay_signature("order_X", "pay_Y", sig_with_wrong) is False


# ---------------------------------------------------------------------------
# 3. Dispute status transitions
# ---------------------------------------------------------------------------

def test_dispute_transitions_open():
    from app.models.admin import DISPUTE_TRANSITIONS, DisputeStatus
    allowed = DISPUTE_TRANSITIONS[DisputeStatus.open]
    assert DisputeStatus.in_review in allowed
    assert DisputeStatus.resolved  in allowed
    assert DisputeStatus.rejected  in allowed


def test_dispute_transitions_in_review():
    from app.models.admin import DISPUTE_TRANSITIONS, DisputeStatus
    allowed = DISPUTE_TRANSITIONS[DisputeStatus.in_review]
    assert DisputeStatus.resolved in allowed
    assert DisputeStatus.rejected in allowed
    assert DisputeStatus.open not in allowed


def test_dispute_transitions_terminal():
    """Resolved and rejected have no further transitions."""
    from app.models.admin import DISPUTE_TRANSITIONS, DisputeStatus
    assert len(DISPUTE_TRANSITIONS[DisputeStatus.resolved]) == 0
    assert len(DISPUTE_TRANSITIONS[DisputeStatus.rejected]) == 0
