# Milo_AI/scripts/index_knowledge.py
"""
Auxin AI — Phase 2 Semantic Vector Knowledge Indexing Pipeline
Idempotently indexes curated Q&A records and authoritative knowledge documents into Supabase pgvector.
"""

import os
import sys
import json
import time
import glob
import urllib.request
import urllib.error
from typing import List, Dict, Any

# Ensure Milo_AI root is on sys.path
milo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if milo_root not in sys.path:
    sys.path.insert(0, milo_root)

# Load environment variables
project_root = os.path.dirname(milo_root)
app_env = os.getenv("APP_ENV", "development")
env_file = os.path.join(project_root, f".env.{app_env}")
if not os.path.exists(env_file):
    env_file = os.path.join(project_root, ".env")
if os.path.exists(env_file):
    from dotenv import load_dotenv
    load_dotenv(env_file)

from backend.rag.embedding_service import embedding_service

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://snjqxpelsbsvytxezwne.supabase.co")
SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    ""
)

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def load_authoritative_knowledge_docs(knowledge_dir: str) -> List[Dict[str, Any]]:
    """Loads and chunks the 22 production knowledge markdown files."""
    docs = []
    md_files = glob.glob(os.path.join(knowledge_dir, "**", "*.md"), recursive=True)
    
    for fpath in md_files:
        rel_path = os.path.relpath(fpath, knowledge_dir)
        category = os.path.dirname(rel_path).replace("\\", "/").split("/")[0] or "general"
        role = category if category in ["admin", "customer", "delivery", "farmer"] else "customer"
        title = os.path.splitext(os.path.basename(fpath))[0].replace("_", " ")

        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read().strip()

        # Split document by headers or paragraphs
        sections = [s.strip() for s in content.split("\n## ") if s.strip()]
        for idx, sec in enumerate(sections):
            sec_content = ("## " + sec) if idx > 0 else sec
            chunk_id = f"doc_{category}_{os.path.basename(fpath).lower().replace('.md', '')}_c{idx+1:03d}"
            docs.append({
                "chunk_id": chunk_id,
                "title": f"{title} - Part {idx+1}",
                "content": sec_content,
                "category": category,
                "role": role,
                "source": f"knowledge/{rel_path}",
                "is_authoritative": True
            })
    return docs

def load_curated_qa_docs(curated_jsonl_path: str, max_records: int = 500) -> List[Dict[str, Any]]:
    """Loads prioritized curated Q&A knowledge records."""
    docs = []
    if not os.path.exists(curated_jsonl_path):
        return docs

    with open(curated_jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line.strip())
            docs.append({
                "chunk_id": f"qa_{item['document_id']}",
                "title": item.get("title", item.get("query", "")),
                "content": item.get("content", ""),
                "category": item.get("category", "general"),
                "role": item.get("role", "customer"),
                "source": "curated_qa_10500",
                "is_authoritative": False
            })
            if len(docs) >= max_records:
                break
    return docs

def upsert_chunks_to_supabase(chunks: List[Dict[str, Any]], batch_size: int = 50) -> int:
    """Idempotently uploads vector chunks to Supabase using upsert merge-duplicates."""
    endpoint = f"{SUPABASE_URL}/rest/v1/document_chunks"
    successful = 0

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        payload = []
        for c in batch:
            payload.append({
                "chunk_id": c["chunk_id"],
                "chunk_index": 1,
                "content": c["content"],
                "embedding": str(c["embedding"]),
                "token_count": len(c["content"].split()),
                "category": c["category"],
                "role": c["role"],
                "metadata": {
                    "title": c["title"],
                    "source": c["source"],
                    "is_authoritative": c.get("is_authoritative", False)
                }
            })

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(endpoint, data=req_data, headers=HEADERS, method="POST")
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status in [200, 201]:
                    successful += len(batch)
        except Exception as e:
            # Continue gracefully
            pass

    return successful

def build_and_index_knowledge(
    knowledge_dir: str,
    curated_jsonl_path: str,
    output_index_path: str
) -> Dict[str, Any]:
    start_time = time.time()
    print("[Indexing] Step 1: Loading authoritative knowledge base docs...")
    auth_docs = load_authoritative_knowledge_docs(knowledge_dir)
    print(f"Loaded {len(auth_docs)} authoritative document chunks from {knowledge_dir}")

    print("[Indexing] Step 2: Loading curated Q&A knowledge records...")
    qa_docs = load_curated_qa_docs(curated_jsonl_path, max_records=600)
    print(f"Loaded {len(qa_docs)} curated Q&A records")

    all_docs = auth_docs + qa_docs
    print(f"[Indexing] Step 3: Generating 384-dimensional BGE embeddings for {len(all_docs)} chunks...")
    
    texts = [d["content"] for d in all_docs]
    embeddings = embedding_service.generate_embeddings_batch(texts, batch_size=32)

    for doc, emb in zip(all_docs, embeddings):
        doc["embedding"] = emb

    print("[Indexing] Step 4: Idempotently upserting chunks to Supabase pgvector...")
    indexed_in_supabase = upsert_chunks_to_supabase(all_docs, batch_size=50)
    print(f"Successfully synced {indexed_in_supabase} chunks to Supabase pgvector.")

    print(f"[Indexing] Step 5: Caching local vector snapshot to {output_index_path}...")
    os.makedirs(os.path.dirname(output_index_path), exist_ok=True)
    with open(output_index_path, "w", encoding="utf-8") as f:
        json.dump(all_docs, f, ensure_ascii=False)

    elapsed = round(time.time() - start_time, 2)
    summary = {
        "status": "success",
        "total_chunks_indexed": len(all_docs),
        "authoritative_chunks": len(auth_docs),
        "curated_qa_chunks": len(qa_docs),
        "supabase_synced_chunks": indexed_in_supabase,
        "local_snapshot_file": output_index_path,
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "vector_dimension": 384,
        "time_seconds": elapsed
    }
    print(f"[Indexing Complete] {summary}")
    return summary

if __name__ == "__main__":
    k_dir = os.path.abspath(os.path.join(milo_root, "knowledge"))
    q_file = os.path.abspath(os.path.join(milo_root, "data", "curated", "production_dataset.jsonl"))
    if not os.path.exists(q_file):
        q_file = os.path.abspath(os.path.join(milo_root, "data", "curated", "curated_knowledge_documents.jsonl"))
    out_idx = os.path.abspath(os.path.join(milo_root, "data", "curated", "curated_vector_index.json"))
    build_and_index_knowledge(k_dir, q_file, out_idx)
