"use client";

import { useState, useRef } from "react";
import { useCases } from "../../hooks/useCases";

export default function CasesPage() {
  const { cases, activeCaseId, isLoaded, addCase, selectCase, deleteCase } = useCases();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pendingDeleteCaseId, setPendingDeleteCaseId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Avoid hydration mismatch by waiting for local storage to load
  if (!isLoaded) {
    return (
      <div>
        <h1>Analysefälle</h1>
        <p>Lade...</p>
      </div>
    );
  }

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    addCase(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setIsCreating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteCaseId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteCase(id);
    setPendingDeleteCaseId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteCaseId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Analysefälle</h1>
        {!isCreating && (
          <button type="button" className="btn-primary" onClick={() => setIsCreating(true)}>
            Neuen Analysefall erstellen
          </button>
        )}
      </div>

      <p>Hier verwalten Sie Ihre Analysefälle. Wählen Sie einen Fall aus, um ihn zu bearbeiten.</p>

      {isCreating && (
        <div className="card">
          <h2>Neuen Analysefall anlegen</h2>
          <form onSubmit={handleAddCase}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Titel *</label>
              <input
                id="title"
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="z.B. IT-Infrastruktur 2026"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">Beschreibung (optional)</label>
              <textarea
                id="description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Kurze Beschreibung des Analysefalls..."
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary">Speichern</button>
              <button type="button" className="btn-secondary" onClick={() => setIsCreating(false)}>Abbrechen</button>
            </div>
          </form>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            Noch keine Analysefälle vorhanden.
          </div>
        </div>
      ) : (
        <div className="case-list">
          {cases.map((c) => (
            <div 
              key={c.id} 
              className={`case-card ${c.id === activeCaseId ? 'active' : ''}`}
              style={{ cursor: "default" }}
            >
              <div 
                className="case-info"
                onClick={() => selectCase(c.id)}
                style={{ cursor: "pointer", flex: 1 }}
              >
                <h3>{c.title} {c.id === activeCaseId && <span style={{ fontSize: "0.8rem", color: "var(--primary-color)", marginLeft: "10px" }}>(Aktiv)</span>}</h3>
                {c.description && <p style={{ margin: "5px 0 0 0" }}>{c.description}</p>}
                <div className="case-meta">
                  Erstellt am: {new Date(c.createdAt).toLocaleString("de-CH")}
                </div>
              </div>
              {pendingDeleteCaseId === c.id ? (
                <div 
                  className="delete-confirm-box"
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "8px", 
                    padding: "12px", 
                    backgroundColor: "rgba(220, 53, 69, 0.05)", 
                    border: "1px solid #dc3545", 
                    borderRadius: "6px",
                    alignSelf: "center",
                    minWidth: "240px"
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#dc3545" }}>
                    Diesen Analysefall wirklich löschen?
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      type="button" 
                      className="btn-danger" 
                      style={{ padding: "4px 8px", fontSize: "0.8rem", cursor: "pointer" }}
                      onClick={(e) => handleConfirmDelete(e, c.id)}
                    >
                      Ja, löschen
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: "4px 8px", fontSize: "0.8rem", cursor: "pointer" }}
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
                  onClick={(e) => handleDeleteClick(e, c.id)}
                  title="Fall löschen"
                >
                  Löschen
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
