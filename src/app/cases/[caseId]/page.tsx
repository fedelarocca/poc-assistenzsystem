"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCases } from "../../../hooks/useCases";
import { useDocuments } from "../../../hooks/useDocuments";
import { isSupabaseConfigured } from "../../../lib/supabase";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { cases, isLoaded: isCasesLoaded, error: casesError } = useCases();
  const { 
    isLoaded: isDocsLoaded, 
    error: docsError,
    addDocument, 
    deleteDocument, 
    getDocumentsByCaseId 
  } = useDocuments();

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avoid hydration mismatch by waiting for local storage to load
  if (!isCasesLoaded || !isDocsLoaded) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Analysefall Details</h1>
        <p>Lade Analysefall...</p>
      </div>
    );
  }

  // Find the case by ID
  const currentCase = cases.find((c) => c.id === caseId);

  // If the case does not exist or was deleted, show a clean error state
  if (!currentCase) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <div className="card" style={{ padding: "40px 20px" }}>
          <h1 style={{ color: "#dc3545", marginBottom: "15px" }}>Analysefall nicht gefunden.</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "25px" }}>
            Der gesuchte Fall existiert nicht oder wurde gelöscht.
          </p>
          <Link href="/cases" className="btn-secondary">
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  // Get documents for this specific case
  const caseDocs = getDocumentsByCaseId(caseId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fileName = selectedFile.name;
    const fileType = selectedFile.type || "unknown";
    const fileSize = selectedFile.size;

    // Use filename as fallback title if not entered
    const title = docTitle.trim() || fileName;

    addDocument({
      caseId,
      title,
      description: docDescription.trim() || undefined,
      fileName,
      fileType,
      fileSize,
    });

    // Reset Form completely
    setDocTitle("");
    setDocDescription("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsAddingDoc(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteDocId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteDocument(id);
    setPendingDeleteDocId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteDocId(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="case-detail-workspace">
      {/* Back Link */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/cases" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary-color)", fontWeight: "500" }}>
          &larr; Zurück zur Übersicht
        </Link>
      </div>

      {!isSupabaseConfigured && (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffe69c", 
          color: "#664d03", 
          padding: "15px", 
          borderRadius: "6px", 
          marginBottom: "20px",
          lineHeight: "1.5"
        }}>
          <strong>Supabase-Verbindung nicht konfiguriert:</strong> Bitte erstellen Sie eine lokale <code>.env.local</code> Datei basierend auf <code>.env.local.example</code> im Projekt-Stammverzeichnis und tragen Sie Ihre echten Supabase-Zugangsdaten (URL und Anon-Key) ein. Die localStorage-Datenhaltung ist ab dieser Iteration deaktiviert.
        </div>
      )}

      {isSupabaseConfigured && (casesError || docsError) && (
        <div style={{ 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c2c7", 
          color: "#842029", 
          padding: "15px", 
          borderRadius: "6px", 
          marginBottom: "20px"
        }}>
          <strong>Datenbankfehler:</strong> {casesError || docsError}
        </div>
      )}

      {/* Case Header & Metadata */}
      <div className="card" style={{ marginBottom: "30px", borderLeft: "4px solid var(--primary-color)" }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: "2rem" }}>{currentCase.title}</h1>
        {currentCase.description && (
          <p style={{ fontSize: "1.1rem", color: "var(--text-color)", margin: "0 0 20px 0", lineHeight: "1.6" }}>
            {currentCase.description}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "0.85rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
          <div>
            <strong>Erstellt am:</strong> {new Date(currentCase.createdAt).toLocaleString("de-CH")}
          </div>
          <div>
            <strong>Referenz-ID:</strong> <code style={{ backgroundColor: "var(--bg-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}>{currentCase.id}</code>
          </div>
        </div>
      </div>

      {/* Preparatory Sections Workspace Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* Section 1: Documents - Active in I-04 */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Dokumente</h2>
            {!isAddingDoc && isSupabaseConfigured && (
              <button 
                type="button" 
                className="btn-primary" 
                style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                onClick={() => setIsAddingDoc(true)}
              >
                Dokument zuordnen
              </button>
            )}
          </div>

          {/* Add Document Form */}
          {isAddingDoc && (
            <div className="card" style={{ backgroundColor: "var(--bg-color)", marginBottom: "20px", border: "1px dashed var(--border-color)" }}>
              <h3 style={{ marginTop: 0 }}>Lokales Dokument zuordnen</h3>
              
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", backgroundColor: "#eef7ff", padding: "10px", borderRadius: "4px", borderLeft: "4px solid #0a58ca", marginBottom: "15px", lineHeight: "1.4" }}>
                <strong>Hinweis:</strong> Es wird nur eine Datei lokal ausgewählt und deren Metadaten (Name, Typ, Größe) werden im Browser-Speicher zugeordnet. Der eigentliche Datei-Upload auf den Server sowie die Textextraktion erfolgen in einer späteren Iteration.
              </div>

              <form onSubmit={handleAddDocument}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fileInput">Datei auswählen *</label>
                  <input
                    id="fileInput"
                    type="file"
                    ref={fileInputRef}
                    className="form-control"
                    onChange={handleFileChange}
                    required
                    style={{ backgroundColor: "#fff" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="docTitle">Dokumenttitel (optional)</label>
                  <input
                    id="docTitle"
                    type="text"
                    className="form-control"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder={selectedFile ? selectedFile.name : "z.B. Ausschreibung IT-Services"}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="docDescription">Beschreibung (optional)</label>
                  <textarea
                    id="docDescription"
                    className="form-control"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="z.B. Lastenheft oder Leistungsvereinbarung"
                    rows={2}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>Dokument zuordnen</button>
                  <button type="button" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => {
                    setIsAddingDoc(false);
                    setDocTitle("");
                    setDocDescription("");
                    setSelectedFile(null);
                  }}>Abbrechen</button>
                </div>
              </form>
            </div>
          )}

          {/* Documents List */}
          {caseDocs.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
              Noch keine Dokumente zugeordnet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px 5px" }}>Dokumenttitel</th>
                    <th style={{ padding: "10px 5px" }}>Dateiname</th>
                    <th style={{ padding: "10px 5px" }}>Grösse</th>
                    <th style={{ padding: "10px 5px" }}>Typ</th>
                    <th style={{ padding: "10px 5px" }}>Zugeordnet am</th>
                    <th style={{ padding: "10px 5px", textAlign: "right" }}>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {caseDocs.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 5px" }}>
                        <div style={{ fontWeight: "600" }}>{doc.title}</div>
                        {doc.description && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{doc.description}</div>}
                      </td>
                      <td style={{ padding: "12px 5px", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.8rem" }}>{doc.fileName}</td>
                      <td style={{ padding: "12px 5px" }}>{formatFileSize(doc.fileSize)}</td>
                      <td style={{ padding: "12px 5px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{doc.fileType}</td>
                      <td style={{ padding: "12px 5px" }}>{new Date(doc.createdAt).toLocaleString("de-CH")}</td>
                      <td style={{ padding: "12px 5px", textAlign: "right" }}>
                        {pendingDeleteDocId === doc.id ? (
                          <div 
                            className="delete-confirm-box"
                            style={{ 
                              display: "inline-flex", 
                              flexDirection: "column", 
                              gap: "4px", 
                              padding: "8px", 
                              backgroundColor: "rgba(220, 53, 69, 0.05)", 
                              border: "1px solid #dc3545", 
                              borderRadius: "4px",
                              textAlign: "left",
                              maxWidth: "180px"
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#dc3545", whiteSpace: "normal" }}>
                              Diesen Dokumenteintrag wirklich löschen?
                            </span>
                            <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
                              <button 
                                type="button" 
                                className="btn-danger" 
                                style={{ padding: "2px 6px", fontSize: "0.75rem", cursor: "pointer" }}
                                onClick={(e) => handleConfirmDelete(e, doc.id)}
                              >
                                Ja, löschen
                              </button>
                              <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ padding: "2px 6px", fontSize: "0.75rem", cursor: "pointer" }}
                                onClick={(e) => handleCancelDelete(e)}
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            className="btn-danger" 
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={(e) => handleDeleteClick(e, doc.id)}
                            title="Dokumenteintrag löschen"
                          >
                            Löschen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Prompts / Execution - Placeholder */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Analyse / Prompts
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-07</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine Analyse ausgeführt.
          </div>
        </div>

        {/* Section 3: Active Results - Placeholder */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Ergebnisse
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-08</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine Ergebnisse vorhanden.
          </div>
        </div>

        {/* Section 4: Saved Results - Placeholder */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gridColumn: "span 2" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Gespeicherte Ergebnisse
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-09</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine gespeicherten Ergebnisse vorhanden.
          </div>
        </div>
      </div>
    </div>
  );
}
