# Assistenzsystem zur Ausschreibungsanalyse (PoC)

Dieses Repository enthält ein webbasiertes Assistenzsystem als Proof of Concept (PoC) im Rahmen einer Bachelorarbeit in Wirtschaftsinformatik.

**Thema der Arbeit:**  
*„Vibe Coding als Entwicklungsansatz für Proofs of Concept – Eine gestaltungsorientierte Konzeption und Evaluation eines webbasierten Assistenzsystems“*

Das System dient als minimaler Einkaufsassistent zur Voranalyse von Ausschreibungsunterlagen im strategischen Einkauf. Es handelt sich um ein rein wissenschaftliches Artefakt und keine produktionsreife Unternehmenslösung.

---

## 1. Kurzbeschreibung des MVP

Das System unterstützt den strategischen Einkauf durch folgende Kernfunktionen:
*   **Case-Verwaltung (F1):** Erstellen und Verwalten von getrennten Analysefällen (Ausschreibungsprojekten).
*   **Dokumentenzuordnung (F2, F3):** Upload von textbasierten Dokumenten und Speicherung mit Metadaten.
*   **KI-Analyse (F4, F5, F7, F8):** Durchführung von Analysen auf Dokumentenbasis mithilfe flexibler Prompts und statischer Prompt-Vorschläge sowie strukturierter Darstellung der Ergebnisse.
*   **Snapshot-Archivierung (F6, F9):** Dauerhafte Speicherung und Wiederauffindbarkeit ausgewählter Analyseergebnisse als Momentaufnahmen.

---

## 2. Technologie-Stack

*   **Framework:** Next.js (App Router)
*   **Sprache:** TypeScript
*   **Datenhaltung:** Supabase Database (PostgreSQL)
*   **Dokumentenspeicherung:** Supabase Storage (Buckets)
*   **KI-Integration:** Vercel AI SDK (Google Gemini / OpenAI vorbereitet)

---

## 3. Lokales Setup

### Voraussetzungen
Stellen Sie sicher, dass Node.js (v18+) und ein Supabase-Projekt (oder eine lokale Instanz) bereitstehen.

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren
Kopieren Sie die Vorlagendatei `.env.local.example` in eine neue Datei namens `.env.local` und tragen Sie Ihre API Keys und Datenbank-Endpunkte ein:
```bash
cp .env.local.example .env.local
```
*Hinweis: Die Datei `.env.local` wird über `.gitignore` vom Git-Repository ausgeschlossen.*

### 3. Datenbank-Migrationen einspielen
Die Datenbanktabellen werden über die SQL-Skripte im Verzeichnis `supabase/migrations/` angelegt. Führen Sie diese im SQL-Editor Ihres Supabase-Projekts aus.

### 4. Anwendung lokal ausführen
```bash
npm run dev
```
Öffnen Sie danach [http://localhost:3000](http://localhost:3000) im Browser.

### 5. Produktionsbuild validieren
```bash
npm run build
```

---

## 4. Nutzungshinweise (E2E-Workflow)

Folgen Sie diesem Ablauf zur Durchführung einer Ausschreibungsanalyse:
1.  **Case anlegen:** Navigieren Sie zu „Analysefälle“ und erstellen Sie ein neues Projekt.
2.  **Dokument hochladen:** Öffnen Sie den Fall, klicken Sie auf „Dokument zuordnen“ und laden Sie eine textbasierte Datei hoch.
3.  **Text extrahieren:** Klicken Sie in der Dokumentenliste auf „Text extrahieren“, um die Textbasis bereitzustellen.
4.  **KI-Analyse ausführen:** Wechseln Sie zum Tab „Analyse ausführen“, wählen Sie das Dokument, nutzen Sie einen Prompt-Vorschlag (oder editieren Sie einen eigenen Prompt) und starten Sie die Analyse.
5.  **Ergebnis speichern und wiederfinden:** Prüfen Sie das Ergebnis unter „Ergebnisse prüfen“, vergeben Sie einen Snapshot-Titel und speichern Sie diesen. Der Snapshot ist danach dauerhaft im Tab „Gespeicherte Ergebnisse“ abrufbar.

---

## 5. Hinweis zu Evidence & Dokumentation

Der Ordner `03_Evidence/` auf Workspace-Ebene liegt **bewusst ausserhalb des Git-Repositories** und wird nicht in GitHub versioniert.
*   Er dient der thesisbezogenen Dokumentation des Vibe-Coding-Prozesses (Prompts, Fehler, Builds, Testläufe und Commit-Hashes).
*   Er ist nicht Bestandteil des deploybaren App-Artefakts und dient ausschliesslich der wissenschaftlichen Nachvollziehbarkeit und Bewertung.

---

## 6. Einschränkungen (Limitations)

Da es sich um ein Proof of Concept handelt, gelten folgende Einschränkungen:
*   Keine Authentifizierung oder Benutzerrollen (Single-User Betrieb).
*   Keine Mandantentrennung (alle Cases liegen in derselben Datenbank).
*   Kein OCR-Support (nur digital lesbare Textdateien, PDFs oder Word-Dokumente werden unterstützt; eingescannte Dokumente können nicht verarbeitet werden).
*   Keine verbindliche fachliche oder rechtliche Bewertung durch die KI. Die KI-Outputs dienen ausschliesslich der Orientierung und Voranalyse.
*   Keine echten Kundendokumente im Repository.
