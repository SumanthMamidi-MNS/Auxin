# Milo_AI/tests/test_final_milo_experience.py
"""
Auxin AI — Final Milo Guided Experience & Direct Action Verification Suite
Validates Guided Category Trees, Live Platform Action Routing, Free-Text AI, Response Safety, and RBAC.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure Milo_AI root is in path
milo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if milo_dir not in sys.path:
    sys.path.insert(0, milo_dir)

from backend.main import app
from backend.guided.guided_menu import get_guided_options_for_role, GUIDED_MENU_BY_ROLE
from backend.actions.action_executor import action_executor
from backend.rag.response_validator import response_validator, TECHNICAL_ERROR_SIGNATURES, SAFE_REFUSAL_MESSAGE

class TestFinalMiloExperience(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_guided_options_customer(self):
        """Verify guided options endpoint returns valid categories for customer role."""
        res = self.client.get("/api/chat/guided-options?role=customer")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "customer")
        self.assertGreaterEqual(len(data["categories"]), 4)
        cat_titles = [c["title"] for c in data["categories"]]
        self.assertTrue(any("order" in t.lower() for t in cat_titles))
        self.assertTrue(any("refunds" in t.lower() or "payments" in t.lower() for t in cat_titles))

    def test_02_guided_options_farmer(self):
        """Verify guided options endpoint returns farmer categories."""
        res = self.client.get("/api/chat/guided-options?role=farmer")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "farmer")
        cat_titles = [c["title"] for c in data["categories"]]
        self.assertTrue(any("getting started" in t.lower() for t in cat_titles))
        self.assertTrue(any("products" in t.lower() or "orders" in t.lower() for t in cat_titles))

    def test_03_guided_options_delivery(self):
        """Verify guided options endpoint returns delivery partner categories."""
        res = self.client.get("/api/chat/guided-options?role=delivery")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "delivery")
        cat_titles = [c["title"] for c in data["categories"]]
        self.assertTrue(any("registration" in t.lower() or "process" in t.lower() for t in cat_titles))

    def test_04_guided_options_admin(self):
        """Verify guided options endpoint returns admin operational categories."""
        res = self.client.get("/api/chat/guided-options?role=admin")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "admin")
        cat_titles = [c["title"] for c in data["categories"]]
        self.assertTrue(any("approvals" in t.lower() or "operations" in t.lower() for t in cat_titles))

    def test_05_guided_options_super_admin(self):
        """Verify guided options endpoint returns super admin governance categories."""
        res = self.client.get("/api/chat/guided-options?role=super_admin")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "super_admin")
        cat_titles = [c["title"] for c in data["categories"]]
        self.assertTrue(any("governance" in t.lower() or "administration" in t.lower() for t in cat_titles))

    def test_06_direct_action_order_status(self):
        """Verify direct action routing for order status query."""
        payload = {
            "query": "Where is my active order?",
            "action": "check_order_status",
            "role": "customer",
            "user_id": "usr-2"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent"], "direct_action")
        self.assertTrue(data["should_skip_rag"])
        self.assertIn("Order", data["answer"])

    def test_07_direct_action_approval_status(self):
        """Verify direct action routing for farmer approval status check."""
        payload = {
            "query": "Check my farmer approval status",
            "action": "check_approval_status",
            "role": "farmer",
            "user_id": "usr-3"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent"], "direct_action")
        self.assertIn("Status", data["answer"])

    def test_08_direct_action_browse_catalogue(self):
        """Verify direct action routing for catalogue browsing."""
        payload = {
            "query": "Browse fresh produce catalogue",
            "action": "browse_catalogue",
            "role": "customer"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent"], "direct_action")
        self.assertIn("Catalogue", data["answer"])

    def test_09_direct_action_admin_stats_allowed(self):
        """Verify admin stats action succeeds for admin role."""
        payload = {
            "query": "Check platform pending approval statistics",
            "action": "check_admin_stats",
            "role": "admin",
            "user_id": "usr-5"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Governance", data["answer"])

    def test_10_direct_action_admin_stats_blocked_for_customer(self):
        """Verify admin stats action is rejected for customer role."""
        payload = {
            "query": "Check platform admin stats",
            "action": "check_admin_stats",
            "role": "customer",
            "user_id": "usr-2"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("only display", data["answer"].lower())

    def test_11_free_text_knowledge_query(self):
        """Verify free text knowledge question executes RAG pipeline cleanly."""
        payload = {
            "query": "What is the refund policy for cancelled orders?",
            "role": "customer",
            "conversation_id": "test-free-text-001"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["should_skip_rag"])
        self.assertIn("refund", data["answer"].lower())
        for sig in TECHNICAL_ERROR_SIGNATURES:
            self.assertNotIn(sig, data["answer"].lower())

    def test_12_free_text_out_of_domain_refusal(self):
        """Verify out-of-domain query safely triggers safe refusal without technical errors."""
        payload = {
            "query": "What is the speed of light in deep space?",
            "role": "customer"
        }
        res = self.client.post("/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["confidence"], "NO_MATCH")
        self.assertIn("auxin", data["answer"].lower())

    def test_13_error_sanitization(self):
        """Verify response validator cleanses simulated internal error strings."""
        val = response_validator.validate_response(
            query="test query",
            raw_answer="Note: Answer synthesized from verified Auxin knowledge base (HTTP Error 404: Not Found).",
            retrieved_chunks=[{"content": "--- \ntitle: Order Policy\n\nOrders can be cancelled within 15 minutes."}],
            user_role="customer"
        )
        self.assertNotIn("http error", val["sanitized_answer"].lower())
        self.assertNotIn("404", val["sanitized_answer"])
        self.assertIn("Orders can be cancelled", val["sanitized_answer"])

    def test_14_conversation_history_endpoint(self):
        """Verify conversation history retrieval works for active session."""
        conv_id = "test-history-conv-999"
        self.client.post("/api/chat", json={"query": "Hello Milo", "conversation_id": conv_id})
        res = self.client.post("/api/chat/history", json={"conversation_id": conv_id})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total_turns"], 1)

if __name__ == "__main__":
    unittest.main(verbosity=2)
