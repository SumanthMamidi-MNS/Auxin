# Milo_AI/data/build_evaluation_sets.py
"""
Auxin AI — Generates evaluation benchmark sets for Phase 2 retrieval and role isolation testing.
"""

import os
import json

def generate_evaluation_sets(eval_dir: str):
    os.makedirs(eval_dir, exist_ok=True)

    # 1. Role access test queries (cross-role authorization & leakage testing)
    role_queries = [
        {
            "query": "How do I add a new product item to my cart and checkout?",
            "requesting_role": "customer",
            "expected_allowed_role": "customer",
            "expected_category": "cart",
            "should_succeed": True
        },
        {
            "query": "How does KYC verification and farm land document approval work for farmers?",
            "requesting_role": "farmer",
            "expected_allowed_role": "farmer",
            "expected_category": "farmer_approval",
            "should_succeed": True
        },
        {
            "query": "What is the delivery partner geofence radius and OTP handoff protocol?",
            "requesting_role": "delivery",
            "expected_allowed_role": "delivery",
            "expected_category": "delivery_otp",
            "should_succeed": True
        },
        {
            "query": "How do administrators review disputed escrow transactions and issue manual refunds?",
            "requesting_role": "admin",
            "expected_allowed_role": "admin",
            "expected_category": "admin_disputes",
            "should_succeed": True
        },
        {
            "query": "How do administrators review disputed escrow transactions and issue manual refunds?",
            "requesting_role": "customer",
            "expected_allowed_role": "admin",
            "expected_category": "admin_disputes",
            "should_succeed": False, # Customer must NOT receive privileged admin knowledge
            "expected_action": "isolate_admin_knowledge"
        },
        {
            "query": "How does farmer payout ledger reconciliation and super admin privilege override work?",
            "requesting_role": "farmer",
            "expected_allowed_role": "admin",
            "expected_category": "admin",
            "should_succeed": False,
            "expected_action": "isolate_admin_knowledge"
        }
    ]

    # 2. Semantic retrieval benchmark queries (testing semantic match accuracy)
    semantic_queries = [
        {
            "query": "What happens if my OTP code expires during registration?",
            "expected_keyword_matches": ["expire", "5 minutes", "resend otp"],
            "role": "customer",
            "category": "otp_verification"
        },
        {
            "query": "Can I filter vegetables to only see certified organic produce?",
            "expected_keyword_matches": ["organic", "filter", "badge"],
            "role": "customer",
            "category": "product_browsing"
        },
        {
            "query": "How does escrow hold customer funds until delivery is verified?",
            "expected_keyword_matches": ["escrow", "held", "delivery"],
            "role": "customer",
            "category": "payments"
        }
    ]

    # 3. Irrelevant / Unknown out-of-domain queries (testing safe refusal)
    irrelevant_queries = [
        {
            "query": "What is quantum entanglement and quantum teleportation in physics?",
            "is_out_of_domain": True,
            "expected_safe_refusal": True
        },
        {
            "query": "Write a recipe for chocolate chip cookies with sea salt.",
            "is_out_of_domain": True,
            "expected_safe_refusal": True
        },
        {
            "query": "Who was the Roman emperor in 44 BC?",
            "is_out_of_domain": True,
            "expected_safe_refusal": True
        }
    ]

    with open(os.path.join(eval_dir, "role_access_test_queries.json"), "w", encoding="utf-8") as f:
        json.dump(role_queries, f, indent=2)

    with open(os.path.join(eval_dir, "semantic_benchmark_queries.json"), "w", encoding="utf-8") as f:
        json.dump(semantic_queries, f, indent=2)

    with open(os.path.join(eval_dir, "irrelevant_unknown_queries.json"), "w", encoding="utf-8") as f:
        json.dump(irrelevant_queries, f, indent=2)

    print(f"[Evaluation] Created benchmark suites in {eval_dir}")

if __name__ == "__main__":
    eval_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "evaluation"))
    generate_evaluation_sets(eval_dir)
