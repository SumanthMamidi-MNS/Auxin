"""
app/repositories/delivery_repository.py
=========================================
All DB queries for the `deliveries` table.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery import Delivery, DeliveryStatus


class DeliveryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def get_by_id(self, delivery_id: int) -> Delivery | None:
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        result = await self._db.execute(
            select(Delivery)
            .options(
                selectinload(Delivery.delivery_partner),
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(Delivery.id == delivery_id)
        )
        return result.scalar_one_or_none()

    async def get_by_order_id(self, order_id: int) -> Delivery | None:
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        result = await self._db.execute(
            select(Delivery)
            .options(
                selectinload(Delivery.delivery_partner),
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(Delivery.order_id == order_id)
        )
        return result.scalar_one_or_none()

    async def list_for_partner(
        self,
        partner_id: int,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Delivery]:
        """Return all deliveries assigned to a partner, newest first."""
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        result = await self._db.execute(
            select(Delivery)
            .options(
                selectinload(Delivery.delivery_partner),
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(Delivery.delivery_partner_id == partner_id)
            .order_by(Delivery.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_for_partner(self, partner_id: int) -> int:
        result = await self._db.execute(
            select(func.count())
            .select_from(Delivery)
            .where(Delivery.delivery_partner_id == partner_id)
        )
        return result.scalar_one()

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    async def create(
        self,
        *,
        order_id: int,
        destination_latitude: float | None = None,
        destination_longitude: float | None = None,
    ) -> Delivery:
        """
        Create a pending delivery record for an order.

        Destination coordinates are optional — can be provided later via
        an address lookup or when the customer supplies them.
        """
        from app.models.order import Order
        from sqlalchemy import select
        res = await self._db.execute(select(Order.is_demo).where(Order.id == order_id))
        is_demo_val = res.scalar() or False

        delivery = Delivery(
            order_id=order_id,
            delivery_partner_id=None,
            status=DeliveryStatus.pending,
            destination_latitude=destination_latitude,
            destination_longitude=destination_longitude,
            is_demo=is_demo_val,
        )
        self._db.add(delivery)
        await self._db.flush()
        return delivery

    async def assign_partner(
        self,
        delivery: Delivery,
        partner_id: int,
        assigned_at,
    ) -> Delivery:
        """Assign a delivery partner and move status → assigned."""
        delivery.delivery_partner_id = partner_id
        delivery.status = DeliveryStatus.assigned
        delivery.assigned_at = assigned_at
        self._db.add(delivery)
        await self._db.flush()
        return delivery

    async def set_status(
        self,
        delivery: Delivery,
        new_status: DeliveryStatus,
        *,
        otp_code: str | None = None,
        plain_otp: str | None = None,
        otp_expires_at=None,
        picked_up_at=None,
        delivered_at=None,
    ) -> Delivery:
        """
        Transition delivery to `new_status`, optionally setting lifecycle
        timestamps and OTP fields.
        """
        delivery.status = new_status

        if otp_code is not None:
            delivery.otp_code = otp_code
        if plain_otp is not None:
            delivery.plain_otp = plain_otp
        if otp_expires_at is not None:
            delivery.otp_expires_at = otp_expires_at
        if picked_up_at is not None:
            delivery.picked_up_at = picked_up_at
        if delivered_at is not None:
            delivery.delivered_at = delivered_at

        self._db.add(delivery)
        await self._db.flush()
        return delivery

    async def list_unassigned_pending_deliveries(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Delivery]:
        """Return all unassigned deliveries that are currently pending, newest first."""
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        result = await self._db.execute(
            select(Delivery)
            .options(
                selectinload(Delivery.order).selectinload(Order.items),
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(
                Delivery.status == DeliveryStatus.pending,
                Delivery.delivery_partner_id.is_(None),
            )
            .order_by(Delivery.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active_delivery_for_partner(self, partner_id: int) -> Delivery | None:
        """Return any active (non-terminal) delivery assigned to this partner."""
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        active_statuses = [
            DeliveryStatus.assigned,
            DeliveryStatus.accepted,
            DeliveryStatus.picked_up,
            DeliveryStatus.out_for_delivery,
        ]
        result = await self._db.execute(
            select(Delivery)
            .options(
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(
                Delivery.delivery_partner_id == partner_id,
                Delivery.status.in_(active_statuses),
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def atomic_claim_delivery(
        self,
        delivery_id: int,
        partner_id: int,
        assigned_at,
    ) -> Delivery | None:
        """
        Atomically claim an unassigned pending delivery for a partner.
        Uses row-level locking / conditional matching to prevent race conditions.
        Returns the claimed Delivery, or None if already claimed by someone else.
        """
        from sqlalchemy.orm import selectinload
        from app.models.order import Order
        from app.models.user import User
        from app.models.farmer import Farmer

        # Fetch with lock if dialect supports it
        stmt = (
            select(Delivery)
            .options(
                selectinload(Delivery.order).selectinload(Order.customer).selectinload(User.addresses),
                selectinload(Delivery.order).selectinload(Order.farmer).selectinload(Farmer.user).selectinload(User.addresses),
            )
            .where(
                Delivery.id == delivery_id,
                Delivery.status == DeliveryStatus.pending,
                Delivery.delivery_partner_id.is_(None),
            )
        )
        if self._db.bind and self._db.bind.dialect.name == "postgresql":
            stmt = stmt.with_for_update()

        result = await self._db.execute(stmt)
        delivery = result.scalar_one_or_none()
        if delivery is None:
            return None

        delivery.delivery_partner_id = partner_id
        delivery.status = DeliveryStatus.assigned
        delivery.assigned_at = assigned_at
        self._db.add(delivery)
        await self._db.flush()
        return delivery

    async def clear_otp(self, delivery: Delivery) -> Delivery:
        """Clear OTP fields after successful verification."""
        delivery.otp_code = None
        delivery.plain_otp = None
        delivery.otp_expires_at = None
        self._db.add(delivery)
        await self._db.flush()
        return delivery

