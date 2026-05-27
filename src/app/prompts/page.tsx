export default function PromptsPage() {
  return (
    <div>
      <h1>Prompts</h1>
      <p>Verwalten Sie hier die Analyseaufträge (Prompts) für Ihre Dokumente.</p>

      <div className="card">
        <div className="empty-state">
          Noch keine Prompts ausgeführt.
        </div>
      </div>
    </div>
  );
}
