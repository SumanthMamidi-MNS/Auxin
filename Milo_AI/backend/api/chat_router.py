# backend/api/chat_router.py
# Auxin AI — Production Guided RAG, Live Action Router & Semantic Search API

import time
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.rag.rag_engine import rag_engine
from backend.rag.intent_detector import intent_detector
from backend.memory.session_memory import session_memory
from backend.guided.guided_menu import get_guided_options_for_role
from backend.actions.action_executor import action_executor

chat_router = APIRouter(prefix="/api/chat", tags=["Milo AI Chat API"])

# --- Request / Response Pydantic Schemas ---

class ChatRequest(BaseModel):
    query: str = Field(..., example="How does farmer registration work?", description="The user's question or message.")
    conversation_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), example="conv-12345", description="Unique conversation session ID.")
    user_id: Optional[Any] = Field(default="usr-anonymous", example="usr-8921", description="Stakeholder user ID.")
    role: Optional[Any] = Field(default="customer", example="farmer", description="Role filter: customer, farmer, delivery, admin, super_admin.")
    category_filter: Optional[str] = Field(default=None, example="farmer", description="Optional category override filter.")
    action: Optional[str] = Field(default=None, example="check_order_status", description="Optional live platform action identifier.")

class ChatMatchInfo(BaseModel):
    chunk_id: str
    category: str
    similarity: float
    snippet: str
    role: Optional[str] = "customer"
    confidence: Optional[str] = "STRONG"

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    user_id: str
    query: str
    answer: str
    intent: str
    should_skip_rag: bool
    role_applied: str
    confidence: Optional[str] = "STRONG"
    is_grounded: Optional[bool] = True
    latency_ms: float
    retrieved_chunks: List[ChatMatchInfo]
    timestamp: str

class HistoryRequest(BaseModel):
    conversation_id: str = Field(..., example="conv-12345")

class FeedbackRequest(BaseModel):
    conversation_id: str = Field(..., example="conv-12345")
    message_id: str = Field(..., example="msg-98765")
    rating: int = Field(..., example=1, description="+1 for positive feedback, -1 for negative feedback.")
    comment: Optional[str] = Field(default=None, example="Accurate answer regarding onboarding.")

# --- Endpoints ---

@chat_router.get("/guided-options", summary="Get Guided Options Hierarchy for Role")
def get_guided_options(role: Optional[str] = Query("customer", description="User role: customer, farmer, delivery, admin, super_admin")):
    """Returns the authorized progressive guided categories and questions for the user's role."""
    options = get_guided_options_for_role(role)
    return {
        "role": role or "customer",
        "categories": options
    }

@chat_router.post("", response_model=ChatResponse, summary="Main Production Semantic RAG & Action Chat Endpoint")
def process_chat(req: ChatRequest):
    """Executes live platform actions, intent detection, role-aware semantic search, Gemini generation, and session memory updates."""
    start_time = time.time()
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
        
    retrieved_chunks = []
    confidence = "STRONG"
    is_grounded = True
    role = str(req.role or "customer").lower()
    user_id = str(req.user_id or "usr-anonymous")

    # PATH 1: DIRECT APPLICATION ACTIONS
    if req.action:
        action_res = action_executor.execute_action(req.action, user_id, role)
        answer = action_res["answer"]
        intent = "direct_action"
        skip_rag = True
    else:
        # PATH 2 & 3: INTENT DETECTION -> GREETING OR SEMANTIC RETRIEVAL
        intent_info = intent_detector.detect_intent(req.query)
        intent = intent_info["intent"]
        skip_rag = intent_info["should_skip_rag"]
        
        if skip_rag:
            # Direct conversational response for greetings / thanks
            if intent == "greeting":
                answer = "Hello! I am Milo, the official guided AI assistant for Auxin. How can I assist you with farm produce, orders, logistics, or platform services today?"
            else:
                answer = "You're welcome! Feel free to choose an option from the menu or ask any other questions about Auxin."
        else:
            # Fetch recent conversation turns for multi-turn grounding
            history = session_memory.get_history(req.conversation_id)
            
            # Execute Role-Aware Semantic RAG Engine
            try:
                rag_res = rag_engine.ask(
                    query=req.query,
                    user_role=role,
                    top_k=3,
                    similarity_threshold=0.55,
                    filter_category=req.category_filter,
                    conversation_history=history
                )
                answer = rag_res["answer"]
                retrieved_chunks = rag_res["retrieved_chunks"]
                confidence = rag_res.get("confidence", "STRONG")
                is_grounded = rag_res.get("is_grounded", True)
            except Exception:
                answer = "I'm having trouble retrieving that information right now. Please try asking again or select a topic from the menu."
                confidence = "NO_MATCH"
                is_grounded = False
                
    latency_ms = round((time.time() - start_time) * 1000, 2)
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Update Session Conversation Memory
    session_memory.add_turn(
        conversation_id=req.conversation_id,
        user_id=req.user_id,
        user_query=req.query,
        bot_response=answer,
        metadata={"role": role, "intent": intent, "confidence": confidence, "latency_ms": latency_ms}
    )
    
    formatted_chunks = [
        ChatMatchInfo(
            chunk_id=c.get("chunk_id", "c0"),
            category=c.get("category", "general"),
            similarity=float(c.get("similarity", 0.0)),
            snippet=c.get("snippet", ""),
            role=c.get("role", role),
            confidence=c.get("confidence", confidence)
        )
        for c in retrieved_chunks
    ]
    
    return ChatResponse(
        conversation_id=req.conversation_id,
        message_id=msg_id,
        user_id=req.user_id,
        query=req.query,
        answer=answer,
        intent=intent,
        should_skip_rag=skip_rag,
        role_applied=role,
        confidence=confidence,
        is_grounded=is_grounded,
        latency_ms=latency_ms,
        retrieved_chunks=formatted_chunks,
        timestamp=timestamp
    )

@chat_router.post("/history", summary="Get Conversation History")
def get_history(req: HistoryRequest):
    """Retrieves all conversation turns for a given session ID."""
    turns = session_memory.get_history(req.conversation_id)
    return {
        "conversation_id": req.conversation_id,
        "turns": turns,
        "total_turns": len(turns)
    }

@chat_router.post("/feedback", summary="Submit Message Feedback")
def submit_feedback(req: FeedbackRequest):
    """Records stakeholder feedback (+1 / -1) for a specific Milo AI response turn."""
    if req.rating not in [-1, 1]:
        raise HTTPException(status_code=400, detail="Rating must be either 1 or -1.")
        
    session_memory.record_feedback(
        conversation_id=req.conversation_id,
        message_id=req.message_id,
        rating=req.rating,
        comment=req.comment
    )
    return {
        "status": "success",
        "message_id": req.message_id,
        "rating": req.rating,
        "detail": "Feedback saved."
    }

@chat_router.get("/health", summary="Milo AI Health Check")
def health_check():
    """Returns the operational status of the Milo AI RAG Subsystem."""
    return {
        "status": "healthy",
        "service": "Auxin AI Semantic Search & Role-Aware RAG API v16.0",
        "version": "16.0",
        "vector_search": "active",
        "database": "supabase_pgvector"
    }

get_chat_health = health_check
