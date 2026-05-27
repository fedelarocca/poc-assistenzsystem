\# rules-core.md — Kernregeln für den PoC



\## Grundprinzipien



| Richtig | Falsch |

|---|---|

| MVP-Anforderung identifizieren, bevor implementiert wird | Features ohne Bezug zu F1–F9 bauen |

| Kleine, überprüfbare Iterationen | Grosses Gesamtsystem auf einmal generieren |

| Einfache, lesbare Struktur | Überabstrahierte Enterprise-Architektur |

| PoC-Grenzen respektieren | Produktionsnahe Komplexität einführen |

| Entscheidungen kurz dokumentieren | Architekturentscheidungen nur im Chat verlieren |

| Fehler und Nacharbeiten sichtbar machen | Fehler verstecken oder überspringen |

| Leere Zustände verwenden | Fake-Daten oder fiktive Demo-Projekte einbauen |

| Home als Workflow-Einstieg gestalten | Home als doppelte Navigation mit Kacheln bauen |



\## Implementierungsregeln



\- Verwende TypeScript.

\- Verwende Next.js App Router.

\- Verwende für frühe Iterationen nur `src/app/globals.css` für Styling.

\- Kein Tailwind CSS, kein shadcn/ui, kein Bootstrap und keine zusätzliche UI-Library, ausser ausdrücklich verlangt.

\- Halte UI, Anwendungslogik und Infrastruktur nachvollziehbar getrennt.

\- Verwende Supabase erst dann, wenn die Datenstruktur ausreichend klar und die entsprechende Iteration freigegeben ist.

\- Verwende Vercel AI SDK / OpenAI erst dann, wenn der Prompt-/Result-Fluss vorbereitet und die entsprechende Iteration freigegeben ist.

\- Vermeide unnötige externe Libraries.

\- Schreibe keine komplexen generischen Frameworks.

\- Baue zuerst funktional demonstrierbare PoC-Schritte.

\- Bei nicht-trivialen Änderungen zuerst Implementierungsplan erstellen und Freigabe abwarten.



\## UI-Regeln



\- Die App soll sachlich, seriös und intuitiv wirken.

\- Die sichtbare App soll nicht wie eine fiktive Bachelorarbeitsdemo wirken.

\- Keine fiktiven Cases, Dokumente, Prompts, Ergebnisse oder gespeicherten Ergebnisse.

\- Verwende leere Zustände wie:

&#x20; - „Noch keine Analysefälle vorhanden.“

&#x20; - „Noch keine Dokumente hochgeladen.“

&#x20; - „Noch keine Prompts ausgeführt.“

&#x20; - „Noch keine Ergebnisse vorhanden.“

&#x20; - „Noch keine gespeicherten Ergebnisse vorhanden.“

\- Die Startseite soll den Nutzungseinstieg unterstützen:

&#x20; - Analysefall erstellen

&#x20; - Dokument zuordnen

&#x20; - Analyse ausführen

&#x20; - Ergebnis prüfen und speichern

\- Die Startseite soll nicht einfach die linke Navigation duplizieren.

\- Keine prominenten Hinweise auf die Bachelorarbeit im sichtbaren UI.

\- Der PoC-Charakter bleibt in Dokumentation, Code und Arbeit sichtbar, aber nicht als Hauptinhalt der App-Oberfläche.



\## Git- und GitHub-Regeln



\- GitHub soll von Anfang an als Source of Truth verwendet werden.

\- Vor dem ersten Remote-Setup muss der Nutzer nach Repository-Name, Sichtbarkeit und GitHub-Account gefragt werden.

\- Nach bestätigtem Remote-Setup sollen abgeschlossene Iterationen committed und gepusht werden.

\- Vor jedem Commit und Push prüfen:

&#x20; - keine `.env`-Dateien

&#x20; - keine API Keys

&#x20; - keine Secrets

&#x20; - keine echten vertraulichen Ausschreibungsunterlagen

&#x20; - keine `node\_modules`

&#x20; - keine `.next`-Artefakte

&#x20; - keine `.vercel`-Artefakte

&#x20; - keine unnötigen Build-Artefakte

\- `.gitignore` muss mindestens enthalten:

&#x20; - `node\_modules/`

&#x20; - `.next/`

&#x20; - `.vercel/`

&#x20; - `.env`

&#x20; - `.env.local`

&#x20; - `.env.\*`

&#x20; - `dist/`

&#x20; - `build/`

&#x20; - `coverage/`

\- Commit-Messages sollen die Iteration nennen, zum Beispiel:

&#x20; - `I-01: initialize PoC baseline`

\- Kein Vercel-Deployment ohne separate Freigabe.



\## Dokumentationsregeln



Nach jeder abgeschlossenen Iteration:



\- Iteration-ID nennen.

\- Bezug zu F1–F9 nennen.

\- geänderte Dateien nennen.

\- wichtige Prompts oder Outputs zusammenfassen.

\- Probleme und Korrekturen nennen.

\- Build-Ergebnis dokumentieren.

\- Git-Commit und Push-Status dokumentieren.

\- Evidence-Dateien im Ordner `03\_Evidence` erstellen oder aktualisieren.

\- Fehlende Evidenzen mit `\[zu ergänzen]` markieren.

\- Keine Screenshots, Commit-Hashes, Testergebnisse oder Dateien erfinden.



\## Pflichtoutputs nach jeder Iteration



Nach jeder abgeschlossenen Iteration sind folgende Dateien zu erstellen oder zu aktualisieren, sofern `03\_Evidence` im Workspace verfügbar ist:



| Datei | Zweck |

|---|---|

| `03\_Evidence/01\_Iterationsprotokolle/\[ITERATION-ID]\_\[kurztitel].md` | Ausgefülltes Iterationsprotokoll |

| `03\_Evidence/02\_Promptauszuege/\[ITERATION-ID]\_prompts.md` | Relevante Prompts und kurze Kontextnotiz |

| `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_build\_log.txt` | Ergebnis von `npm run build` oder technischem Prüfkommando |

| `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_git\_commit.txt` | Commit-Hash, Branch, Remote-URL und Push-Status oder Hinweis `\[zu ergänzen]` |

| `03\_Evidence/03\_Screenshots/\[ITERATION-ID]\_\[beschreibung].png` | Manuell zu ergänzender Screenshot, falls nicht automatisch möglich |



\## Abschlussregel



Eine Iteration gilt erst dann als abgeschlossen, wenn:



1\. die Umsetzung erfolgt ist,

2\. eine technische Prüfung durchgeführt wurde,

3\. die Evidence-Dateien erstellt oder aktualisiert wurden,

4\. fehlende Evidenzen markiert wurden,

5\. Git-Commit und Push-Status dokumentiert wurden,

6\. `session-handoff.md` aktualisiert wurde.

