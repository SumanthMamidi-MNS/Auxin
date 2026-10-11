-- 04_create_indexes.sql
-- Auxin AI v9.0 — HNSW Vector Indexes and Column Indexes

-- HNSW Vector Index using cosine distance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
    ON public.document_chunks 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Category and Role Filter Indexes
CREATE INDEX IF NOT EXISTS document_chunks_category_idx ON public.document_chunks(category);
CREATE INDEX IF NOT EXISTS document_chunks_role_idx ON public.document_chunks(role);
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS documents_category_role_idx ON public.documents(category, role);
