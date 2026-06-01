-- Migration: Create analysis_results table for I-08
-- HINWEIS: Dieses Skript legt die Tabelle für die Speicherung der KI-Analyseergebnisse an.
-- Da der PoC ohne explizite Benutzerauthentifizierung arbeitet, werden offene anonyme Policies (anon) verwendet.
-- 
-- SICHERHEITSHINWEIS:
-- - Diese offenen Policies sind ausschliesslich für den prototypischen Proof of Concept (PoC) geeignet.
-- - Sie sind absolut NICHT produktionsgeeignet, da sie keine echte Benutzer- oder Mandantentrennung bieten.
-- - Für eine produktive Anwendung müssen diese anon-Policies entfernt und durch restriktive,
--   auf auth.uid() basierende Policies gekoppelt mit Supabase Auth, ersetzt werden.

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    prompt text NOT NULL,
    result_text text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    analysis_type text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Row Level Security (RLS) aktivieren
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- 3. Offene Policies für anonymen (anon) Zugriff im PoC einrichten
-- SELECT erlaubt das Lesen aller Ergebnisse
CREATE POLICY "Allow anon SELECT on analysis_results" 
ON public.analysis_results 
FOR SELECT 
TO anon 
USING (true);

-- INSERT erlaubt das Speichern neuer Ergebnisse
CREATE POLICY "Allow anon INSERT on analysis_results" 
ON public.analysis_results 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- DELETE erlaubt das Löschen von Ergebnissen
CREATE POLICY "Allow anon DELETE on analysis_results" 
ON public.analysis_results 
FOR DELETE 
TO anon 
USING (true);

-- HINWEIS: Es wird keine UPDATE Policy angelegt, da I-08 keine Bearbeitung bestehender Ergebnisse vorsieht.
