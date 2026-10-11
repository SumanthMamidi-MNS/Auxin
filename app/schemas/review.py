from pydantic import BaseModel, Field
from datetime import datetime

class ReviewCreateRequest(BaseModel):
    farmer_rating: int = Field(..., ge=1, le=5, description="Rating for the farmer (1-5)")
    farmer_review: str | None = Field(None, description="Optional text review for the farmer")
    delivery_rating: int | None = Field(None, ge=1, le=5, description="Optional rating for the delivery partner (1-5)")
    delivery_review: str | None = Field(None, description="Optional text review for the delivery partner")

class ReviewOut(BaseModel):
    id: int
    order_id: int
    customer_id: int
    farmer_id: int
    delivery_partner_id: int | None = None
    farmer_rating: int
    farmer_review: str | None = None
    delivery_rating: int | None = None
    delivery_review: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

class AdminReviewAnalyticsOut(BaseModel):
    avg_farmer_rating: float | None = None
    avg_delivery_rating: float | None = None
    total_reviews: int
    latest_reviews: list[ReviewOut]
