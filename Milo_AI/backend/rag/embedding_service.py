# backend/rag/embedding_service.py
# Auxin AI v10.1 — RAG Embedding Generation Service

import os
import sys
import numpy as np
from typing import List

try:
    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer('BAAI/bge-small-en-v1.5')
except Exception as e:
    _model = None

class EmbeddingService:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.dimension = 384

    def generate_embedding(self, text: str) -> List[float]:
        """Generates a 384-dimensional normalized embedding for text."""
        if not text or not text.strip():
            raise ValueError("Input text for embedding generation cannot be empty.")
            
        if _model is not None:
            vec = _model.encode(text, normalize_embeddings=True)
            return vec.tolist()
        else:
            # Deterministic projection fallback for test environments
            np.random.seed(abs(hash(text)) % (2**32))
            tokens = text.lower().split()
            vec = np.zeros(384, dtype=np.float32)
            for t in tokens:
                h = abs(hash(t)) % 384
                vec[h] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            else:
                vec = np.random.randn(384).astype(np.float32)
                vec = vec / np.linalg.norm(vec)
            return vec.tolist()

    def generate_embeddings_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generates normalized embeddings for a batch of texts."""
        if not texts:
            return []
        clean_texts = [t.strip() if t and t.strip() else " " for t in texts]
        if _model is not None:
            vecs = _model.encode(clean_texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
            return vecs.tolist()
        else:
            return [self.generate_embedding(t) for t in clean_texts]

embedding_service = EmbeddingService()
