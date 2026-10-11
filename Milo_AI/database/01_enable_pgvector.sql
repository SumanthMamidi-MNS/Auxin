-- 01_enable_pgvector.sql
-- Auxin AI v9.0 — Enable pgvector Extension in Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
