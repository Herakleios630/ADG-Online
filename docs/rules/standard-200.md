# Standard 200-Point Format

Status: RV2-04 source-lock baseline for default format profile and budget/setup anchors; army-list cross-check and exact table import still require later manual acceptance.

## Source References

- `docs/source/Rules_v2.md` `rv2.setup-terrain-selection-and-placement`, `rv2.ambushes-and-deployment`, `rv2.flank-marches-and-hesitant-corps`, and `rv2.budget-and-force-costing`.
- Example crops: `rv2-p73-compulsory-terrain-table-a`, `rv2-p74-terrain-selection-table-a`, `rv2-p78-deployment-zones-a`, `rv2-p81-budget-commander-camp-a`, `rv2-p81-budget-foot-units-a`, `rv2-p81-budget-mounted-units-a`.
- `Army_list_spreadsheet_V4 (1).xlsx`, `Standard format (200 pts)` sheet.
- `docs/rules/errata.md` for corrections affecting setup, camps, deployment, combat objects, and army-list interpretation.

## Scan-Confirmed Baseline

- Default core format is standard `200` points with `2` players, `3` corps per army, and a mandatory camp.
- The standard battlefield profile is `120 x 80 cm` for `6-15 mm`, with `1 UD = 4 cm`.
- Initiative before setup uses commander values, strategist bonus, and scouting, then determines region choice plus attacker/defender role.
- Standard format setup includes battle plans, ambushes, visible deployment, flank marches, and dismounting as part of the baseline sequence, not optional add-ons.
- The budget page on p.81 is the authoritative rules-side cost framework for commanders, camp variants, fortifications, obstacles, troop classes, qualities, and priced options.
- The army-list corpus and spreadsheet remain necessary to determine legal troop availability and some list-specific structure, but p.81 is the format-side bridge between force construction and battlefield rules.
- Optional reduced, big-battle, random-factor, reroll, card, and event systems belong to later variant profiles and must not leak into the default standard-200 ruleset.

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

These are the default product-target assumptions for AdG Online. They are now source-locked at the profile level, but exact imported table values and army-list overlays still need later cross-check before implementation-grade builder claims.

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

## Engine Invariants

- `standard-200` is a rules profile, not a UI preset. Commander structure, camp requirements, budget hooks, battlefield profile, initiative inputs, and setup flow should reference this profile or linked tables.
- Budget logic must be data-driven from p.81 plus army-list data; no UI path should hardcode costs for commanders, camps, fortifications, or troop options.
- Optional format packages from p.82-85 must be modeled as separate variant overlays, not as silent switches inside standard-200 defaults.
- Current army cohesion value, camp type, and commander/corps structure interact with later rout and victory logic and cannot be stored as isolated roster-only metadata.

## Edge Cases And Test Hooks

- Initiative tests: strategist bonus, scouting differential cap, attacker/defender choice, and region-choice handoff into setup.
- Budget tests: standard versus fortified or sacred camp, included commanders, allied or unreliable commanders, fortifications, obstacles, and optional priced unit upgrades.
- Profile-boundary tests: reduced/big-battle/event systems stay excluded unless the user explicitly selects another ruleset profile.

## Data Separation Implications

- `standard-200` is a format profile, not a mere UI preset.
- Army list legality, commander structure, camp options, setup sequence, battlefield profile, and initiative hooks should reference this profile or linked rule tables.
- Unit instances must not store format rules such as point cap, corps count, or camp requirements directly.
- Future roster validation should combine this profile with army-list data and errata overlays rather than hard-coding Standard 200 assumptions into UI flows.

## Open Verification

- `standard-200.budget-table.values`, `army-budget.core-vs-optional-profile-boundary`, and `standard-200.initiative-inputs` remain in `docs/rules/open-verification.md` as narrowed table-import, variant-boundary, and manual-acceptance checks.
- Army-list-family exceptions and spreadsheet cross-checks remain open until RV2-05 and later army-builder alignment work is completed.

## Scope Note

- This file gives later setup, budget, rout, and army-builder work a stable default profile target; it does not by itself finish army-builder legality.
