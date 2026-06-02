# REFACTOR-05: Cross-Cutting Concerns

> **Phase:** 5
> **Risiko:** 🟢 Optional, keine Eile
> **Abhängigkeiten:** REFACTOR-04
> **Geschätzte Dateien:** ~10

## Ziel

Übergreifende Verbesserungen, die nicht phasen-spezifisch sind, aber nach dem Refaktor leichter umsetzbar.

## Subtasks

### 5.1 Test-Fixtures-Bibliothek ausbauen

**Aktuell:** `src/state/__fixtures__/` existiert (aus REFACTOR-03-5)
**Ziel:** Für ALLE Module nutzbar machen

- `src/__fixtures__/` auf oberster `src/`-Ebene anlegen?
- Oder pro Modul: `engine/charge/__fixtures__/`, `engine/movement/__fixtures__/`, etc.
- Gemeinsame Basis-Fixtures: Einheiten, Kommandanten, Gelände

### 5.2 Magische Zahlen extrahieren

- Regel-Konstanten aus Engine-Dateien identifizieren
- Ziel: `src/constants/rules.js`
- Beispiele: CP-Kosten, Bewegungswerte, Kampf-Faktoren
- Jede Konstante mit Regel-Quellenverweis versehen (z.B. `// Rules p.56 – Shooting Ranges`)

### 5.3 JSDoc-Type-Definitions

- Kein TypeScript-Zwang, aber JSDoc-Types für bessere IDE-Unterstützung
- Fokus auf öffentliche API-Funktionen in engine/
- `@typedef` für zentrale Datenstrukturen (Unit, BattlefieldState, ChargePath)

### 5.4 Barrel-Exports auditieren

- Konsistenz-Prüfung über ALLE `index.js`-Dateien
- Regel: Jeder Ordner exportiert seine öffentliche API über `index.js`
- Kein direkter Import aus Unterdateien außerhalb des Moduls

### 5.5 `melee-v2-adapter.js` prüfen

- Liegt in `src/ui/melee-v2-adapter.js`
- Passt der Name/Zweck noch nach dem Refaktor?
- Enthält es UI-Logik oder ist es ein reiner Bridge/Adapter? → ggf. verschieben

## Akzeptanzkriterien

- [ ] Fixtures sind mindestens für engine/ und state/ nutzbar
- [ ] `src/constants/rules.js` existiert mit dokumentierten Konstanten
- [ ] JSDoc-Types an zentralen engine-APIs vorhanden
- [ ] Keine Regel-Konstanten mehr als Magic Numbers im Code

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 5
