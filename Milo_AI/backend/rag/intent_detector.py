# backend/rag/intent_detector.py
# Auxin AI v11.0 — Lightweight Intent Detection Service

import re
from typing import Dict, Any

class IntentDetector:
    def __init__(self):
        self.greetings = {
            "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
            "greetings", "namaste", "howdy", "what's up", "who are you"
        }
        self.thanks = {"thanks", "thank you", "thx", "great", "awesome", "bye", "goodbye"}

    def detect_intent(self, text: str) -> Dict[str, Any]:
        """Classifies query into 'greeting', 'thanks', 'knowledge_question', or 'general'."""
        clean_text = re.sub(r'[^\w\s]', '', text.lower().strip())
        words = set(clean_text.split())
        
        greetings_exact = {"hi", "hello", "hey", "good morning", "good evening", "good afternoon", "namaste", "greetings"}
        
        # Check if full phrase or individual word matches greeting
        if clean_text in greetings_exact or words.intersection(self.greetings) or any(clean_text.startswith(g) for g in ["hello", "good morning", "good evening", "good afternoon", "namaste"]):
            return {"intent": "greeting", "should_skip_rag": True, "confidence": 0.95}
            
        if words.intersection(self.thanks) or any(t in clean_text for t in ["thank you", "thanks"]):
            return {"intent": "thanks", "should_skip_rag": True, "confidence": 0.95}
            
        # Default domain knowledge questions execute RAG
        return {"intent": "knowledge_question", "should_skip_rag": False, "confidence": 0.90}

intent_detector = IntentDetector()
