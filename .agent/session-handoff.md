# session-handoff.md — Session-Übergabe

## Aktueller Stand

Iteration I-06 wurde erfolgreich und vollumfänglich abgeschlossen. Die physische Dokumentenablage wurde durch die Anbindung von Supabase Storage in das System integriert. Das Hochladen von Dokumenten erfolgt nun direkt in einen privaten Storage Bucket in der Cloud.

### Wichtigste Meilensteine:
1. **Supabase Storage Integration:** Der Hook `useDocuments` wurde so erweitert, dass ausgewählte Dateien direkt und asynchron in den privaten Storage Bucket `tender-documents` hochgeladen werden.
2. **Synchrones Löschen & Rollback:** Ein dokumentenbezogenes Löschen entfernt zuerst das physische Storage-Objekt und anschliessend den DB-Metadateneintrag. Falls die DB-Transaktion beim Hinzufügen fehlschlägt, wird die hochgeladene Datei automatisch wieder aus dem Storage entfernt (`rollback`).
3. **Format- und Grössenbegrenzung:** Es werden ausschliesslich `.pdf`, `.txt` und `.docx` Dateien bis zu einer maximalen Dateigrösse von 10 MB akzeptiert. Ungültige Dateien werden vor dem Upload mit einer sachlichen Fehlermeldung blockiert.
4. **UI- loader-Erweiterung:** Der Upload-Prozess deaktiviert Schaltflächen, ändert den Button-Text zu „Wird hochgeladen...“ und verhindert so Mehrfacheingaben.
5. **Bekannte PoC-Grenze:** Beim Löschen eines gesamten Cases werden die verknüpften Dokumente in der Datenbank kaskadierend gelöscht, die physischen Storage-Dateien verbleiben jedoch als Datenleichen im Bucket. Dies wurde bewusst als bekannte technische Grenze des PoCs dokumentiert.
6. **Validierung:** Der Next.js-Produktions-Build (`npm run build`) kompiliert ohne TypeScript- oder Laufzeitfehler.

---

## Letzte erledigte Schritte (I-05 & I-06)

- **Iteration I-05:**
  - Einrichtung des typisierten Supabase Database Clients in `src/lib/supabase.ts`.
  - Migration der Hooks `useCases.ts` und `useDocuments.ts` auf asynchrone Supabase-Abfragen mit Snake-Case-zu-Camel-Case-Mapping.
  - Dokumentation der Evidenzen (`I-05_supabase-datenhaltung.md`, Prompts, Build- und Git-Logs).
- **Iteration I-06:**
  - Konzeption und Implementierung des echten Datei-Uploads in den privaten Storage Bucket `tender-documents`.
  - Client-seitige Format- und Dateigrösseprüfung vor dem Upload.
  - Synchronisierte Löschlogik (zuerst Storage, dann DB) im `useDocuments.ts` Hook.
  - Ladeindikatoren und Schaltflächensperre in `/cases/[caseId]/page.tsx`.
  - Dokumentation der Evidenzen (`I-06_supabase-storage-upload.md`, Prompts und Build-Logs).

---

## Nächste geplante Iteration

### I-07: Dokumenten-Textextraktion (Analysebasis)

**Ziel:**
Auslesen und Extrahieren von Textinhalten (PDF-Parsing und Textextraktion) aus hochgeladenen Dokumenten und persistentes Speichern im Feld `extracted_text` in der `documents`-Datenbanktabelle. Dies bildet die inhaltliche Text-Grundlage für zukünftige KI-Analysen.

**MVP-Bezug:**
- **F2:** Vollständiges Zuweisen und Bereitstellen von textbasierten Dokumentinhalten für die KI-Analyse.
- **F4 (Vorbereitung):** Textinhalte stehen für die Ausführung von Prompts bereit.

---

## Blocker

- Derzeit keine technischen oder organisatorischen Blocker vorhanden.
