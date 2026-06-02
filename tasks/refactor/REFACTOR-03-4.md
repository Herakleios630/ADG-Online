# REFACTOR-03-4: Große Dateien splitten – Stufe 4: UI

> **Phase:** 3.4
> **Risiko:** 🔴 Höher (stark gekoppelt, visuelle Änderungen möglich)
> **Abhängigkeiten:** REFACTOR-03-3
> **Geschätzte Dateien:** 4 → ~12 nach Split

## Ziel

Große UI-Dateien in thematische Komponenten-Ordner splitten.

**Achtung:** UI-Code ist stark an DOM-Rendering gekoppelt. Vor jedem Split prüfen ob Komponenten sauber trennbar sind.

---

### 3.4.1 `ui/p0-app.js` (1.563 Zeilen)

**Zielstruktur:** `ui/app/`
- `routing.js` – Phasen/Routing-Logik
- `state-binding.js` – Verbindung zu State-Management
- `init.js` – Initialisierung
- `index.js` – Barrel

### 3.4.2 `ui/p0-battlefield.js` (1.583 Zeilen)

**Zielstruktur:** `ui/battlefield/`
- `renderer.js` – Haupt-Rendering
- `unit-manager.js` – Einheiten-Verwaltung
- `zoc-overlay.js` – ZOC-Visualisierung
- `index.js` – Barrel

### 3.4.3 `ui/battlefield-command-panel.js` (1.496 Zeilen)

**Zielstruktur:** `ui/command-panel/`
- `panel-renderer.js` – Panel-Darstellung
- `cp-display.js` – CP-Anzeige
- `range-overlay.js` – Reichweiten-Overlay
- `index.js` – Barrel

### 3.4.4 `ui/battlefield-dialogs.js` (1.091 Zeilen)

**Zielstruktur:** `ui/dialogs/`
- `charge-dialog.js`
- `reaction-dialog.js`
- `evade-dialog.js`
- `index.js` – Barrel

## Akzeptanzkriterien

- [ ] Alle neuen UI-Ordner existieren
- [ ] Keine visuellen Regressionen (manuell prüfen!)
- [ ] Tests laufen identisch zur Baseline
- [ ] `npm run build` erfolgreich

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 3.4
- Quellen: `ui/p0-app.js`, `ui/p0-battlefield.js`, `ui/battlefield-command-panel.js`, `ui/battlefield-dialogs.js`
