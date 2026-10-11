# tests/test_milo.py
import pytest
from httpx import AsyncClient


async def test_milo_status_endpoint(client: AsyncClient):
    """
    Verify that the GET /api/v1/milo/status endpoint responds correctly.
    """
    r = await client.get("/api/v1/milo/status")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "coming_soon"
    assert body["version"] == "1.0"
    assert "enabled" in body
    assert "provider" in body


async def test_milo_chat_proxy_endpoint(client: AsyncClient, customer_tokens: dict):
    """
    Authenticated callers are proxied to Milo with their DB-resolved role.
    If the Milo service (MILO_BACKEND_URL, default :8001) is not running the
    proxy answers 503 gracefully.
    """
    payload = {
        "query": "Hello Milo, what is Auxin?",
        "conversation_id": "test-proxy-conv-001",
    }
    r = await client.post("/api/v1/milo/chat", json=payload, headers=customer_tokens["headers"])
    assert r.status_code in [200, 502, 503]
    if r.status_code == 200:
        body = r.json()
        assert "answer" in body
        assert body["role_applied"] == "customer"
