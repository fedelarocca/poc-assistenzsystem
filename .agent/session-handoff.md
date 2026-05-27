\# session-handoff.md



\## Aktueller Stand



Das Projekt wird neu gestartet. Es existiert noch kein final übernommener Artefaktstand.



Die bisherigen Testläufe haben gezeigt, dass der KI-Agent ohne präzisere Regeln dazu neigt, fiktive Demo-Daten, doppelte Navigation und zu starke Bachelorarbeits-Hinweise im UI zu erzeugen. Diese Erkenntnisse wurden in das .agent-Regelwerk aufgenommen.



\## Letzte erledigte Schritte



\- Bachelorarbeitsmethodik erstellt.

\- MVP-Anforderungen F1–F9 definiert.

\- Nutzungsszenarien S1–S4 definiert.

\- Lokale Ordnerstruktur mit `02\_Artefakt` und `03\_Evidence` erstellt.

\- Reduziertes `.agent`-Framework definiert.

\- Evidence-Regeln ergänzt.

\- GitHub als Source of Truth festgelegt.

\- UI-Grundsätze präzisiert:

&#x20; - keine Fake-Daten

&#x20; - keine doppelten Home-Kacheln

&#x20; - Home als Workflow-Einstieg

&#x20; - seriöses, aber nicht überdesigntes PoC-UI



\## Nächste geplante Iteration



I-01: Technische Grundstruktur des Next.js-PoC erstellen.



\## Ziel von I-01



\- Next.js-Projekt mit App Router und TypeScript initialisieren.

\- Einfache Startseite erstellen.

\- Einfache Navigation erstellen.

\- Platzhalterbereiche für Case, Document, Prompt, Result und SavedResult anlegen.

\- Home-Seite als workflow-orientierten Einstieg gestalten.

\- Keine fiktiven Daten erzeugen.

\- Keine produktionsnahen Integrationen einbauen.

\- Git lokal initialisieren.

\- GitHub-Repository nach Freigabe verbinden.

\- Iterationsstand committen und nach GitHub pushen.

\- Evidence-Dateien für I-01 erstellen.



\## Relevante MVP-Anforderungen



I-01 bereitet F1–F9 vor, insbesondere:



\- F1: Analysefall als zentrales Einstiegselement vorbereiten.

\- F2: Dokumentzuordnung als späteren Schritt sichtbar machen.

\- F4: Prompt-Ausführung als späteren Schritt sichtbar machen.

\- F7: strukturierte Ergebnisdarstellung vorbereiten.

\- F9: gespeicherte Ergebnisse als späteren Bereich vorbereiten.



\## Offene Punkte



\- Supabase noch nicht einrichten.

\- Vercel AI SDK / OpenAI noch nicht anbinden.

\- Vercel Deployment noch nicht einrichten.

\- GitHub Remote erst nach Nutzerfreigabe einrichten.

\- Keine Authentifizierung implementieren.



\## Blocker



Keine bekannten Blocker.

