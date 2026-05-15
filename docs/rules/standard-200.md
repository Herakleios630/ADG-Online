# Standard 200-Point Format

Status: planning profile with partial source verification; not a complete roster or setup extract.

## Source References

- `Rules.pdf`, budget section around page 81.
- `Rules.pdf`, setup section around pages 73-79.
- `Army_list_spreadsheet_V4 (1).xlsx`, `Standard format (200 pts)` sheet.
- `Errata_ADG_V4_English.pdf` for corrections that affect setup, camps, deployment, or army-list interpretation.
- `merged.pdf` as OCR helper only when locating matching rulebook or army-list passages.

## Source Status

- `verified`: the spreadsheet contains an explicit `Standard format (200 pts)` worksheet and the project default target is standard 200.
- `needs-source-check`: exact budget-table values, list interactions, and setup restrictions still need authoritative rulebook plus errata confirmation.
- `ocr-assisted`: OCR helpers may be used to locate candidate text, but they do not replace direct source verification.

## Project Default

AdG Online is designed first for standard 200-point tournament training.

Default assumptions:

- 200 points per army;
- 3 corps per army;
- each corps has a commander;
- each army has a mandatory camp;
- standard camp is free, sacred/fortified camp and fortifications/obstacles have budget effects;
- command and camp budget values follow the standard 200-point table;
- standard 6-15 mm battlefield profile is 120 x 80 cm with UD = 4 cm;
- armies often contain about 20-30 units, but exact legality comes from list and budget validation.

These are planning defaults for AdG Online's first complete ruleset profile. They are sufficient for phase planning, but not yet a claim that all Standard 200 legality details have been fully verified.

## Profile Fields Required Later

The `standard-200` profile should eventually provide at least these data fields:

- `formatId`: `standard-200`
- `rulesetVersion`: active AdG V4 plus errata snapshot identifier
- `playerCount`: `2`
- `pointsPerArmy`: `200`
- `corpsPerArmy`: `3`
- `commanderRequirement`: one commander per corps unless a verified exception applies
- `campRequirement`: mandatory camp
- `campBudgetModel`: standard, sacred, fortified, and obstacle-related budget hooks
- `battlefieldProfileId`: standard 6-15 mm table profile
- `battlefieldWidthCm`: `120`
- `battlefieldDepthCm`: `80`
- `udInCm`: `4`
- `initiativeInputs`: all values required before attacker or defender and region choice
- `setupFlowProfile`: reference to the verified Standard 200 setup sequence
- `armyListSourceModel`: printed lists plus spreadsheet cross-check, with errata overlay support

## Verified Planning Facts

- AdG Online targets `standard-200` as the default product profile.
- The project assumes `2` players, `200` points per army, `3` corps per army, and a mandatory camp as the planning baseline.
- The standard battlefield planning target is `120 cm x 80 cm` for 6-15 mm with `1 UD = 4 cm`.
- The spreadsheet source explicitly includes a `Standard format (200 pts)` worksheet, so the format exists as a structured source surface and not only as prose.

## Engine Invariants

- `standard-200` is the default format unless the user explicitly selects another mode.
- Roster validation must fail if the army exceeds 200 points.
- Roster validation must require the standard corps/commander structure unless a verified rule exception applies.
- Camp state must exist during setup and on the battlefield.
- Army list minima/maxima and point costs must come from data, not from UI code.

## Data Separation Implications

- `standard-200` is a format profile, not a mere UI preset.
- Army list legality, commander structure, camp options, setup sequence, battlefield profile, and initiative hooks should reference this profile or linked rule tables.
- Unit instances must not store format rules such as point cap, corps count, or camp requirements directly.
- Future roster validation should combine this profile with army-list data and errata overlays rather than hard-coding Standard 200 assumptions into UI flows.

## Open Verification

- Exact commander/camp budget table values for standard 200.
- Exact treatment of allied or unreliable commanders in 200-point format.
- Exact camp, fortified camp, sacred camp, fortification, and obstacle point costs.
- Any official tournament convention beyond the rulebook that should become a selectable ruleset profile.
- Exact initiative inputs and attacker or defender decision hooks required before terrain and setup.
- Whether any Standard 200 format exceptions depend on army-list family, allies, or campaign-specific notes.

## P1 Notes

- This file is meant to give P2-P4 and P11 a stable profile target, not to finish army-builder legality in P1.
- Unverified budget or list details must be tracked in `docs/rules/open-verification.md` before any implementation claims depend on them.
- Terrain-region structure, camp-placement legality, and official deployment-zone math remain P3-sensitive blockers and should stay linked to `docs/rules/terrain-and-setup.md` plus `docs/rules/open-verification.md` until directly verified.
