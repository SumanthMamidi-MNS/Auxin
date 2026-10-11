-- 06_functions.sql
-- Auxin AI v9.0 — RPC Match Documents Vector Search Function

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5,
    filter_category text DEFAULT NULL,
    filter_role text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_id VARCHAR(255),
    content TEXT,
    category VARCHAR(100),
    role VARCHAR(100),
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_id,
        dc.content,
        dc.category,
        dc.role,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
      AND (filter_category IS NULL OR dc.category = filter_category)
      AND (filter_role IS NULL OR dc.role = filter_role)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
