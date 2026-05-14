# Standard 200-Point Format

Status: initial planning extract; requires full source verification before implementation.

## Source References

- `Rules.pdf`, budget section around page 81.
- `Rules.pdf`, setup section around pages 73-79.
- `Army_list_spreadsheet_V4 (1).xlsx`, `Standard format (200 pts)` sheet.

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

## Engine Invariants

- `standard-200` is the default format unless the user explicitly selects another mode.
- Roster validation must fail if the army exceeds 200 points.
- Roster validation must require the standard corps/commander structure unless a verified rule exception applies.
- Camp state must exist during setup and on the battlefield.
- Army list minima/maxima and point costs must come from data, not from UI code.

## Open Verification

- Exact commander/camp budget table values for standard 200.
- Exact treatment of allied or unreliable commanders in 200-point format.
- Exact camp, fortified camp, sacred camp, fortification, and obstacle point costs.
- Any official tournament convention beyond the rulebook that should become a selectable ruleset profile.
