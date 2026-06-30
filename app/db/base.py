"""
app/db/base.py
==============
Declarative base class for all ORM models.

IMPORTANT — import discipline:
  This module defines ONLY the Base class.
  It must NOT import any model modules, because every model imports Base
  from here — creating a circular import if we also import models here.

  The full model registry (required by Alembic autogenerate and by
  SQLAlchemy's metadata) lives in app.db.base_all, which is imported
  by main.py and alembic/env.py AFTER all individual models have been
  independently loaded.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    Inheriting from DeclarativeBase (SQLAlchemy 2.0 style)
    instead of the legacy declarative_base() factory.
    """
    pass
