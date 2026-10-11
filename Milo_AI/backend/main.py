# backend/main.py
# Auxin AI v11.0 — Production FastAPI Application Server

import os
import sys

# Ensure Milo_AI root is on sys.path
milo_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
if milo_root not in sys.path:
    sys.path.insert(0, milo_root)

# Load environment variables from project root
project_root = os.path.dirname(milo_root)
app_env = os.getenv("APP_ENV", "development")
env_file = os.path.join(project_root, f".env.{app_env}")
if not os.path.exists(env_file):
    env_file = os.path.join(project_root, ".env")
if os.path.exists(env_file):
    from dotenv import load_dotenv
    load_dotenv(env_file)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.chat_router import chat_router

app = FastAPI(
    title="Auxin AI — Milo AI Production Backend API",
    description="Production RAG Backend API for Milo AI powered by Supabase pgvector, BAAI/bge-small-en-v1.5 embeddings, and Gemini 2.5 Flash.",
    version="11.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(chat_router)

@app.get("/", tags=["System Root"])
def root():
    return {
        "message": "Welcome to Auxin AI — Milo AI Production Backend API v11.0",
        "docs_url": "/docs",
        "health_check": "/api/chat/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
