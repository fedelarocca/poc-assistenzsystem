"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [tokenInput, setTokenInput] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const savedToken = localStorage.getItem("poc_demo_token");
    if (savedToken) {
      setIsTokenSaved(true);
    }
  }, []);

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setMessage("Bitte geben Sie einen Token ein.");
      return;
    }
    localStorage.setItem("poc_demo_token", tokenInput.trim());
    setIsTokenSaved(true);
    setTokenInput("");
    setMessage("Demo-Token gespeichert. Sie können nun den Assistenten nutzen.");
  };

  const handleResetToken = () => {
    localStorage.removeItem("poc_demo_token");
    setIsTokenSaved(false);
    setMessage("Demo-Token entfernt. Der Zugriff auf geschützte Seiten ist gesperrt.");
  };

  return (
    <div>
      <h1>Ausschreibungsanalyse starten</h1>
      <p>Willkommen im Assistenzsystem. Bitte folgen Sie dem Prozess, um eine Analyse durchzuführen.</p>

      {/* Demo Access Area Card */}
      <div className="card" style={{ borderLeft: "4px solid #0056b3", margin: "20px 0" }}>
        <h3>Demo-Zugang (Preview-Modus)</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "15px" }}>
          Dies ist ein geschützter Demo-Zugang für ein wissenschaftliches PoC-Artefakt. 
          Die Gültigkeitsprüfung des Tokens erfolgt serverseitig bei API-Aktionen. 
          Es handelt sich nicht um eine produktionsreife Authentifizierung.
        </p>

        {isTokenSaved ? (
          <div>
            <p style={{ color: "green", fontWeight: "bold", marginBottom: "15px" }}>
              ✓ Demo-Token gespeichert (im Browser-Speicher)
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/cases" className="btn-primary">
                Zu den Analysefällen wechseln
              </Link>
              <button 
                onClick={handleResetToken} 
                className="btn-secondary" 
                style={{ backgroundColor: "#dc3545", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Demo-Zugang zurücksetzen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveToken} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label htmlFor="token" style={{ fontWeight: "bold" }}>Demo-Token eingeben:</label>
              <input
                type="password"
                id="token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Demo-Zugangsschlüssel eingeben"
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "fit-content", cursor: "pointer" }}>
              Token speichern
            </button>
          </form>
        )}

        {message && (
          <p style={{ marginTop: "15px", fontSize: "14px", color: "var(--text-muted)" }}>
            {message}
          </p>
        )}
      </div>

      <div className="workflow-steps">
        <div className="workflow-step">
          <div className="step-number">1</div>
          <div>
            <strong>Analysefall erstellen</strong>
            <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)" }}>Legen Sie einen neuen Fall für eine Ausschreibung an.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">2</div>
          <div>
            <strong>Dokument zuordnen</strong>
            <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)" }}>Laden Sie die relevanten Ausschreibungsunterlagen hoch.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">3</div>
          <div>
            <strong>Analyse ausführen</strong>
            <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)" }}>Starten Sie einen Prompt zur inhaltlichen Auswertung.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">4</div>
          <div>
            <strong>Ergebnis prüfen und speichern</strong>
            <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)" }}>Kontrollieren Sie die Resultate und speichern Sie diese ab.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Neuen Analysefall erstellen</h2>
        <p>Starten Sie hier mit einem neuen Workflow.</p>
        {isTokenSaved ? (
          <Link href="/cases" className="btn-primary">
            Analysefall erstellen
          </Link>
        ) : (
          <div>
            <p style={{ color: "#dc3545", fontSize: "14px", marginBottom: "10px" }}>
              * Bitte speichern Sie zuerst einen Demo-Token, um fortzufahren.
            </p>
            <button disabled className="btn-primary" style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Analysefall erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
