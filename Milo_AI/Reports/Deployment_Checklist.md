# 🛡️ AUXIN AI v13.0 — DEPLOYMENT CHECKLIST

- [x] **Single Supabase Project Configured**: `https://snjqxpelsbsvytxezwne.supabase.co`
- [x] **pgvector Extension Active**: Enabled with 384d vector support.
- [x] **Documents & Chunks Tables Populated**: 22 documents and 22 vector chunks inserted into `snjqxpelsbsvytxezwne`.
- [x] **HNSW Index Created**: `document_chunks_embedding_hnsw_idx` active.
- [x] **RPC Similarity Search Active**: `match_documents` function verified.
- [x] **FastAPI Backend Operational**: `main.py` entrypoint configured with CORS middleware and `/docs`.
- [x] **Intent Routing Verified**: Greetings skip vector search; knowledge queries execute RAG.
- [x] **Multi-Role Filtering Verified**: Customer, Farmer, Delivery, Admin, and Super Admin roles tested.
- [x] **Frontend Integrated**: `MiloChatWidget.tsx` and Flutter client models connected to FastAPI backend.
