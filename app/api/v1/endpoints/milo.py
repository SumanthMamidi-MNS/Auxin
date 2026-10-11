# app/api/v1/endpoints/milo.py
"""
Auxin Main Backend — Milo AI Proxy & Status Endpoints
Resolves legitimate authenticated user role from application database and proxies requests to Milo AI.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import httpx

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/milo", tags=["Milo AI Assistant"])

class MiloProxyChatRequest(BaseModel):
    query: str = Field(..., example="What is the refund policy for cancelled orders?")
    conversation_id: Optional[str] = Field(default=None, example="conv-12345")
    category_filter: Optional[str] = Field(default=None, example="orders")
    action: Optional[str] = Field(default=None, example="track_order")

@router.get("/status")
async def get_milo_status():
    """
    Status endpoint for the Milo Integration Framework.
    """
    return {
        "enabled": settings.MILO_ENABLED,
        "status": "coming_soon",
        "version": "1.0",
        "provider": settings.MILO_PROVIDER,
    }

@router.post("/chat", summary="Authenticated Milo AI Chat Proxy")
async def proxy_milo_chat(
    req: MiloProxyChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Requires a valid, approved account.  The caller's role is taken from the
    application database (never from the request) and forwarded to Milo, which
    uses it to filter knowledge by audience.  Upstream URL: MILO_BACKEND_URL.
    """
    resolved_role = "super_admin" if current_user.is_super_admin else current_user.role.value
    resolved_user_id = f"usr-{current_user.id}"

    milo_backend_url = f"{settings.MILO_BACKEND_URL.rstrip('/')}/api/chat"
    payload = {
        "query": req.query,
        "conversation_id": req.conversation_id or f"conv-{resolved_user_id}",
        "user_id": resolved_user_id,
        "role": resolved_role,
        "category_filter": req.category_filter,
        "action": req.action,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(milo_backend_url, json=payload)
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Milo AI service is currently unavailable.",
        )

    if resp.status_code == 200:
        return resp.json()
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Milo AI service returned an error.",
    )


@router.get("/guided-options", summary="Role-aware guided Milo categories (authenticated)")
async def proxy_guided_options(
    current_user: User = Depends(get_current_user),
):
    """The role is resolved server-side from the account, never from a query parameter."""
    role = "super_admin" if current_user.is_super_admin else current_user.role.value
    url = f"{settings.MILO_BACKEND_URL.rstrip('/')}/api/chat/guided-options"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"role": role})
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Milo AI service is currently unavailable.",
        )
    if resp.status_code == 200:
        return resp.json()
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Milo AI service returned an error.",
    )
