import { useState, useEffect } from "react";
import { Case } from "../types/case";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const ACTIVE_CASE_KEY = "poc_active_case";

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cases from Supabase on mount
  useEffect(() => {
    const storedActiveCase = localStorage.getItem(ACTIVE_CASE_KEY);

    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      if (storedActiveCase) {
        localStorage.removeItem(ACTIVE_CASE_KEY);
      }
      return;
    }

    async function fetchCases() {
      try {
        setError(null);
        const { data, error: fetchErr } = await supabase!
          .from("cases")
          .select("*")
          .order("created_at", { ascending: true });

        if (fetchErr) throw fetchErr;

        if (data) {
          const mappedCases: Case[] = data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description || undefined,
            createdAt: c.created_at,
          }));
          setCases(mappedCases);

          // Restore active case selection if it still exists in the database
          if (storedActiveCase && mappedCases.some((c) => c.id === storedActiveCase)) {
            setActiveCaseId(storedActiveCase);
          } else {
            setActiveCaseId(null);
            localStorage.removeItem(ACTIVE_CASE_KEY);
          }
        }
      } catch (err: any) {
        console.error("Error fetching cases from Supabase:", err);
        setError(err.message || "Fehler beim Laden der Analysefälle.");
      } finally {
        setIsLoaded(true);
      }
    }

    fetchCases();
  }, []);

  // Save active case to localStorage when it changes (session state)
  useEffect(() => {
    if (isLoaded) {
      try {
        if (activeCaseId) {
          localStorage.setItem(ACTIVE_CASE_KEY, activeCaseId);
        } else {
          localStorage.removeItem(ACTIVE_CASE_KEY);
        }
      } catch (err) {
        console.error("Failed to update active case in localStorage:", err);
      }
    }
  }, [activeCaseId, isLoaded]);

  const addCase = async (title: string, description?: string): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase is not configured. Cannot add case.");
      return null;
    }

    try {
      setError(null);
      const { data, error: insertErr } = await supabase
        .from("cases")
        .insert({
          title,
          description: description || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (data) {
        const newCase: Case = {
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          createdAt: data.created_at,
        };
        setCases((prev) => [...prev, newCase]);
        return newCase.id;
      }
      return null;
    } catch (err: any) {
      console.error("Error adding case to Supabase:", err);
      setError(err.message || "Fehler beim Erstellen des Analysefalls.");
      return null;
    }
  };

  const selectCase = (id: string) => {
    setActiveCaseId(id);
  };

  const deleteCase = async (id: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase is not configured. Cannot delete case.");
      return;
    }

    try {
      setError(null);
      const { error: deleteErr } = await supabase
        .from("cases")
        .delete()
        .eq("id", id);

      if (deleteErr) throw deleteErr;

      setCases((prev) => prev.filter((c) => c.id !== id));
      setActiveCaseId((prev) => (prev === id ? null : prev));
    } catch (err: any) {
      console.error("Error deleting case from Supabase:", err);
      setError(err.message || "Fehler beim Löschen des Analysefalls.");
    }
  };

  return {
    cases,
    activeCaseId,
    activeCase: cases.find((c) => c.id === activeCaseId) || null,
    isLoaded,
    error,
    addCase,
    selectCase,
    deleteCase,
  };
}
