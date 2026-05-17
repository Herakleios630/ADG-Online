# Rules Knowledge Index

This directory is the AI-readable rules workspace for AdG Online. The original PDFs in `Konzepte/` remain authoritative. Files here contain original project summaries, derived invariants, data-table plans, test ideas, and source references.

Do not paste long copyrighted rulebook passages here. Summarize in project wording and cite the source document and page for verification.

## Working Rules

- Treat every markdown file in this folder as working knowledge, never as the primary authority source.
- Errata overrides the base rules wherever they conflict.
- OCR helpers may speed up search and draft extraction, but they do not replace authoritative source verification.
- Any rule fact that will later affect engine legality, validation, data tables, or tests must be verified against the original source PDFs and errata.
- `open-verification.md` is the single repository tracker for unresolved rule-source questions. Do not split unresolved source checks across multiple files.

## Source Priority

1. `Konzepte/Errata_ADG_V4_English.pdf`
2. `Konzepte/Rules.pdf`
3. `Konzepte/ArmyLists1-82.pdf`
4. `Konzepte/Army_list_spreadsheet_V4 (1).xlsx`
5. `Konzepte/Reglettes.pdf`
6. `Konzepte/Konzept.pdf`

## OCR Working Copies

- `Konzepte/merged.pdf` is an OCR working copy, not an authority source.
- It currently contains the army-list material before the rules material in the wrong order.
- Use it as a search and extraction aid when it is faster than visual page inspection.
- When OCR wording, page order, tables, or diagrams are uncertain, fall back to the original source PDFs and errata.
- Any rule fact that affects engine behavior must still be verified against the authoritative originals before implementation claims depend on it.

## Source Status Labels

Use these labels consistently in rule docs and extraction notes:

- `verified`: checked against the authoritative source PDF and errata if applicable.
- `ocr-assisted`: drafted with OCR help but still checked against the authoritative source before being treated as reliable.
- `needs-source-check`: useful planning note, but not yet verified against the authoritative source.
- `superseded-by-errata`: base-rule wording exists, but errata changes the rule and wins.
- `blocked`: the relevant source fact is still too unclear to rely on for implementation.

## Planned Files

- `errata.md`
- `glossary.md`
- `sequence-of-play.md`
- `standard-200.md`
- `units-and-bases.md`
- `command.md`
- `terrain-and-setup.md`
- `setup-source-notes.md`
- `movement-source-notes.md`
- `hidden-info.md`
- `movement.md`
- `zoc.md`
- `charge.md`
- `evasion.md`
- `conformation.md`
- `shooting.md`
- `melee.md`
- `rout-pursuit-and-victory.md`
- `army-lists.md`
- `open-verification.md`

## Current Status

- Rulebook: image-based, requires rendered-page review, OCR, or manual extraction.
- Army lists: image-based, requires rendered-page review, OCR, or manual extraction.
- OCR helper: `merged.pdf` exists and is useful for text search, but it has wrong document order and may contain OCR inaccuracies.
- Errata: text extraction available and should be summarized early.
- Spreadsheet: readable and useful for army index, points formats, and calculator cross-checks.
- Initial planning extracts now exist for standard-200, sequence of play, terrain/setup, hidden information, errata, and a focused P4 movement source-status note. They are not complete implementation sources until verified.
- A focused planning blueprint now exists for units, bases, roster boundaries, and shared rule-table separation in `units-and-bases.md`.

## Rule Extraction Format

Use the format from `docs/rules-knowledge.md` for every extracted rule entry.

Minimum rule-entry fields:

- rule id;
- source reference with page numbers where known;
- status label;
- short original-language summary in project wording;
- engine invariants;
- validation consequences or future data needs;
- open verification references when unresolved.

## Verification Workflow

1. Locate the rule area in the authoritative source set.
2. Use OCR helpers only as accelerators, never as substitutes for verification.
3. Summarize the rule in original wording without copying long passages.
4. Record source reference, status label, and errata interaction.
5. If anything remains unclear, add it to `open-verification.md` instead of silently guessing.
6. Only after that may later phases treat the extract as planning input.

## P2 Geometry Assumptions

- P2 fundamental geometry may proceed without waiting for the current P3+ setup, terrain, disclosure, or phase-order open verification items.
- P2 may derive front/flank/rear-style geometric relationships from rotated rectangles and base dimensions as planning and debug outputs.
- These geometry outputs are not authoritative rule verdicts for charge legality, ZOC, conformation, contact, combat, or terrain interaction.
- P2 debug overlays are developer tooling and must stay distinct from user-facing rule claims.
- If a future implementation step needs official rules to resolve a boundary or ambiguity, that rule question must be checked against the authoritative source set or kept open in `open-verification.md`.
