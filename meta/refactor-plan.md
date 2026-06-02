# ADG Online – Refaktor-Plan

> **Stand:** 2026-06-02
> **Status:** Geplant, noch nicht gestartet
> **Letzte Diskussion:** Session mit Coding-Agent am 2026-06-02

---

## 🔒 Leitplanken

Diese Regeln gelten für den gesamten Refaktor und dürfen nicht verletzt werden:

| # | Regel | Begründung |
|---|-------|------------|
| R1 | **1:1-Regeltreue** | Jede Änderung muss regelkonform sein. Kein Refactor darf Spielverhalten ändern. Das Spiel soll später für echte Turnier-Vorbereitung nutzbar sein. |
| R2 | **V2 = aktiv, V1 = Archiv** | `p9-melee.js` (V1) bleibt als Referenz/Dokumentation erhalten, wird nicht gelöscht, aber als deprecated markiert. |
| R3 | **TODOs bleiben erhalten** | TODO-Dateien sind Teil des Projekt-Fahrplans (zusammen mit roadmap.md). Sie werden strukturiert in `meta/todos/` mit `open/` und `done/`. |
| R4 | **Trennung schärfen** | Engine ≠ State ≠ UI ≠ Data. Jede Datei bekommt klare Zugehörigkeit. Keine Vermischung von Logik-Schichten. |
| R5 | **Tests bei Source** | Tests bleiben neben den Source-Dateien (nicht in separates `tests/`-Verzeichnis). Aber gemeinsame Fixtures werden ausgelagert. |
| R6 | **Regel-PDFs unverändert lassen** | Die PDF-Scans unter `docs/source/new scan/` und `Konzepte/` sind Quellen und werden nur verschoben, nicht verändert. |
| R7 | **Tasks vor Code** | Jede Phase wird in einzelne Task-Karten zerlegt. Kein Code ohne Task. |

---

## 🗺️ Übersicht: 6 Phasen

| Phase | Beschreibung | Geschätzte Dateien | Risiko | Reihenfolge |
|-------|-------------|---------------------|--------|-------------|
| **0** | Root aufräumen, Temp löschen, erste Ordnung | ~40 | 🟢 Kein Risiko | Zuerst |
| **1** | TODO- & Meta-Struktur aufbauen | ~25 | 🟢 Kein Risiko | Zuerst (parallel zu 0) |
| **2** | V1 archivieren & deprecation-Markierungen | ~10 | 🟢 Kein Risiko | Nach 0+1 |
| **3** | Große Dateien splitten (>800 Zeilen) | ~18 → ~60 | 🟡 Mittel | Nach 2, in 5 Stufen |
| **4** | Unterordner-Struktur finalisieren | ~alle | 🟡 Nur Moves | Nach 3 |
| **5** | Cross-Cutting Concerns | ~10 | 🟢 Optional | Später |

---

## 📁 Ziel-Verzeichnisstruktur (nach Refaktor)

