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
    const storedCases = localStorage.getItem(STORAGE_KEY);
    const storedActiveCase = localStorage.getItem(ACTIVE_CASE_KEY);
    
    if (storedCases) {
      try {
        setCases(JSON.parse(storedCases));
      } catch (error) {
        console.error("Failed to parse cases from localStorage", error);
      }
    }
    
    if (storedActiveCase) {
      setActiveCaseId(storedActiveCase);
    }
    
    setIsLoaded(true);
  }, []);

  // Save cases to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    }
  }, [cases, isLoaded]);

  // Save active case to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      if (activeCaseId) {
        localStorage.setItem(ACTIVE_CASE_KEY, activeCaseId);
      } else {
        localStorage.removeItem(ACTIVE_CASE_KEY);
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
    if (activeCaseId === id) {
      setActiveCaseId(null);
    }
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
