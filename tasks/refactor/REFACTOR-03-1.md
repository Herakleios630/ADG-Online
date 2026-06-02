# REFACTOR-03-1: Große Dateien splitten – Stufe 1: Daten-Dateien

> **Phase:** 3.1
> **Risiko:** 🟢 Gering (reine Daten + Tests)
> **Abhängigkeiten:** REFACTOR-02
> **Geschätzte Dateien:** 7 → ~18 nach Split

## Ziel

Große Data-Dateien (>800 Zeilen) in thematische Unterordner splitten.

## Split-Regeln (für alle Stufen gültig)

1. Vor jedem Split: `npm test` → Baseline notieren
2. Split durchführen (Moves + neue `index.js` Barrel-Exports)
3. `npm test` → muss identisch zur Baseline sein
4. Bei Fehlschlag: Zurückrollen
5. Nächste Datei erst nach Erfolg

---

### 3.1.1 `melee-drill-scenarios.js` (1.967 Zeilen)

**Split nach Periode:**
- `src/data/melee-drill/ancient.js`
- `src/data/melee-drill/classical.js`
- `src/data/melee-drill/index.js` (Barrel)

**Dito für Tests:**
- `src/data/melee-drill/ancient.test.js`
- `src/data/melee-drill/classical.test.js`

### 3.1.2 `unit-profiles.js` (812 Zeilen)

**Split nach Einheitentyp:**
- `src/data/unit-profiles/foot.js`
- `src/data/unit-profiles/mounted.js`
- `src/data/unit-profiles/commanders.js`
- `src/data/unit-profiles/index.js` (Barrel)

### 3.1.3 `charge-drill-scenarios.js` (22.79 KB)

**Split nach Szenario-Typ:**
- `src/data/charge-drill/basic.js`
- `src/data/charge-drill/evade.js`
- `src/data/charge-drill/zoc.js`
- `src/data/charge-drill/index.js` (Barrel)

### 3.1.4 `conform-drill-scenarios.js` prüfen

- Zeilen ermitteln (9.75 KB – vermutlich <800 Zeilen?)
- Wenn >800: analog splitten

### 3.1.5 Import-Updates

- Alle Dateien, die bisher die alten Dateien importieren, auf neue Pfade umstellen
- `grep_search` nach `charge-drill-scenarios`, `melee-drill-scenarios`, `unit-profiles`

## Akzeptanzkriterien

- [ ] Alle neuen Unterordner existieren mit korrekten `index.js` Exports
- [ ] Alte Dateien gelöscht/verschoben
- [ ] Tests laufen identisch zur Baseline
- [ ] Keine Import-Fehler in abhängigen Dateien

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 3.1
- Quellen: `src/data/melee-drill-scenarios.js`, `unit-profiles.js`, `charge-drill-scenarios.js`, `conform-drill-scenarios.js`
