# AGENT.md — PoC Assistenzsystem Bachelorarbeit

## Projektkontext

Dieses Repository enthält ein webbasiertes Assistenzsystem als Proof of Concept im Rahmen einer Bachelorarbeit in Wirtschaftsinformatik / Software Engineering.

Titel der Arbeit:
„Vibe Coding als Entwicklungsansatz für Proofs of Concept – Eine gestaltungsorientierte Konzeption und Evaluation eines webbasierten Assistenzsystems“

Das System dient als PoC zur Analyse von Ausschreibungsunterlagen im strategischen Einkauf. Ziel ist keine produktionsreife Unternehmenslösung, sondern ein evaluierbares MVP-orientiertes Artefakt.

## Zentrale Forschungslogik

Das Artefakt wird mit Vibe Coding iterativ entwickelt. Nicht nur das resultierende System ist relevant, sondern auch der Entwicklungsprozess, einschliesslich Prompts, KI-Ausgaben, Fehler, Korrekturen, Entscheidungen und Nacharbeiten.

Die Entwicklung muss so erfolgen, dass sie später anhand von Iterationsprotokollen, Prompt-Auszügen, Testläufen, Screenshots, Commit-Verweisen und einer Bewertungsmatrix nachvollziehbar evaluiert werden kann.

## Technologiestack

Geplanter Zielrahmen:

- Next.js mit App Router
- TypeScript
- Route Handlers für serverseitige Verarbeitung
- Vercel AI SDK als spätere Integrationsschicht
- OpenAI als späterer initialer Modellprovider
- Supabase Database für strukturierte Daten
- Supabase Storage für Originaldokumente
- GitHub als Source of Truth
- Vercel für späteres Hosting

Wichtig:
In frühen Iterationen dürfen Supabase, Vercel AI SDK, OpenAI und Vercel noch nicht angebunden werden, sofern dies nicht explizit für die jeweilige Iteration verlangt wird.

## Kernobjekte

- Case: abgegrenzter Analysefall
- Document: einem Case zugeordnetes Ausschreibungsdokument mit Metadaten und späterer Storage-Referenz
- Prompt: Analyseauftrag oder angepasste Eingabe
- Result: KI-generierte Ausgabe
- SavedResult: ausgewähltes gespeichertes Ergebnis

## MVP-Mindestanforderungen

F1: Ein Analysefall kann angelegt und getrennt von anderen Analysefällen bearbeitet werden.  
F2: Ein textbasiertes Ausschreibungsdokument kann einem Analysefall zugeordnet und als Grundlage für eine KI-gestützte Analyse verwendet werden.  
F3: Hochgeladene Dokumente werden mit grundlegenden Metadaten und Referenzen zum jeweiligen Analysefall verwaltet.  
F4: Ein Prompt kann auf Basis eines ausgewählten Dokuments ausgeführt werden.  
F5: Prompts können angepasst und erneut ausgeführt werden.  
F6: Verwendete Prompts und erzeugte Ergebnisse bleiben einem Analysefall zuordenbar.  
F7: KI-generierte Ergebnisse werden in einer Weboberfläche strukturiert dargestellt.  
F8: Ergebnisse können entlang relevanter Analyseperspektiven ausgewertet werden: AGB, Risiken, Eignungskriterien, Anforderungskriterien, Verfahrensregeln sowie Termine und Fristen.  
F9: Ausgewählte Ergebnisse können gespeichert und später einem Analysefall zugeordnet wieder aufgerufen werden.

## Nutzungsszenarien für spätere Evaluation

S1: Analysefall anlegen und Dokument hochladen.  
S2: Ausschreibungsdokument entlang fachlicher Kategorien analysieren.  
S3: Prompt anpassen und Analyse erneut ausführen.  
S4: Ergebnis speichern und wieder aufrufen.

## Harte Scope-Grenzen

Nicht implementieren, ausser ausdrücklich verlangt:

- Authentifizierung
- Rollen- und Berechtigungssystem
- produktionsnahe Security-/Compliance-Architektur
- Monitoring
- Skalierungsmechanismen
- Performance-Optimierungen
- Enterprise-Integration
- automatische rechtliche oder einkaufsfachliche Entscheidung
- Vertragsgenerierung
- Lieferantenbewertung
- fiktive Demo-Projekte
- Mock-Cases mit erfundenen Ausschreibungsdaten
- künstliche Risikoanalysen oder Fake-Ergebnisse

