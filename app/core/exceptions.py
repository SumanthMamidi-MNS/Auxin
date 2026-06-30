"""
app/core/exceptions.py
=======================
Domain exception hierarchy for Auxin.

All exceptions ultimately derive from AuxinException so callers
can catch the entire domain with one except clause when needed.

HTTP mapping is handled by the exception handlers registered in
app/api/v1/router.py so business logic never imports FastAPI.
"""


class AuxinException(Exception):
    """Base class for all Auxin application exceptions."""
    status_code: int = 500
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


# ---------------------------------------------------------------------------
# Auth token exceptions
# ---------------------------------------------------------------------------

class TokenMissingError(AuxinException):
    status_code = 401
    detail = "Authentication token is missing."


class TokenInvalidError(AuxinException):
    status_code = 401
    detail = "Authentication token is invalid or malformed."


class TokenExpiredError(AuxinException):
    status_code = 401
    detail = "Authentication token has expired."


class SupabaseAuthError(AuxinException):
    status_code = 401
    detail = "Supabase authentication failed."


# ---------------------------------------------------------------------------
# User exceptions
# ---------------------------------------------------------------------------

class UserNotFoundError(AuxinException):
    status_code = 404
    detail = "User not found."


class ProfileNotFoundError(AuxinException):
    status_code = 404
    detail = "Profile not found."



class UserInactiveError(AuxinException):
    status_code = 403
    detail = "User account is inactive."


class UserSuspendedError(AuxinException):
    status_code = 403
    detail = "Your account has been suspended. Please contact support."


class PendingApprovalError(AuxinException):
    status_code = 403
    detail = (
        "Your account is pending approval. "
        "An admin will review your application shortly."
    )


class RejectedAccountError(AuxinException):
    status_code = 403
    detail = (
        "Your account application was not approved. "
        "Please contact support for more information."
    )


# ---------------------------------------------------------------------------
# RBAC exceptions
# ---------------------------------------------------------------------------

class PermissionDeniedError(AuxinException):
    status_code = 403
    detail = "You do not have permission to access this resource."


# ---------------------------------------------------------------------------
# Farmer exceptions
# ---------------------------------------------------------------------------

class FarmerProfileExistsError(AuxinException):
    status_code = 409
    detail = "A farmer profile already exists for this account."


class FarmerNotFoundError(AuxinException):
    status_code = 404
    detail = "Farmer profile not found."


class FarmerNotApprovedError(AuxinException):
    status_code = 403
    detail = "Your farmer profile has not been approved yet. Please wait for admin approval."


# ---------------------------------------------------------------------------
# Product exceptions
# ---------------------------------------------------------------------------

class ProductNotFoundError(AuxinException):
    status_code = 404
    detail = "Product not found."


class ProductForbiddenError(AuxinException):
    status_code = 403
    detail = "You do not own this product."


# ---------------------------------------------------------------------------
# Order exceptions
# ---------------------------------------------------------------------------

class OrderNotFoundError(AuxinException):
    status_code = 404
    detail = "Order not found."


class OrderForbiddenError(AuxinException):
    status_code = 403
    detail = "You do not have permission to access this order."


class OrderInvalidStatusTransitionError(AuxinException):
    status_code = 409
    detail = "This status transition is not allowed."


class OrderCannotBeCancelledError(AuxinException):
    status_code = 409
    detail = "Order can only be cancelled while it is pending."


class InsufficientStockError(AuxinException):
    status_code = 409
    detail = "One or more products do not have sufficient stock."


class ProductInactiveError(AuxinException):
    status_code = 409
    detail = "One or more products are no longer available."


class CrossFarmerOrderError(AuxinException):
    status_code = 422
    detail = "All products in an order must belong to the same farmer."


class EmptyOrderError(AuxinException):
    status_code = 422
    detail = "An order must contain at least one item."


# ---------------------------------------------------------------------------
# Delivery Partner exceptions
# ---------------------------------------------------------------------------

class DeliveryPartnerProfileExistsError(AuxinException):
    status_code = 409
    detail = "A delivery partner profile already exists for this account."


