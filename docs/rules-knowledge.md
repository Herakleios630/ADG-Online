# Rules Knowledge Plan

## Purpose

The project needs AI-readable rule knowledge in addition to the original PDFs. The PDFs remain authoritative, but markdown and structured data are required so agents can search, reason, test, and explain rules without repeatedly relying on visual PDF inspection.

## Current Source Status

- `Errata_ADG_V4_English.pdf` extracts as readable text and should be converted early.
- `Konzept.pdf` extracts as readable text and already informs the architecture.
- `Reglettes.pdf` extracts partially and provides movement ruler distance categories.
- `Rules.pdf` is effectively image-based in this workspace. It must be rendered, OCR'd or manually transcribed, and human-verified.
- `ArmyLists1-82.pdf` is effectively image-based in this workspace. It must be rendered, OCR'd or manually transcribed, and human-verified.
- `Army_list_spreadsheet_V4 (1).xlsx` is readable through spreadsheet tooling and should be used to cross-check list index, formats, point totals, and calculator logic.

## Target Rule Knowledge Structure

```text
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

Structured data derived from those markdown files should later live under `src/data/rules/`, but implementation and data files are phase work, not part of the current planning pass.

## Rule Entry Format

Each extracted rule section should use a repeatable format.

```markdown
## Rule ID: movement.slide.basic

Source: Rules.pdf, page X; Errata_ADG_V4_English.pdf, page Y if amended
Status: verified | needs-source-check | superseded-by-errata
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
```

The summary must be original project wording. Do not paste large copyrighted passages from the rulebook. Use short references and derived facts.

## Extraction Workflow

1. Render the relevant PDF pages at readable resolution.
2. OCR or manually transcribe the target section.
3. Summarize rules in original wording.
4. Record source page, extraction status, and errata amendments.
5. Convert tables into structured markdown and later JSON.
6. Add open verification notes for unclear diagrams or ambiguous wording.
7. Review the result with AdG-Rules-Engine-Agent.
8. Use extracted rules to design tests before implementation.

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
