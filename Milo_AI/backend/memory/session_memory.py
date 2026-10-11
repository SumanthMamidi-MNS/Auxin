# backend/memory/session_memory.py
# Auxin AI v11.0 — Session Conversation Memory Manager

import time
from typing import List, Dict, Any, Optional

class SessionMemoryManager:
    def __init__(self, max_history_length: int = 10):
        self.sessions: Dict[str, List[Dict[str, Any]]] = {}
        self.feedback_store: List[Dict[str, Any]] = []
        self.max_history_length = max_history_length

    def add_turn(self, conversation_id: str, user_id: str, user_query: str, bot_response: str, metadata: Optional[Dict[str, Any]] = None):
        """Appends a conversation turn to session history."""
        if conversation_id not in self.sessions:
            self.sessions[conversation_id] = []
            
        turn = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_query": user_query,
            "bot_response": bot_response,
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
            "metadata": metadata or {}
        }
        
        self.sessions[conversation_id].append(turn)
        # Trim sliding window if exceeds limit
        if len(self.sessions[conversation_id]) > self.max_history_length:
            self.sessions[conversation_id] = self.sessions[conversation_id][-self.max_history_length:]

    def get_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Retrieves session history for a conversation ID."""
        return self.sessions.get(conversation_id, [])

    def format_history_for_prompt(self, conversation_id: str, max_turns: int = 3) -> str:
        """Formats recent history turns as string for prompt context."""
        history = self.get_history(conversation_id)
        if not history:
            return "No previous conversation turns."
            
        turns = history[-max_turns:]
        lines = []
        for t in turns:
            lines.append(f"User: {t['user_query']}\nMilo: {t['bot_response']}")
        return "\n".join(lines)

    def record_feedback(self, conversation_id: str, message_id: str, rating: int, comment: Optional[str] = None):
        """Records user rating feedback (+1 / -1)."""
        record = {
            "conversation_id": conversation_id,
            "message_id": message_id,
            "rating": rating,
            "comment": comment,
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.feedback_store.append(record)
        return record

session_memory = SessionMemoryManager()
