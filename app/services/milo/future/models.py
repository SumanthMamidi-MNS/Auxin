# app/services/milo/future/models.py
"""
Placeholder schemas for future chatbot session history.
This prepares database integration without making schema migrations today.
"""
# from app.db.base import Base
# import sqlalchemy as sa
#
# class MiloChatSession(Base):
#     __tablename__ = "milo_chat_sessions"
#     id = sa.Column(sa.Integer, primary_key=True)
#     user_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"))
#     session_token = sa.Column(sa.String(100), unique=True)
#     created_at = sa.Column(sa.DateTime)
