"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCases } from "../../../hooks/useCases";
import { useDocuments } from "../../../hooks/useDocuments";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { useAnalysis } from "../../../hooks/useAnalysis";
import { useSavedResults } from "../../../hooks/useSavedResults";

const PROMPT_SUGGESTIONS = [
  {
    id: "risk",
    title: "Risikoanalyse",
    description: "Identifiziert Risiken, Unklarheiten und Prüfpunkte.",
    prompt: "Analysiere die Textgrundlage aus Sicht des strategischen Einkaufs. Identifiziere potenzielle Risiken, Unklarheiten und prüfungsrelevante Punkte. Strukturiere die Antwort nach Beobachtung, Relevanz und empfohlener Prüfung."
  },
  {
    id: "requirements",
    title: "Anforderungen extrahieren",
    description: "Extrahiert Muss-/Optionale Anforderungen und offene Punkte.",
    prompt: "Extrahiere die wichtigsten fachlichen, technischen und organisatorischen Anforderungen aus der Textgrundlage. Gliedere die Antwort in Muss-Anforderungen, optionale Anforderungen und offene Punkte."
  },
  {
    id: "deadlines",
    title: "Fristen und Termine prüfen",
    description: "Sucht nach Fristen und zeitkritischen Vorgaben.",
    prompt: "Identifiziere alle relevanten Fristen, Termine, Abgabepunkte und zeitkritischen Anforderungen in der Textgrundlage. Weise darauf hin, wenn keine eindeutigen Fristen erkennbar sind."
  },
  {
    id: "questions",
    title: "Unklarheiten und Rückfragen",
    description: "Formuliert konkrete Rückfragen an den Auftraggeber.",
    prompt: "Analysiere die Textgrundlage auf unklare, widersprüchliche oder interpretationsbedürftige Stellen. Formuliere daraus konkrete Rückfragen an den Auftraggeber."
  },
  {
    id: "summary",
    title: "Management-Zusammenfassung",
    description: "Erstellt eine prägnante Zusammenfassung für Entscheider.",
    prompt: "Erstelle eine kurze Management-Zusammenfassung der Textgrundlage für den strategischen Einkauf. Hebe Ziel, zentrale Anforderungen, mögliche Risiken und empfohlene nächste Schritte hervor."
  }
];