```
ADG Online/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
├── .vscode/
├── .github/
│   ├── copilot-instructions.md
│   ├── prompts/
│   └── agents/
├── .continue/
│   ├── mcpServers/
│   └── rules/
│
├── meta/
│   ├── roadmap.md                    ← aus root
│   ├── refactor-plan.md              ← DIESE DATEI
│   ├── todos/
│   │   ├── open/
│   │   │   ├── P0_todo.md
│   │   │   ├── P1_todo.md
│   │   │   ├── P2_todo.md
│   │   │   ├── P3_todo.md
│   │   │   ├── P4_todo.md
│   │   │   ├── P5_todo.md
│   │   │   ├── P6_todo.md
│   │   │   ├── P7_todo.md
│   │   │   ├── P7A_todo.md
│   │   │   ├── P7A2_todo.md
│   │   │   ├── P7B_todo.md
│   │   │   ├── P7C_todo.md
│   │   │   ├── P8_todo.md
│   │   │   ├── P9_todo.md
│   │   │   ├── P9_v2_todo.md
│   │   │   ├── CHARGE_DRILL_2_todo.md
│   │   │   ├── CLASSIC_PERIOD_todo.md
│   │   │   ├── CONFORM_DRILL_todo.md
│   │   │   ├── LOGGING_todo.md
│   │   │   ├── RULEBOOK_EXAMPLES_todo.md
│   │   │   ├── RULES_V2_todo.md
│   │   │   ├── SOURCE_OCR_todo.md
│   │   │   └── UNIT_CAPABILITIES_todo.md
│   │   ├── done/
│   │   │   └── (erledigte TODOs, die als Referenz bleiben)
│   │   └── archive/
│   │       └── (V1-bezogene TODOs, falls vorhanden)
│   ├── handoffs/
│   │   └── LAPTOP_HANDOFF_2026-05-24.txt
│   └── outputs/
│       ├── results.txt
│       ├── test_output.txt
│       ├── test_results.txt
│       ├── search_results.txt
│       ├── validation_results.txt
│       ├── p7_regression_results.txt
│       ├── regression_results.txt
│       ├── extracted_pages.txt
│       ├── summary.txt
│       └── output.log
│
├── tools/
│   ├── active/
│   │   ├── extract_pdf_text.py
│   │   ├── search_pdf.py
│   │   ├── search_pdfs.py
│   │   ├── search_rules.py
│   │   ├── read_movement.py
│   │   ├── read_results.py
│   │   └── reproduce_issue.js
│   └── archived/
│       ├── temp_pdf_extract.py
│       ├── temp_pdf_modcheck.py
│       ├── temp_pdf_render.py
│       ├── temp_snippet.js
│       ├── temp-zoc-search.mjs
│       ├── temp-dual-zoc-search.mjs
│       ├── temp-replay-smoke.mjs
│       ├── test-script.mjs
│       ├── fix_cohesion.cjs       ← eine Version behalten
│       ├── fix_cohesion.js        ← löschen
│       └── fix_cohesion.mjs       ← löschen
│
├── scripts/
│   └── start-vscode-lan.ps1
│
├── logs/                           ← bleibt wie es ist
│   ├── adg-browser-repro-current.jsonl
│   ├── adg-debug-current.jsonl
│   └── adg-debug-current.previous.jsonl
│
├── public/
│   ├── p8-source-checks/
│   └── replay-smoke.json
│
├── tasks/                          ← bleibt wie es ist (Task-Karten-System)
│   └── P9_v2/
│       ├── P9V2-20/
│       ├── P9V2-21/
│       ├── P9V2-22/
│       ├── P9V2-23/
│       ├── P9V2-24/
│       ├── P9V2-30/
│       ├── P9V2-31/
│       ├── P9V2-40/
│       ├── P9V2-MINI-11-12-15-16/
│       ├── P9V2-MINI-12/
│       ├── P9_v2-14/
│       └── P9_v2-15/
│
├── docs/
│   ├── architecture.md
│   ├── army-builder.md
│   ├── battlefield-visuals.md
│   ├── browser-automation.md
│   ├── charge-phase-procedure-concept.md
│   ├── placement-catalog-v1.md
│   ├── planning-review.md
│   ├── project-governance.md
│   ├── rules-knowledge.md
│   ├── source/
│   │   ├── Ancient_Period.md
│   │   ├── army-lists.md
│   │   ├── Classic_Period.md
│   │   ├── period-list-review-2026-05-23.md
│   │   ├── rules-v2-scan-review-2026-05-23.md
│   │   ├── rules.md
│   │   ├── Rules_v2.md
│   │   ├── rules-v2-examples/
│   │   │   ├── index.md
│   │   │   └── (viele .png Beispiel-Bilder)
│   │   ├── new scan/
│   │   │   ├── Ancient_Period.pdf
│   │   │   ├── Classical_Period.pdf
│   │   │   ├── Rules_Color_300DPI.pdf
│   │   │   ├── rendered/              ← viele .png Seiten
│   │   │   ├── rendered_check/        ← check .png Seiten
│   │   │   └── rules_color_review/
│   │   │       ├── scan_metrics.json
│   │   │       ├── scan_summary.txt
│   │   │       ├── contact_1-4.png
│   │   │       └── single_pages/      ← viele .png Seiten
│   │   └── konzepte/                  ← aus Root/Konzepte/ hierher verschoben
│   │       ├── ArmyLists1-82.pdf
│   │       ├── Army_list_spreadsheet_V4 (1).xlsx
│   │       ├── class.png
│   │       ├── Errata_ADG_V4_English.pdf
│   │       ├── Konzept.pdf
│   │       ├── merged.pdf
│   │       ├── Reference_Sheet_V4.pdf
│   │       ├── Reglettes.pdf
│   │       └── Rules.pdf
│   ├── rules/
│   │   ├── index.md
│   │   ├── charge.md
│   │   ├── command.md
│   │   ├── conformation.md
│   │   ├── errata.md
│   │   ├── hidden-info.md
│   │   ├── melee.md
│   │   ├── melee-decision-matrix.md
│   │   ├── movement.md
│   │   ├── movement-source-notes.md
│   │   ├── open-verification.md
│   │   ├── rout-and-pursuit.md
│   │   ├── sequence-of-play.md
│   │   ├── setup-source-notes.md
│   │   ├── shooting.md
│   │   ├── standard-200.md
│   │   ├── terrain-and-setup.md
│   │   ├── units-and-bases.md
│   │   └── zoc.md
│   └── agents/
│       ├── index.md
│       ├── README.md
│       ├── coding-agent.md
│       ├── lead-agent.md
│       ├── reviewer-agent.md
│       └── (diverse Handoff-Dokumente *.md)
│
└── src/
    ├── main.js
    ├── constants/                    ← NEU: falls später sinnvoll
    │   └── (magische Zahlen, Regel-Konstanten)
    │
    ├── engine/
    │   ├── charge/
    │   │   ├── evade/                ← NEU: aus evade-solver.js gesplittet
    │   │   │   ├── solver.js
    │   │   │   ├── geometry.js
    │   │   │   ├── validation.js
    │   │   │   ├── index.js
    │   │   │   └── *.test.js
    │   │   ├── classification.js
    │   │   ├── classification.test.js
    │   │   ├── contact.js
    │   │   ├── contact.test.js
    │   │   ├── declaration.js
    │   │   ├── declaration.test.js
    │   │   ├── evade-geometry.js     ← wird nach evade/geometry.js migriert
    │   │   ├── evade-model.js
    │   │   ├── evade-solver.js       ← wird in evade/ gesplittet
    │   │   ├── evade.js
    │   │   ├── evade.test.js         ← wird gesplittet
    │   │   ├── index.js
    │   │   ├── model.js
    │   │   ├── model.test.js
    │   │   ├── path.js
    │   │   ├── path.test.js
    │   │   ├── reaction.js
    │   │   └── reaction.test.js
    │   │
    │   ├── command/
    │   │   ├── cp.js
    │   │   ├── cp.test.js
    │   │   ├── in-command.js
    │   │   ├── index.js
    │   │   ├── range.js
    │   │   └── range.test.js
    │   │
    │   ├── conformation/
    │   │   ├── candidates.js
    │   │   ├── candidates.test.js
    │   │   ├── index.js
    │   │   ├── model.js
    │   │   ├── model.test.js
    │   │   ├── shifting.js
    │   │   └── shifting.test.js
    │   │
    │   ├── geometry/
    │   │   ├── angle.js
    │   │   ├── distance.js
    │   │   ├── facing-boundaries.js
    │   │   ├── facing-zones.js
    │   │   ├── geometry.test.js
    │   │   ├── index.js
    │   │   ├── rectangle.js
    │   │   ├── relationship.js
    │   │   ├── unit-base.js
    │   │   └── vector.js
    │   │
    │   ├── melee/                        ← V1 (deprecated)
    │   │   ├── contact-geometry.js
    │   │   ├── index.js
    │   │   ├── resolution.js
    │   │   ├── resolution.test.js
    │   │   ├── roles.js
    │   │   └── roles.test.js
    │   │
    │   ├── melee-v2/                     ← AKTIV
    │   │   ├── combat-matrix-v2.js
    │   │   ├── contact-model.js
    │   │   ├── factor-lookup.js
    │   │   ├── factor-lookup.test.js
    │   │   ├── modifier-pipeline.js
    │   │   ├── resolution/
    │   │   │   ├── combat-resolution.js  ← NEU: aus resolution.js gesplittet
    │   │   │   ├── outcome.js
    │   │   │   ├── pursuit.js
    │   │   │   └── index.js
    │   │   ├── resolution.js             ← wird gesplittet
    │   │   └── role-assignment.js
    │   │
    │   ├── movement/
    │   │   ├── validation/               ← NEU
    │   │   │   ├── advance.js
    │   │   │   ├── wheel.js
    │   │   │   ├── charge.js
    │   │   │   └── index.js
    │   │   ├── advance.js
    │   │   ├── budget.js
    │   │   ├── index.js
    │   │   ├── manoeuvre-classification.js
    │   │   ├── manoeuvre-classification.test.js
    │   │   ├── model.js
    │   │   ├── model.test.js
    │   │   ├── path-splitting.js
    │   │   ├── path-splitting.test.js
    │   │   ├── slide.js
    │   │   ├── validation.js             ← wird gesplittet
    │   │   ├── validation.test.js
    │   │   └── wheel.js
    │   │
    │   ├── setup/
    │   │   ├── ambush-markers.js
    │   │   ├── ambush-markers.test.js
    │   │   ├── battle-plan.js
    │   │   ├── battle-plan.test.js
    │   │   ├── deployment-placeholders.js
    │   │   ├── deployment-placeholders.test.js
    │   │   ├── setup-objects.js
    │   │   ├── setup-objects.test.js
    │   │   ├── terrain-placeholders.js
    │   │   ├── terrain-placeholders.test.js
    │   │   ├── terrain-validation.js
    │   │   └── terrain-validation.test.js
    │   │
    │   ├── shooting/
    │   │   ├── eligibility.js
    │   │   ├── eligibility.test.js
    │   │   ├── geometry.js
    │   │   ├── geometry.test.js
    │   │   ├── index.js
    │   │   ├── line-of-sight.js
    │   │   ├── line-of-sight.test.js
    │   │   ├── model.js
    │   │   ├── model.test.js
    │   │   ├── resolution.js
    │   │   ├── resolution.test.js
    │   │   ├── support.js
    │   │   ├── support.test.js
    │   │   ├── target-priority.js
    │   │   └── target-priority.test.js
    │   │
    │   ├── visibility/
    │   │   ├── setup-view.js
    │   │   └── setup-view.test.js
    │   │
    │   └── zoc/
    │       ├── geometry.js
    │       ├── geometry.test.js
    │       ├── index.js
    │       ├── most-threatening.js
    │       └── most-threatening.test.js
    │
    ├── state/
    │   ├── __fixtures__/                ← NEU: geteilte Test-Daten
    │   │   ├── sample-units.js
    │   │   ├── sample-battlefield.js
    │   │   └── sample-commands.js
    │   ├── core/                        ← NEU: aus p0-state.js
    │   │   ├── state-reducer.js
    │   │   ├── state-selectors.js
    │   │   ├── state-actions.js
    │   │   └── index.js
    │   ├── shooting/                    ← NEU: aus p0-shooting.js
    │   │   ├── shooting-reducer.js
    │   │   ├── shooting-helpers.js
    │   │   ├── shooting-selectors.js
    │   │   └── index.js
    │   ├── melee-v2/                    ← NEU: aus p9-melee-v2.js
    │   │   ├── melee-reducer.js
    │   │   ├── combat-pipeline.js
    │   │   ├── outcome-handler.js
    │   │   └── index.js
    │   ├── p0-advance.js
    │   ├── p0-battle-start.js
    │   ├── p0-charge-branch-helpers.js
    │   ├── p0-charge-choice-reducers.js
    │   ├── p0-charge-conformation-reducers.js
    │   ├── p0-charge-evade-helpers.js
    │   ├── p0-charge-follow-through-helpers.js
    │   ├── p0-charge-preview-helpers.js
    │   ├── p0-charge-preview-helpers.test.js
    │   ├── p0-charge-preview-reducers.js
    │   ├── p0-charge-reaction-reducers.js
    │   ├── p0-charge-state-helpers.js
    │   ├── p0-cohesion.js
    │   ├── p0-command-context.js
    │   ├── p0-commander-helpers.js
    │   ├── p0-commander-reducers.js
    │   ├── p0-corps-slot.js
    │   ├── p0-evade-move-state-helpers.js
    │   ├── p0-fixtures.js
    │   ├── p0-movement-stay-reducers.js
    │   ├── p0-movement.js
    │   ├── p0-reset-reducers.js
    │   ├── p0-round.js
    │   ├── p0-setup.js
    │   ├── p0-shell-reducers.js
    │   ├── p0-shooting.js               ← wird in shooting/ gesplittet
    │   ├── p0-shooting.test.js
    │   ├── p0-slide.js
    │   ├── p0-state-initializers.js
    │   ├── p0-state-ui-helpers.js
    │   ├── p0-state.js                  ← wird in core/ gesplittet
    │   ├── p0-state.test.js             ← 6.518 Zeilen! Wird gesplittet
    │   ├── p0-state-melee.test.js
    │   ├── p0-wheel.js
    │   ├── p9-melee.js                  ← V1, DEPRECATED
    │   ├── p9-melee.test.js             ← V1, DEPRECATED
    │   ├── p9-melee-v2.js               ← wird in melee-v2/ gesplittet
    │   └── p9-melee-v2.test.js          ← wird gesplittet
    │
    ├── ui/
    │   ├── command-panel/               ← NEU
    │   │   ├── panel-renderer.js
    │   │   ├── cp-display.js
    │   │   ├── range-overlay.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── battlefield/                 ← NEU
    │   │   ├── renderer.js
    │   │   ├── unit-manager.js
    │   │   ├── zoc-overlay.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── dialogs/                     ← NEU
    │   │   ├── charge-dialog.js
    │   │   ├── reaction-dialog.js
    │   │   ├── evade-dialog.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── app/                         ← NEU
    │   │   ├── routing.js
    │   │   ├── state-binding.js
    │   │   ├── init.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── battlefield-command-overlays.js
    │   ├── battlefield-command-panel.js      ← wird in command-panel/ gesplittet
    │   ├── battlefield-command-panel.test.js
    │   ├── battlefield-coordinate.js
    │   ├── battlefield-coordinate.test.js
    │   ├── battlefield-dialogs.js            ← wird in dialogs/ gesplittet
    │   ├── battlefield-drag-controls.js
    │   ├── battlefield-evade-overlays.js
    │   ├── battlefield-render-helpers.js
    │   ├── battlefield-setup-panels.js
    │   ├── battlefield-side-panel.js
    │   ├── battlefield-surface-overlays.js
    │   ├── battlefield-unit-visuals.js
    │   ├── melee-v2-adapter.js
    │   ├── p0-advance-controls.js
    │   ├── p0-app.js                        ← wird in app/ gesplittet
    │   ├── p0-app.test.js
    │   ├── p0-battlefield.js                ← wird in battlefield/ gesplittet
    │   ├── p0-battlefield.test.js
    │   ├── p0-slide-controls.js
    │   ├── p0-wheel-controls.js
    │   └── p0-wheel-controls.test.js
    │
    ├── data/
    │   ├── melee-drill/                  ← NEU
    │   │   ├── ancient.js
    │   │   ├── classical.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── charge-drill/                 ← NEU
    │   │   ├── basic.js
    │   │   ├── evade.js
    │   │   ├── zoc.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── unit-profiles/                ← NEU
    │   │   ├── foot.js
    │   │   ├── mounted.js
    │   │   ├── commanders.js
    │   │   ├── index.js
    │   │   └── *.test.js
    │   ├── battlefield-profiles.js
    │   ├── battlefield-profiles.test.js
    │   ├── charge-drill-scenarios.js     ← wird in charge-drill/ gesplittet
    │   ├── charge-drill-scenarios.test.js
    │   ├── conform-drill-scenarios.js
    │   ├── conform-drill-scenarios.test.js
    │   ├── melee-combat-factors.js
    │   ├── melee-drill-scenarios.js      ← wird in melee-drill/ gesplittet
    │   ├── melee-drill-scenarios.test.js
    │   ├── shooting-drill-scenarios.js
    │   ├── shooting-drill-scenarios.test.js
    │   ├── unit-profiles.js              ← wird in unit-profiles/ gesplittet
    │   └── unit-profiles.test.js
    │
    ├── debug/                            ← bleibt flach
    │   ├── browser-debug-logger.js
    │   ├── browser-debug-logger.test.js
    │   ├── browser-repro-contract.js
    │   ├── browser-repro-recorder.js
    │   ├── browser-repro-recorder.test.js
    │   ├── canonical-replay-contract.js
    │   ├── canonical-replay-contract.test.js
    │   ├── canonical-replay-executor.js
    │   ├── canonical-replay-executor.test.js
    │   ├── debug-log-contract.js
    │   ├── logging-config.js
    │   ├── logging-config.test.js
    │   ├── replay-divergence.js
    │   ├── replay-divergence.test.js
    │   ├── rule-logging.js
    │   ├── rule-logging.test.js
    │   ├── vite-debug-log-plugin.js
    │   └── vite-debug-log-plugin.test.js
    │
    └── styles/                           ← bleibt flach
        ├── p0-battlefield-panels.css
        ├── p0-battlefield.css
        ├── p0-foundation.css
        ├── p0-responsive.css
        └── p0.css
```

