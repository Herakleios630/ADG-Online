# REFACTOR-04: Unterordner-Struktur finalisieren

> **Phase:** 4
> **Risiko:** 🟡 Nur Moves, aber viele Dateien
> **Abhängigkeiten:** REFACTOR-03-5 (alle Splits abgeschlossen)
> **Geschätzte Dateien:** ~alle

## Ziel

Automatisch entstandene Subfolder aus Phase 3 konsolidieren. Prüfen, ob alle `index.js` Barrel-Exports korrekt sind und Import-Pfade stimmen.

## Subtasks

### 4.1 Barrel-Exports prüfen

Für JEDEN neuen/existierenden Ordner mit `index.js`:
- Exportiert er ALLE öffentlichen Funktionen des Moduls?
- Sind die Export-Namen konsistent (keine Tippfehler, keine vergessenen Exports)?
- Wird `index.js` selbst nirgends importiert? (Sollte immer nur der Ordner importiert werden)

**Prüfliste (neue Ordner aus Phase 3):**
- [ ] `src/data/melee-drill/index.js`
- [ ] `src/data/charge-drill/index.js`
- [ ] `src/data/unit-profiles/index.js`
- [ ] `src/engine/charge/evade/index.js`
- [ ] `src/engine/melee-v2/resolution/index.js`
- [ ] `src/engine/movement/validation/index.js`
- [ ] `src/state/core/index.js`
- [ ] `src/state/shooting/index.js`
- [ ] `src/state/melee-v2/index.js`
- [ ] `src/ui/app/index.js`
- [ ] `src/ui/battlefield/index.js`
- [ ] `src/ui/command-panel/index.js`
- [ ] `src/ui/dialogs/index.js`

### 4.2 Import-Pfade global prüfen

- `grep_search` nach alten Dateinamen (z.B. `p0-state` ohne `/core/`)
- Alle Imports auf neue Pfade umstellen

### 4.3 Gesamte Test-Suite

- `npm test` – alle Tests müssen grün sein
- Bei Fehlern: Import-Pfade fixen

### 4.4 `src/main.js` prüfen

- Sind alle Top-Level-Imports noch korrekt?
- Funktioniert der App-Start?

### 4.5 Build prüfen

- `npm run build` muss erfolgreich sein
- Output prüfen auf fehlende Module

## Akzeptanzkriterien

- [ ] Alle `index.js`-Dateien sind vollständig
- [ ] Keine defekten Imports im gesamten Projekt
- [ ] `npm test` 100% grün
- [ ] `npm run build` erfolgreich
- [ ] App startet und funktioniert

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 4