export default function CaseDetailPage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const params = useParams();
  const caseId = params?.caseId as string;
  const { cases, isLoaded: isCasesLoaded, error: casesError } = useCases();
  const { 
    isLoaded: isDocsLoaded, 
    error: docsError,
    addDocument, 
    deleteDocument, 
    getDocumentsByCaseId,
    extractDocumentText
  } = useDocuments();

  const {
    analysisResults,
    isLoaded: isAnalysisLoaded,
    error: analysisError,
    runAnalysis
  } = useAnalysis(caseId);

  const {
    savedResults,
    isLoaded: isSavedResultsLoaded,
    error: savedResultsError,
    saveAnalysisResult,
    deleteSavedResult
  } = useSavedResults(caseId);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingMap, setIsExtractingMap] = useState<{ [docId: string]: boolean }>({});
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Analysis State
  const [selectedDocId, setSelectedDocId] = useState("");
  const [provider, setProvider] = useState("google");
  const [model, setModel] = useState("gemini-3.1-flash-lite");
  const [promptText, setPromptText] = useState(
    "Analysiere die folgende Textgrundlage eines Ausschreibungsdokuments aus Sicht des strategischen Einkaufs. Identifiziere die wichtigsten potenziellen Risiken, Unklarheiten und prüfungsrelevanten Punkte. Strukturiere die Antwort in kurze Abschnitte mit Überschriften und Stichpunkten. Trenne klar zwischen Beobachtung, möglicher Relevanz und empfohlener Prüfung."
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Saved Results States
  const [saveTitle, setSaveTitle] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteSavedResultId, setPendingDeleteSavedResultId] = useState<string | null>(null);
  const [expandedSavedResultId, setExpandedSavedResultId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"documents" | "analysis" | "results" | "saved">("documents");
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  const [promptFeedback, setPromptFeedback] = useState("");
  const feedbackTimeoutRef = useRef<any>(null);

  const applySuggestion = (prompt: string, title: string) => {
    setPromptText(prompt);
    setPromptFeedback(`✓ Prompt "${title}" übernommen`);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setPromptFeedback("");
    }, 2500);
  };

  useEffect(() => {
    const token = localStorage.getItem("poc_demo_token");
    if (!token) {
      router.push("/");
      setHasToken(false);
    } else {
      setHasToken(true);
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Auto switch default tab once when docs are loaded
  useEffect(() => {
    if (isDocsLoaded && !hasAutoSwitched) {
      const docs = getDocumentsByCaseId(caseId);
      const withText = docs.filter((d) => d.extractedText && d.extractedText.trim());
      if (withText.length > 0) {
        setActiveTab("analysis");
      }
      setHasAutoSwitched(true);
    }
  }, [isDocsLoaded, caseId, getDocumentsByCaseId, hasAutoSwitched]);

  // Avoid hydration mismatch by waiting for local storage to load
  if (hasToken === null || hasToken === false || !isCasesLoaded || !isDocsLoaded || !isAnalysisLoaded || !isSavedResultsLoaded) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Analysefall Details</h1>
        <p>Prüfe Demo-Zugangsschlüssel...</p>
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
  const docsWithText = caseDocs.filter((d) => d.extractedText && d.extractedText.trim());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);

    // Use filename as fallback title if not entered
    const title = docTitle.trim() || selectedFile.name;

    const docId = await addDocument({
      caseId,
      title,
      description: docDescription.trim() || undefined,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
    }, selectedFile);

    setIsUploading(false);

    if (docId) {
      // Reset Form completely upon success
      setDocTitle("");
      setDocDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsAddingDoc(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteDocId(id);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await deleteDocument(id);
    if (success) {
      setPendingDeleteDocId(null);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteDocId(null);
  };

  const handleDeleteSavedResultClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteSavedResultId(id);
  };

  const handleConfirmDeleteSavedResult = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await deleteSavedResult(id);
    if (success) {
      setPendingDeleteSavedResultId(null);
    }
  };

  const handleCancelDeleteSavedResult = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteSavedResultId(null);
  };

  const handleExtractText = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExtractingMap((prev) => ({ ...prev, [id]: true }));
    await extractDocumentText(id);
    setIsExtractingMap((prev) => ({ ...prev, [id]: false }));
  };

  const handleExecuteAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !promptText.trim()) return;

    setIsAnalyzing(true);
    setActiveAnalysisResult(null);

    const res = await runAnalysis(
      caseId,
      selectedDocId,
      promptText.trim(),
      provider,
      model
    );

    setIsAnalyzing(false);
    if (res) {
      setActiveAnalysisResult(res.resultText);
      setExpandedResultId(res.id);
      setSaveTitle(`Analyseergebnis vom ${new Date(res.createdAt).toLocaleString("de-CH")}`);
      setSaveNote("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="case-detail-workspace container-constrained">
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

      {isSupabaseConfigured && (casesError || docsError || analysisError || savedResultsError) && (
        <div style={{ 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c2c7", 
          color: "#842029", 
          padding: "15px", 
          borderRadius: "6px", 
          marginBottom: "20px"
        }}>
          <strong>Fehler:</strong> {casesError || docsError || analysisError || savedResultsError}
        </div>
      )}

      {/* Case Header & Metadata */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px", borderLeft: "4px solid var(--primary-color)" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "1.5rem" }}>{currentCase.title}</h1>
        {currentCase.description && (
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: "1.5" }}>
            {currentCase.description}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
          <div>
            <strong>Erstellt am:</strong> {new Date(currentCase.createdAt).toLocaleString("de-CH")}
          </div>
          <div>
            <strong>Referenz-ID:</strong> <code className="technical-path" style={{ backgroundColor: "var(--bg-color)", padding: "2px 6px", borderRadius: "4px" }}>{currentCase.id}</code>
          </div>
        </div>
      </div>
      {/* Tab/Workflow Navigation */}
      <div className="workspace-tabs">
        <button 
          type="button"
          className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          Dokumente
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("analysis");
            // Auto pre-select document if none selected and texts are available
            if (!selectedDocId && docsWithText.length > 0) {
              setSelectedDocId(docsWithText[0].id);
            }
          }}
        >
          Analyse ausführen
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Ergebnisse prüfen ({analysisResults.length})
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          Gespeicherte Ergebnisse ({savedResults.length})
        </button>
      </div>

      {/* Active Tab Workspace Panel */}
      <div className="workspace-panel">
        
        {/* Tab 1: Documents */}
        {activeTab === "documents" && (
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  <strong>Hinweis:</strong> Es wird eine Datei ausgewählt, in Supabase Storage gespeichert und deren Metadaten werden persistent mit dem Analysefall verknüpft. Erlaubt sind PDF-, TXT- und DOCX-Dateien bis maximal 10 MB.
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
                      accept=".pdf,.txt,.docx"
                      required
                      disabled={isUploading}
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
                      disabled={isUploading}
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
                      disabled={isUploading}
                      placeholder="z.B. Lastenheft oder Leistungsvereinbarung"
                      rows={2}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? "Wird hochgeladen..." : "Dokument zuordnen"}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: "8px 16px", fontSize: "0.9rem" }} 
                      disabled={isUploading}
                      onClick={() => {
                        setIsAddingDoc(false);
                        setDocTitle("");
                        setDocDescription("");
                        setSelectedFile(null);
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Documents Card List */}
            {caseDocs.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
                Noch keine Dokumente zugeordnet. Ordnen Sie oben rechts ein Dokument zu.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {caseDocs.map((doc) => (
                  <div key={doc.id} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "16px 20px", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "8px", 
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    gap: "15px",
                    flexWrap: "wrap"
                  }}>
                    {/* Doc Metadata Details */}
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "1rem", color: "var(--primary-color)", wordBreak: "break-word" }}>{doc.title}</strong>
                        {doc.extractedText ? (
                          <span className="badge badge-success">✓ Textbasis</span>
                        ) : (
                          <span className="badge badge-secondary">Keine Textbasis</span>
                        )}
                      </div>
                      {doc.description && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {doc.description}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        <span className="technical-path" style={{ display: "inline-block", maxWidth: "250px" }}>
                          📄 {doc.fileName}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span style={{ textTransform: "uppercase" }}>{doc.fileType.split("/")[1] || doc.fileType}</span>
                        <span>•</span>
                        <span>Zugeordnet: {new Date(doc.createdAt).toLocaleDateString("de-CH")}</span>
                      </div>
                    </div>

                    {/* Doc Actions */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {doc.extractedText ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={() => setPreviewDoc(doc)}
                        >
                          Vorschau anzeigen
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={(e) => handleExtractText(e, doc.id)}
                          disabled={isExtractingMap[doc.id]}
                        >
                          {isExtractingMap[doc.id] ? "Wird extrahiert..." : "Text extrahieren"}
                        </button>
                      )}

                      {pendingDeleteDocId === doc.id ? (
                        <div 
                          className="delete-confirm-box"
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            padding: "6px 10px", 
                            backgroundColor: "var(--danger-bg)", 
                            border: "1px solid var(--danger-border)", 
                            borderRadius: "6px",
                            textAlign: "left"
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--danger-color)" }}>
                            Löschen?
                          </span>
                          <button 
                            type="button" 
                            className="btn-danger" 
                            style={{ padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}
                            onClick={(e) => handleConfirmDelete(e, doc.id)}
                          >
                            Ja
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}
                            onClick={(e) => handleCancelDelete(e)}
                          >
                            Nein
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          className="btn-danger" 
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={(e) => handleDeleteClick(e, doc.id)}
                          disabled={isExtractingMap[doc.id]}
                          title="Dokumenteintrag löschen"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Analyse ausführen */}
        {activeTab === "analysis" && (
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 20px 0" }}>
              Analyse ausführen
              <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Ausschreibungsanalyse</span>
            </h2>
            
            {docsWithText.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", minHeight: "150px" }}>
                <div>
                  <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "var(--text-muted)" }}>Keine Textgrundlage vorhanden.</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Für diesen Analysefall ist noch keine Textgrundlage vorhanden. Extrahieren Sie zuerst den Text eines zugeordneten Dokuments im Tab „Dokumente“.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteAnalysis} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="analysisDocSelect" style={{ fontWeight: "600" }}>Dokument auswählen *</label>
                  <select
                    id="analysisDocSelect"
                    className="form-control"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    required
                    disabled={isAnalyzing}
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="">-- Dokument auswählen --</option>
                    {docsWithText.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.fileName})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="providerSelect" style={{ fontWeight: "600" }}>KI-Provider *</label>
                    <select
                      id="providerSelect"
                      className="form-control"
                      value={provider}
                      onChange={(e) => {
                        const newProvider = e.target.value;
                        setProvider(newProvider);
                        // Auto-update model to start model of new provider
                        if (newProvider === "google") {
                          setModel("gemini-3.1-flash-lite");
                        } else {
                          setModel("gpt-4o-mini");
                        }
                      }}
                      required
                      disabled={isAnalyzing}
                      style={{ backgroundColor: "#fff" }}
                    >
                      <option value="google">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modelSelect" style={{ fontWeight: "600" }}>Modell *</label>
                    <select
                      id="modelSelect"
                      className="form-control"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      disabled={isAnalyzing}
                      style={{ backgroundColor: "#fff" }}
                    >
                      {provider === "google" ? (
                        <>
                          <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Standard)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Kompatibel)</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                          <option value="gemini-3.1-flash">gemini-3.1-flash</option>
                          <option value="gemini-3.1-pro">gemini-3.1-pro</option>
                        </>
                      ) : (
                        <>
                          <option value="gpt-4o-mini">gpt-4o-mini (Standard)</option>
                          <option value="gpt-4o">gpt-4o</option>
                          <option value="o3-mini">o3-mini</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="promptTextarea" style={{ fontWeight: "600" }}>Analyseprompt *</label>
                  <textarea
                    id="promptTextarea"
                    className="form-control"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    required
                    disabled={isAnalyzing}
                    rows={6}
                    style={{ resize: "vertical", fontSize: "0.9rem", lineHeight: "1.4", minHeight: "150px" }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span className="form-label" style={{ margin: 0, fontWeight: "600" }}>Prompt-Vorschläge (Schnellauswahl)</span>
                    {promptFeedback && (
                      <span style={{ fontSize: "0.8rem", color: "var(--success-color)", fontWeight: "600", transition: "opacity 0.2s" }}>
                        {promptFeedback}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                    gap: "10px" 
                  }}>
                    {PROMPT_SUGGESTIONS.map((sug) => (
                      <div 
                        key={sug.id}
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between", 
                          padding: "10px 12px", 
                          backgroundColor: "#f8fafc", 
                          border: "1px solid var(--border-color)", 
                          borderRadius: "6px",
                          gap: "8px",
                          textAlign: "left"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--primary-color)" }}>{sug.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.3" }}>{sug.description}</div>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", alignSelf: "stretch", textAlign: "center", display: "block" }}
                          disabled={isAnalyzing}
                          onClick={() => applySuggestion(sug.prompt, sug.title)}
                        >
                          Verwenden
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isAnalyzing || !selectedDocId}
                  style={{ width: "100%", padding: "12px", fontWeight: "600", fontSize: "1rem" }}
                >
                  {isAnalyzing ? "Analyse wird ausgeführt..." : "Analyse ausführen"}
                </button>
              </form>
            )}

            {isAnalyzing && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                marginTop: "15px", 
                padding: "12px 16px", 
                backgroundColor: "var(--info-bg)", 
                border: "1px solid var(--info-border)", 
                borderRadius: "6px",
                color: "var(--info-color)",
                fontSize: "0.9rem"
              }}>
                <div className="spinner"></div>
                <span>Die KI-Analyse wird ausgeführt. Dies kann einige Sekunden dauern...</span>
              </div>
            )}

            {/* Active Generation Result Preview */}
            {activeAnalysisResult && (
              <div className="card" style={{ marginTop: "25px", backgroundColor: "#f8f9fa", border: "1px solid var(--border-color)", borderLeft: "4px solid #0f5132" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#0f5132", fontSize: "0.95rem", fontWeight: "600" }}>Aktuelles Analyseergebnis</h4>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Textgrundlage wurde für die Analyse auf 20'000 Zeichen begrenzt. Sie können dieses Ergebnis dauerhaft im Tab „Ergebnisse prüfen“ abspeichern.
                </div>
                <div style={{ fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: "300px", padding: "10px", backgroundColor: "#fff", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                  {activeAnalysisResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Ergebnisse prüfen */}
        {activeTab === "results" && (
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 20px 0" }}>
              Ergebnisse prüfen
              <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Historie ({analysisResults.length})</span>
            </h2>
            
            {analysisResults.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
                Noch keine Analyseergebnisse vorhanden. Führen Sie zuerst eine Analyse im Tab „Analyse ausführen“ durch.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {analysisResults.map((res) => {
                  const doc = caseDocs.find((d) => d.id === res.documentId);
                  const isExpanded = expandedResultId === res.id;
                  const isAlreadySaved = savedResults.some(r => r.analysisResultId === res.id);
                  
                  return (
                    <div key={res.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff" }}>
                      {/* Collapsible Header */}
                      <div 
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedResultId(null);
                            setSaveTitle("");
                            setSaveNote("");
                          } else {
                            setExpandedResultId(res.id);
                            setSaveTitle(`Analyseergebnis vom ${new Date(res.createdAt).toLocaleString("de-CH")}`);
                            setSaveNote("");
                          }
                        }}
                        style={{ 
                          padding: "14px 18px", 
                          backgroundColor: "#f8fafc", 
                          cursor: "pointer", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          borderBottom: isExpanded ? "1px solid var(--border-color)" : "none"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
                          <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "var(--primary-color)" }}>
                            {doc ? doc.title : "Unbekanntes Dokument"}
                          </span>
                          <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)", alignItems: "center" }}>
                            <span style={{ backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", color: "#334155" }}>
                              {res.provider}: {res.model}
                            </span>
                            <span>•</span>
                            <span>{new Date(res.createdAt).toLocaleString("de-CH")}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "600" }}>
                          {isExpanded ? "Ausblenden" : "Anzeigen"}
                        </span>
                      </div>

                      {/* Result Content */}
                      {isExpanded && (
                        <div style={{ padding: "18px", backgroundColor: "#fff", textAlign: "left" }}>
                          
                          {/* Snapshot Action Form */}
                          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "15px", marginBottom: "15px" }}>
                            {isAlreadySaved ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", color: "#15803d", backgroundColor: "#f0fdf4", padding: "10px 15px", borderRadius: "6px", border: "1px solid #bbf7d0", textAlign: "left" }}>
                                <span style={{ fontWeight: "bold" }}>✓ Ergebnis gespeichert</span>
                                <span style={{ fontSize: "0.8rem", color: "#166534" }}>Dieses Analyseergebnis wurde dauerhaft als Momentaufnahme gespeichert.</span>
                              </div>
                            ) : (
                              <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "600" }}>Dieses Analyseergebnis als Momentaufnahme speichern</h4>
                                <div className="form-group" style={{ marginBottom: "10px" }}>
                                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600" }}>Titel (optional)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={saveTitle}
                                    onChange={(e) => setSaveTitle(e.target.value)}
                                    placeholder={`z.B. Analyseergebnis vom ${new Date(res.createdAt).toLocaleString("de-CH")}`}
                                    style={{ fontSize: "0.85rem", padding: "6px 10px" }}
                                    disabled={isSaving}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: "12px" }}>
                                  <label className="form-label" style={{ fontSize: "0.8rem", fontWeight: "600" }}>Notiz (optional)</label>
                                  <textarea
                                    className="form-control"
                                    value={saveNote}
                                    onChange={(e) => setSaveNote(e.target.value)}
                                    placeholder="z.B. Relevante Unklarheiten zur vertraglichen Haftung"
                                    rows={2}
                                    style={{ fontSize: "0.85rem", padding: "6px 10px", resize: "vertical" }}
                                    disabled={isSaving}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                                    disabled={isSaving}
                                    onClick={async () => {
                                      setIsSaving(true);
                                      const defaultTitle = `Analyseergebnis vom ${new Date(res.createdAt).toLocaleString("de-CH")}`;
                                      const success = await saveAnalysisResult({
                                        caseId,
                                        documentId: res.documentId,
                                        analysisResultId: res.id,
                                        title: saveTitle.trim() || defaultTitle,
                                        note: saveNote.trim() || undefined,
                                        resultText: res.resultText,
                                        prompt: res.prompt,
                                        provider: res.provider,
                                        model: res.model
                                      });
                                      setIsSaving(false);
                                      if (success) {
                                        setSaveTitle("");
                                        setSaveNote("");
                                      }
                                    }}
                                  >
                                    {isSaving ? "Wird gespeichert..." : "Speichern"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                                    disabled={isSaving}
                                    onClick={() => {
                                      setSaveTitle(`Analyseergebnis vom ${new Date(res.createdAt).toLocaleString("de-CH")}`);
                                      setSaveNote("");
                                    }}
                                  >
                                    Zurücksetzen
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Prompt preview */}
                          <div style={{ 
                            fontSize: "0.8rem", 
                            color: "var(--text-muted)", 
                            backgroundColor: "#f8fafc", 
                            padding: "10px 12px", 
                            borderRadius: "6px", 
                            borderLeft: "3px solid #cbd5e1",
                            marginBottom: "15px",
                            fontStyle: "italic" 
                          }}>
                            <strong>Verwendeter Prompt:</strong> {res.prompt}
                          </div>

                          {/* KI Result Text */}
                          <div style={{ 
                            fontSize: "0.95rem", 
                            lineHeight: "1.6", 
                            whiteSpace: "pre-wrap", 
                            color: "var(--text-color)",
                            backgroundColor: "#ffffff",
                            padding: "5px 0"
                          }}>
                            {res.resultText}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Gespeicherte Ergebnisse */}
        {activeTab === "saved" && (
          <div className="card" style={{ display: "flex", flexDirection: "column", borderTop: "4px solid var(--primary-color)" }}>
            <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 20px 0" }}>
              Gespeicherte Ergebnisse
              <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Momentaufnahmen ({savedResults.length})</span>
            </h2>

            {savedResults.length > 0 && (
              <div style={{ 
                fontSize: "0.85rem", 
                color: "#475569", 
                backgroundColor: "#f8fafc", 
                padding: "12px 15px", 
                borderRadius: "6px", 
                border: "1px solid #cbd5e1", 
                marginBottom: "20px",
                lineHeight: "1.4"
              }}>
                ℹ️ <strong>Momentaufnahmen:</strong> Diese Einträge sind dauerhaft gespeicherte Zwischenstände. Sie bleiben unverändert als Abbild erhalten, selbst wenn das ursprüngliche Dokument oder die ursprüngliche Analyse gelöscht wird.
              </div>
            )}
            
            {savedResults.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
                Noch keine gespeicherten Ergebnisse vorhanden. Sie können ein Analyseergebnis im Tab „Ergebnisse prüfen“ abspeichern.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {savedResults.map((savedRes) => {
                  const doc = caseDocs.find((d) => d.id === savedRes.documentId);
                  const isExpanded = expandedSavedResultId === savedRes.id;
                  
                  return (
                    <div key={savedRes.id} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff" }}>
                      {/* Collapsible Header */}
                      <div 
                        onClick={() => setExpandedSavedResultId(isExpanded ? null : savedRes.id)}
                        style={{ 
                          padding: "14px 18px", 
                          backgroundColor: "#f8fafc", 
                          cursor: "pointer", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          borderBottom: isExpanded ? "1px solid var(--border-color)" : "none"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
                          <span style={{ fontWeight: "600", fontSize: "1rem", color: "var(--primary-color)" }}>
                            {savedRes.title}
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)", alignItems: "center" }}>
                            <span style={{ backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", color: "#334155" }}>
                              Snapshot
                            </span>
                            {savedRes.provider && savedRes.model && (
                              <span style={{ backgroundColor: "#ffffff", border: "1px solid #dee2e6", padding: "1px 5px", borderRadius: "4px" }}>
                                {savedRes.provider}: {savedRes.model}
                              </span>
                            )}
                            <span>Gespeichert am: {new Date(savedRes.createdAt).toLocaleString("de-CH")}</span>
                            <span>•</span>
                            <span>
                              Dokument: {doc ? (
                                <strong style={{ color: "var(--text-color)", wordBreak: "break-all" }}>{doc.title} ({doc.fileName})</strong>
                              ) : (
                                <span style={{ fontStyle: "italic", color: "var(--danger-color)" }}>Gelöscht (Momentaufnahme bleibt erhalten)</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", fontWeight: "600" }}>
                          {isExpanded ? "Ausblenden" : "Anzeigen"}
                        </span>
                      </div>

                      {/* Result Content */}
                      {isExpanded && (
                        <div style={{ padding: "18px", backgroundColor: "#fff", textAlign: "left" }}>
                          {savedRes.note && (
                            <div style={{ 
                              fontSize: "0.85rem", 
                              color: "#475569", 
                              backgroundColor: "#f8fafc", 
                              padding: "10px 15px", 
                              borderRadius: "6px", 
                              borderLeft: "4px solid var(--primary-color)",
                              marginBottom: "15px" 
                            }}>
                              <strong>Notiz:</strong> {savedRes.note}
                            </div>
                          )}

                          {savedRes.prompt && (
                            <div style={{ 
                              fontSize: "0.8rem", 
                              color: "var(--text-muted)", 
                              backgroundColor: "#f8fafc", 
                              padding: "8px 12px", 
                              borderRadius: "6px", 
                              borderLeft: "3px solid #cbd5e1",
                              marginBottom: "15px",
                              fontStyle: "italic" 
                            }}>
                              <strong>Verwendeter Prompt:</strong> {savedRes.prompt}
                            </div>
                          )}

                          {/* Snapshot Result Text */}
                          <div style={{ 
                            fontSize: "0.95rem", 
                            lineHeight: "1.6", 
                            whiteSpace: "pre-wrap", 
                            color: "var(--text-color)",
                            backgroundColor: "#fafafa",
                            padding: "15px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            marginBottom: "15px",
                            maxHeight: "350px",
                            overflowY: "auto"
                          }}>
                            {savedRes.resultText}
                          </div>

                          {/* Inline Delete Action */}
                          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                            {pendingDeleteSavedResultId === savedRes.id ? (
                              <div 
                                className="delete-confirm-box"
                                style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center",
                                  gap: "10px", 
                                  padding: "8px 12px", 
                                  backgroundColor: "var(--danger-bg)", 
                                  border: "1px solid var(--danger-border)", 
                                  borderRadius: "6px",
                                  textAlign: "left"
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--danger-color)" }}>
                                  Dieses gespeicherte Ergebnis unwiderruflich löschen?
                                </span>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button 
                                    type="button" 
                                    className="btn-danger" 
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer" }}
                                    onClick={(e) => handleConfirmDeleteSavedResult(e, savedRes.id)}
                                  >
                                    Ja, löschen
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer" }}
                                    onClick={(e) => handleCancelDeleteSavedResult(e)}
                                  >
                                    Abbrechen
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                className="btn-danger" 
                                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                onClick={(e) => handleDeleteSavedResultClick(e, savedRes.id)}
                              >
                                Ergebnis löschen
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal Overlay */}
      {previewDoc && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px"
        }} onClick={() => setPreviewDoc(null)}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: "15px 20px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Textvorschau: {previewDoc.title}</h3>
              <button 
                type="button" 
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "1.5rem", 
                  cursor: "pointer", 
                  color: "var(--text-muted)", 
                  padding: "0" 
                }} 
                onClick={() => setPreviewDoc(null)}
              >
                &times;
              </button>
            </div>
            {/* Content */}
            <div style={{
              padding: "20px",
              overflowY: "auto",
              flex: 1,
              lineHeight: "1.6",
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
              backgroundColor: "var(--bg-color)"
            }}>
              {previewDoc.extractedText ? (
                <>
                  {previewDoc.extractedText.substring(0, 800)}
                  {previewDoc.extractedText.length > 800 && (
                    <div style={{
                      marginTop: "15px",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      borderTop: "1px dashed var(--border-color)",
                      paddingTop: "10px"
                    }}>
                      [...] (Vorschau auf 800 Zeichen begrenzt)
                    </div>
                  )}
                </>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Keine Textgrundlage vorhanden.</span>
              )}
            </div>
            {/* Footer */}
            <div style={{
              padding: "15px 20px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setPreviewDoc(null)}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