---

## 📋 Phasen-Details

### Phase 0: Root aufräumen (Low-Hanging Fruits)

**Ziel:** Müll und lose Dateien aus dem Root entfernen. Keine Logik-Änderung.

| # | Aktion | Details |
|---|--------|---------|
| 0.1 | `p9-melee-v2.js.tmp` löschen | Temp-Datei, nicht benötigt |
| 0.2 | `fix_cohesion` aufräumen | Eine Version behalten (`.js`), Rest in `tools/archived/` |
| 0.3 | Temp-Scripts verschieben | `temp_*.py`, `temp_*.mjs`, `temp_*.js` → `tools/archived/` |
| 0.4 | Lose `.txt`-Results verschieben | `results.txt`, `test_output.txt`, `test_results.txt`, `search_results.txt`, `validation_results.txt`, `p7_regression_results.txt`, `regression_results.txt`, `extracted_pages.txt`, `summary.txt` → `meta/outputs/` |
| 0.5 | `output.log` verschieben | → `meta/outputs/` |
| 0.6 | `Konzepte/` integrieren | → `docs/source/konzepte/` |
| 0.7 | `test.txt` verschieben | → `meta/outputs/` |
| 0.8 | `page40.png`, `page41.png` prüfen | Vermutlich obsolet? → `meta/outputs/` oder löschen |
| 0.9 | `LAPTOP_HANDOFF_2026-05-24.txt` | → `meta/handoffs/` |

