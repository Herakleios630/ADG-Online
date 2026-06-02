# REFACTOR-00: Root aufräumen (Low-Hanging Fruits)

> **Phase:** 0
> **Risiko:** 🟢 Kein Risiko
> **Abhängigkeiten:** Keine
> **Geschätzte Dateien betroffen:** ~40

## Ziel

Müll und lose Dateien aus dem Root entfernen. Keine Logik-Änderung. Root enthält danach nur noch: `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, und die Hauptordner.

## Subtasks

### 0.1 `p9-melee-v2.js.tmp` löschen
- **Datei:** `src/state/p9-melee-v2.js.tmp`
- **Aktion:** Löschen (Temp-Datei, nicht benötigt)
- **Vorher prüfen:** Enthält sie Code, der nicht in `p9-melee-v2.js` steht?

### 0.2 `fix_cohesion` aufräumen
- **Dateien:** `fix_cohesion.cjs`, `fix_cohesion.js`, `fix_cohesion.mjs`
- **Aktion:** Eine Version behalten (`.js`), `.cjs` und `.mjs` nach `tools/archived/` verschieben
- **Vorher prüfen:** Welche Version ist die aktuellste/funktionale?

### 0.3 Temp-Scripts verschieben
- **Dateien:** `temp_pdf_extract.py`, `temp_pdf_modcheck.py`, `temp_pdf_render.py`, `temp_snippet.js`, `temp-zoc-search.mjs`, `temp-dual-zoc-search.mjs`, `temp-replay-smoke.mjs`, `test-script.mjs`
- **Aktion:** → `tools/archived/`

### 0.4 Lose `.txt`-Results verschieben
- **Dateien:** `results.txt`, `test_output.txt`, `test_results.txt`, `search_results.txt`, `validation_results.txt`, `p7_regression_results.txt`, `regression_results.txt`, `extracted_pages.txt`, `summary.txt`
- **Aktion:** → `meta/outputs/`

### 0.5 `output.log` verschieben
- **Datei:** `output.log`
- **Aktion:** → `meta/outputs/`

### 0.6 `Konzepte/` integrieren
- **Ordner:** `Konzepte/`
- **Aktion:** → `docs/source/konzepte/` (kompletter Ordner)
- **Achtung:** PDFs sind Quellen – NUR verschieben, nicht verändern (Leitplanke R6)

### 0.7 `test.txt` verschieben
- **Datei:** `test.txt`
- **Aktion:** → `meta/outputs/`

### 0.8 `page40.png`, `page41.png` prüfen
- **Dateien:** `page40.png`, `page41.png`
- **Aktion:** Prüfen ob obsolet → wenn ja löschen, sonst → `meta/outputs/`

### 0.9 `LAPTOP_HANDOFF_2026-05-24.txt` verschieben
- **Datei:** `LAPTOP_HANDOFF_2026-05-24.txt`
- **Aktion:** → `meta/handoffs/`

## Akzeptanzkriterien

- [ ] Root enthält keine losen `.txt`, `.py`, `.mjs`, `.cjs`, `.log`, `.tmp` Dateien mehr
- [ ] Root enthält nur noch: `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, `.vscode/`, `.github/`, `.continue/`, `src/`, `docs/`, `meta/`, `tools/`, `tasks/`, `scripts/`, `public/`, `logs/`
- [ ] `Konzepte/` ist erfolgreich nach `docs/source/konzepte/` verschoben
- [ ] Tests laufen unverändert (npm test)
- [ ] Build funktioniert (npm run build)

## Verwandte Dateien

- Plan: `meta/refactor-plan.md`
