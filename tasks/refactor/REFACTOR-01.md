# REFACTOR-01: TODO- & Meta-Struktur aufbauen

> **Phase:** 1
> **Risiko:** 🟢 Kein Risiko
> **Abhängigkeiten:** REFACTOR-00 (benötigt `meta/outputs/`, `meta/handoffs/` Verzeichnisse)
> **Geschätzte Dateien betroffen:** ~25

## Ziel

Alle Projektmanagement-Dateien in einheitliches System unter `meta/` bringen:
- `roadmap.md` aus Root nach `meta/`
- Alle TODO-Dateien aus Root nach `meta/todos/open/`
- Verzeichnisstruktur für künftige done/archive TODOs anlegen

## Subtasks

### 1.1 Verzeichnisstruktur anlegen
- `meta/todos/open/`
- `meta/todos/done/`
- `meta/todos/archive/`
- `meta/handoffs/`
- `meta/outputs/`

### 1.2 `roadmap.md` verschieben
- **Datei:** `roadmap.md`
- **Aktion:** → `meta/roadmap.md`

### 1.3 TODO-Dateien verschieben
Alle `*_todo.md` aus Root → `meta/todos/open/`:

- `P0_todo.md`, `P1_todo.md`, `P2_todo.md`, `P3_todo.md`, `P4_todo.md`, `P5_todo.md`, `P6_todo.md`
- `P7_todo.md`, `P7A_todo.md`, `P7A2_todo.md`, `P7B_todo.md`, `P7C_todo.md`
- `P8_todo.md`, `P9_todo.md`, `P9_v2_todo.md`
- `CHARGE_DRILL_2_todo.md`, `CLASSIC_PERIOD_todo.md`, `CONFORM_DRILL_todo.md`
- `LOGGING_todo.md`, `RULEBOOK_EXAMPLES_todo.md`, `RULES_V2_todo.md`
- `SOURCE_OCR_todo.md`, `UNIT_CAPABILITIES_todo.md`

### 1.4 `meta/todos/README.md` anlegen (optional)
Falls hilfreich: Erklärt das TODO-System (open/done/archive)

## Akzeptanzkriterien

- [ ] `meta/roadmap.md` existiert und Inhalt ist identisch zum ursprünglichen Root-`roadmap.md`
- [ ] Alle 23 TODO-Dateien sind in `meta/todos/open/`
- [ ] `meta/todos/done/` und `meta/todos/archive/` existieren (leer)
- [ ] Root enthält keine `*_todo.md` oder `roadmap.md` mehr

## Verwandte Dateien

- Plan: `meta/refactor-plan.md` Phase 1
- Betroffene Dateien: 23 TODO-Dateien + roadmap.md
