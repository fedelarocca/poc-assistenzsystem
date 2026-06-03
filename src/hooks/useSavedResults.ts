import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { SavedResult } from "../types/saved-result";

export function useSavedResults(caseId?: string) {
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved results from Supabase on mount or caseId change
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      return;
    }

    async function fetchSavedResults() {
      try {
        setError(null);
        let query = supabase!
          .from("saved_results")
          .select("*")
          .order("created_at", { ascending: false });

        if (caseId) {
          query = query.eq("case_id", caseId);
        }

        const { data, error: fetchErr } = await query;

        if (fetchErr) throw fetchErr;

        if (data) {
          const mappedResults: SavedResult[] = data.map((res: any) => ({
            id: res.id,
            caseId: res.case_id,
            documentId: res.document_id || undefined,
            analysisResultId: res.analysis_result_id || undefined,
            title: res.title,
            note: res.note || undefined,
            resultText: res.result_text,
            prompt: res.prompt || undefined,
            provider: res.provider || undefined,
            model: res.model || undefined,
            createdAt: res.created_at,
          }));
          setSavedResults(mappedResults);
        }
      } catch (err: any) {
        console.error("Error fetching saved results from Supabase:", err);
        setError(err.message || "Fehler beim Laden der gespeicherten Ergebnisse.");
      } finally {
        setIsLoaded(true);
      }
    }

    fetchSavedResults();
  }, [caseId]);

  const saveAnalysisResult = async (
    input: Omit<SavedResult, "id" | "createdAt">
  ): Promise<SavedResult | null> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Ergebnis kann nicht gespeichert werden.");
      return null;
    }

    try {
      setError(null);

      // Verify input
      if (!input.title || !input.title.trim()) {
        throw new Error("Ein Titel ist zum Speichern zwingend erforderlich.");
      }
      if (!input.resultText || !input.resultText.trim()) {
        throw new Error("Ein leeres Analyseergebnis kann nicht gespeichert werden.");
      }

      // Insert record to Supabase saved_results table
      const { data, error: insertErr } = await supabase
        .from("saved_results")
        .insert({
          case_id: input.caseId,
          document_id: input.documentId || null,
          analysis_result_id: input.analysisResultId || null,
          title: input.title.trim(),
          note: input.note?.trim() || null,
          result_text: input.resultText,
          prompt: input.prompt || null,
          provider: input.provider || null,
          model: input.model || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (data) {
        const newSavedResult: SavedResult = {
          id: data.id,
          caseId: data.case_id,
          documentId: data.document_id || undefined,
          analysisResultId: data.analysis_result_id || undefined,
          title: data.title,
          note: data.note || undefined,
          resultText: data.result_text,
          prompt: data.prompt || undefined,
          provider: data.provider || undefined,
          model: data.model || undefined,
          createdAt: data.created_at,
        };

        setSavedResults((prev) => [newSavedResult, ...prev]);
        return newSavedResult;
      }
      return null;
    } catch (err: any) {
      console.error("Error saving analysis result:", err);
      setError(err.message || "Fehler beim Speichern des Ergebnisses.");
      return null;
    }
  };

  const deleteSavedResult = async (savedResultId: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Ergebnis kann nicht gelöscht werden.");
      return false;
    }

    try {
      setError(null);

      const { error: deleteErr } = await supabase
        .from("saved_results")
        .delete()
        .eq("id", savedResultId);

      if (deleteErr) throw deleteErr;

      setSavedResults((prev) => prev.filter((item) => item.id !== savedResultId));
      return true;
    } catch (err: any) {
      console.error("Error deleting saved result:", err);
      setError(err.message || "Fehler beim Löschen des gespeicherten Ergebnisses.");
      return false;
    }
  };

  return {
    savedResults,
    isLoaded,
    error,
    saveAnalysisResult,
    deleteSavedResult,
  };
}
