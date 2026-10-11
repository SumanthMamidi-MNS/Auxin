# app/models/__init__.py
# Import all ORM models here so that Alembic autogenerate detects them
# and so that SQLAlchemy's metadata is fully populated before migrations run.

from app.models.user import User, UserRole, UserStatus  # noqa: F401
from app.models.admin import AdminAction, Dispute, AdminActionType, DisputeStatus  # noqa: F401
from app.models.address import Address  # noqa: F401
from app.models.farmer import Farmer  # noqa: F401
from app.models.product import Product  # noqa: F401  (legacy — kept for backward compat)
from app.models.catalogue import MasterCategory, MasterProduct, FarmerInventory  # noqa: F401
from app.models.order import Order, OrderItem, OrderStatus  # noqa: F401
from app.models.delivery import DeliveryPartner, Delivery, DeliveryStatus  # noqa: F401
from app.models.payment import Payment, Transaction  # noqa: F401
from app.models.review import Review  # noqa: F401
