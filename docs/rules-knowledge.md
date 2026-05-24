# Rules Knowledge Plan

## Purpose

The project needs AI-readable rule knowledge in addition to the original PDFs. The PDFs remain authoritative, but markdown and structured data are required so agents can search, reason, test, and explain rules without repeatedly relying on visual PDF inspection.

## Current Source Status

- `Errata_ADG_V4_English.pdf` extracts as readable text and should be converted early.
- `Konzept.pdf` extracts as readable text and already informs the architecture.
- `Reglettes.pdf` extracts partially and provides movement ruler distance categories.
- `Rules.pdf` is effectively image-based in this workspace. It must be rendered, OCR'd or manually transcribed, and human-verified.
- `ArmyLists1-82.pdf` is effectively image-based in this workspace. It must be rendered, OCR'd or manually transcribed, and human-verified.
- `merged.pdf` is an OCR working copy that currently combines the army lists before the rules in the wrong order. It is useful for search, extraction, and rough cross-checking, but it is not authoritative and must fall back to the original PDFs plus errata whenever OCR quality or ordering is unclear.
- `Army_list_spreadsheet_V4 (1).xlsx` is readable through spreadsheet tooling and should be used to cross-check list index, formats, point totals, and calculator logic.

## Target Rule Knowledge Structure

```text
docs/source/
  rules.md
  army-lists.md

docs/rules/
  index.md
  errata.md
  glossary.md
  sequence-of-play.md
  units-and-bases.md
  command.md
  terrain-and-setup.md
  movement.md
  zoc.md
  charge.md
  evasion.md
  conformation.md
  shooting.md
  melee.md
  rout-pursuit-and-victory.md
  army-lists.md
  open-verification.md
```

`docs/source/rules.md` and `docs/source/army-lists.md` are the planned durable source corpus files from the intensive OCR pass. They should be complete in coverage, written in original project wording, and source-referenced. For rules work, `docs/source/rules.md` remains the broad routing and backfill corpus, while `docs/source/Rules_v2.md` is the working default lookup layer for hardened rule-sensitive areas once the relevant RV2 source-lock notes exist.

SOCR-04 QA note:

- The source corpus files now contain explicit QA snapshot sections and should be treated as the first lookup layer for planning even before every subsection is verified.
- `docs/source/rules.md` is the broad planning-first rule corpus and backfill layer for non-hardened areas.
- `docs/source/Rules_v2.md` is the active color-scan rules corpus for RV2 work and the working default source layer for hardened rule-sensitive planning; for P7A2/P7B/P8+ planning, prefer it plus `docs/source/rules-v2-examples/index.md` over the older OCR-era `docs/source/rules.md` wherever the relevant RV2-04 area has been hardened.
- `docs/source/army-lists.md` is the planning-first army-list corpus.
- `docs/rules/open-verification.md` remains the single unresolved-source tracker that gates which corpus entries are still unsafe for implementation.
- When a topic file in `docs/rules/` summarizes a rule area, it should prefer linking or pointing to the corpus section and open-verification IDs instead of restating uncertain OCR-derived details.

SOCR-04 corpus-to-blocker mapping:

- Hardened `sequence`, `command`, `movement`, `zoc`, `charge`, `conformation`, `shooting`, `melee`, `rout-pursuit`, `terrain/setup`, and `standard-200` questions should start from `docs/source/Rules_v2.md`, `docs/source/rules-v2-examples/index.md`, and the matching `docs/rules/` source-lock notes, then be checked against the matching blocker IDs in `docs/rules/open-verification.md`.
- Non-hardened or broad backfill rules questions may still start from `docs/source/rules.md`, but that OCR-era corpus no longer outranks the Rules-v2 source-lock surface in hardened areas.
- `army-lists`, list restrictions, ally windows, replacements, and commander-linked list notes should start from `docs/source/army-lists.md` and then be checked against the corresponding `army-lists` blocker IDs in `docs/rules/open-verification.md`.
- If a phase only needs one narrow source area, upgrade that local corpus section and blocker state first instead of widening the OCR pass.

RV2-04 source-lock note:

- `docs/rules/sequence-of-play.md`, `docs/rules/command.md`, `docs/rules/movement.md`, and `docs/rules/zoc.md` are the Rules-v2-facing workspace notes for the sequence/command/movement/ZOC block.
- `docs/rules/shooting.md`, `docs/rules/melee.md`, `docs/rules/rout-and-pursuit.md`, `docs/rules/terrain-and-setup.md`, and `docs/rules/standard-200.md` now extend that source-lock surface through combat, terrain/setup, and default format-profile anchors.
- These files record scan-confirmed baselines and keep exact errata/manual-acceptance questions in `docs/rules/open-verification.md`.
- The older `docs/source/rules.md` remains useful as a broad routing/backfill corpus, but for these hardened areas it no longer outranks the Rules-v2 source-lock surface.

The topic files under `docs/rules/` remain implementation-facing summaries and rule-area workspaces. They should link back to the source corpus rather than duplicating long extracted sections.

Structured data derived from those markdown files should later live under `src/data/rules/`, but implementation and data files are phase work, not part of the current planning pass.

## Rule Entry Format

Each extracted rule section should use a repeatable format.

```markdown
## Rule ID: movement.slide.basic

Source: Rules.pdf, page X; Errata_ADG_V4_English.pdf, page Y if amended
Status: verified | ocr-assisted | needs-source-check | superseded-by-errata | blocked
Applies to: movement, slide, unit, group

Rule text summary:
- ...

Engine invariant:
- ...

Validation consequences:
- Legal when ...
- Illegal when ...

Edge cases:
- ...

Test fixtures:
- ...

Open verification:
- reference `docs/rules/open-verification.md` item ids when unresolved
```

