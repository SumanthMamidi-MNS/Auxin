"""
app/core/supabase.py
=====================
Supabase Auth integration helpers for the Auxin backend.

This module re-exports decode_supabase_jwt for use by dependency injection
and any other backend code that needs to validate Supabase-issued tokens.

The decode function lives in app.core.security to keep all crypto in one
place; this module provides a clean import path for Supabase-specific logic.
"""

from app.core.security import decode_supabase_jwt  # noqa: F401

__all__ = ["decode_supabase_jwt"]
