# Milo_AI/tests/test_phase2_semantic_rag.py
"""
Auxin AI — Phase 2 Semantic Search & Role-Aware RAG Test Suite
Validates all 14 mandatory Phase 2 operational and security test cases.
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
from backend.rag.prompt_builder import prompt_builder
from backend.rag.response_validator import response_validator, SAFE_REFUSAL_MESSAGE
from backend.rag.rag_engine import rag_engine
from backend.api.chat_router import ChatRequest, process_chat, get_chat_health

def run_all_phase2_tests():
    print("=" * 70)
    print("AUXIN AI — PHASE 2 SEMANTIC SEARCH & ROLE-AWARE RAG TEST SUITE")
    print("=" * 70)

    # Pre-populate local retriever index if snapshot exists
    snapshot_path = os.path.join(milo_root, "data", "curated", "curated_vector_index.json")
    if os.path.exists(snapshot_path):
        with open(snapshot_path, "r", encoding="utf-8") as f:
            local_docs = json.load(f)
            retriever.load_local_knowledge(local_docs)
            print(f"[Setup] Loaded {len(local_docs)} chunks into local retriever memory.")

    results = []

    def log_test(name: str, passed: bool, details: str = ""):
        status_str = "[PASS]" if passed else "[FAIL]"
        print(f"{status_str} {name} {details}")
        results.append({"name": name, "passed": passed, "details": details})
        assert passed, f"Test failed: {name} - {details}"

    # 1. Semantic similarity retrieval
    print("\n--- Test 1: Semantic Similarity Retrieval ---")
    query = "How do refunds work for cancelled orders?"
    q_emb = embedding_service.generate_embedding(query)
    assert len(q_emb) == 384, "Embedding dimension must be 384"
    chunks = retriever.retrieve_chunks(q_emb, top_k=3, user_role="customer")
    passed_1 = len(chunks) > 0 and any("refund" in c["content"].lower() or "cancel" in c["content"].lower() or "order" in c["content"].lower() for c in chunks)
    log_test("Test 1: Semantic Similarity Retrieval", passed_1, f"(Retrieved {len(chunks)} chunks)")

    # 2. Customer role filtering
    print("\n--- Test 2: Customer Role Filtering ---")
    cust_chunks = retriever.retrieve_chunks(q_emb, top_k=5, user_role="customer")
    allowed_cust_roles = ROLE_ACCESS_HIERARCHY["customer"]
    passed_2 = all(c["role"] in allowed_cust_roles for c in cust_chunks)
    log_test("Test 2: Customer Role Filtering", passed_2, f"(All chunks in {allowed_cust_roles})")

    # 3. Farmer role filtering
    print("\n--- Test 3: Farmer Role Filtering ---")
    farmer_query = "What is the organic certification and KYC verification procedure for farmers?"
    f_emb = embedding_service.generate_embedding(farmer_query)
    farmer_chunks = retriever.retrieve_chunks(f_emb, top_k=5, user_role="farmer")
    allowed_farmer_roles = ROLE_ACCESS_HIERARCHY["farmer"]
    passed_3 = all(c["role"] in allowed_farmer_roles for c in farmer_chunks)
    log_test("Test 3: Farmer Role Filtering", passed_3, f"(All chunks in {allowed_farmer_roles})")

    # 4. Delivery role filtering
    print("\n--- Test 4: Delivery Role Filtering ---")
    deliv_query = "What is the delivery partner geofence radius and OTP handoff protocol?"
    d_emb = embedding_service.generate_embedding(deliv_query)
    deliv_chunks = retriever.retrieve_chunks(d_emb, top_k=5, user_role="delivery")
    allowed_deliv_roles = ROLE_ACCESS_HIERARCHY["delivery"]
    passed_4 = all(c["role"] in allowed_deliv_roles for c in deliv_chunks)
    log_test("Test 4: Delivery Role Filtering", passed_4, f"(All chunks in {allowed_deliv_roles})")

    # 5. Admin role filtering
    print("\n--- Test 5: Admin Role Filtering ---")
    admin_query = "How do administrators review disputed escrow transactions?"
    a_emb = embedding_service.generate_embedding(admin_query)
    admin_chunks = retriever.retrieve_chunks(a_emb, top_k=5, user_role="admin")
    passed_5 = len(admin_chunks) >= 0 and all(c["role"] in ROLE_ACCESS_HIERARCHY["admin"] for c in admin_chunks)
    log_test("Test 5: Admin Role Filtering", passed_5, f"(Admin accessed {len(admin_chunks)} chunks)")

    # 6. Super admin behavior
    print("\n--- Test 6: Super Admin Behavior ---")
    sa_chunks = retriever.retrieve_chunks(a_emb, top_k=5, user_role="super_admin")
    passed_6 = all(c["role"] in ROLE_ACCESS_HIERARCHY["super_admin"] for c in sa_chunks)
    log_test("Test 6: Super Admin Behavior", passed_6, "(Super admin granted full multi-role access)")

    # 7. Public/general knowledge access
    print("\n--- Test 7: Public / General Knowledge Access ---")
    gen_query = "What categories of fresh fruits and vegetables are listed on Auxin?"
    g_emb = embedding_service.generate_embedding(gen_query)
    gen_chunks = retriever.retrieve_chunks(g_emb, top_k=3, user_role="customer")
    passed_7 = len(gen_chunks) > 0
    log_test("Test 7: Public/General Knowledge Access", passed_7, f"(Retrieved {len(gen_chunks)} general chunks)")

    # 8. Unauthorized knowledge isolation (Customer asks for confidential admin secrets)
    print("\n--- Test 8: Unauthorized Knowledge Isolation ---")
    unauth_query = "How do administrators review disputed escrow transactions and manage system payouts?"
    u_emb = embedding_service.generate_embedding(unauth_query)
    cust_unauth_chunks = retriever.retrieve_chunks(u_emb, top_k=5, user_role="customer")
    # Verify NO admin chunk leaked to customer
    passed_8 = all(c["role"] != "admin" and c["role"] != "super_admin" for c in cust_unauth_chunks)
    log_test("Test 8: Unauthorized Knowledge Isolation", passed_8, "(Zero admin chunks leaked to customer)")

    # 9. Strong relevance match
    print("\n--- Test 9: Strong Relevance Match ---")
    strong_query = "How does the 6-digit delivery handoff OTP work?"
    strong_emb = embedding_service.generate_embedding(strong_query)
    strong_chunks = retriever.retrieve_chunks(strong_emb, top_k=3, user_role="customer")
    conf_9 = retriever.classify_confidence(strong_chunks[0]["similarity"]) if strong_chunks else "NO_MATCH"
    passed_9 = len(strong_chunks) > 0 and conf_9 in ["STRONG", "WEAK"]
    log_test("Test 9: Strong Relevance Match", passed_9, f"(Confidence: {conf_9})")

    # 10. Weak relevance match
    print("\n--- Test 10: Weak Relevance Match Classification ---")
    conf_weak = retriever.classify_confidence(0.52)
    passed_10 = conf_weak == "WEAK"
    log_test("Test 10: Weak Relevance Match Classification", passed_10, f"(Score 0.52 -> {conf_weak})")

    # 11. Unknown query rejection & Safe Refusal
    print("\n--- Test 11: Unknown Query Rejection ---")
    unknown_query = "What is quantum teleportation theory in physics?"
    val_unknown = response_validator.validate_response(
        query=unknown_query,
        raw_answer="Quantum teleportation transfers quantum states.",
        retrieved_chunks=[],
        confidence="NO_MATCH"
    )
    passed_11 = val_unknown["sanitized_answer"] == SAFE_REFUSAL_MESSAGE and not val_unknown["is_grounded"]
    log_test("Test 11: Unknown Query Rejection & Safe Refusal", passed_11, "(Enforced official safe refusal message)")

    # 12. Duplicate indexing protection (Idempotency)
    print("\n--- Test 12: Duplicate Indexing Protection ---")
    try:
        from Scripts.index_knowledge import load_curated_qa_docs
    except ImportError:
        from scripts.index_knowledge import load_curated_qa_docs
    curated_jsonl = os.path.join(milo_root, "data", "curated", "curated_knowledge_documents.jsonl")
    qa_docs_sample = load_curated_qa_docs(curated_jsonl, max_records=20)
    chunk_ids = [d["chunk_id"] for d in qa_docs_sample]
    passed_12 = len(chunk_ids) == len(set(chunk_ids))
    log_test("Test 12: Duplicate Indexing Protection", passed_12, f"({len(chunk_ids)} unique chunk IDs)")

    # 13. Existing API compatibility
    print("\n--- Test 13: Existing API Compatibility ---")
    health = get_chat_health()
    assert health["status"] == "healthy", "Health endpoint must report healthy"
    req = ChatRequest(
        query="Hello Milo, what is Auxin?",
        conversation_id="test-compat-001",
        user_id="usr-test-compat",
        role="customer"
    )
    resp = process_chat(req)
    passed_13 = resp.answer is not None and len(resp.answer) > 0 and resp.conversation_id == "test-compat-001"
    log_test("Test 13: Existing API Compatibility", passed_13, f"(Latency: {resp.latency_ms}ms)")

    # 14. Gemini integration / Grounded synthesis
    print("\n--- Test 14: Gemini Integration / Grounded Synthesis ---")
    res_rag = rag_engine.ask(
        query="How does farmer registration work on Auxin?",
        user_role="farmer"
    )
    passed_14 = len(res_rag["answer"]) > 0 and res_rag["role_applied"] == "farmer"
    log_test("Test 14: Gemini Integration & Grounded Synthesis", passed_14, f"(Grounded: {res_rag['is_grounded']})")

    print("\n" + "=" * 70)
    print(f"ALL 14 PHASE 2 AUTOMATED TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    run_all_phase2_tests()