## UI-Grundsätze

Das UI ist nicht der primäre Untersuchungsgegenstand, soll aber seriös, konsistent und vorzeigbar wirken.

Erlaubt:

- klare Navigation
- sachliche Startseite
- gute Lesbarkeit
- konsistente Abstände
- ruhige Farbgebung
- einfache Cards oder Sections
- responsive Grundstruktur
- sinnvolle leere Zustände

Nicht erwünscht:

- doppelte Navigation auf Home
- fiktive Demo-Daten
- prominente Hinweise auf die Bachelorarbeit in der sichtbaren App
- verspielte Mockup-Wirkung
- aufwendige Animationen
- Dark-/Light-Mode-Systeme
- unnötige UI-Libraries
- produktionsnahes Designsystem

Die sichtbare App soll wie ein ernsthaft nutzbarer Minimalassistent wirken. Der PoC-Charakter wird in Dokumentation, Code und Bachelorarbeit nachvollziehbar gemacht, aber nicht prominent im UI ausgespielt.

## Startseiten-Logik

Die Startseite soll nicht die Navigation duplizieren.

Die Startseite soll den Arbeitsfluss unterstützen:

1. Analysefall erstellen
2. Dokument zuordnen
3. Analyse ausführen
4. Ergebnis prüfen und speichern

Die Home-Seite soll als Einstieg in die Ausschreibungsanalyse dienen, nicht als reine Kachelübersicht der Menüeinträge.

## Session-Start-Protokoll

Zu Beginn jeder Session:

1. Diese Datei lesen.
2. `.agent/rules-core.md` lesen.
3. `.agent/evidence-rules.md` lesen.
4. `.agent/session-handoff.md` lesen.
5. `.agent/glossary.md` bei Begriffsklärung verwenden.
6. Vor Umsetzung kurz sagen, welche Iteration bearbeitet wird und welche MVP-Anforderungen betroffen sind.

## Arbeitsweise

- Iterativ arbeiten.
- Kleine, prüfbare Änderungen bevorzugen.
- Vor nicht-trivialen Änderungen einen kurzen Implementierungsplan vorschlagen.
- Keine unnötige Komplexität einführen.
- Keine zusätzlichen Libraries ohne Begründung.
- Keine produktionsnahen Features ohne explizite Freigabe.
- Bei Unsicherheit zuerst fragen.
- GitHub soll von Anfang an als Source of Truth verwendet werden.
- Vor dem ersten GitHub-Remote-Setup nach Repository-Name, Sichtbarkeit und GitHub-Account fragen.
- Vor Vercel-Verbindung, Supabase-Verbindung oder KI-Anbindung zuerst Freigabe einholen.

## Rollen

Je nach Aufgabe eine passende Rolle einnehmen:

- Architect: bei Struktur- und Architekturfragen
- Engineer: bei Implementierung
- Reviewer: bei Codeprüfung
- Debugger: bei Fehleranalyse
- Documenter: bei Iterations- und Evidence-Dokumentation

## Evidence-Dokumentation

Nach jeder abgeschlossenen Entwicklungsiteration müssen die relevanten Evidence-Dateien im Ordner `03_Evidence` erstellt oder aktualisiert werden, sofern der Ordner im Workspace verfügbar ist.

Dabei ist `.agent/evidence-rules.md` verbindlich zu befolgen.

Es dürfen keine Evidenzen erfunden werden. Fehlende oder noch nicht geprüfte Evidenzen sind mit `[zu ergänzen]` oder `[zu prüfen]` zu markieren.

## Session-Ende

Am Ende jeder Session oder abgeschlossenen Iteration:

1. Build oder relevante Prüfung ausführen.
2. Evidence-Dateien gemäss `.agent/evidence-rules.md` erstellen oder aktualisieren.
3. Git-Status prüfen.
4. Änderungen committen und nach GitHub pushen, sofern GitHub eingerichtet ist und keine Secrets oder vertraulichen Inhalte enthalten sind.
5. `.agent/session-handoff.md` aktualisieren.
6. Offene Punkte für die nächste Iteration festhalten.
7. Keine erfundenen Evidenzen eintragen.