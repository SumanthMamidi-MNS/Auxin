# backend/rag/rag_engine.py
# Auxin AI — Production End-to-End Semantic Search & RAG Orchestrator

import os
import sys
import json
import time
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

from dotenv import load_dotenv
rag_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(rag_dir, "..", "..", ".."))
app_env = os.getenv("APP_ENV", "development")
env_file = os.path.join(project_root, f".env.{app_env}")
if not os.path.exists(env_file):
    env_file = os.path.join(project_root, ".env")
if os.path.exists(env_file):
    load_dotenv(env_file)

from backend.rag.embedding_service import embedding_service
from backend.rag.retriever import retriever
from backend.rag.prompt_builder import prompt_builder
from backend.rag.response_validator import (
    response_validator, 
    SAFE_REFUSAL_MESSAGE, 
    USER_SAFE_ERROR_FALLBACK, 
    clean_markdown_and_technical_text
)

def extract_clean_grounded_answer(chunks: List[Dict[str, Any]]) -> str:
    """Extracts a concise, natural, human-readable response from retrieved knowledge chunks."""
    if not chunks:
        return SAFE_REFUSAL_MESSAGE

    for chunk in chunks:
        content = chunk.get("content", "").strip()
        if not content:
            continue

        # Pattern 1: QA dialogue dataset with "Milo:"
        if "Milo:" in content:
            milo_parts = re.findall(r'Milo:\s*(.*?)(?=\nUser:|\nKey Guidance:|\nDialogue Flow:|$)', content, re.DOTALL)
            for part in milo_parts:
                cleaned_part = part.strip()
                if cleaned_part and len(cleaned_part) > 20:
                    cleaned_part = re.sub(r',\s*[A-Z][a-z]+[!,\.]', '!', cleaned_part)
                    return clean_markdown_and_technical_text(cleaned_part)

        # Pattern 2: "Key Guidance:"
        if "Key Guidance:" in content:
            guidance = content.split("Key Guidance:")[-1].strip()
            if guidance and len(guidance) > 15:
                guidance = re.sub(r',\s*[A-Z][a-z]+[!,\.]', '!', guidance)
                return clean_markdown_and_technical_text(guidance)

        # Pattern 3: Authoritative Markdown Documents
        cleaned_doc = clean_markdown_and_technical_text(content)
        paras = [p.strip() for p in cleaned_doc.split("\n\n") if p.strip()]
        for p in paras:
            if len(p) > 30 and not any(p.startswith(k) for k in ["title:", "category:", "role:", "version:", "source:", "---"]):
                return p

    return SAFE_REFUSAL_MESSAGE

class RAGEngine:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    def call_gemini(self, prompt: str, fallback_chunks: Optional[List[Dict[str, Any]]] = None) -> str:
        """Invokes Gemini API via HTTPS REST with fast timeout and clean grounded synthesis fallback."""
        if not self.gemini_api_key:
            if "NO MATCHING AUXIN KNOWLEDGE BASE CONTEXT FOUND" in prompt:
                return SAFE_REFUSAL_MESSAGE
            return extract_clean_grounded_answer(fallback_chunks or [])

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600
            }
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return clean_markdown_and_technical_text(parts[0].get("text", "").strip())
            return extract_clean_grounded_answer(fallback_chunks or [])
        except Exception:
            return extract_clean_grounded_answer(fallback_chunks or [])

    def ask(
        self, 
        query: str, 
        user_role: str = "customer",
        top_k: int = 3, 
        similarity_threshold: float = 0.50,
        filter_category: Optional[str] = None,
        filter_role: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Executes Semantic Search Pipeline:
        Query -> BGE Embedding -> Role-Aware Vector Search -> Relevance Thresholding -> Prompt -> Gemini -> Validation
        """
        # 1. Semantic Embedding Generation
        query_embedding = embedding_service.generate_embedding(query)

        # 2. Role-Aware Supabase Vector Search
        retrieved_chunks = retriever.retrieve_chunks(
            query_embedding=query_embedding,
            top_k=top_k,
            similarity_threshold=similarity_threshold,
            filter_category=filter_category,
            filter_role=filter_role,
            user_role=user_role
        )

        # 3. Determine Overall Retrieval Confidence
        if retrieved_chunks:
            max_similarity = max(c.get("similarity", 0.0) for c in retrieved_chunks)
            confidence = retriever.classify_confidence(max_similarity)
        else:
            max_similarity = 0.0
            confidence = "NO_MATCH"

        # 4. Filter Context Chunks by Confidence
        valid_chunks = [c for c in retrieved_chunks if c.get("similarity", 0.0) >= similarity_threshold]

        # 5. Grounded Prompt Construction
        constructed_prompt = prompt_builder.build_prompt(
            query=query,
            context_chunks=valid_chunks,
            user_role=user_role,
            conversation_history=conversation_history
        )

        # 6. Gemini Synthesis with Clean Grounded Fallback
        if confidence == "NO_MATCH" and not valid_chunks:
            raw_answer = SAFE_REFUSAL_MESSAGE
        else:
            raw_answer = self.call_gemini(constructed_prompt, fallback_chunks=valid_chunks)

        # 7. Groundedness & Role Isolation Validation
        val_result = response_validator.validate_response(
            query=query,
            raw_answer=raw_answer,
            retrieved_chunks=valid_chunks,
            user_role=user_role,
            confidence=confidence
        )

        final_answer = val_result["sanitized_answer"]

        formatted_chunks = [
            {
                "chunk_id": c.get("chunk_id"),
                "category": c.get("category"),
                "similarity": c.get("similarity"),
                "snippet": c.get("content", "")[:120] + "...",
                "role": c.get("role"),
                "confidence": c.get("confidence")
            }
            for c in valid_chunks
        ]

        return {
            "query": query,
            "answer": final_answer,
            "confidence": confidence,
            "is_grounded": val_result["is_grounded"],
            "retrieved_chunks": formatted_chunks,
            "role_applied": user_role
        }

rag_engine = RAGEngine()
