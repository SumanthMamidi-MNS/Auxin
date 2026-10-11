-- 03_create_embeddings_table.sql
-- Auxin AI v9.0 — Document Chunks & Embeddings Table (pgvector 384 dimensions)

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384) NOT NULL, -- BAAI/bge-small-en-v1.5 384 dimensions
    token_count INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
