\# evidence-rules.md — Regeln für Evidence-Dokumentation



\## Ziel



Die Evidence-Dokumentation stellt sicher, dass jede Entwicklungsiteration nachvollziehbar für die Bachelorarbeit dokumentiert wird.



Die Evidence-Dateien bilden die Grundlage für:



\- Kapitel 4 Auswertung und Ergebnisse

\- Bewertung der MVP-Anforderungen F1–F9

\- Bewertung der Nutzungsszenarien S1–S4

\- Reflexion des Entwicklungsprozesses

\- Aussagen zu Stärken, Grenzen und Nacharbeiten beim Einsatz von Vibe Coding



\## Evidence-Ordner



Der Evidence-Ordner liegt auf Workspace-Ebene:



`03\_Evidence/`



\## Pflichtstruktur



\- `03\_Evidence/01\_Iterationsprotokolle/`

\- `03\_Evidence/02\_Promptauszuege/`

\- `03\_Evidence/03\_Screenshots/`

\- `03\_Evidence/04\_Testlaeufe/`

\- `03\_Evidence/05\_Bewertungsmatrix/`



\## Pflichtdateien pro Iteration



Für jede Iteration `\[ITERATION-ID]` sind zu erstellen:



1\. Iterationsprotokoll  

&#x20;  `03\_Evidence/01\_Iterationsprotokolle/\[ITERATION-ID]\_\[kurztitel].md`



2\. Prompt-Auszug  

&#x20;  `03\_Evidence/02\_Promptauszuege/\[ITERATION-ID]\_prompts.md`



3\. Build-Log oder technische Prüfnotiz  

&#x20;  `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_build\_log.txt`



4\. Git-Commit-Notiz  

&#x20;  `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_git\_commit.txt`



5\. Screenshot-Hinweis im Iterationsprotokoll  

&#x20;  Falls kein Screenshot automatisch erstellt werden kann: `\[Screenshot zu ergänzen]`



\## Regeln gegen erfundene Evidenzen



\- Evidenzen müssen auf tatsächlichen Vorgängen beruhen.

\- Fehlende Evidenzen werden mit `\[zu ergänzen]` markiert.

\- Unsichere Angaben werden mit `\[zu prüfen]` markiert.

\- Keine Screenshots behaupten, wenn keine Datei vorhanden ist.

\- Keine Commit-Hashes eintragen, wenn kein Commit erstellt wurde.

\- Keine Testläufe als erfolgreich markieren, wenn sie nicht ausgeführt wurden.

\- Keine fiktiven Ergebnisse oder Nutzerdaten erzeugen.

\- Keine erfundenen Fehler oder Korrekturen dokumentieren.



\## Ablauf am Ende jeder Iteration



1\. Prüfen, welche Iteration abgeschlossen wurde.

2\. Relevante MVP-Anforderungen F1–F9 zuordnen.

3\. `npm run build` oder ein anderes passendes Prüfkommando ausführen.

4\. Build-Ergebnis in `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_build\_log.txt` speichern.

5\. Relevante Prompts in `03\_Evidence/02\_Promptauszuege/\[ITERATION-ID]\_prompts.md` speichern oder zusammenfassen.

6\. Iterationsprotokoll anhand `.agent/templates/iteration-protocol-template.md` erstellen.

7\. Commit-Information in `03\_Evidence/04\_Testlaeufe/\[ITERATION-ID]\_git\_commit.txt` speichern oder `\[zu ergänzen]` markieren.

8\. Screenshot-Hinweise im Protokoll eintragen.

9\. `.agent/session-handoff.md` aktualisieren.



\## Inhalt des Prompt-Auszuges



Die Datei `\[ITERATION-ID]\_prompts.md` soll enthalten:



\- Iteration-ID

\- Ziel der Iteration

\- wichtigste Nutzerprompts (in vollständiger Länge, ungekürzt)

\- kurze Zusammenfassung relevanter KI-Antworten

\- Hinweise auf Korrekturprompts (in vollständiger Länge, ungekürzt)



\## Inhalt des Build-Logs



Die Datei `\[ITERATION-ID]\_build\_log.txt` soll enthalten:



\- ausgeführtes Kommando

\- Zeitpunkt oder Datum

\- Ergebnis: erfolgreich / fehlgeschlagen

\- relevante Fehlermeldungen, falls vorhanden

\- kurze Korrekturmassnahme, falls durchgeführt



\## Inhalt der Git-Commit-Notiz



Die Datei `\[ITERATION-ID]\_git\_commit.txt` soll enthalten:



\- Commit-Hash, falls vorhanden

\- Commit-Message, falls vorhanden

\- Branch, falls relevant

\- Remote-URL, falls vorhanden

\- Push-Status: erfolgreich / nicht durchgeführt / fehlgeschlagen

\- falls kein Commit erstellt wurde: `\[Commit zu ergänzen]`

\- keine Secrets oder vertraulichen Inhalte dokumentieren



\## Screenshots



Screenshots werden in der Regel manuell ergänzt.



Ablage:



`03\_Evidence/03\_Screenshots/`



Namensschema:



`\[ITERATION-ID]\_\[kurze-beschreibung].png`



Beispiel:



`I-01\_home\_startseite.png`



Wenn kein Screenshot vorhanden ist, im Protokoll eintragen:



`\[Screenshot zu ergänzen]`

