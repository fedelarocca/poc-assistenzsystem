import { useState, useEffect } from "react";
import { Document } from "../types/document";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      return;
    }

    async function fetchDocuments() {
      try {
        setError(null);
        const { data, error: fetchErr } = await supabase!
          .from("documents")
          .select("*")
          .order("created_at", { ascending: true });

        if (fetchErr) throw fetchErr;

        if (data) {
          const mappedDocs: Document[] = data.map((d: any) => ({
            id: d.id,
            caseId: d.case_id,
            title: d.title,
            description: d.description || undefined,
            fileName: d.file_name,
            fileType: d.file_type || "unknown",
            fileSize: Number(d.file_size),
            createdAt: d.created_at,
            storagePath: d.storage_path || undefined,
            extractedText: d.extracted_text || undefined,
          }));
          setDocuments(mappedDocs);
        }
      } catch (err: any) {
        console.error("Error fetching documents from Supabase:", err);
        setError(err.message || "Fehler beim Laden der Dokumente.");
      } finally {
        setIsLoaded(true);
      }
    }

    fetchDocuments();
  }, []);

  const addDocument = async (input: Omit<Document, "id" | "createdAt">): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase is not configured. Cannot add document.");
      return null;
    }

    try {
      setError(null);
      const { data, error: insertErr } = await supabase
        .from("documents")
        .insert({
          case_id: input.caseId,
          title: input.title,
          description: input.description || null,
          file_name: input.fileName,
          file_type: input.fileType || null,
          file_size: input.fileSize,
          storage_path: input.storagePath || null,
          extracted_text: input.extractedText || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (data) {
        const newDoc: Document = {
          id: data.id,
          caseId: data.case_id,
          title: data.title,
          description: data.description || undefined,
          fileName: data.file_name,
          fileType: data.file_type || "unknown",
          fileSize: Number(data.file_size),
          createdAt: data.created_at,
          storagePath: data.storage_path || undefined,
          extractedText: data.extracted_text || undefined,
        };
        setDocuments((prev) => [...prev, newDoc]);
        return newDoc.id;
      }
      return null;
    } catch (err: any) {
      console.error("Error adding document to Supabase:", err);
      setError(err.message || "Fehler beim Hinzufügen des Dokuments.");
      return null;
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase is not configured. Cannot delete document.");
      return;
    }

    try {
      setError(null);
      const { error: deleteErr } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteErr) throw deleteErr;

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err: any) {
      console.error("Error deleting document from Supabase:", err);
      setError(err.message || "Fehler beim Löschen des Dokuments.");
    }
  };

  const getDocumentsByCaseId = (caseId: string) => {
    return documents.filter((d) => d.caseId === caseId);
  };

  return {
    documents,
    isLoaded,
    error,
    addDocument,
    deleteDocument,
    getDocumentsByCaseId,
  };
}
