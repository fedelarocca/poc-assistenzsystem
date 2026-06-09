import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface AnalysisResult {
  id: string;
  caseId: string;
  documentId: string;
  prompt: string;
  resultText: string;
  provider: string;
  model: string;
  createdAt: string;
  analysisType?: string;
  errorMessage?: string;
}

export function useAnalysis(caseId?: string) {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis results from Supabase on mount or caseId change
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      return;
    }

    async function fetchAnalysisResults() {
      try {
        setError(null);
        let query = supabase!
          .from("analysis_results")
          .select("*")
          .order("created_at", { ascending: false });

        if (caseId) {
          query = query.eq("case_id", caseId);
        }

        const { data, error: fetchErr } = await query;

        if (fetchErr) throw fetchErr;

        if (data) {
          const mappedResults: AnalysisResult[] = data.map((res: any) => ({
            id: res.id,
            caseId: res.case_id,
            documentId: res.document_id,
            prompt: res.prompt,
            resultText: res.result_text,
            provider: res.provider,
            model: res.model,
            createdAt: res.created_at,
            analysisType: res.analysis_type || undefined,
            errorMessage: res.error_message || undefined,
          }));
          setAnalysisResults(mappedResults);
        }
      } catch (err: any) {
        console.error("Error fetching analysis results from Supabase:", err);
        setError(err.message || "Fehler beim Laden der Analyseergebnisse.");
      } finally {
        setIsLoaded(true);
      }
    }

    fetchAnalysisResults();
  }, [caseId]);

  const runAnalysis = async (
    targetCaseId: string,
    documentId: string,
    prompt: string,
    provider: string,
    model: string
  ): Promise<AnalysisResult | null> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Analyse kann nicht gestartet werden.");
      return null;
    }

    try {
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("poc_demo_token") || "" : "";
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-token": token,
        },
        body: JSON.stringify({
          caseId: targetCaseId,
          documentId,
          prompt,
          provider,
          model,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler bei der KI-Analyse.");
      }

      const newResult: AnalysisResult = {
        id: data.result.id,
        caseId: data.result.caseId,
        documentId: data.result.documentId,
        prompt: data.result.prompt,
        resultText: data.result.resultText,
        provider: data.result.provider,
        model: data.result.model,
        createdAt: data.result.createdAt,
        analysisType: "strategic_purchase",
      };

      // Prepend to results list (newest first)
      setAnalysisResults((prev) => [newResult, ...prev]);
      return newResult;
    } catch (err: any) {
      console.error("Error running AI analysis:", err);
      setError(err.message || "Fehler bei der KI-Analyse.");
      return null;
    }
  };

  const getResultsByDocumentId = (docId: string) => {
    return analysisResults.filter((r) => r.documentId === docId);
  };

  return {
    analysisResults,
    isLoaded,
    error,
    runAnalysis,
    getResultsByDocumentId,
  };
}
