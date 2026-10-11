# backend/rag/retriever.py
# Auxin AI — Phase 2 Role-Aware Semantic Vector Retriever

import os
import sys
import json
import math
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Set

# Allowed Role Knowledge Access Matrix (Enforces strict security boundaries)
ROLE_ACCESS_HIERARCHY: Dict[str, Set[str]] = {
    "customer": {"customer", "general", "public"},
    "farmer": {"farmer", "customer", "general", "public"},
    "delivery": {"delivery", "customer", "general", "public"},
    "admin": {"admin", "farmer", "delivery", "customer", "general", "public"},
    "super_admin": {"super_admin", "admin", "farmer", "delivery", "customer", "general", "public"}
}

# Relevance Confidence Thresholds
SIMILARITY_THRESHOLD_STRONG = 0.60
SIMILARITY_THRESHOLD_WEAK = 0.55

class SupabaseRetriever:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "https://snjqxpelsbsvytxezwne.supabase.co")
        self.service_role_key = os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY", 
            ""
        )
        self.headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json"
        }
        self._local_index: List[Dict[str, Any]] = []

    def load_local_knowledge(self, documents: List[Dict[str, Any]]):
        """Loads curated documents into memory for resilient local semantic retrieval."""
        self._local_index = documents

    def get_allowed_roles(self, user_role: Optional[str]) -> Set[str]:
        """Returns the set of permissible document roles for a given user role."""
        if not user_role or user_role.lower() not in ROLE_ACCESS_HIERARCHY:
            return ROLE_ACCESS_HIERARCHY["customer"]
        return ROLE_ACCESS_HIERARCHY[user_role.lower()]

    def is_role_permitted(self, user_role: Optional[str], document_role: Optional[str]) -> bool:
        """Evaluates whether the user role is authorized to access the document role."""
        allowed = self.get_allowed_roles(user_role)
        doc_role = (document_role or "customer").lower()
        return doc_role in allowed

    def classify_confidence(self, max_similarity: float) -> str:
        """Classifies retrieval confidence into STRONG, WEAK, or NO_MATCH."""
        if max_similarity >= SIMILARITY_THRESHOLD_STRONG:
            return "STRONG"
        elif max_similarity >= SIMILARITY_THRESHOLD_WEAK:
            return "WEAK"
        else:
            return "NO_MATCH"

    def retrieve_chunks(
        self, 
        query_embedding: List[float], 
        top_k: int = 5, 
        similarity_threshold: float = 0.40,
        filter_category: Optional[str] = None,
        filter_role: Optional[str] = None,
        user_role: str = "customer"
    ) -> List[Dict[str, Any]]:
        """
        Executes role-aware semantic vector retrieval:
        1. Calls Supabase `match_documents` RPC with thresholding.
        2. Applies strict Python-layer role filtering to prevent unauthorized knowledge leaks.
        3. Enriches chunks with sanitized similarity scores and confidence tags.
        """
        allowed_roles = self.get_allowed_roles(user_role)
        
        # Determine database filter role
        # If user is admin/super_admin and requested specific filter, use it; otherwise let post-filter handle hierarchy
        rpc_filter_role = filter_role if filter_role in allowed_roles else (user_role if user_role in ["customer", "farmer", "delivery"] else None)

        rpc_url = f"{self.supabase_url}/rest/v1/rpc/match_documents"
        payload = {
            "query_embedding": str(query_embedding),
            "match_threshold": similarity_threshold,
            "match_count": top_k * 2, # Fetch wider candidate pool for role isolation filtering
            "filter_category": filter_category,
            "filter_role": rpc_filter_role
        }

        raw_results = []
        try:
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(rpc_url, data=req_data, headers=self.headers, method="POST")
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw_results = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            # If Supabase RPC is unavailable or offline, search local memory index if populated
            if self._local_index:
                raw_results = self._search_local_index(query_embedding, top_k * 2, similarity_threshold, filter_category)

        # Post-retrieval role security enforcement & score sanitization
        filtered_chunks: List[Dict[str, Any]] = []
        for r in raw_results:
            chunk_role = (r.get("role") or "customer").lower()
            if chunk_role not in allowed_roles:
                continue # STRICT ISOLATION: Drop unauthorized chunks

            sim = r.get("similarity")
            if sim is None or (isinstance(sim, float) and math.isnan(sim)):
                sim = 0.75 # Default grounded score for matches where distance was normalized

            filtered_chunks.append({
                "chunk_id": r.get("chunk_id", "c0"),
                "document_id": r.get("document_id"),
                "category": r.get("category", "general"),
                "role": chunk_role,
                "content": r.get("content", ""),
                "similarity": round(float(sim), 4),
                "confidence": self.classify_confidence(float(sim)),
                "metadata": r.get("metadata", {})
            })

            if len(filtered_chunks) >= top_k:
                break

        return filtered_chunks

    def _search_local_index(
        self,
        query_embedding: List[float],
        top_k: int,
        threshold: float,
        filter_category: Optional[str]
    ) -> List[Dict[str, Any]]:
        """In-memory cosine similarity search over local index."""
        import numpy as np
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        q_vec = q_vec / q_norm

        scored = []
        for doc in self._local_index:
            if filter_category and doc.get("category") != filter_category:
                continue
            emb = doc.get("embedding")
            if not emb:
                continue
            d_vec = np.array(emb, dtype=np.float32)
            d_norm = np.linalg.norm(d_vec)
            if d_norm == 0:
                continue
            sim = float(np.dot(q_vec, d_vec / d_norm))
            if sim >= threshold:
                scored.append({
                    "chunk_id": doc.get("document_id", "doc_local"),
                    "category": doc.get("category", "general"),
                    "role": doc.get("role", "customer"),
                    "content": doc.get("content", ""),
                    "similarity": sim,
                    "metadata": {"source": doc.get("source", "curated_local")}
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

retriever = SupabaseRetriever()
