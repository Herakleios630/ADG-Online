# Terrain And Setup

Status: RV2-04 source-lock baseline for terrain fundamentals and setup sequence from Rules-v2 p.70-80; hidden-info disclosure details and some setup-state boundaries still require later manual acceptance.

Historical implementation map: [setup-source-notes.md](setup-source-notes.md) remains the older P3 placeholder guide, but this file is now the Rules-v2-facing source lock for terrain/setup rule knowledge.

## Source References

- `docs/source/Rules_v2.md` `rv2.terrain-fundamentals`, `rv2.setup-terrain-selection-and-placement`, `rv2.terrain-adjustment-and-camps`, `rv2.ambushes-and-deployment`, and `rv2.flank-marches-and-hesitant-corps`.
- Example crops: `rv2-p71-river-difficulty-table-a`, `rv2-p71-hills-visibility-a`, `rv2-p72-terrain-table-a`, `rv2-p73-compulsory-terrain-table-a`, `rv2-p74-terrain-selection-table-a`, `rv2-p75-terrain-sectors-a`, `rv2-p75-terrain-position-table-a`, `rv2-p76-terrain-adjustment-table-a`, `rv2-p77-ambush-zones-a`, `rv2-p78-deployment-zones-a`.
- `docs/rules/errata.md`, especially terrain, deployment, and combat-across-terrain corrections.
- `Reference_Sheet_V4.pdf` as quick-reference cross-check only; it does not override errata or full rules.

## Scan-Confirmed Baseline

- Terrain is a first-class rules object because it changes movement, combat, visibility, cover, ambush rights, and setup constraints.
- Area terrain must fit inside a `6 UD` circle and contain a `2 UD x 3 UD` rectangle. Fields, plantations, and villages are rectangular; roads and rivers are linear features.
- Core terrain categories are `open`, `rough`, `difficult`, and `impassable`, with named terrain types refining movement, cover, ambush, and visibility rules.
- Rivers are `1-2 UD` wide with randomized difficulty; coastal zones are `4 UD` wide and impassable.
- Hills, crest lines, horizon lines, gullies, woods, brush, fields, villages, and roads all carry explicit visibility or cover consequences that must share geometry primitives with shooting and melee.
- Setup is a fixed pre-battle sequence: initiative, attacker/defender and region choice, terrain selection and placement, terrain adjustment, camp plus fortification or obstacle placement, battle plans, ambushes, visible deployment, dismounting, then battle start.
- Initiative combines commander values, strategist bonus, and scouting, then uses an opposed `D6` roll with capped adjustment.
- Region choice and attacker/defender choice immediately bind asymmetric setup privileges. The defender gets compulsory terrain and places terrain first; the attacker adjusts first, deploys second, and takes the first player sequence.
- The terrain-selection table on p.74 is the authoritative region and quota source. The compulsory terrain counts toward duplicate limits.
- Terrain placement uses fixed sector and edge-position tables, one reroll per player for blocked placement, discard after failure, central-sector restriction for impassable terrain, and a balance rule between table halves.
- The road is always placed last, has its own length and crossing constraints, and may cross terrain except specified prohibited families.
- Terrain adjustment is die-table driven, limited by how many pieces a player originally chose, and strategist can improve adjustment attempts.
- Camps, fortifications, and obstacles are public setup objects with deployment-zone, open-ground, spacing, and access-path restrictions.
- Battle plans, ambush composition, and flank marches are canonical hidden-information declarations and must remain private until reveal rules expose them.
- Ambushes use `1 UD` markers, can be fake, have explicit terrain and LOS placement rules, reveal on proximity or LOS, and deploy into actual units under strict post-reveal constraints.
- Visible deployment starts only after battle plan and ambush placement. Corps deploy by battle-plan zone, with command-range and zone-shape constraints.
- Flank marches, hesitant corps, and dismounting are part of official setup-state flow and not optional UI annotations.

Placeholder terrain should capture at least:

- table footprint in UD, including corners or area bounds;
- shape model such as area, rectangle, ellipse, or path placeholder;
- label text visible on the battlefield;
- terrain type and source-verification status;
- owner or placement role when relevant;
- locked or draft placement state.

This keeps P3 useful visually while preserving rule discipline: physical footprint checks can be tested early, while exact terrain quotas, overlap, road, river, and adjustment rules remain blocked until verified.

## Engine Invariants

- Terrain definitions, terrain instances, and setup-state transitions must stay separate. Region tables and placement constraints belong in structured rule tables, not UI prose.
- Hidden setup declarations need canonical state plus visibility-filtered views. Battle plan, ambush contents, fake markers, and flank-march composition cannot be exposed accidentally.
- Deployment legality depends on battle-plan zone, table geometry, command range, terrain occupancy, and object-family restrictions; it cannot be validated from center points only.
- Terrain, cover, visibility, ambush eligibility, riverbank defense, and fortification or obstacle effects must reference shared geometry and rule tags so combat and setup do not diverge.

## Edge Cases And Test Hooks

- Region tests: compulsory terrain counting toward duplicate limits, river/coastal selection roll failure, village touch requirements, impassable flank-only sector reroll, and balance rule between table halves.
- Terrain geometry tests: `6 UD` container, `2 x 3 UD` minimum rectangle, road length bounds, river crossing with automatic bridge or ford, and no-overlap except road crossing.
- Adjustment tests: compulsory terrain movable but not removable, strategist extra attempt or reroll, move/rotate/remove branches, and single removal limit.
- Setup hidden-info tests: fake ambush, reveal by LOS, reveal by proximity, illegal ambush fallback placement, corps-zone disclosure, and flank-march declared edge plus first-move constraints.

## Open Verification

- `terrain.region-table-and-quotas`, `terrain.region-choice-and-compulsory-terrain-binding`, `terrain.size-and-placement-geometry`, `setup.camps-fortifications-obstacles`, `setup.deployment-zone-math`, and `setup.flank-march-arrival-edge-and-entry-sequence` remain in `docs/rules/open-verification.md` as narrowed errata/manual-acceptance or hidden-state questions.
- Hidden-information disclosure timing still depends on the dedicated hidden-info checks and should not be treated as closed by this source lock alone.
