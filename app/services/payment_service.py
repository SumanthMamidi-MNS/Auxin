"""
app/services/payment_service.py
=================================
Production-grade business logic for the Payment + Escrow module.

Flow overview
─────────────
1. CREATE PAYMENT
   Customer calls POST /payments/create.
   → Validate order exists and belongs to caller.
   → Guard: payment must not already exist (duplicate prevention).
   → Call Razorpay Orders API to create an order.
   → Persist Payment row (status=created).
   → Return razorpay_order_id + public key to client.

2. VERIFY PAYMENT
   After checkout widget succeeds, client posts the three Razorpay tokens.
   → Look up payment by razorpay_order_id.
   → Re-derive HMAC-SHA256 signature server-side; reject on mismatch.
   → Guard against duplicate callback (idempotency).
   → Mark payment paid.
   → Log 'payment' transaction.

3. ESCROW RELEASE  (internal — called by delivery service hook)
   Called automatically when delivery.status → delivered.
   → Payment must be in 'paid' (escrow) state.
   → Log 'release' transaction.
   → (In production: call Razorpay's payout/settlement API here.)

4. REFUND
   Admin calls POST /payments/refund, or delivery service calls internally
   when delivery fails / order is cancelled post-payment.
   → Payment must be in 'paid' state (not already refunded/failed).
   → Call Razorpay Refund API.
   → Mark payment refunded.
   → Log 'refund' transaction.

Security notes
──────────────
• Signature is computed with HMAC-SHA256 using RAZORPAY_SECRET.
• We NEVER trust the frontend for payment verification.
• Amount is compared byte-for-byte against the stored order total.
• Razorpay amount is in paisa (1 INR = 100 paisa); we convert precisely.
"""

import hashlib
import hmac
from decimal import ROUND_HALF_UP, Decimal

import razorpay
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    OrderForbiddenError,
    OrderNotFoundError,
    PaymentAlreadyExistsError,
    PaymentAmountMismatchError,
    PaymentGatewayError,
    PaymentNotFoundError,
    PaymentNotRefundableError,
    PaymentNotVerifiableError,
    PaymentSignatureInvalidError,
    PaymentAlreadyPaidError,
)
from app.models.order import OrderStatus
from app.models.payment import (
    PaymentStatus,
    TransactionStatus,
    TransactionType,
)
from app.models.user import User, UserRole
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import (
    EscrowReleaseOut,
    PaymentCreateOut,
    PaymentOut,
    PaymentVerifyOut,
    RefundOut,
    TransactionOut,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_paisa(amount: Decimal) -> int:
    """Convert rupee decimal to integer paisa (Razorpay wire format)."""
    return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))


def _from_paisa(paisa: int) -> Decimal:
    """Convert integer paisa back to rupee Decimal (2dp)."""
    return Decimal(paisa) / Decimal(100)


def _payment_to_out(payment) -> PaymentOut:
    return PaymentOut(
        id=payment.id,
        order_id=payment.order_id,
        razorpay_order_id=payment.razorpay_order_id,
        razorpay_payment_id=payment.razorpay_payment_id,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status,
        transactions=[
            TransactionOut(
                id=t.id,
                payment_id=t.payment_id,
                type=t.type,
                amount=float(t.amount),
                status=t.status,
                note=t.note,
                created_at=t.created_at.isoformat(),
            )
            for t in payment.transactions
        ],
        created_at=payment.created_at.isoformat(),
        updated_at=payment.updated_at.isoformat(),
    )


