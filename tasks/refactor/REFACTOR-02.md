# REFACTOR-02: V1-Archiv & Deprecation-Markierungen

> **Phase:** 2
> **Risiko:** 🟢 Kein Risiko
> **Abhängigkeiten:** REFACTOR-00, REFACTOR-01
> **Geschätzte Dateien betroffen:** ~10

## Ziel

V1-Code klar als "archiviert/nur Referenz" kennzeichnen, ohne ihn zu löschen.

## Subtasks

### 2.1 Header-Kommentar in V1-Dateien einfügen

Betroffene Dateien:
- `src/engine/melee/contact-geometry.js`
- `src/engine/melee/index.js`
- `src/engine/melee/resolution.js`
- `src/engine/melee/resolution.test.js`
- `src/engine/melee/roles.js`
- `src/engine/melee/roles.test.js`
- `src/state/p9-melee.js`
- `src/state/p9-melee.test.js`

**Header-Template:**
```js
/**
 * @deprecated V1 Melee System – kept for reference only.
 * Active implementation: src/state/p9-melee-v2.js and src/engine/melee-v2/
 *
 * DO NOT MODIFY. If V2 is missing functionality, implement it in melee-v2/.
 */
```

### 2.2 V1-Tests von CI ausschließen
- **Aktion:** Test-Konfiguration anpassen
- **Option A:** `testPathIgnorePatterns` in jest/vitest config um `**/melee/**` (nur V1 engine/melee, nicht melee-v2) und `**/p9-melee.js` + `**/p9-melee.test.js` erweitern
- **Option B:** `@deprecated` Marker im Test-Runner auswerten
- **Vorher prüfen:** Werden V1 engine/melee Dateien noch von aktivem Code importiert?

### 2.3 Abhängigkeiten auf V1 prüfen
- `grep_search` nach `require.*melee` oder `import.*melee` (ohne `melee-v2`)
- Falls V1 engine/melee noch importiert wird → entscheiden: Migration auf V2 oder bewusster V1-Import mit Kommentar?

## Akzeptanzkriterien

- [ ] Alle V1-Dateien haben Deprecation-Header
- [ ] V1-Tests werden nicht mehr in CI ausgeführt (optional: manuell ausführbar)
- [ ] Kein aktiver Code importiert V1 unkommentiert
- [ ] Tests für V2 laufen unverändert

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 2
- V1 Engine: `src/engine/melee/` (6 Dateien)
- V1 State: `src/state/p9-melee.js`, `src/state/p9-melee.test.js`
