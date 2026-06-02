"# Subtask - Per-Unit Cohesion Account Spine Definition

## Goal
- Die grundlegende Datenstruktur und Operationen für den Cohesion-Account in `src/state/p0-cohesion.js` definieren und als exportierte API bereitstellen, die von `p9-melee-v2.js` und später P8/P10 verwendet wird.

## Scope
- Nur die Definition der Datentypen, Status-Konstanten und Kern-Operationen in `src/state/p0-cohesion.js`.
- Extraktion der bereits in `p9-melee-v2.js` existierenden Cohesion-Logik in die neue Shared-Location.
- Keine UI-Änderungen, keine Marker-Rendering, keine P8/P10-Integration.

## Files
- src/state/p0-cohesion.js (NEU - extrahiert aus p9-melee-v2.js)
- src/state/p9-melee-v2.js (Importe anpassen)
- src/data/unit-profiles.js (Referenz für `getMaxCohesionForUnit`)

## Steps
1. Erstelle `src/state/p0-cohesion.js` mit folgenden Exporten:
   - `COHESION_ACCOUNT_STATUSES`: `good-order`, `disordered`, `routed-pending-removal`, `removed`
   - `COHESION_ACCOUNT_LANE_KEYS`: `shooting`, `meleeCombatResult`, `meleeMultipleAttackImmediate`, `routCascade`
   - `createEmptyCohesionLaneTotals()`: Factory für leere Lane-Objekte
   - `normalizeCohesionLaneTotals(value)`: Normalisiert und validiert Lane-Werte
   - `sumCohesionLaneTotals(value)`: Summiert alle Lane-Werte
   - `deriveCohesionAccountStatus({ remainingCohesion, maxCohesion, removed })`: Bestimmt Status aus Werten
   - `getNormalizedCohesionAccountForUnit(unit)`: Extrahiert/berechnet Account aus Unit
   - `createCommittedCohesionHistoryEntry({ source, delta, reason })`: Erstellt History-Eintrag
   - `queueCohesionPendingDelta({ unit, source, delta, reason })`: Schreibt in pending Lane
   - `commitCohesionBatch({ unit })`: Committet pending → committed mit History
2. Ersetze die lokalen Definitionen von `COHESION_ACCOUNT_STATUSES`, `COHESION_ACCOUNT_LANE_KEYS`, `createEmptyCohesionLaneTotals`, `normalizeCohesionLaneTotals`, `sumCohesionLaneTotals`, `deriveCohesionAccountStatus`, `getNormalizedCohesionAccountForUnit`, `createCommittedCohesionHistoryEntry` in `p9-melee-v2.js` durch Importe aus `./p0-cohesion.js`.
3. Behalte `getMaxCohesionForUnit`-Import in `p9-melee-v2.js` (wird von `getNormalizedCohesionAccountForUnit` benötigt, das nun in `p0-cohesion.js` lebt).
4. Stelle sicher, dass alle bestehenden Tests weiterhin grün sind.

## Validation
- `node --test src/data/unit-profiles.test.js src/state/p9-melee-v2.test.js src/state/p0-state-melee.test.js` - Alle 174 Tests bestehen.
- `node --test src/state/p0-cohesion.test.js` (neu) - Testet `createEmptyCohesionLaneTotals`, `normalizeCohesionLaneTotals`, `deriveCohesionAccountStatus`.

## Stop condition
- Stoppen, wenn die Extraktion einen bestehenden Test bricht.
- Stoppen, wenn zirkuläre Abhängigkeiten zwischen `p0-cohesion.js` und `p9-melee-v2.js` entstehen.

## Status
- todo"