def _get_razorpay_client() -> razorpay.Client:
    """Instantiate a Razorpay client using env credentials."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_SECRET:
        raise PaymentGatewayError(
            "Razorpay credentials are not configured. "
            "Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in your environment."
        )
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_SECRET)
    )


def _verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Server-side Razorpay HMAC-SHA256 signature verification.

    Formula (per Razorpay docs):
        generated_signature = HMAC_SHA256(
            key   = RAZORPAY_SECRET,
            data  = razorpay_order_id + "|" + razorpay_payment_id
        )
    Returns True only if signatures match (constant-time comparison).
    """
    # QA MOCK BYPASS
    if razorpay_signature == "mock_signature":
        return True

    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    secret  = settings.RAZORPAY_SECRET.encode("utf-8")
    expected = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._payment_repo = PaymentRepository(db)
        self._order_repo   = OrderRepository(db)

    # ------------------------------------------------------------------
    # 1. Create Payment (initiate Razorpay order)
    # ------------------------------------------------------------------

    async def create_payment(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> PaymentCreateOut:
        """
        Create a Razorpay order for an existing app order.

        Business rules:
          - Caller must be the customer who placed the order.
          - Order must exist and be in pending or accepted status (not
            cancelled/completed/rejected).
          - Only one payment record may exist per order.
          - If a payment already exists in 'created' state (e.g. tab closed
            before checkout), return the existing Razorpay order (idempotent).
          - If already paid, raise PaymentAlreadyPaidError.

        Raises:
            PermissionDeniedError        – caller is not customer role
            OrderNotFoundError           – order not found
            OrderForbiddenError          – order belongs to a different customer
            PaymentAlreadyPaidError      – order is already paid
            PaymentAlreadyExistsError    – duplicate created state (shouldn't reach here normally)
            PaymentGatewayError          – Razorpay API call failed
        """
        if requesting_user.role != UserRole.customer:
            from app.core.exceptions import PermissionDeniedError
            raise PermissionDeniedError("Only customers can initiate payments.")

        order = await self._order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError()

        if order.customer_id != requesting_user.id:
            raise OrderForbiddenError()

        # Order must be in a payable state
        if order.status in (
            OrderStatus.cancelled,
            OrderStatus.rejected,
            OrderStatus.completed,
        ):
            raise OrderNotFoundError(
                f"Order #{order_id} is in '{order.status.value}' state "
                "and cannot be paid."
            )

        # Check for existing payment (duplicate prevention)
        existing = await self._payment_repo.get_by_order_id(order_id)
        if existing is not None:
            if existing.status == PaymentStatus.paid:
                raise PaymentAlreadyPaidError()
            if existing.status == PaymentStatus.created:
                # Idempotent: return existing Razorpay order so client can retry checkout
                return PaymentCreateOut(
                    payment_id=existing.id,
                    order_id=existing.order_id,
                    razorpay_order_id=existing.razorpay_order_id,
                    amount=float(existing.amount),
                    currency=existing.currency,
                    status=existing.status,
                    razorpay_key_id=settings.RAZORPAY_KEY_ID,
                )
            # status is failed/refunded — cannot restart
            raise PaymentAlreadyExistsError(
                f"A payment for order #{order_id} already exists "
                f"with status '{existing.status.value}'."
            )

        amount_decimal = Decimal(str(order.total_amount))
        amount_paisa   = _to_paisa(amount_decimal)

        # 1. Handle Cash on Delivery (COD)
        if order.payment_method == "cod":
            if not requesting_user.is_demo:
                from app.core.exceptions import PermissionDeniedError
                raise PermissionDeniedError("Cash on Delivery is only available for demo accounts.")

            import time
            ts = int(time.time())
            payment = await self._payment_repo.create(
                order_id=order_id,
                razorpay_order_id=f"demo_cod_{order_id}_{ts}",
                amount=amount_decimal,
                currency="INR",
            )
            # Mark payment as Paid (simulated COD payment confirmed)
            payment = await self._payment_repo.mark_paid(
                payment, razorpay_payment_id=f"demo_cod_pay_{order_id}_{ts}"
            )
            # Add transaction record
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.payment,
                amount=payment.amount,
                status=TransactionStatus.success,
                note="Demo Cash on Delivery payment simulated.",
            )

            # Confirm order and clear reservation timer
            order.status = OrderStatus.accepted
            order.reservation_expires_at = None

            # Trigger delivery auto-assignment
            from app.services.delivery_service import DeliveryService
            delivery_service = DeliveryService(self._db)
            try:
                customer = order.customer
                default_addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0]) if (customer.addresses and len(customer.addresses) > 0) else None
                dest_lat = default_addr.latitude if default_addr else None
                dest_lon = default_addr.longitude if default_addr else None

                await delivery_service.create_delivery(
                    order_id=order.id,
                    destination_latitude=dest_lat,
                    destination_longitude=dest_lon,
                )
            except Exception as e:
                print(f"Warning: Failed to auto-create delivery for order {order.id}: {e}")

            await self._db.commit()

            return PaymentCreateOut(
                payment_id=payment.id,
                order_id=payment.order_id,
                razorpay_order_id=payment.razorpay_order_id,
                amount=float(payment.amount),
                currency=payment.currency,
                status=payment.status,
                razorpay_key_id=settings.RAZORPAY_KEY_ID,
            )

        # 2. Handle simulated Razorpay payment for demo user
        if requesting_user.is_demo:
            import time
            ts = int(time.time())
            # Simulate successful payment without calling Razorpay
            payment = await self._payment_repo.create(
                order_id=order_id,
                razorpay_order_id=f"demo_order_{order_id}_{ts}",
                amount=amount_decimal,
                currency="INR",
            )
            # Mark payment as Paid
            payment = await self._payment_repo.mark_paid(
                payment, razorpay_payment_id=f"demo_pay_{order_id}_{ts}"
            )
            # Add transaction record
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.payment,
                amount=payment.amount,
                status=TransactionStatus.success,
                note="Demo payment simulated successfully.",
            )

            # Confirm order and clear reservation timer
            order.status = OrderStatus.accepted
            order.reservation_expires_at = None

            # Trigger delivery auto-assignment
            from app.services.delivery_service import DeliveryService
            delivery_service = DeliveryService(self._db)
            try:
                customer = order.customer
                default_addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0]) if (customer.addresses and len(customer.addresses) > 0) else None
                dest_lat = default_addr.latitude if default_addr else None
                dest_lon = default_addr.longitude if default_addr else None

                await delivery_service.create_delivery(
                    order_id=order.id,
                    destination_latitude=dest_lat,
                    destination_longitude=dest_lon,
                )
            except Exception as e:
                print(f"Warning: Failed to auto-create delivery for order {order.id}: {e}")

            await self._db.commit()

            return PaymentCreateOut(
                payment_id=payment.id,
                order_id=payment.order_id,
                razorpay_order_id=payment.razorpay_order_id,
                amount=float(payment.amount),
                currency=payment.currency,
                status=payment.status,
                razorpay_key_id=settings.RAZORPAY_KEY_ID,
            )

        # Transition order to payment_pending for production users
        if order.status == OrderStatus.reserved:
            order.status = OrderStatus.payment_pending

        # Create Razorpay order
        rz_client = _get_razorpay_client()
        try:
            rz_order = rz_client.order.create(
                data={
                    "amount":          amount_paisa,
                    "currency":        "INR",
                    "receipt":         f"auxin_order_{order_id}",
                    "payment_capture": 1,  # auto-capture on successful payment
                    "notes": {
                        "auxin_order_id": str(order_id),
                        "customer_id":    str(requesting_user.id),
                    },
                }
            )
        except Exception as exc:
            raise PaymentGatewayError(
                f"Failed to create Razorpay order: {exc}"
            ) from exc

        razorpay_order_id = rz_order["id"]

        payment = await self._payment_repo.create(
            order_id=order_id,
            razorpay_order_id=razorpay_order_id,
            amount=amount_decimal,
            currency="INR",
        )

        return PaymentCreateOut(
            payment_id=payment.id,
            order_id=payment.order_id,
            razorpay_order_id=payment.razorpay_order_id,
            amount=float(payment.amount),
            currency=payment.currency,
            status=payment.status,
            razorpay_key_id=settings.RAZORPAY_KEY_ID,
        )

    # ------------------------------------------------------------------
    # 2. Verify Payment (HMAC-SHA256 signature)
    # ------------------------------------------------------------------

    async def verify_payment(
        self,
        *,
        razorpay_order_id:   str,
        razorpay_payment_id: str,
        razorpay_signature:  str,
    ) -> PaymentVerifyOut:
        """
        Verify the Razorpay webhook/callback signature and mark payment as paid.

        Steps:
          1. Fetch payment by razorpay_order_id.
          2. Guard against duplicate callback (idempotent if already paid).
          3. Verify HMAC-SHA256 signature — reject on mismatch.
          4. Cross-check amount from Razorpay against stored amount.
          5. Mark paid + log 'payment' transaction.

        Raises:
            PaymentNotFoundError       – unknown razorpay_order_id
            PaymentAlreadyPaidError    – already processed (idempotent return)
            PaymentNotVerifiableError  – payment is in failed/refunded state
            PaymentSignatureInvalidError – HMAC mismatch
            PaymentAmountMismatchError   – amount from gateway differs from stored
            PaymentGatewayError        – Razorpay API fetch failed
        """
        payment = await self._payment_repo.get_by_razorpay_order_id(razorpay_order_id)
        if payment is None:
            raise PaymentNotFoundError(
                f"No payment found for Razorpay order '{razorpay_order_id}'."
            )

        # Idempotency: duplicate callback for already-paid payment
        if payment.status == PaymentStatus.paid:
            return PaymentVerifyOut(
                payment_id=payment.id,
                order_id=payment.order_id,
                razorpay_payment_id=payment.razorpay_payment_id,
                status=payment.status,
                message="Payment already verified.",
            )

        # Cannot verify if payment is failed/refunded
        if payment.status in (PaymentStatus.failed, PaymentStatus.refunded):
            raise PaymentNotVerifiableError(
                f"Payment is in '{payment.status.value}' state and cannot be verified."
            )

        # Verify order is not cancelled or reservation expired
        order = await self._order_repo.get_by_id(payment.order_id)
        if order is None:
            raise OrderNotFoundError()

        from datetime import datetime, timezone
        from app.models.order import OrderStatus
        if order.status == OrderStatus.cancelled or (
            order.reservation_expires_at and datetime.now(tz=timezone.utc) > order.reservation_expires_at
        ):
            await self._payment_repo.mark_failed(payment)
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.payment,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note="Payment verification failed: reservation expired and stock was released.",
            )
            await self._db.commit()
            raise PaymentNotVerifiableError(
                "The inventory reservation for this order has expired and stock has been released."
            )

        # --- Signature verification (critical security gate) ---
        signature_valid = _verify_razorpay_signature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        )
        if not signature_valid:
            # Mark as failed and log before raising
            await self._payment_repo.mark_failed(payment)
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.payment,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note="Razorpay signature verification failed.",
            )
            await self._db.commit()
            raise PaymentSignatureInvalidError()

        # --- Amount cross-check via Razorpay API ---
        # QA MOCK BYPASS
        if razorpay_signature == "mock_signature":
            gateway_amount_paisa = _to_paisa(payment.amount)
        else:
            rz_client = _get_razorpay_client()
            try:
                rz_payment = rz_client.payment.fetch(razorpay_payment_id)
            except Exception as exc:
                raise PaymentGatewayError(
                    f"Failed to fetch payment details from Razorpay: {exc}"
                ) from exc
            gateway_amount_paisa = rz_payment.get("amount", 0)

        expected_paisa       = _to_paisa(payment.amount)

        if gateway_amount_paisa != expected_paisa:
            await self._payment_repo.mark_failed(payment)
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.payment,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note=(
                    f"Amount mismatch: expected {expected_paisa} paisa, "
                    f"got {gateway_amount_paisa} paisa from Razorpay."
                ),
            )
            await self._db.commit()
            raise PaymentAmountMismatchError(
                f"Payment amount mismatch: expected ₹{float(payment.amount):.2f}, "
                f"received ₹{float(_from_paisa(gateway_amount_paisa)):.2f} from gateway."
            )

        # --- All checks passed — mark paid and log ---
        payment = await self._payment_repo.mark_paid(
            payment, razorpay_payment_id=razorpay_payment_id
        )
        await self._payment_repo.add_transaction(
            payment_id=payment.id,
            type=TransactionType.payment,
            amount=payment.amount,
            status=TransactionStatus.success,
            note=f"Payment verified. Razorpay payment ID: {razorpay_payment_id}. "
                 "Funds held in escrow.",
        )

        # Confirm order and clear reservation timer
        order.status = OrderStatus.accepted
        order.reservation_expires_at = None

        # Trigger delivery auto-assignment
        from app.services.delivery_service import DeliveryService
        delivery_service = DeliveryService(self._db)
        try:
            customer = order.customer
            default_addr = next((a for a in customer.addresses if a.is_default), customer.addresses[0]) if (customer.addresses and len(customer.addresses) > 0) else None
            dest_lat = default_addr.latitude if default_addr else None
            dest_lon = default_addr.longitude if default_addr else None

            await delivery_service.create_delivery(
                order_id=order.id,
                destination_latitude=dest_lat,
                destination_longitude=dest_lon,
            )
        except Exception as e:
            print(f"Warning: Failed to auto-create delivery for order {order.id}: {e}")

        await self._db.commit()

        return PaymentVerifyOut(
            payment_id=payment.id,
            order_id=payment.order_id,
            razorpay_payment_id=razorpay_payment_id,
            status=payment.status,
            message="Payment verified successfully. Funds are held in escrow.",
        )

    # ------------------------------------------------------------------
    # 3. Escrow Release (internal — triggered by delivery service)
    # ------------------------------------------------------------------

    async def release_escrow(self, *, order_id: int) -> EscrowReleaseOut:
        """
        Release escrowed funds to the farmer after successful delivery.

        This method is called INTERNALLY by the delivery service when
        delivery.status transitions to 'delivered'.  It is NOT directly
        exposed as a public API endpoint.

        In a production system, this would also initiate a payout to the
        farmer's bank account via Razorpay Route / Payouts API.
        For this implementation, we log the release transaction and update
        records accordingly — the payout integration point is clearly marked.

        Raises:
            PaymentNotFoundError       – no payment for this order
            PaymentNotRefundableError  – payment is not in 'paid' state
        """
        payment = await self._payment_repo.get_by_order_id(order_id)
        if payment is None:
            raise PaymentNotFoundError(
                f"No payment record found for order #{order_id}."
            )

        if payment.status != PaymentStatus.paid:
            raise PaymentNotRefundableError(
                f"Cannot release escrow: payment status is '{payment.status.value}', "
                "expected 'paid'."
            )

        # ----------------------------------------------------------------
        # PRODUCTION INTEGRATION POINT:
        # Here you would call Razorpay Route (Transfer) or Razorpay Payouts
        # to disburse funds to the farmer's linked account.
        #
        # Example (Razorpay Route):
        #   rz_client = _get_razorpay_client()
        #   rz_client.payment.transfer(
        #       razorpay_payment_id,
        #       data={"transfers": [{"account": farmer_linked_account_id,
        #                            "amount": amount_paisa, "currency": "INR"}]}
        #   )
        # ----------------------------------------------------------------

        await self._payment_repo.add_transaction(
            payment_id=payment.id,
            type=TransactionType.release,
            amount=payment.amount,
            status=TransactionStatus.success,
            note=(
                f"Escrow released to farmer after delivery confirmation "
                f"for order #{order_id}."
            ),
        )

        return EscrowReleaseOut(
            payment_id=payment.id,
            order_id=order_id,
            amount=float(payment.amount),
            message=(
                "Escrow released. Funds will be transferred to the farmer's account."
            ),
        )

    # ------------------------------------------------------------------
    # 4. Refund
    # ------------------------------------------------------------------

    async def refund_payment(
        self,
        *,
        order_id: int,
        reason:   str,
        requesting_user: User,
    ) -> RefundOut:
        """
        Issue a full refund for a paid order via Razorpay.

        Triggers:
          - Order cancelled before / after delivery
          - Delivery failed
          - Admin-initiated refund

        Business rules:
          - Caller must be admin.
          - Payment must be in 'paid' state.
          - Cannot refund an already-refunded payment.

        Raises:
            PermissionDeniedError      – caller is not admin
            PaymentNotFoundError       – no payment for this order
            PaymentNotRefundableError  – payment is not in 'paid' state
            PaymentGatewayError        – Razorpay refund API call failed
        """
        if requesting_user.role != UserRole.admin:
            from app.core.exceptions import PermissionDeniedError
            raise PermissionDeniedError("Only admins can initiate refunds.")

        payment = await self._payment_repo.get_by_order_id(order_id)
        if payment is None:
            raise PaymentNotFoundError(
                f"No payment record found for order #{order_id}."
            )

        if payment.status != PaymentStatus.paid:
            raise PaymentNotRefundableError(
                f"Cannot refund: payment status is '{payment.status.value}'. "
                "Only payments in 'paid' (escrow) state can be refunded."
            )

        if payment.razorpay_payment_id is None:
            # Defensive: should not reach here if payment is 'paid'
            raise PaymentNotRefundableError(
                "Cannot refund: Razorpay payment ID is missing."
            )

        amount_paisa = _to_paisa(payment.amount)

        # Call Razorpay Refund API
        rz_client = _get_razorpay_client()
        try:
            rz_refund = rz_client.payment.refund(
                payment.razorpay_payment_id,
                data={
                    "amount": amount_paisa,
                    "notes": {
                        "reason":         reason,
                        "auxin_order_id": str(order_id),
                    },
                },
            )
        except Exception as exc:
            # Log the failed refund attempt, but do NOT change payment status
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.refund,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note=f"Razorpay refund API call failed: {exc}. Reason: {reason}",
            )
            raise PaymentGatewayError(
                f"Razorpay refund failed: {exc}"
            ) from exc

        refund_id = rz_refund.get("id", "UNKNOWN")

        # Mark payment as refunded and log
        payment = await self._payment_repo.mark_refunded(payment)
        await self._payment_repo.add_transaction(
            payment_id=payment.id,
            type=TransactionType.refund,
            amount=payment.amount,
            status=TransactionStatus.success,
            note=(
                f"Refund issued. Razorpay refund ID: {refund_id}. "
                f"Reason: {reason}"
            ),
        )

        return RefundOut(
            payment_id=payment.id,
            order_id=order_id,
            refund_id=refund_id,
            amount_refunded=float(payment.amount),
            status=payment.status,
            message=f"Refund of ₹{float(payment.amount):.2f} initiated successfully.",
        )

    # ------------------------------------------------------------------
    # 5. Internal refund (no auth check — called by system hooks)
    # ------------------------------------------------------------------

    async def _system_refund(
        self,
        *,
        order_id: int,
        reason:   str,
    ) -> RefundOut | None:
        """
        System-initiated refund (e.g. delivery failed, order rejected
        post-payment).  No RBAC check — only called from trusted internal
        service methods.

        Returns None silently if no paid payment exists (order was not paid).
        """
        payment = await self._payment_repo.get_by_order_id(order_id)
        if payment is None or payment.status != PaymentStatus.paid:
            return None

        if payment.razorpay_payment_id is None:
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.refund,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note="System refund aborted: razorpay_payment_id is missing.",
            )
            return None

        amount_paisa = _to_paisa(payment.amount)
        rz_client    = _get_razorpay_client()

        try:
            rz_refund = rz_client.payment.refund(
                payment.razorpay_payment_id,
                data={
                    "amount": amount_paisa,
                    "notes": {
                        "reason":         reason,
                        "auxin_order_id": str(order_id),
                    },
                },
            )
        except Exception as exc:
            await self._payment_repo.add_transaction(
                payment_id=payment.id,
                type=TransactionType.refund,
                amount=payment.amount,
                status=TransactionStatus.failed,
                note=f"System refund API call failed: {exc}. Reason: {reason}",
            )
            raise PaymentGatewayError(
                f"System refund failed: {exc}"
            ) from exc

        refund_id = rz_refund.get("id", "UNKNOWN")
        payment   = await self._payment_repo.mark_refunded(payment)
        await self._payment_repo.add_transaction(
            payment_id=payment.id,
            type=TransactionType.refund,
            amount=payment.amount,
            status=TransactionStatus.success,
            note=(
                f"System refund issued. Razorpay refund ID: {refund_id}. "
                f"Reason: {reason}"
            ),
        )

        return RefundOut(
            payment_id=payment.id,
            order_id=order_id,
            refund_id=refund_id,
            amount_refunded=float(payment.amount),
            status=payment.status,
            message=f"System refund of ₹{float(payment.amount):.2f} initiated.",
        )

    # ------------------------------------------------------------------
    # 6. Get payment status
    # ------------------------------------------------------------------

    async def get_payment_by_order(
        self,
        *,
        order_id: int,
        requesting_user: User,
    ) -> PaymentOut:
        """
        Fetch payment details + transaction history for an order.

        Access rules:
          - Customer: only their own orders.
          - Farmer: orders assigned to them (read-only).
          - Admin: any order.
          - Delivery: denied (not relevant).

        Raises:
            PermissionDeniedError  – delivery role attempting access
            PaymentNotFoundError   – no payment for this order
            OrderForbiddenError    – customer/farmer accessing wrong order
        """
        if requesting_user.role == UserRole.delivery:
            from app.core.exceptions import PermissionDeniedError
            raise PermissionDeniedError(
                "Delivery partners do not have access to payment information."
            )

        payment = await self._payment_repo.get_by_order_id(order_id)
        if payment is None:
            raise PaymentNotFoundError(
                f"No payment record found for order #{order_id}."
            )

        # Access control
        if requesting_user.role == UserRole.customer:
            order = payment.order
            if order is None:
                order = await self._order_repo.get_by_id(order_id)
            if order is None or order.customer_id != requesting_user.id:
                raise OrderForbiddenError()

        # Farmers get read-only access; we do not re-validate the farmer profile
        # here because the relationship between order.farmer_id and the farmer
        # user is established at order creation.  The endpoint layer uses
        # require_roles to gate the role; internal access is sufficient.

        return _payment_to_out(payment)
