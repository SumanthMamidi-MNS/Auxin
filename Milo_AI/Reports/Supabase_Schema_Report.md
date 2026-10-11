# 🛡️ AUXIN AI v9.0 — SUPABASE SCHEMA REPORT

**Schema Version**: 1.0 (pgvector)
**Vector Dimensions**: `384` (`BAAI/bge-small-en-v1.5`)
**Status**: 🟢 SQL MIGRATION FILES GENERATED

---

## 1. Migration Files Inventory

1. `01_enable_pgvector.sql`: Enables `pgvector` and `uuid-ossp` extensions.
2. `02_create_documents_table.sql`: Creates `documents` master table.
3. `03_create_embeddings_table.sql`: Creates `document_chunks` table with `embedding vector(384)`.
4. `04_create_indexes.sql`: Creates HNSW vector index (`vector_cosine_ops`) and metadata indexes.
5. `05_rls_policies.sql`: Enables Row Level Security (RLS) and access policies.
6. `06_functions.sql`: Defines `match_documents` RPC vector similarity search function.

---

## 2. Schema Specification

- **Master Table**: `public.documents`
- **Chunks Table**: `public.document_chunks`
- **Vector Index**: HNSW (`m = 16`, `ef_construction = 64`)
- **Search RPC Function**: `match_documents(query_embedding, match_threshold, match_count, filter_category, filter_role)`
