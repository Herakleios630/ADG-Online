# Movement Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.29-35; implementation-grade only for explicitly listed invariants after errata/manual acceptance.

## Source References

- `docs/source/Rules_v2.md` `rv2.movement-general-and-allowances`, `rv2.movement-measurement-and-core-manoeuvres`, `rv2.multiple-movements-and-manoeuvrability`, and `rv2.movement-specific-cases`.
- Example crops from pages `29-34`: movement allowance table, distance measurement, slide, wheel, half-turn, line/column, war wagon quarter-turn, extension, and contraction examples.
- Errata summary: `docs/rules/errata.md` movement and ZOC notes.
- Historical planning note: `docs/rules/movement-source-notes.md` remains P4-era context and is superseded by this file for RV2 source-lock work.

## Scan-Confirmed Baseline

- Movement is performed by the phasing player corps by corps; all moves for one corps are completed before the next corps is activated.
- A move may be by a single unit or a valid group. A moving group must be valid at the start and end of the shared move.
- Movement requires an order and spends CP unless a later special rule provides a no-CP path.
- Operational zone is `4 UD` or more from enemy. Tactical zone is less than `4 UD`. ZoC is less than `1 UD` directly in front of an enemy.
- Units in tactical distance may move only once in the turn. Multiple moves require staying outside tactical distance for the entire movement phase.
- Movement allowance is troop-type and terrain driven; mixed groups use the slowest relevant allowance.
- Crossing multiple terrain types uses the lowest relevant allowance. A road move uses open-terrain allowance for the road path and may add `1 UD` if chosen.
- Heavy infantry in open terrain may advance `3 UD` instead of `2 UD` if it starts in the operational zone.
- Movement distance is measured from the front edge; no point of that front edge may travel farther than the applicable allowance.
- A wheel pivots around an outer front corner and measures the opposite front corner. Normal wheel limit is `90 degrees`; war wagons are limited to `45 degrees`.
- A slide is a lateral displacement up to `1 UD`, allowed before, during, or after an advance. Outside charge/contact exceptions, it requires at least `1 UD` of straight advance in the move.
- A unit may perform only one slide in the movement phase, even across multiple moves.
- Slides cannot combine with quarter-turns, half-turns, extensions, or contractions, and are restricted in ZoC except for charge/conformation cases.
- Quarter-turn and half-turn are reorientation manoeuvres. They usually cost `1 UD`, but cost `2 UD` for unmanoeuvrable troops, war wagons, pikemen, and cataphracts.
- Light troops may take one free half-turn or quarter-turn at the start or end of a move, then a second such turn by spending `1 UD`.
- Extension and contraction are group frontage changes with their own movement costs, terrain limits, and blocked-space consequences; they are not single-unit visual snaps.
- A second move may be possible; a third move is restricted by troop class and commander accompaniment and often counts as difficult.
- Difficult manoeuvre surcharge does not stack multiple difficulty reasons beyond a single extra CP.
- If a unit lacks sufficient movement allowance for a difficult manoeuvre, the manoeuvre can still happen but disorders the unit rather than causing extra cohesion loss if already disordered.
- Special troop exceptions apply to pikemen, cataphracts, impetuous cavalry, war wagons, heavy artillery, scythed chariots, and impetuous units within charge range.

## Engine Invariants

- Movement legality needs explicit `moveCountThisPhase`, `startedInOperationalZone`, `outsideTacticalForWholePhase`, `usedSlideThisPhase`, and `activeCorpsId` state.
- Movement allowance must come from data tables keyed by troop family, terrain, road state, and special state, not from UI sliders.
- Measurement must be footprint-aware: front-edge travel, wheel pivot, slide offset, and group widest-rank wheel geometry are distinct calculations.
- Difficult manoeuvre classification is a rules function that feeds command cost and disorder consequences.
- Special troop exceptions must be data-backed rule hooks, not hardcoded in UI controls.

## Edge Cases And Test Hooks

- Boundary tests: exactly `4 UD`, just below `4 UD`, exactly `1 UD`, and just below `1 UD`.
- Slide tests: one slide per phase, slide plus required advance, slide blocked in ZoC, and evade/charge exceptions handled elsewhere.
- Wheel tests: single-unit `90 degrees`, war wagon `45 degrees`, group widest-rank wheel, and temporary friendly overlap during group wheel.
- Multiple-move tests: unit remains outside tactical distance for whole phase, enters tactical distance mid-phase, and commander-accompanied third move.
- Difficult-manoeuvre tests: unmanoeuvrable short advance, quarter-turn, half-turn, extension/contraction, voluntary ZoC exit, and non-stacking surcharge.
- Special troop tests: heavy artillery center wheel, scythed chariot simple-only move, war wagon two-wagon line/column limit, impetuous cavalry third move.

## Open Verification

- Keep allowance-table transcription open until the table is converted into structured data and cross-checked with terrain and charge/evade chapters.
- Keep movement/turn errata open for exact light-troop free-turn wording and ZoC-facing exceptions.
- Keep interpenetration and burst-through in their own open verification item because p.39-40 is a separate solver matrix.