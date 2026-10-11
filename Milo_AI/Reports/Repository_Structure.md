# 🛡️ AUXIN AI v13.0 — REPOSITORY STRUCTURE REPORT

```text
The Auxin/
├── .env                               # Production Environment Secrets
├── .env.development                   # Development Environment Settings
├── auxin-frontend/                    # SINGLE CANONICAL FRONTEND APPLICATION
│   ├── src/
│   │   ├── app/                       # Next.js Application Pages
│   │   └── components/
│   │       └── milo/
│   │           └── MiloChatWidget.tsx # Milo AI Production Web & Flutter Client
│   └── package.json
├── Milo_AI/                           # SINGLE CANONICAL PRODUCTION AI BACKEND
│   ├── backend/
│   │   ├── api/
│   │   │   └── chat_router.py         # FastAPI REST Endpoints (/api/chat, /history, /feedback, /health)
│   │   ├── memory/
│   │   │   └── session_memory.py      # Session Conversation Memory Manager
│   │   ├── rag/
│   │   │   ├── embedding_service.py   # BAAI/bge-small-en-v1.5 Query Embedder
│   │   │   ├── retriever.py           # Supabase pgvector RPC Retriever
│   │   │   ├── prompt_builder.py      # Grounded Prompt Synthesizer
│   │   │   ├── rag_engine.py          # RAG Pipeline Orchestrator
│   │   │   └── intent_detector.py     # Intent Classification Service
│   │   └── main.py                     # FastAPI Application Server Entrypoint
│   ├── config/
│   │   ├── environment.py
│   │   └── settings.py
│   ├── database/                      # SQL Migrations (01 to 06)
│   ├── knowledge/                     # 22 Production Markdown Documents
│   └── Reports/                       # Phase Audit Reports
└── schema.sql                         # Auxiliary Database Schema Definitions
```
