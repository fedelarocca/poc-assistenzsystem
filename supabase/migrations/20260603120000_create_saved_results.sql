-- Migration: Create saved_results table for I-09
-- HINWEIS: Dieses Skript legt die Tabelle für die persistenten Momentaufnahmen (Snapshots) an.
-- Da der PoC ohne explizite Benutzerauthentifizierung arbeitet, werden offene anonyme Policies (anon) verwendet.
-- 
-- SICHERHEITSHINWEIS:
-- - Diese offenen Policies sind ausschliesslich für den prototypischen Proof of Concept (PoC) geeignet.
-- - Sie sind absolut NICHT produktionsgeeignet, da sie keine echte Benutzer- oder Mandantentrennung bieten.
-- - Für eine produktive Anwendung müssen diese anon-Policies entfernt und durch restriktive,
--   auf auth.uid() basierende Policies gekoppelt mit Supabase Auth, ersetzt werden.

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.saved_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
    analysis_result_id uuid REFERENCES public.analysis_results(id) ON DELETE SET NULL,
    title text NOT NULL,
    note text,
    result_text text NOT NULL,
    prompt text,
    provider text,
    model text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Row Level Security (RLS) aktivieren
ALTER TABLE public.saved_results ENABLE ROW LEVEL SECURITY;

-- 3. Offene Policies für anonymen (anon) Zugriff im PoC einrichten
-- SELECT erlaubt das Lesen der gespeicherten Ergebnisse
CREATE POLICY "Allow anon SELECT on saved_results" 
ON public.saved_results 
FOR SELECT 
TO anon 
USING (true);

-- INSERT erlaubt das Speichern neuer Momentaufnahmen
CREATE POLICY "Allow anon INSERT on saved_results" 
ON public.saved_results 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- DELETE erlaubt das Löschen von gespeicherten Momentaufnahmen
CREATE POLICY "Allow anon DELETE on saved_results" 
ON public.saved_results 
FOR DELETE 
TO anon 
USING (true);

-- HINWEIS: Es wird keine UPDATE Policy angelegt, da I-09 keine Bearbeitung gespeicherter Ergebnisse vorsieht.
