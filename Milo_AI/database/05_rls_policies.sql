-- 05_rls_policies.sql
-- Auxin AI v9.0 — Row Level Security (RLS) Policies

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users and service roles
CREATE POLICY "Allow public read access to documents" 
    ON public.documents FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access to document_chunks" 
    ON public.document_chunks FOR SELECT 
    USING (true);

-- Restrict write access to service_role key only
CREATE POLICY "Allow service role full access to documents" 
    ON public.documents FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to document_chunks" 
    ON public.document_chunks FOR ALL 
    USING (auth.role() = 'service_role');
