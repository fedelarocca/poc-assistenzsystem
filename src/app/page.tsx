import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Ausschreibungsanalyse starten</h1>
      <p>Willkommen im Assistenzsystem. Bitte folgen Sie dem Prozess, um eine Analyse durchzuführen.</p>

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
        <Link href="/cases" className="btn-primary">
          Analysefall erstellen
        </Link>
      </div>
    </div>
  );
}
