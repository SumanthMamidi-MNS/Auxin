"""
app/db/base_all.py
==================
Model registry — imports every ORM model so that:
  1. SQLAlchemy's metadata is fully populated (all tables known).
  2. Alembic autogenerate can discover every model.
  3. Relationships can resolve their string-based forward references.

WHY this is a separate module from app.db.base:
  Every model imports `Base` from app.db.base.
  If base.py also imported all models, the first model to load
  (e.g. user.py) would trigger base.py → user.py → base.py — a
  circular import that crashes with:
      ImportError: cannot import name 'User' from partially
      initialized module 'app.models.user'

  Keeping Base definition and model registration separate breaks
  the cycle:
    model.py  →  app.db.base   (only Base class, no model imports)
    main.py   →  app.db.base_all  (safe to import after all models load)

USAGE:
  Import this module wherever you need the full metadata to be loaded:
    - main.py        (startup: create_all / Alembic)
    - alembic/env.py (autogenerate)

  Do NOT import it from inside any model file.
"""

# Re-export Base so callers that previously imported from base can
# switch to base_all with a one-line change if needed.
from app.db.base import Base  # noqa: F401

# ---------------------------------------------------------------------------
# Register every model (order matters only for FKs; SQLAlchemy resolves
# string-based relationship targets lazily, so order here is flexible).
# ---------------------------------------------------------------------------
from app.models.user import User                          # noqa: F401
from app.models.farmer import Farmer                     # noqa: F401
from app.models.product import Product                   # noqa: F401
from app.models.order import Order, OrderItem            # noqa: F401
from app.models.delivery import DeliveryPartner, Delivery  # noqa: F401
from app.models.payment import Payment, Transaction      # noqa: F401
from app.models.admin import AdminAction, Dispute        # noqa: F401
