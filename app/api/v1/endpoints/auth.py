"""
app/api/v1/endpoints/auth.py
=============================
Auth endpoints — no business logic here, only HTTP handling.

Supabase Auth handles sign-up, sign-in, and session management on the client.
The backend exposes:

  POST /auth/sync-user  — After Supabase sign-up, creates or updates our User
                          row in the application database.  Idempotent.
                          Sets the initial account status based on role:
                            customer / admin  → approved (immediate access)
                            farmer / delivery → pending  (awaiting admin approval)

  GET  /auth/me         — Returns the authenticated user's profile.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.exceptions import TokenExpiredError, TokenInvalidError, TokenMissingError
from app.core.security import decode_supabase_jwt
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import SyncUserRequest, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# POST /auth/sync-user
# ---------------------------------------------------------------------------
# NOTE: This endpoint cannot use get_current_user because that dependency
# raises UserNotFoundError when the user row does not exist yet (which is
# exactly the case for a first-time sync).  We read the Supabase JWT
# directly, validate it, and then upsert the user row.

@router.post(
    "/sync-user",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Sync Supabase user to application database",
    description=(
        "Creates or updates the caller's user record in the application database. "
        "Must be called once after Supabase sign-up, before accessing any other "
        "protected endpoint. Subsequent calls are idempotent.\n\n"
        "**Account status is set based on role:**\n"
        "- `customer` or `admin` → `approved` (immediate access)\n"
        "- `farmer` or `delivery` → `pending` (awaiting admin approval)\n\n"
        "Requires a valid Supabase JWT in the `Authorization: Bearer` header."
    ),
)
async def sync_user(
    body: SyncUserRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ],
) -> UserOut:
    # 1. Validate Supabase JWT
    if credentials is None or not credentials.credentials:
        raise TokenMissingError()

    try:
        payload = decode_supabase_jwt(credentials.credentials)
    except ExpiredSignatureError:
        raise TokenExpiredError()
    except JWTError:
        raise TokenInvalidError()

    supabase_uid: str | None = payload.get("sub")
    if not supabase_uid:
        raise TokenInvalidError("Token subject (sub) is missing.")

    # 2. Upsert user row
    repo = UserRepository(db)
    user = await repo.get_by_supabase_uid(supabase_uid)

    if user is None:
        # First sync: try to match an existing row by phone or email
        # (handles the case where a user was created before Supabase migration)
        if body.phone:
            user = await repo.get_by_phone(body.phone)
        if user is None and body.email:
            user = await repo.get_by_email(str(body.email))

        if user is not None:
            # Link existing row to Supabase UID
            user = await repo.update_supabase_uid(user, supabase_uid)
        else:
            # Brand new user: create row — status is derived from role
            user = await repo.create(
                name=body.name,
                phone=body.phone,
                role=body.role,
                email=str(body.email) if body.email else None,
                supabase_uid=supabase_uid,
                # status intentionally omitted → default_status_for_role() applies
            )
    else:
        # Subsequent sync: update mutable profile fields only
        # Status is NOT updated here — admin controls status changes
        user.name = body.name
        user.phone = body.phone
        if body.email:
            user.email = str(body.email)
        db.add(user)
        await db.flush()

    await db.commit()
    await db.refresh(user)

    return UserOut(
        id=user.id,
        name=user.name,
        phone=user.phone,
        email=user.email,
        role=user.role,
        status=user.status,
        created_at=user.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user profile",
    description=(
        "Returns the profile of the currently authenticated user. "
        "Requires a valid Supabase JWT in the `Authorization: Bearer` header. "
        "Returns 403 if the account is pending, rejected, or suspended."
    ),
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserOut:
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        role=current_user.role,
        status=current_user.status,
        created_at=current_user.created_at.isoformat(),
    )
