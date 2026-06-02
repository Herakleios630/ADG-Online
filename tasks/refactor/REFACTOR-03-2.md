# REFACTOR-03-2: Große Dateien splitten – Stufe 2: Engine

> **Phase:** 3.2
> **Risiko:** 🟡 Mittel (Engine-Logik, aber gute Testabdeckung)
> **Abhängigkeiten:** REFACTOR-03-1
> **Geschätzte Dateien:** 5 → ~15 nach Split

## Ziel

Große Engine-Dateien splitten. Jede Engine-Datei hat Tests – das gibt Sicherheit.

## Split-Regeln (Wiederholung)

1. `npm test` → Baseline
2. Split + neue `index.js`
3. `npm test` → identisch?
4. Bei Fehler: Rollback

---

### 3.2.1 `engine/charge/evade-solver.js` (2.380 Zeilen)

**Zielstruktur:** `engine/charge/evade/`
- `solver.js` – Kern-Logik
- `geometry.js` – Geometrie-Berechnungen
- `validation.js` – Regel-Validierung
- `index.js` – Barrel

**Achtung:** `evade-geometry.js` existiert bereits daneben! Prüfen ob das mit dem neuen `evade/geometry.js` konsolidiert werden kann.

### 3.2.2 `engine/charge/evade.test.js` (1.162 Zeilen)

**Parallel zum Source-Split:**
- `evade/solver.test.js`
- `evade/geometry.test.js`
- `evade/validation.test.js`

### 3.2.3 `engine/melee-v2/resolution.js` (14 KB)

**Zielstruktur:** `engine/melee-v2/resolution/`
- `combat-resolution.js`
- `outcome.js`
- `pursuit.js`
- `index.js`

### 3.2.4 `engine/movement/validation.js` (21 KB)

**Zielstruktur:** `engine/movement/validation/`
- `advance.js`
- `wheel.js`
- `charge.js`
- `index.js`

### 3.2.5 Import-Updates

- `grep_search` nach Imports der gesplitteten Dateien
- Alle Import-Pfade aktualisieren

## Akzeptanzkriterien

- [ ] Alle neuen Unterordner existieren
- [ ] `evade-solver.js` → `evade/` inkl. Konsolidierung mit `evade-geometry.js`
- [ ] Tests laufen identisch zur Baseline
- [ ] Keine defekten Imports

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 3.2
- Quellen: `engine/charge/evade-solver.js`, `evade.test.js`, `evade-geometry.js`, `engine/melee-v2/resolution.js`, `engine/movement/validation.js`
