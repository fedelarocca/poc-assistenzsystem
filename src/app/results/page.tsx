export default function ResultsPage() {
  return (
    <div>
      <h1>Ergebnisse</h1>
      <p>Hier sehen Sie die KI-generierten Analyseergebnisse.</p>

      <div className="card">
        <div className="empty-state">
          Noch keine Ergebnisse vorhanden.
        </div>
      </div>
    </div>
  );
}
