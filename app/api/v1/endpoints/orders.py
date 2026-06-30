"""
app/api/v1/endpoints/orders.py
================================
Order endpoints — thin HTTP layer, all logic delegated to OrderService.

Routes:
  POST /orders                  → Create order (customer)
  GET  /orders/my               → Customer's order history
  GET  /orders/{id}             → Order detail (customer, farmer, admin)
  PUT  /orders/{id}/cancel      → Customer cancels pending order
  PUT  /orders/{id}/accept      → Farmer accepts pending order
  PUT  /orders/{id}/reject      → Farmer rejects pending order
  PUT  /orders/{id}/complete    → Farmer marks accepted order as completed
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import (
    CreateOrderRequest,
    OrderOut,
    OrderStatusOut,
    PaginatedOrdersOut,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


# ---------------------------------------------------------------------------
# POST /orders  — Create order (customer only)
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Place an order",
    description=(
        "Creates an order from a list of product_id + quantity pairs. "
        "All products must belong to the **same farmer** and be active. "
        "Stock is deducted atomically at creation. "
        "Caller must have role='customer'."
    ),
)
async def create_order(
    body: CreateOrderRequest,
    current_user: Annotated[User, Depends(require_roles(UserRole.customer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderOut:
    service = OrderService(db)
    return await service.create_order(
        requesting_user=current_user,
        cart_items=body.items,
    )


# ---------------------------------------------------------------------------
# GET /orders/my  — Customer's order history
# ---------------------------------------------------------------------------

@router.get(
    "/my",
    response_model=PaginatedOrdersOut,
    status_code=status.HTTP_200_OK,
    summary="List my orders",
    description="Returns a paginated list of orders placed by the authenticated customer.",
)
async def list_my_orders(
    current_user: Annotated[User, Depends(require_roles(UserRole.customer))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedOrdersOut:
    service = OrderService(db)
    return await service.list_my_orders(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# GET /orders/farmer/incoming  — Farmer's incoming orders
# ---------------------------------------------------------------------------

@router.get(
    "/farmer/incoming",
    response_model=PaginatedOrdersOut,
    status_code=status.HTTP_200_OK,
    summary="List incoming orders for the farmer",
    description=(
        "Returns a paginated list of orders assigned to the authenticated farmer. "
        "Includes orders in all statuses. "
        "Caller must have role='farmer'."
    ),
)
async def list_farmer_incoming_orders(
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> PaginatedOrdersOut:
    service = OrderService(db)
    return await service.list_farmer_orders(
        requesting_user=current_user,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# GET /orders/{order_id}  — Order detail
# ---------------------------------------------------------------------------

@router.get(
    "/{order_id}",
    response_model=OrderOut,
    status_code=status.HTTP_200_OK,
    summary="Get order details",
    description=(
        "Returns full order details including all line items. "
        "Accessible by the customer who placed it, the assigned farmer, or admins."
    ),
)
async def get_order(
    order_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderOut:
    service = OrderService(db)
    return await service.get_order(
        order_id=order_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# PUT /orders/{order_id}/cancel  — Customer cancels
# ---------------------------------------------------------------------------

@router.put(
    "/{order_id}/cancel",
    response_model=OrderStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Cancel an order",
    description=(
        "Allows the customer who placed the order to cancel it. "
        "Cancellation is only permitted while the order is **pending**. "
        "Stock is restored on cancellation."
    ),
)
async def cancel_order(
    order_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.customer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderStatusOut:
    service = OrderService(db)
    return await service.cancel_order(
        order_id=order_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# PUT /orders/{order_id}/accept  — Farmer accepts
# ---------------------------------------------------------------------------

@router.put(
    "/{order_id}/accept",
    response_model=OrderStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Accept an order",
    description=(
        "Farmer accepts a pending order (status: pending → accepted). "
        "Only the farmer the order is assigned to can perform this action."
    ),
)
async def accept_order(
    order_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderStatusOut:
    service = OrderService(db)
    return await service.accept_order(
        order_id=order_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# PUT /orders/{order_id}/reject  — Farmer rejects
# ---------------------------------------------------------------------------

@router.put(
    "/{order_id}/reject",
    response_model=OrderStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Reject an order",
    description=(
        "Farmer rejects a pending order (status: pending → rejected). "
        "Stock is restored to allow other customers to order. "
        "Only the assigned farmer may reject."
    ),
)
async def reject_order(
    order_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderStatusOut:
    service = OrderService(db)
    return await service.reject_order(
        order_id=order_id,
        requesting_user=current_user,
    )


# ---------------------------------------------------------------------------
# PUT /orders/{order_id}/complete  — Farmer marks completed
# ---------------------------------------------------------------------------

@router.put(
    "/{order_id}/complete",
    response_model=OrderStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Mark order as completed",
    description=(
        "Farmer marks an accepted order as completed (status: accepted → completed). "
        "This is the final terminal state for a fulfilled order."
    ),
)
async def complete_order(
    order_id: int,
    current_user: Annotated[User, Depends(require_roles(UserRole.farmer))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderStatusOut:
    service = OrderService(db)
    return await service.complete_order(
        order_id=order_id,
        requesting_user=current_user,
    )
