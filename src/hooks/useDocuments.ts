import { useState, useEffect } from "react";
import { Document } from "../types/document";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function sanitizeFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const base = name.substring(0, name.lastIndexOf('.')) || name;
  const safeBase = base
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric characters with underscores
    .replace(/__+/g, '_')          // Collapse multiple underscores
    .replace(/^_+|_+$/g, '')      // Trim leading/trailing underscores
    .toLowerCase();
  return `${safeBase}.${ext}`;
}

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

  const addDocument = async (
    input: Omit<Document, "id" | "createdAt" | "storagePath" | "extractedText">,
    file: File
  ): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Dokumente können nicht hinzugefügt werden.");
      return null;
    }

    // 1. File type validation (.pdf, .txt, .docx)
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'txt', 'docx'];
    if (!allowedExtensions.includes(ext)) {
      setError("Ungültiges Dateiformat. Nur PDF-, TXT- und DOCX-Dateien sind erlaubt.");
      return null;
    }

    // 2. File size validation (max 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      setError("Datei ist zu gross. Die maximale Dateigrösse beträgt 10 MB.");
      return null;
    }

    let storagePath = "";
    try {
      setError(null);

      // Generate a safe unique storage path
      const safeName = sanitizeFileName(file.name);
      storagePath = `cases/${input.caseId}/${Date.now()}_${safeName}`;

      // 3. Upload physical file to private Storage Bucket 'tender-documents'
      const { error: uploadErr } = await supabase.storage
        .from("tender-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) {
        throw new Error(`Fehler beim Datei-Upload in Storage: ${uploadErr.message}`);
      }

      // 4. Save metadata in the database
      const { data, error: insertErr } = await supabase
        .from("documents")
        .insert({
          case_id: input.caseId,
          title: input.title,
          description: input.description || null,
          file_name: file.name,
          file_type: file.type || ext,
          file_size: file.size,
          storage_path: storagePath,
          extracted_text: null, // Keep null for I-06
        })
        .select()
        .single();

      if (insertErr) {
        // Rollback: delete the uploaded file from storage if DB insert fails
        await supabase.storage.from("tender-documents").remove([storagePath]);
        throw insertErr;
      }

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
          extractedText: undefined,
        };
        setDocuments((prev) => [...prev, newDoc]);
        return newDoc.id;
      }
      return null;
    } catch (err: any) {
      console.error("Error adding document:", err);
      setError(err.message || "Fehler beim Hinzufügen des Dokuments.");
      return null;
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Dokumente können nicht gelöscht werden.");
      return false;
    }

    const docToDelete = documents.find((d) => d.id === documentId);
    if (!docToDelete) {
      setError("Das zu löschende Dokument wurde nicht gefunden.");
      return false;
    }

    try {
      setError(null);

      // 1. Delete physical file from Supabase Storage first
      if (docToDelete.storagePath) {
        const { error: storageErr } = await supabase.storage
          .from("tender-documents")
          .remove([docToDelete.storagePath]);

        if (storageErr) {
          throw new Error(`Fehler beim Löschen aus dem Storage: ${storageErr.message}`);
        }
      }

      // 2. Delete database entry after successful storage deletion
      const { error: deleteErr } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteErr) throw deleteErr;

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      return true;
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setError(err.message || "Fehler beim Löschen des Dokuments.");
      return false;
    }
  };

  const getDocumentsByCaseId = (caseId: string) => {
    return documents.filter((d) => d.caseId === caseId);
  };

  const extractDocumentText = async (documentId: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase ist nicht konfiguriert. Textextraktion nicht möglich.");
      return false;
    }

    try {
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("poc_demo_token") || "" : "";
      const res = await fetch(`/api/documents/${documentId}/extract-text`, {
        method: "POST",
        headers: {
          "x-demo-token": token,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler bei der Textextraktion.");
      }

      // Update the local state with the extracted text
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? { ...d, extractedText: data.extractedText }
            : d
        )
      );

      return true;
    } catch (err: any) {
      console.error("Error in extractDocumentText hook:", err);
      setError(err.message || "Fehler bei der Textextraktion.");
      return false;
    }
  };

  return {
    documents,
    isLoaded,
    error,
    addDocument,
    deleteDocument,
    getDocumentsByCaseId,
    extractDocumentText,
  };
}