class DeliveryPartnerNotFoundError(AuxinException):
    status_code = 404
    detail = "Delivery partner profile not found."


class DeliveryPartnerInactiveError(AuxinException):
    status_code = 403
    detail = "Delivery partner account is inactive."


class NoDeliveryPartnerAvailableError(AuxinException):
    status_code = 503
    detail = "No delivery partner is currently available. The delivery remains pending assignment."


# ---------------------------------------------------------------------------
# Delivery exceptions
# ---------------------------------------------------------------------------

class DeliveryNotFoundError(AuxinException):
    status_code = 404
    detail = "Delivery record not found."


class DeliveryForbiddenError(AuxinException):
    status_code = 403
    detail = "You are not the assigned delivery partner for this delivery."


class DeliveryInvalidStatusTransitionError(AuxinException):
    status_code = 409
    detail = "This delivery status transition is not allowed."


class DeliveryAlreadyExistsError(AuxinException):
    status_code = 409
    detail = "A delivery record already exists for this order."


class DeliveryOTPExpiredError(AuxinException):
    status_code = 400
    detail = "Delivery OTP has expired. Please request a new one."


class DeliveryOTPInvalidError(AuxinException):
    status_code = 400
    detail = "Delivery OTP is incorrect."


class DeliveryOTPNotReadyError(AuxinException):
    status_code = 409
    detail = "Delivery OTP is only available when status is 'out_for_delivery'."


class DeliveryLocationRequiredError(AuxinException):
    status_code = 422
    detail = "Delivery partner current location (lat/long) is required to complete delivery."


class DeliveryOutsideGeofenceError(AuxinException):
    status_code = 422
    detail = "Delivery partner is too far from the delivery location. Move closer and try again."


class DeliveryDestinationUnknownError(AuxinException):
    status_code = 422
    detail = "Delivery destination coordinates are not set on this order."


# ---------------------------------------------------------------------------
# Payment exceptions
# ---------------------------------------------------------------------------

class PaymentNotFoundError(AuxinException):
    status_code = 404
    detail = "Payment record not found."


class PaymentAlreadyExistsError(AuxinException):
    status_code = 409
    detail = "A payment record already exists for this order."


class PaymentAlreadyPaidError(AuxinException):
    status_code = 409
    detail = "This order has already been paid."


class PaymentSignatureInvalidError(AuxinException):
    status_code = 400
    detail = "Payment signature verification failed. The request may have been tampered with."


class PaymentAmountMismatchError(AuxinException):
    status_code = 409
    detail = "Payment amount received from the gateway does not match the order total."


class PaymentNotVerifiableError(AuxinException):
    status_code = 409
    detail = "Payment cannot be verified in its current state."


class PaymentNotRefundableError(AuxinException):
    status_code = 409
    detail = "Payment cannot be refunded in its current state."


class PaymentGatewayError(AuxinException):
    status_code = 502
    detail = "Payment gateway returned an unexpected error. Please try again."


# ---------------------------------------------------------------------------
# Admin / Governance exceptions
# ---------------------------------------------------------------------------

class AdminActionNotFoundError(AuxinException):
    status_code = 404
    detail = "Admin action record not found."


class UserAlreadySuspendedError(AuxinException):
    status_code = 409
    detail = "User is already suspended."


class UserNotSuspendedError(AuxinException):
    status_code = 409
    detail = "User is not currently suspended."


# ---------------------------------------------------------------------------
# Dispute exceptions
# ---------------------------------------------------------------------------

class DisputeNotFoundError(AuxinException):
    status_code = 404
    detail = "Dispute not found."


class DisputeForbiddenError(AuxinException):
    status_code = 403
    detail = "You do not have permission to access this dispute."


class DisputeAlreadyExistsError(AuxinException):
    status_code = 409
    detail = "An active dispute already exists for this order."


class DisputeInvalidTransitionError(AuxinException):
    status_code = 409
    detail = "This dispute status transition is not allowed."


class DisputeResolutionRequiredError(AuxinException):
    status_code = 422
    detail = "A resolution note is required when resolving or rejecting a dispute."
