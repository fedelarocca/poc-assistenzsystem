export default function SavedResultsPage() {
  return (
    <div>
      <h1>Gespeicherte Ergebnisse</h1>
      <p>Hier finden Sie alle gespeicherten Auswertungen zu Ihren Analysefällen.</p>

      <div className="card">
        <div className="empty-state">
          Noch keine gespeicherten Ergebnisse vorhanden.
        </div>
      </div>
    </div>
  );
}
