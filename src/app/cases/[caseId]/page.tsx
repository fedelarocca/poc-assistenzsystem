"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCases } from "../../../hooks/useCases";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { cases, isLoaded } = useCases();

  // Avoid hydration mismatch by waiting for local storage to load
  if (!isLoaded) {
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

  return (
    <div className="case-detail-workspace">
      {/* Back Link */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/cases" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary-color)", fontWeight: "500" }}>
          &larr; Zurück zur Übersicht
        </Link>
      </div>

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
        {/* Section 1: Documents */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Dokumente
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-04</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine Dokumente zugeordnet.
          </div>
        </div>

        {/* Section 2: Prompts / Execution */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Analyse / Prompts
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-07</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine Analyse ausgeführt.
          </div>
        </div>

        {/* Section 3: Active Results */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Ergebnisse
            <span style={{ fontSize: "0.75rem", backgroundColor: "var(--bg-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Bereit für I-08</span>
          </h2>
          <div className="empty-state" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0" }}>
            Noch keine Ergebnisse vorhanden.
          </div>
        </div>

        {/* Section 4: Saved Results */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
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