**Ergebnis:** Root enthält nur noch: `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, und die Hauptordner (`src/`, `docs/`, `meta/`, `tools/`, `tasks/`, `scripts/`, `public/`, `logs/`).

---

### Phase 1: TODO- & Meta-Struktur

**Ziel:** Alle Projektmanagement-Dateien in einheitliches System unter `meta/`.

| # | Aktion | Details |
|---|--------|---------|
| 1.1 | `roadmap.md` verschieben | Root → `meta/roadmap.md` |
| 1.2 | TODO-Dateien verschieben | Alle `*_todo.md` aus Root → `meta/todos/open/` |
| 1.3 | `meta/todos/done/` anlegen | Für zukünftig erledigte TODOs |
| 1.4 | `meta/todos/archive/` anlegen | Für V1-bezogene oder komplett obsolete TODOs |
| 1.5 | `meta/handoffs/` anlegen | Für Handoff-Dokumente |
| 1.6 | `meta/outputs/` anlegen | Für Build/Test-Outputs |

**Zu verschiebende TODO-Dateien:**
- `P0_todo.md` → `meta/todos/open/`
- `P1_todo.md` → `meta/todos/open/`
- `P2_todo.md` → `meta/todos/open/`
- `P3_todo.md` → `meta/todos/open/`
- `P4_todo.md` → `meta/todos/open/`
- `P5_todo.md` → `meta/todos/open/`
- `P6_todo.md` → `meta/todos/open/`
- `P7_todo.md` → `meta/todos/open/`
- `P7A_todo.md` → `meta/todos/open/`
- `P7A2_todo.md` → `meta/todos/open/`
- `P7B_todo.md` → `meta/todos/open/`
- `P7C_todo.md` → `meta/todos/open/`
- `P8_todo.md` → `meta/todos/open/`
- `P9_todo.md` → `meta/todos/open/`
- `P9_v2_todo.md` → `meta/todos/open/`
- `CHARGE_DRILL_2_todo.md` → `meta/todos/open/`
- `CLASSIC_PERIOD_todo.md` → `meta/todos/open/`
- `CONFORM_DRILL_todo.md` → `meta/todos/open/`
- `LOGGING_todo.md` → `meta/todos/open/`
- `RULEBOOK_EXAMPLES_todo.md` → `meta/todos/open/`
- `RULES_V2_todo.md` → `meta/todos/open/`
- `SOURCE_OCR_todo.md` → `meta/todos/open/`
- `UNIT_CAPABILITIES_todo.md` → `meta/todos/open/`

---

### Phase 2: V1-Archiv & Deprecation

**Ziel:** V1-Code klar als "archiviert/nur Referenz" kennzeichnen, ohne ihn zu löschen.

| # | Aktion | Betroffene Dateien |
|---|--------|-------------------|
| 2.1 | Header-Kommentar in V1-Dateien einfügen | `src/engine/melee/*.js` (V1 engine), `src/state/p9-melee.js`, `src/state/p9-melee.test.js` |
| 2.2 | V1-Tests von CI ausschließen | Test-Konfiguration anpassen (z.B. `testPathIgnorePatterns` oder `@deprecated` Marker) |

**Deprecation-Header-Template:**
```js
/**
 * @deprecated V1 Melee System – kept for reference only.
 * Active implementation: src/state/p9-melee-v2.js and src/engine/melee-v2/
 *
 * DO NOT MODIFY. If V2 is missing functionality, implement it in melee-v2/.
 */
