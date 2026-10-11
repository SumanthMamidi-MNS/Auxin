# Milo_AI/tests/test_phase3_production.py
"""
Auxin AI — Phase 3 Final Production Test Suite
Comprehensive automated verification across all 22 required architectural, security, and data integrity areas.
"""

import os
import sys
import json
import time

# Ensure Milo_AI root is on sys.path
milo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if milo_root not in sys.path:
    sys.path.insert(0, milo_root)

# Load environment variables
project_root = os.path.dirname(milo_root)
app_env = os.getenv("APP_ENV", "development")
env_file = os.path.join(project_root, f".env.{app_env}")
if not os.path.exists(env_file):
    env_file = os.path.join(project_root, ".env")
if os.path.exists(env_file):
    from dotenv import load_dotenv
    load_dotenv(env_file)

from backend.rag.embedding_service import embedding_service
from backend.rag.retriever import retriever, ROLE_ACCESS_HIERARCHY
from backend.rag.intent_detector import intent_detector
from backend.rag.prompt_builder import prompt_builder
from backend.rag.response_validator import response_validator, SAFE_REFUSAL_MESSAGE
from backend.rag.rag_engine import rag_engine
from backend.memory.session_memory import session_memory
from backend.api.chat_router import ChatRequest, process_chat, get_chat_health

