from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.review import Review
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.core.exceptions import PermissionDeniedError, OrderNotFoundError
from datetime import datetime, timezone

class ReviewAlreadyExistsError(Exception):
    pass

class ReviewService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def submit_review(
        self,
        *,
        order_id: int,
        requesting_user: User,
        farmer_rating: int,
        farmer_review: str | None = None,
        delivery_rating: int | None = None,
        delivery_review: str | None = None,
    ) -> Review:
        # Fetch order with delivery eagerly loaded
        res = await self._db.execute(
            select(Order)
            .options(selectinload(Order.delivery))
            .where(Order.id == order_id)
        )
        order = res.scalar_one_or_none()
        if not order:
            raise OrderNotFoundError()

        # Enforce: Caller must be the purchasing customer
        if order.customer_id != requesting_user.id:
            raise PermissionDeniedError("Only the customer who placed the order can review it.")

        # Enforce: Order must be in completed status
        if order.status != OrderStatus.completed:
            raise PermissionDeniedError("Only completed orders can be reviewed.")

        # Enforce: Exactly one review per order
        res_existing = await self._db.execute(
            select(Review).where(Review.order_id == order_id)
        )
        existing_review = res_existing.scalar_one_or_none()
        if existing_review:
            raise ReviewAlreadyExistsError("A review has already been submitted for this order.")

        # Determine delivery partner
        delivery_partner_id = None
        if order.delivery:
            delivery_partner_id = order.delivery.delivery_partner_id

        # Create review
        review = Review(
            order_id=order_id,
            customer_id=requesting_user.id,
            farmer_id=order.farmer_id,
            delivery_partner_id=delivery_partner_id,
            farmer_rating=farmer_rating,
            farmer_review=farmer_review,
            delivery_rating=delivery_rating,
            delivery_review=delivery_review,
            is_demo=order.is_demo,
        )

        self._db.add(review)
        await self._db.commit()
        return review

    async def get_farmer_average_rating(self, farmer_id: int) -> tuple[float | None, int]:
        res = await self._db.execute(
            select(
                func.avg(Review.farmer_rating),
                func.count(Review.id)
            )
            .where(Review.farmer_id == farmer_id)
        )
        avg_rating, count = res.all()[0]
        return float(avg_rating) if avg_rating is not None else None, count

    async def get_delivery_average_rating(self, delivery_partner_id: int) -> tuple[float | None, int]:
        res = await self._db.execute(
            select(
                func.avg(Review.delivery_rating),
                func.count(Review.id)
            )
            .where(Review.delivery_partner_id == delivery_partner_id)
            .where(Review.delivery_rating.isnot(None))
        )
        avg_rating, count = res.all()[0]
        return float(avg_rating) if avg_rating is not None else None, count

    async def get_admin_review_analytics(self) -> dict:
        # Total Reviews
        res_total = await self._db.execute(select(func.count(Review.id)))
        total_reviews = res_total.scalar() or 0

        # Average Farmer Rating
        res_farmer = await self._db.execute(select(func.avg(Review.farmer_rating)))
        avg_farmer_rating = res_farmer.scalar()
        avg_farmer_rating = float(avg_farmer_rating) if avg_farmer_rating is not None else None

        # Average Delivery Rating
        res_delivery = await self._db.execute(
            select(func.avg(Review.delivery_rating)).where(Review.delivery_rating.isnot(None))
        )
        avg_delivery_rating = res_delivery.scalar()
        avg_delivery_rating = float(avg_delivery_rating) if avg_delivery_rating is not None else None

        # Latest Reviews
        res_latest = await self._db.execute(
            select(Review).order_by(Review.created_at.desc()).limit(10)
        )
        latest_reviews = res_latest.scalars().all()

        return {
            "avg_farmer_rating": avg_farmer_rating,
            "avg_delivery_rating": avg_delivery_rating,
            "total_reviews": total_reviews,
            "latest_reviews": latest_reviews,
        }
