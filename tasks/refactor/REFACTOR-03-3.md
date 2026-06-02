# REFACTOR-03-3: Große Dateien splitten – Stufe 3: State

> **Phase:** 3.3
> **Risiko:** 🟠 Höher (State-Management, viele Abhängigkeiten)
> **Abhängigkeiten:** REFACTOR-03-2
> **Geschätzte Dateien:** 4 → ~12 nach Split

## Ziel

Große State-Dateien in thematische Module zerlegen: Reducer, Selectors, Actions, Helpers.

## Vorbereitung

- [ ] Abhängigkeitsgraph für `p0-state.js` erstellen (wer importiert was?)
- [ ] Abhängigkeitsgraph für `p9-melee-v2.js` erstellen

---

### 3.3.1 `state/p0-state.js` (1.642 Zeilen)

**Zielstruktur:** `state/core/`
- `state-reducer.js` – reine Reducer-Logik
- `state-selectors.js` – abgeleitete State-Zugriffe
- `state-actions.js` – Action-Creators
- `index.js` – Barrel

**Besonderheit:** `p0-state.test.js` (6.518 Zeilen!) hängt stark davon ab. Split der Tests erfolgt in REFACTOR-03-5.

### 3.3.2 `state/p0-shooting.js` (1.387 Zeilen)

**Zielstruktur:** `state/shooting/`
- `shooting-reducer.js`
- `shooting-helpers.js`
- `shooting-selectors.js`
- `index.js`

### 3.3.3 `state/p9-melee-v2.js` (2.696 Zeilen)

**Zielstruktur:** `state/melee-v2/`
- `melee-reducer.js`
- `combat-pipeline.js`
- `outcome-handler.js`
- `index.js`

### 3.3.4 `state/p9-melee-v2.test.js` (2.576 Zeilen)

**Parallel zum Source-Split:**
- `state/melee-v2/melee-reducer.test.js`
- `state/melee-v2/combat-pipeline.test.js`
- `state/melee-v2/outcome-handler.test.js`
- Gemeinsame Fixtures nach `state/melee-v2/__fixtures__/` auslagern

## Akzeptanzkriterien

- [ ] Alle neuen `state/core/`, `state/shooting/`, `state/melee-v2/` Ordner existieren
- [ ] Keine zirkulären Imports
- [ ] Tests laufen identisch zur Baseline
- [ ] `p0-state.js` und `p9-melee-v2.js` Originale entfernt

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 3.3
- Quellen: `state/p0-state.js`, `state/p0-shooting.js`, `state/p9-melee-v2.js`, `state/p9-melee-v2.test.js`
