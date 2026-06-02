# REFACTOR-03-5: Große Dateien splitten – Stufe 5: Tests

> **Phase:** 3.5
> **Risiko:** 🟠 Mittel (reine Test-Dateien, aber komplex)
> **Abhängigkeiten:** REFACTOR-03-3, REFACTOR-03-4 (Source-Splits müssen abgeschlossen sein)
> **Geschätzte Dateien:** 4 → ~12 nach Split

## Ziel

Test-Monster splitten, gemeinsame Fixtures auslagern, Test-Dateien parallel zu den neu gesplitteten Source-Modulen organisieren.

---

### 3.5.0 Vorbereitung: Fixtures-Bibliothek

**Ziel:** `src/state/__fixtures__/`
- `sample-units.js` – Wiederverwendbare Einheiten-Definitionen
- `sample-battlefield.js` – Standard-Schlachtfeld-Setups
- `sample-commands.js` – Befehlshaber-Konfigurationen

**Quelle:** `src/state/p0-fixtures.js` analysieren und ggf. erweitern.

### 3.5.1 `state/p0-state.test.js` (6.518 Zeilen – das Monster)

**Split-Strategie:**
1. Fixtures identifizieren → nach `__fixtures__/` auslagern
2. Tests nach State-Bereich gruppieren:
   - `state/core/state-reducer.test.js`
   - `state/core/state-selectors.test.js`
   - `state/core/state-actions.test.js`
   - Was übrig bleibt parsen und Rest in passende Dateien

### 3.5.2 `ui/battlefield-command-panel.test.js` (2.594 Zeilen)

**Zielstruktur:** `ui/command-panel/`
- `panel-renderer.test.js`
- `cp-display.test.js`
- `range-overlay.test.js`

### 3.5.3 `ui/p0-battlefield.test.js` (2.541 Zeilen)

**Zielstruktur:** `ui/battlefield/`
- `renderer.test.js`
- `unit-manager.test.js`
- `zoc-overlay.test.js`

### 3.5.4 `ui/p0-app.test.js` (30.79 KB)

- Zeilen prüfen
- Wenn >800: nach `ui/app/*.test.js` splitten

## Akzeptanzkriterien

- [ ] `__fixtures__/` enthält mindestens 3 Basis-Fixture-Dateien
- [ ] `p0-state.test.js` erfolgreich gesplittet
- [ ] Alle Test-Splits laufen und ergeben identische Ergebnisse
- [ ] Keine Duplikate in Test-Logik

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 3.5
- Quellen: `state/p0-state.test.js`, `ui/battlefield-command-panel.test.js`, `ui/p0-battlefield.test.js`, `ui/p0-app.test.js`
