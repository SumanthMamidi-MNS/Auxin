"""
app/core/dependencies.py
=========================
FastAPI dependency injection functions.

Provides:
  - get_current_user    → validates Supabase Bearer JWT and returns the active User
  - require_roles       → factory that returns a dependency enforcing RBAC
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    PendingApprovalError,
    PermissionDeniedError,
    RejectedAccountError,
    SupabaseAuthError,
    TokenExpiredError,
    TokenInvalidError,
    TokenMissingError,
    UserInactiveError,
    UserNotFoundError,
    UserSuspendedError,
)
from app.core.security import decode_supabase_jwt
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Validate a Supabase-issued Bearer JWT and return the corresponding
    User from our database, enforcing account status.

    The JWT sub claim is a UUID string (Supabase user ID).  We look up the
    corresponding row in our users table via the supabase_uid column.

    Raises:
        TokenMissingError      – no Authorization header / Bearer token
        TokenExpiredError      – JWT is valid but exp has passed
        TokenInvalidError      – JWT is malformed / bad signature
        UserNotFoundError      – supabase_uid not found (user not synced yet)
        UserSuspendedError     – account has been suspended by admin
        RejectedAccountError   – account application was rejected by admin
        PendingApprovalError   – farmer/delivery account awaiting approval
        UserInactiveError      – account deactivated by other means
    """
    if credentials is None or not credentials.credentials:
        raise TokenMissingError()

    raw_token = credentials.credentials

    try:
        payload = decode_supabase_jwt(raw_token)
    except ExpiredSignatureError:
        raise TokenExpiredError()
    except JWTError:
        raise TokenInvalidError()

    supabase_uid: str | None = payload.get("sub")
    if not supabase_uid:
        raise TokenInvalidError("Token subject (sub) is missing.")

    repo = UserRepository(db)
    user = await repo.get_by_supabase_uid(supabase_uid)

    if user is None:
        raise UserNotFoundError(
            "No account found for this Supabase user. "
            "Please call POST /auth/sync-user to complete registration."
        )

    # Enforce account status (priority: suspended > rejected > pending > inactive)
    if user.status == UserStatus.suspended:
        raise UserSuspendedError()
    if user.status == UserStatus.rejected:
        raise RejectedAccountError()
    if user.status == UserStatus.pending:
        raise PendingApprovalError()

    # Fallback for any other non-approved state
    if user.status != UserStatus.approved:
        raise UserInactiveError()

    return user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles(UserRole.admin))])

    Or as an injected parameter:
        async def endpoint(user: User = Depends(require_roles(UserRole.admin, UserRole.farmer))):
            ...
    """

    async def _check(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError()
        return current_user

    return _check


async def get_current_user_for_profile(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Retrieve user for profile endpoints, permitting access during the pending approval state.
    """
    if credentials is None or not credentials.credentials:
        raise TokenMissingError()

    raw_token = credentials.credentials

    try:
        payload = decode_supabase_jwt(raw_token)
    except ExpiredSignatureError:
        raise TokenExpiredError()
    except JWTError:
        raise TokenInvalidError()

    supabase_uid: str | None = payload.get("sub")
    if not supabase_uid:
        raise TokenInvalidError("Token subject (sub) is missing.")

    repo = UserRepository(db)
    user = await repo.get_by_supabase_uid(supabase_uid)

    if user is None:
        raise UserNotFoundError(
            "No account found for this Supabase user. "
            "Please call POST /auth/sync-user to complete registration."
        )

    if user.status == UserStatus.suspended:
        raise UserSuspendedError()

    return user


def require_roles_for_profile(*allowed_roles: UserRole):
    """
    Dependency factory for profile-specific endpoints.
    Allows access even if the account is in the pending approval state.
    """
    async def _check(
        current_user: Annotated[User, Depends(get_current_user_for_profile)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError()
        return current_user

    return _check


async def require_super_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Enforces that the current authenticated user is a Super Admin."""
    if current_user.role != UserRole.admin or not current_user.is_super_admin:
        raise PermissionDeniedError("Only Super Admins can perform this action.")
    return current_user


