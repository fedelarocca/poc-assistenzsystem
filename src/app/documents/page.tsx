export default function DocumentsPage() {
  return (
    <div>
      <h1>Dokumente</h1>
      <p>Laden Sie hier Ausschreibungsunterlagen hoch und ordnen Sie diese einem Analysefall zu.</p>

      <div className="card">
        <div className="empty-state">
          Noch keine Dokumente hochgeladen.
        </div>
      </div>
    </div>
  );
}
