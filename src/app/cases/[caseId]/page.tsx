"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCases } from "../../../hooks/useCases";
import { useDocuments } from "../../../hooks/useDocuments";
import { isSupabaseConfigured } from "../../../lib/supabase";

import { useAnalysis } from "../../../hooks/useAnalysis";
import { useSavedResults } from "../../../hooks/useSavedResults";

export default function CaseDetailPage() {
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

  // Avoid hydration mismatch by waiting for local storage to load
  if (!isCasesLoaded || !isDocsLoaded || !isAnalysisLoaded || !isSavedResultsLoaded) {
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
            <strong>Referenz-ID:</strong> <code className="technical-path" style={{ backgroundColor: "var(--bg-color)", padding: "2px 6px", borderRadius: "4px" }}>{currentCase.id}</code>
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
                    <th style={{ padding: "10px 5px" }}>Textbasis</th>
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
                      <td className="technical-path" style={{ padding: "12px 5px" }}>{doc.fileName}</td>
                      <td style={{ padding: "12px 5px" }}>{formatFileSize(doc.fileSize)}</td>
                      <td style={{ padding: "12px 5px", color: "var(--text-muted)", fontSize: "0.8rem" }}>{doc.fileType}</td>
                      <td style={{ padding: "12px 5px" }}>{new Date(doc.createdAt).toLocaleString("de-CH")}</td>
                      <td style={{ padding: "12px 5px" }}>
                        {doc.extractedText ? (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            backgroundColor: "#d1e7dd", 
                            color: "#0f5132", 
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontWeight: "600",
                            whiteSpace: "nowrap"
                          }}>
                            Textbasis vorhanden
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            backgroundColor: "#f8f9fa", 
                            color: "#6c757d", 
                            border: "1px solid #dee2e6",
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontWeight: "600",
                            whiteSpace: "nowrap"
                          }}>
                            Keine Textbasis
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 5px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          {doc.extractedText ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}
                              onClick={() => setPreviewDoc(doc)}
                            >
                              Vorschau anzeigen
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}
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
                              disabled={isExtractingMap[doc.id]}
                              title="Dokumenteintrag löschen"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Prompts / Execution */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 15px 0" }}>
            Analyse / Prompts
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Ausschreibungsanalyse</span>
          </h2>
          
          {docsWithText.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", minHeight: "150px" }}>
              <div>
                <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "var(--text-muted)" }}>Keine Textgrundlage vorhanden.</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  Für diesen Analysefall ist noch keine Textgrundlage vorhanden. Extrahieren Sie zuerst den Text eines zugeordneten Dokuments.
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

              <button
                type="submit"
                className="btn-primary"
                disabled={isAnalyzing || !selectedDocId}
                style={{ width: "100%", padding: "10px", fontWeight: "600" }}
              >
                {isAnalyzing ? "Analyse wird ausgeführt..." : "Analyse ausführen"}
              </button>
            </form>
          )}

          {/* Active Generation Result Preview */}
          {activeAnalysisResult && (
            <div className="card" style={{ marginTop: "20px", backgroundColor: "#f8f9fa", border: "1px solid var(--border-color)", borderLeft: "4px solid #0f5132" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#0f5132", fontSize: "0.95rem", fontWeight: "600" }}>Aktuelles Analyseergebnis</h4>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                Textgrundlage wurde für die Analyse auf 20'000 Zeichen begrenzt.
              </div>
              <div style={{ fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: "300px", padding: "10px", backgroundColor: "#fff", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                {activeAnalysisResult}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Ergebnisse (Analyse-Historie) */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 15px 0" }}>
            Ergebnisse
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Historie ({analysisResults.length})</span>
          </h2>
          
          {analysisResults.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
              Noch keine Analyseergebnisse vorhanden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {analysisResults.map((res) => {
                const doc = caseDocs.find((d) => d.id === res.documentId);
                const isExpanded = expandedResultId === res.id;
                const isAlreadySaved = savedResults.some(r => r.analysisResultId === res.id);
                
                return (
                  <div key={res.id} style={{ border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
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
                        padding: "10px 15px", 
                        backgroundColor: "var(--bg-color)", 
                        cursor: "pointer", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        borderBottom: isExpanded ? "1px solid var(--border-color)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          {doc ? doc.title : "Unbekanntes Dokument"}
                        </span>
                        <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <span style={{ backgroundColor: "#e2e3e5", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", color: "#41464b" }}>
                            {res.provider}: {res.model}
                          </span>
                          <span>{new Date(res.createdAt).toLocaleString("de-CH")}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--primary-color)", fontWeight: "500" }}>
                        {isExpanded ? "Ausblenden" : "Anzeigen"}
                      </span>
                    </div>

                    {/* Result Content */}
                    {isExpanded && (
                      <div style={{ padding: "15px", backgroundColor: "#fff", textAlign: "left" }}>
                        {/* Save Action Form or Status (Form is directly visible when not saved) */}
                        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "12px" }}>
                          {isAlreadySaved ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", color: "#198754", backgroundColor: "#e8f5e9", padding: "10px 15px", borderRadius: "6px", border: "1px solid #c3e6cb", textAlign: "left" }}>
                              <span style={{ fontWeight: "bold" }}>✓ Ergebnis gespeichert</span>
                              <span style={{ fontSize: "0.8rem", color: "#146c43" }}>Dieses Analyseergebnis wurde als Momentaufnahme gespeichert.</span>
                            </div>
                          ) : (
                            <div style={{ backgroundColor: "var(--bg-color)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "600" }}>Dieses Analyseergebnis speichern</h4>
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
                          backgroundColor: "#f8f9fa", 
                          padding: "8px 12px", 
                          borderRadius: "4px", 
                          borderLeft: "3px solid #dee2e6",
                          marginBottom: "12px",
                          fontStyle: "italic" 
                        }}>
                          <strong>Verwendeter Prompt:</strong> {res.prompt}
                        </div>

                        {/* KI Result Text */}
                        <div style={{ 
                          fontSize: "0.9rem", 
                          lineHeight: "1.6", 
                          whiteSpace: "pre-wrap", 
                          color: "var(--text-color)",
                          marginBottom: "15px"
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

        {/* Section 4: Saved Results */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gridColumn: "span 2", borderTop: "4px solid var(--primary-color)" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 15px 0" }}>
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
              marginBottom: "15px",
              lineHeight: "1.4"
            }}>
              ℹ️ <strong>Momentaufnahmen:</strong> Diese Einträge sind dauerhaft gespeicherte Zwischenstände. Sie bleiben unverändert als Abbild erhalten, selbst wenn das ursprüngliche Dokument oder die ursprüngliche Analyse gelöscht wird.
            </div>
          )}
          
          {savedResults.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }}>
              Noch keine gespeicherten Ergebnisse vorhanden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {savedResults.map((savedRes) => {
                const doc = caseDocs.find((d) => d.id === savedRes.documentId);
                const isExpanded = expandedSavedResultId === savedRes.id;
                
                return (
                  <div key={savedRes.id} style={{ border: "1px solid var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Collapsible Header */}
                    <div 
                      onClick={() => setExpandedSavedResultId(isExpanded ? null : savedRes.id)}
                      style={{ 
                        padding: "12px 15px", 
                        backgroundColor: "var(--bg-color)", 
                        cursor: "pointer", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        borderBottom: isExpanded ? "1px solid var(--border-color)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
                        <span style={{ fontWeight: "600", fontSize: "1rem", color: "var(--text-color)" }}>
                          {savedRes.title}
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)", alignItems: "center" }}>
                          <span style={{ backgroundColor: "#e2e3e5", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", color: "#41464b" }}>
                            Snapshot
                          </span>
                          {savedRes.provider && savedRes.model && (
                            <span style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", padding: "1px 5px", borderRadius: "4px" }}>
                              {savedRes.provider}: {savedRes.model}
                            </span>
                          )}
                          <span>Gespeichert am: {new Date(savedRes.createdAt).toLocaleString("de-CH")}</span>
                          <span>•</span>
                          <span>
                            Dokument: {doc ? (
                              <strong style={{ color: "var(--text-color)", wordBreak: "break-all" }}>{doc.title} ({doc.fileName})</strong>
                            ) : (
                              <span style={{ fontStyle: "italic", color: "#dc3545" }}>Gelöscht (Momentaufnahme bleibt erhalten)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--primary-color)", fontWeight: "500" }}>
                        {isExpanded ? "Ausblenden" : "Anzeigen"}
                      </span>
                    </div>

                    {/* Result Content */}
                    {isExpanded && (
                      <div style={{ padding: "15px", backgroundColor: "#fff", textAlign: "left" }}>
                        {savedRes.note && (
                          <div style={{ 
                            fontSize: "0.85rem", 
                            color: "#5c636a", 
                            backgroundColor: "#f8f9fa", 
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
                            backgroundColor: "#f8f9fa", 
                            padding: "8px 12px", 
                            borderRadius: "4px", 
                            borderLeft: "3px solid #dee2e6",
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
                          border: "1px solid #eee",
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
                                backgroundColor: "rgba(220, 53, 69, 0.05)", 
                                border: "1px solid #dc3545", 
                                borderRadius: "6px",
                                textAlign: "left"
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#dc3545" }}>
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