```

---

### Phase 3: Große Dateien splitten

**Reihenfolge nach Risiko: Daten → Engine → State → UI → Tests**

#### Stufe 3.1: Daten-Dateien (kein Risiko, reine Daten)

| Datei | Zeilen | Ziel-Struktur |
|-------|--------|---------------|
| `src/data/melee-drill-scenarios.js` | 1.967 | → `src/data/melee-drill/ancient.js`, `classical.js`, `index.js` |
| `src/data/melee-drill-scenarios.test.js` | 805 | → `src/data/melee-drill/ancient.test.js`, `classical.test.js` |
| `src/data/unit-profiles.js` | 812 | → `src/data/unit-profiles/foot.js`, `mounted.js`, `commanders.js`, `index.js` |
| `src/data/unit-profiles.test.js` | (13.85 KB) | → `src/data/unit-profiles/*.test.js` |
| `src/data/charge-drill-scenarios.js` | (22.79 KB) | → `src/data/charge-drill/basic.js`, `evade.js`, `zoc.js`, `index.js` |
| `src/data/charge-drill-scenarios.test.js` | (13.63 KB) | → `src/data/charge-drill/*.test.js` |
| `src/data/conform-drill-scenarios.js` | (9.75 KB) | Prüfen: Größer als 800 Zeilen? Wenn ja, splitten |

#### Stufe 3.2: Engine-Einzeldateien (isoliert, gute Testabdeckung)

| Datei | Zeilen | Split-Plan |
|-------|--------|------------|
| `src/engine/charge/evade-solver.js` | 2.380 | → `charge/evade/solver.js`, `geometry.js`, `validation.js`, `index.js` |
| `src/engine/charge/evade.test.js` | 1.162 | → `charge/evade/solver.test.js`, `geometry.test.js`, `validation.test.js` |
| `src/engine/melee-v2/resolution.js` | (14 KB) | → `melee-v2/resolution/combat-resolution.js`, `outcome.js`, `pursuit.js`, `index.js` |
| `src/engine/movement/validation.js` | (21 KB) | → `movement/validation/advance.js`, `wheel.js`, `charge.js`, `index.js` |
| `src/engine/movement/validation.test.js` | (16 KB) | → `movement/validation/*.test.js` |

#### Stufe 3.3: State-Dateien (komplex, viele Abhängigkeiten)

| Datei | Zeilen | Split-Plan |
|-------|--------|------------|
| `src/state/p0-state.js` | 1.642 | → `state/core/state-reducer.js`, `state-selectors.js`, `state-actions.js`, `index.js` |
| `src/state/p0-shooting.js` | 1.387 | → `state/shooting/shooting-reducer.js`, `shooting-helpers.js`, `shooting-selectors.js`, `index.js` |
| `src/state/p9-melee-v2.js` | 2.696 | → `state/melee-v2/melee-reducer.js`, `combat-pipeline.js`, `outcome-handler.js`, `index.js` |
| `src/state/p9-melee-v2.test.js` | 2.576 | → `state/melee-v2/*.test.js` + geteilte Fixtures |

#### Stufe 3.4: UI-Dateien (größtes Risiko, stark gekoppelt)

| Datei | Zeilen | Split-Plan |
|-------|--------|------------|
| `src/ui/p0-app.js` | 1.563 | → `ui/app/routing.js`, `state-binding.js`, `init.js`, `index.js` |
| `src/ui/p0-battlefield.js` | 1.583 | → `ui/battlefield/renderer.js`, `unit-manager.js`, `zoc-overlay.js`, `index.js` |
| `src/ui/battlefield-command-panel.js` | 1.496 | → `ui/command-panel/panel-renderer.js`, `cp-display.js`, `range-overlay.js`, `index.js` |
| `src/ui/battlefield-dialogs.js` | 1.091 | → `ui/dialogs/charge-dialog.js`, `reaction-dialog.js`, `evade-dialog.js`, `index.js` |

#### Stufe 3.5: Test-Dateien (nach Source-Split der entsprechenden Module)

| Datei | Zeilen | Plan |
|-------|--------|------|
| `src/state/p0-state.test.js` | 6.518 | Gemeinsame Fixtures in `state/__fixtures__/`, dann nach Source-Modulen splitten |
| `src/ui/battlefield-command-panel.test.js` | 2.594 | Fixtures auslagern, dann nach Source-Modulen splitten |
| `src/ui/p0-battlefield.test.js` | 2.541 | Analog |
| `src/ui/p0-app.test.js` | (30.79 KB) | Prüfen: >800 Zeilen? Wenn ja, splitten |

**Split-Regeln für Stufe 3:**
1. Vor jedem Split: Aktuelle Tests laufen lassen → Baseline
2. Split durchführen (nur Moves + neue index.js Barrel-Exports)
3. Tests laufen lassen → müssen identisch zur Baseline sein
4. Wenn Tests fehlschlagen: Zurückrollen und Ursache analysieren
5. Nächsten Split erst nach erfolgreichem vorherigem Split

---

### Phase 4: Unterordner-Struktur finalisieren

**Ziel:** Automatisch entstandene Subfolder aus Phase 3 konsolidieren. Prüfen, ob alle `index.js` Barrel-Exports korrekt sind.

| # | Aktion |
|---|--------|
| 4.1 | Alle `index.js`-Dateien auf korrekte Exports prüfen |
| 4.2 | Import-Pfade in allen Dateien aktualisieren (falls nötig) |
| 4.3 | Gesamte Test-Suite laufen lassen |
| 4.4 | `src/main.js` prüfen – sind alle Imports noch korrekt? |

---

### Phase 5: Cross-Cutting Concerns (optional)

| # | Thema | Beschreibung |
|---|-------|-------------|
| 5.1 | Test-Fixtures-Bibliothek | `src/state/__fixtures__/` als Vorbild – für ALLE Module nutzbar machen |
| 5.2 | Magische Zahlen extrahieren | Regel-Konstanten aus Engine in `src/constants/rules.js` |
| 5.3 | JSDoc-Type-Definitions | Für bessere IDE-Unterstützung (kein TypeScript-Zwang) |
| 5.4 | Barrel-Exports auditieren | Jeder Ordner hat konsistente `index.js` |
| 5.5 | `melee-v2-adapter.js` prüfen | UI-Datei in `src/ui/` – passt die noch? |

---

## ⚠️ Risiken & Gegenmaßnahmen

| Risiko | Phase | Gegenmaßnahme |
|--------|-------|---------------|
| Import-Pfade brechen nach Split | 3, 4 | Jeder Split-Schritt wird einzeln getestet |
| State-Management koppelt an zu vielen Stellen | 3.3 | Vorher Abhängigkeitsgraph erstellen |
| UI-Rendering ändert Verhalten | 3.4 | Visuelle Regression-Tests (Screenshots?) |
| V1-Code wird versehentlich doch gelöscht | 2 | Nur Header-Kommentare, kein `git rm` |
| Test-Fixtures werden inkonsistent | 3.5 | Zuerst Fixtures definieren, dann Tests splitten |

---

## 📊 Fortschritts-Tracking

| Phase | Status | Start-Datum | Ende-Datum | Task-Karten |
|-------|--------|-------------|------------|-------------|
| 0 | ⬜ Geplant | – | – | – |
| 1 | ⬜ Geplant | – | – | – |
| 2 | ⬜ Geplant | – | – | – |
| 3.1 | ⬜ Geplant | – | – | – |
| 3.2 | ⬜ Geplant | – | – | – |
| 3.3 | ⬜ Geplant | – | – | – |
| 3.4 | ⬜ Geplant | – | – | – |
| 3.5 | ⬜ Geplant | – | – | – |
| 4 | ⬜ Geplant | – | – | – |
| 5 | ⬜ Geplant | – | – | – |

---

## 📝 Session-Notizen

- **2026-06-02:** Plan erstellt in Diskussion mit Coding-Agent. Leitplanken definiert, 6-Phasen-Struktur festgelegt. Nächster Schritt: Task-Karten für Phase 0 extrahieren.
- **Entscheidungen getroffen:**
  - `roadmap.md` → `meta/roadmap.md`
  - V1 bleibt, wird als deprecated markiert
  - TODOs bleiben alle erhalten in `meta/todos/`
  - `Konzepte/` → `docs/source/konzepte/`
  - Temp-Scripts → `tools/archived/`
  - `fix_cohesion` nur eine Version behalten

---

> **Nächste Session:** Phase 0 starten – Task-Karten aus dem Plan extrahieren und abarbeiten.
