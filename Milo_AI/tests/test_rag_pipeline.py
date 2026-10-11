# Milo_AI/tests/test_rag_pipeline.py
"""
Milo AI — RAG Engine & Intent Router Test Suite
"""
import os
import sys

# Ensure Milo_AI is on sys.path
milo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if milo_root not in sys.path:
    sys.path.insert(0, milo_root)

from backend.rag.intent_detector import intent_detector
from backend.rag.embedding_service import embedding_service
from backend.rag.prompt_builder import prompt_builder
from backend.memory.session_memory import session_memory
from backend.api.chat_router import get_chat_health

def test_intent_detection_greetings():
    res = intent_detector.detect_intent("Hello Milo!")
    assert res["intent"] == "greeting"
    assert res["should_skip_rag"] is True

def test_intent_detection_thanks():
    res = intent_detector.detect_intent("Thank you very much!")
    assert res["intent"] == "thanks"
    assert res["should_skip_rag"] is True

def test_intent_detection_rag_query():
    res = intent_detector.detect_intent("How does farmer registration work?")
    assert res["intent"] == "knowledge_question"
    assert res["should_skip_rag"] is False

def test_embedding_service_dimension():
    vec = embedding_service.generate_embedding("Farmer onboarding policy")
    assert len(vec) == 384
    assert isinstance(vec, list)

def test_prompt_builder():
    chunks = [
        {"chunk_id": "c1", "category": "farmer", "content": "Farmers must submit KYC documentation."}
    ]
    prompt = prompt_builder.build_prompt("How to register?", chunks)
    assert "Farmers must submit KYC documentation" in prompt
    assert "How to register?" in prompt

def test_session_memory():
    conv_id = "test-conv-001"
    session_memory.add_turn(
        conversation_id=conv_id,
        user_id="usr-test",
        user_query="Hello",
        bot_response="Hello! I am Milo.",
        metadata={"role": "customer"}
    )
    hist = session_memory.get_history(conv_id)
    assert len(hist) >= 1
    assert hist[-1]["user_query"] == "Hello"

def test_health_check_endpoint():
    health = get_chat_health()
    assert health["status"] == "healthy"
    assert health["target_supabase_project"] == "Auxin"

if __name__ == "__main__":
    test_intent_detection_greetings()
    test_intent_detection_thanks()
    test_intent_detection_rag_query()
    test_embedding_service_dimension()
    test_prompt_builder()
    test_session_memory()
    test_health_check_endpoint()
    print("All 7 Milo AI RAG pipeline unit tests passed successfully!")