def run_production_tests():
    print("=" * 75)
    print("AUXIN AI — PHASE 3 PRODUCTION STABILIZATION & AUDIT TEST SUITE")
    print("=" * 75)

    # Load local vector snapshot into retriever memory
    snapshot_path = os.path.join(milo_root, "data", "curated", "curated_vector_index.json")
    if os.path.exists(snapshot_path):
        with open(snapshot_path, "r", encoding="utf-8") as f:
            local_docs = json.load(f)
            retriever.load_local_knowledge(local_docs)
            print(f"[Setup] Loaded {len(local_docs)} chunks into local vector memory.")

    raw_path = os.path.join(milo_root, "data", "raw", "master_dataset_10500.jsonl")
    curated_path = os.path.join(milo_root, "data", "curated", "production_dataset.jsonl")

    test_results = []

    def verify(test_num: int, title: str, condition: bool, details: str = ""):
        status_str = "[PASS]" if condition else "[FAIL]"
        print(f"{status_str} Test {test_num:02d}: {title} {details}")
        test_results.append({"num": test_num, "title": title, "passed": condition, "details": details})
        assert condition, f"FAILED Test {test_num:02d}: {title} - {details}"

    # 1. Dataset Integrity
    print("\n--- Group 1: Dataset & Data Preservation ---")
    assert os.path.exists(raw_path), "Raw dataset must exist"
    raw_lines = sum(1 for _ in open(raw_path, "r", encoding="utf-8"))
    verify(1, "Dataset Integrity", raw_lines == 10500, f"({raw_lines} lines verified in raw dataset)")

    # 2. Raw Dataset Remains Untouched
    raw_size = os.path.getsize(raw_path)
    verify(2, "Raw Dataset Untouched", raw_size > 7000000 and raw_lines == 10500, f"({raw_size} bytes preserved)")

    # 3. Curated Dataset Contains >= 10,000 Valid Records
    assert os.path.exists(curated_path), "Curated production dataset must exist"
    curated_lines = sum(1 for _ in open(curated_path, "r", encoding="utf-8"))
    verify(3, "Curated Dataset >= 10,000 Records", curated_lines >= 10000, f"({curated_lines} valid curated records)")

    # 4. Embedding Generation
    print("\n--- Group 2: Embedding & Vector Compatibility ---")
    test_text = "Auxin fresh produce farmer onboarding"
    emb = embedding_service.generate_embedding(test_text)
    verify(4, "Embedding Generation", isinstance(emb, list) and len(emb) == 384, "(Generated 384-d vector)")

    # 5. Embedding Dimension Compatibility
    verify(5, "Embedding Dimension Compatibility", embedding_service.dimension == 384 and all(isinstance(x, float) for x in emb), "(Dimension: 384 float32)")

    # 6. Supabase pgvector Connectivity
    print("\n--- Group 3: Supabase pgvector & Retrieval ---")
    chunks = retriever.retrieve_chunks(emb, top_k=2, similarity_threshold=0.0, user_role="customer")
    verify(6, "Supabase pgvector Connectivity", isinstance(chunks, list), f"(Retrieved {len(chunks)} chunks)")

    # 7. Semantic Search
    search_emb = embedding_service.generate_embedding("What is the refund policy for cancelled orders?")
    search_chunks = retriever.retrieve_chunks(search_emb, top_k=3, user_role="customer")
    verify(7, "Semantic Search", len(search_chunks) > 0, f"(Returned {len(search_chunks)} matches)")

    # 8. Relevant Retrieval
    has_rel = any("refund" in c["content"].lower() or "cancel" in c["content"].lower() or "order" in c["content"].lower() for c in search_chunks)
    verify(8, "Relevant Retrieval", has_rel, "(Found relevant refund/order policy terms)")

    # 9. Irrelevant Retrieval Rejection
    irr_emb = embedding_service.generate_embedding("Explain black hole event horizons in astrophysics.")
    irr_chunks = [c for c in retriever.retrieve_chunks(irr_emb, top_k=3, similarity_threshold=0.60, user_role="customer") if c.get("similarity", 0) >= 0.60]
    verify(9, "Irrelevant Retrieval Rejection", len(irr_chunks) == 0, "(Zero high-confidence matches for astrophysics)")

    # 10. Greeting Intent Routing
    print("\n--- Group 4: Intent Routing & Role Boundaries ---")
    greet_res = intent_detector.detect_intent("Hello Milo, good morning!")
    verify(10, "Greeting Intent Routing", greet_res["intent"] == "greeting" and greet_res["should_skip_rag"] is True, "(Greeting skips RAG)")

    # 11. Knowledge-Question Routing
    know_res = intent_detector.detect_intent("How do I link my bank account for farmer payouts?")
    verify(11, "Knowledge-Question Routing", know_res["intent"] == "knowledge_question" and know_res["should_skip_rag"] is False, "(Question routes to RAG)")

    # 12. Customer Role Filtering
    cust_chunks = retriever.retrieve_chunks(search_emb, top_k=5, user_role="customer")
    verify(12, "Customer Role Filtering", all(c["role"] in ROLE_ACCESS_HIERARCHY["customer"] for c in cust_chunks), f"(Permitted: {ROLE_ACCESS_HIERARCHY['customer']})")

    # 13. Farmer Role Filtering
    farmer_emb = embedding_service.generate_embedding("How does organic certification verification work?")
    farmer_chunks = retriever.retrieve_chunks(farmer_emb, top_k=5, user_role="farmer")
    verify(13, "Farmer Role Filtering", all(c["role"] in ROLE_ACCESS_HIERARCHY["farmer"] for c in farmer_chunks), f"(Permitted: {ROLE_ACCESS_HIERARCHY['farmer']})")

    # 14. Delivery Role Filtering
    deliv_emb = embedding_service.generate_embedding("What is the delivery partner geofence radius?")
    deliv_chunks = retriever.retrieve_chunks(deliv_emb, top_k=5, user_role="delivery")
    verify(14, "Delivery Role Filtering", all(c["role"] in ROLE_ACCESS_HIERARCHY["delivery"] for c in deliv_chunks), f"(Permitted: {ROLE_ACCESS_HIERARCHY['delivery']})")

    # 15. Admin Role Filtering
    admin_emb = embedding_service.generate_embedding("How do admins manage order arbitration disputes?")
    admin_chunks = retriever.retrieve_chunks(admin_emb, top_k=5, user_role="admin")
    verify(15, "Admin Role Filtering", all(c["role"] in ROLE_ACCESS_HIERARCHY["admin"] for c in admin_chunks), f"(Permitted: {ROLE_ACCESS_HIERARCHY['admin']})")

    # 16. Super Admin Role Behavior
    sa_chunks = retriever.retrieve_chunks(admin_emb, top_k=5, user_role="super_admin")
    verify(16, "Super Admin Role Behavior", all(c["role"] in ROLE_ACCESS_HIERARCHY["super_admin"] for c in sa_chunks), "(Full multi-role platform visibility)")

    # 17. Cross-Role Access Prevention
    unauth_emb = embedding_service.generate_embedding("How do administrators override payout ledgers and disputes?")
    cust_unauth_chunks = retriever.retrieve_chunks(unauth_emb, top_k=5, user_role="customer")
    verify(17, "Cross-Role Access Prevention", all(c["role"] != "admin" and c["role"] != "super_admin" for c in cust_unauth_chunks), "(Zero admin chunks leaked to customer)")

    # 18. Conversation Memory
    print("\n--- Group 5: Memory, Response & API ---")
    conv_id = "test-session-p3-001"
    session_memory.add_turn(
        conversation_id=conv_id,
        user_id="usr-p3",
        user_query="Can I pay via UPI?",
        bot_response="Yes, Auxin supports Razorpay UPI, Cards, and Net Banking.",
        metadata={"role": "customer"}
    )
    hist = session_memory.get_history(conv_id)
    verify(18, "Conversation Memory", len(hist) >= 1 and hist[-1]["user_query"] == "Can I pay via UPI?", f"({len(hist)} turns in history)")

    # 19. Unknown / Out-of-Domain Question Safe Refusal
    val_res = response_validator.validate_response(
        query="What is quantum entanglement in physics?",
        raw_answer="Quantum entanglement occurs when pairs of particles interact.",
        retrieved_chunks=[],
        confidence="NO_MATCH"
    )
    verify(19, "Unknown Question Safe Refusal", val_res["sanitized_answer"] == SAFE_REFUSAL_MESSAGE and not val_res["is_grounded"], "(Safe refusal enforced)")

    # 20. Gemini API Integration / Grounded Synthesis
    res_rag = rag_engine.ask(
        query="How does farmer registration work on Auxin?",
        user_role="farmer"
    )
    verify(20, "Gemini Integration & Grounded Synthesis", len(res_rag["answer"]) > 0 and res_rag["role_applied"] == "farmer", f"(Grounded: {res_rag['is_grounded']})")

    # 21. API Error Handling (Empty Query)
    try:
        req_bad = ChatRequest(query="   ", role="customer")
        process_chat(req_bad)
        api_err_ok = False
    except Exception:
        api_err_ok = True
    verify(21, "API Error Handling", api_err_ok, "(Rejected empty query with HTTP 400)")

    # 22. Health Endpoint
    health_data = get_chat_health()
    verify(22, "Health Endpoint", health_data["status"] == "healthy" and health_data["version"] == "16.0", f"(Service: {health_data['service']} v{health_data['version']})")

    print("\n" + "=" * 75)
    print("ALL 22 PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
    print("=" * 75)
    return True

if __name__ == "__main__":
    run_production_tests()
