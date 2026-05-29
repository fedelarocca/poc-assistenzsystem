import { useState, useEffect } from "react";
import { Document } from "../types/document";

const STORAGE_KEY = "poc_documents";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedDocs = localStorage.getItem(STORAGE_KEY);
    if (storedDocs) {
      try {
        const parsed = JSON.parse(storedDocs);
        if (Array.isArray(parsed)) {
          setDocuments(parsed);
        } else {
          console.warn("Invalid documents array in localStorage, resetting.");
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to parse documents from localStorage", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when documents change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      } catch (error) {
        console.error("Failed to save documents to localStorage", error);
      }
    }
  }, [documents, isLoaded]);

  const addDocument = (input: Omit<Document, "id" | "createdAt">) => {
    const newDoc: Document = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, newDoc]);
    return newDoc.id;
  };

  const deleteDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
  };

  const getDocumentsByCaseId = (caseId: string) => {
    return documents.filter((d) => d.caseId === caseId);
  };

  return {
    documents,
    isLoaded,
    addDocument,
    deleteDocument,
    getDocumentsByCaseId,
  };
}