The summary must be original project wording. Do not paste large copyrighted passages from the rulebook. Use short references and derived facts.

Status meaning:

- `verified`: authoritative source and errata checked directly.
- `ocr-assisted`: OCR helped draft the note, but the authoritative source was still checked before relying on it.
- `needs-source-check`: useful planning note, not yet verified directly.
- `superseded-by-errata`: the rulebook text exists, but errata changes the effective rule.
- `blocked`: too unclear to support implementation safely.

## Extraction Workflow

1. Render the relevant PDF pages at readable resolution.
2. Prefer OCR working copies such as `merged.pdf` as search aids when they speed up locating rule text.
3. Fall back to the original source PDF and errata whenever OCR wording, page ordering, table layout, or diagrams are unclear.
4. OCR or manually transcribe the target section where needed.
5. Summarize rules in original wording.
6. Record source page, extraction status, OCR helper used if any, and errata amendments.
7. Convert tables into structured markdown and later JSON.
8. Add open verification notes for unclear diagrams, ambiguous wording, or OCR uncertainty.
9. Review the result with AdG-Rules-Engine-Agent.
10. Use extracted rules to design tests before implementation.

For the one-time intensive OCR corpus pass, use `SOURCE_OCR_todo.md` as the execution board. The target files are exactly:

- `docs/source/rules.md`
- `docs/source/army-lists.md`

These corpus files should not be raw full-text reproductions of the commercial PDFs. They should be complete project digests with source references, structured tables, errata overlays, and verification status.

SOCR-00 page-map rule:

- `merged.pdf` pages 1-51 correspond to `ArmyLists1-82.pdf` pages 1-51.
- `merged.pdf` pages 52-135 correspond to `Rules.pdf` pages 1-84.
- Rule lookup from OCR helper uses `Rules.pdf page = merged.pdf page - 51`.
- Army-list lookup from OCR helper uses the same page number as the original army-list PDF.

SOCR-01 tooling decision:

- Use existing `merged.pdf` OCR text as the first extraction helper.
- Use `pdfplumber` or PyMuPDF for text extraction.
- Use `openpyxl` for army-list spreadsheet cross-checks.
- Defer installing a fresh OCR stack until a specific source section cannot be resolved from `merged.pdf`, original PDF page review, errata, and spreadsheet checks.

SOCR army-list reading rules:

- For army-list pages, visual page structure outranks raw OCR line order. Bold subsection headers, color bands, and visible block separation control scope.
- On two-column army-list spreads, treat each column as its own page for reading order. Read one full column top-to-bottom, then move to the next column in printed-page order; do not merge rows across columns just because their OCR `top` values align.
- When the user cites army-list page numbers during calibration, interpret them as the printed footer page numbers in the book unless stated otherwise.
- A bold subsection header applies to the following rows and notes until the next bold subsection header unless the page explicitly breaks that rule.
- Visually separate color-bounded row groups must not be merged just because OCR interleaves them.
- `replace all` usually means the new troop type inherits the min/max slot of the replaced troop block unless the page explicitly gives new min/max values.
- Related modifiers such as `replace 1/2`, `min halve`, and `max halve` should be read as transformations of the inherited slot, not as creation of a new independent slot by default.
- Terrain or subgroup labels in army-list headers often scope terrain, allies, and explicitly named troop hooks only; they should not be assumed to bind unrelated troop blocks unless the page layout shows that binding.
- When OCR and visible layout disagree, prefer the page image and mark the corpus row as needing source check rather than forcing a precise but unstable normalization.
- Apply these reading rules retroactively to existing army-list corpus entries, not only to new extraction work. Older entries that rely on page continuation, interleaved columns, bold subsection scope, or replacement inheritance should be re-audited before they are treated as stable planning anchors.
- Verified calibration examples so far: `List 68 - Later Achaemenid Persian` for bold subsection scoping and special-case notes; `List 75 - Early Arab` for color/section block order and inherited min/max under `replace all warriors`; `List 76/77 - Scythian/Sarmatian` for column-as-page reading order across a two-column spread.

`docs/rules/open-verification.md` is the only central unresolved-source tracker. Rule-area files should point to it, not duplicate unresolved-source lists independently.

## Rule Table Strategy

Some facts belong in global rule tables, not on unit instances.

Examples:

- movement allowance by troop type, formation, terrain, road, and special state;
- combat factors by troop type, enemy troop family, contact type, first-round status, terrain, support, and abilities;
- cohesion loss tables;
- command point costs;
- charge range adjustments;
- ZOC exceptions;
- terrain placement and combat effects.

The unit instance should store current state. It should not duplicate derived table facts unless the value is a logged decision or temporary cached explanation.

## Open Extraction Priorities

1. Sequence of play and all phases.
2. Unit characteristics, bases, cohesion, and abilities.
3. Command and CP system.
4. Terrain placement, deployment, ambushes, camps, fortifications, obstacles, roads, rivers, hills, and villages.
5. Movement allowances and maneuver restrictions.
6. ZOC, most-threatening enemy, and ZOC movement restrictions.
7. Charge, evade, contact, and conformation.
8. Shooting and melee combat tables.
9. Rout, pursuit, army cohesion, victory, and end-game conditions.
10. Army list and points data.

## Implementation Gate

No feature phase may rely on a rule area until that area has either:

- a verified markdown extract;
- a verified structured data table;
- or an explicit open-verification note accepted by the user for that phase.
