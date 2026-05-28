import { useState, useEffect } from "react";
import { Case } from "../types/case";

const STORAGE_KEY = "poc_cases";
const ACTIVE_CASE_KEY = "poc_active_case";

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    let loadedCases: Case[] = [];
    const storedCases = localStorage.getItem(STORAGE_KEY);
    const storedActiveCase = localStorage.getItem(ACTIVE_CASE_KEY);
    
    if (storedCases) {
      try {
        const parsed = JSON.parse(storedCases);
        if (Array.isArray(parsed)) {
          loadedCases = parsed;
          setCases(parsed);
        } else {
          console.warn("Invalid cases array in localStorage, resetting.");
          setCases([]);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to parse cases from localStorage", error);
        setCases([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    if (storedActiveCase) {
      if (loadedCases.some((c) => c.id === storedActiveCase)) {
        setActiveCaseId(storedActiveCase);
      } else {
        setActiveCaseId(null);
        try {
          localStorage.removeItem(ACTIVE_CASE_KEY);
        } catch (e) {
          console.error("Failed to remove active case from localStorage", e);
        }
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Save cases to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      } catch (error) {
        console.error("Failed to save cases to localStorage", error);
      }
    }
  }, [cases, isLoaded]);

  // Save active case to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        if (activeCaseId) {
          localStorage.setItem(ACTIVE_CASE_KEY, activeCaseId);
        } else {
          localStorage.removeItem(ACTIVE_CASE_KEY);
        }
      } catch (error) {
        console.error("Failed to update active case in localStorage", error);
      }
    }
  }, [activeCaseId, isLoaded]);

  const addCase = (title: string, description?: string) => {
    const newCase: Case = {
      id: crypto.randomUUID(),
      title,
      description,
      createdAt: new Date().toISOString(),
    };
    setCases((prev) => [...prev, newCase]);
    return newCase.id;
  };

  const selectCase = (id: string) => {
    setActiveCaseId(id);
  };

  const deleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    setActiveCaseId((prev) => (prev === id ? null : prev));
  };

  return {
    cases,
    activeCaseId,
    activeCase: cases.find((c) => c.id === activeCaseId) || null,
    isLoaded,
    addCase,
    selectCase,
    deleteCase,
  };
}
