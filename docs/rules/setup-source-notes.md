# Setup Source Notes

Status: P3 planning source-status map; use with `open-verification.md`, not instead of it.

## Purpose

This file tells P3 implementation which setup and terrain facts are safe to build now as placeholder or physical infrastructure, and which facts remain blocked until the authoritative source PDFs and errata are checked directly.

Unresolved rule questions still belong in [open-verification.md](open-verification.md). This file is only a working implementation map.

## Source Priority

1. `Konzepte/Errata_ADG_V4_English.pdf`
2. `Konzepte/Rules.pdf`
3. `Konzepte/Reference_Sheet_V4.pdf` as tournament quick-reference cross-check only
4. Existing planning docs in `docs/rules/` and [docs/architecture.md](../architecture.md)

## Source Readability Snapshot

- `Errata_ADG_V4_English.pdf`: text-readable in the current environment.
- `Rules.pdf`: not text-readable with the currently available local tools; requires direct visual/manual source checking.
- `Reference_Sheet_V4.pdf`: present in `Konzepte/`, but not text-readable with the currently available local tools; use as manual cross-check only.
- `merged.pdf`: OCR helper only; do not treat as authority.

## P3 Implementation Status Map

### Verified Enough For P3 Placeholder Infrastructure

These facts are stable enough to build P3 infrastructure without pretending official setup legality is complete:

- Standard battlefield planning profile is `30 UD x 20 UD` with `1 UD = 4 cm` for the default standard-200 target.
- Setup must be modeled as explicit pre-battle states, not as ad hoc battlefield mutation.
- Terrain and setup objects should be state objects with geometry footprints, not decorative overlays.
- Hidden setup data must live in canonical state and be filtered into player views.
- Battle-plan `left`, `center`, `right`, and `flank march` fields should be modeled separately from battlefield sectors.
- Full-footprint table-bound checks are required for setup placement; center-only assumptions are insufficient.
- Public setup objects may be shown to both players once placed, unless a verified rule says otherwise.

Source basis:
- [standard-200.md](standard-200.md)
- [sequence-of-play.md](sequence-of-play.md)
- [terrain-and-setup.md](terrain-and-setup.md)
- [hidden-info.md](hidden-info.md)
- [docs/architecture.md](../architecture.md)

### Placeholder-Only Allowed In P3

These items may be implemented as clearly labelled placeholder tooling, but must not claim official tournament legality yet:

- labelled terrain shapes such as `Hill`, `Wood`, `Field`, `Road`, `River`, `Village`
- public camp, fortification, obstacle, and stake placeholder objects
- public ambush marker shells
- private battle-plan board UI
- private ambush-content entry fields
- player-view and hotseat-safe filtering skeleton
- visible deployment placeholders with footprint and non-overlap hooks
- right-side phase tracker for setup now and battle phases later
- validation surfaces that explicitly say `needs source check` for blocked rule areas

Implementation rule:
- placeholder behavior may enforce physical and data-shape invariants only;
- blocked official rule areas must return explicit source-status warnings instead of fake legality.

### Officially Blocked For Now

These areas must stay source-blocked until directly verified against rules and errata:

- exact region table and compulsory terrain by region
- exact terrain quotas and duplicate-piece limits
- exact terrain size minima/maxima and legal shape constraints
- exact overlap, spacing, edge, road, river, coastal, and village rules
- exact terrain adjustment process
- exact camp, fortified camp, sacred camp, fortification, obstacle, and stake legality/costs
- exact deployment-zone geometry and terrain/battle-plan interactions
- exact corps-relative deployment constraints and commander placement rules
- exact ambush marker counts, allowed placement zones, fake-marker rules, and terrain requirements
- exact flank-march declaration, composition, arrival, and reveal behavior
- exact public/private disclosure timing for battle plans and hidden setup commitments
- exact reveal triggers and hidden-info transitions

For every blocked area, implementation should link back to [open-verification.md](open-verification.md).

## P3 Safe Validator Boundary

P3 validators may safely enforce:

- object has a valid shape model;
- object has positive size;
- object footprint stays inside the battlefield;
- public deployment placeholders do not overlap when that placeholder rule is enabled;
- state objects have required ids, owner references, source status, and visibility fields;
- player-view filtering removes private setup data from the wrong viewer.

P3 validators must not yet claim:

- official terrain selection legality;
- official terrain placement legality;
- official camp legality or point costs;
- official ambush legality;
- official deployment legality;
- official battle-plan effects;
- official reveal behavior.

## P3 Implementation Notes For GPT-5.4

- When a setup feature needs an official rule that is still blocked, implement the data shape and UI shell first, then surface a `needs-source-check` validation state.
- Prefer structured fields over freeform text whenever possible, but allow temporary freeform owner-private notes for ambush contents if roster/unit selection is not ready yet.
- Keep battle-plan secrecy and ambush secrecy real in the data model so future multiplayer does not need a redesign.
- Preserve corps identity and full footprints on deployment placeholders from the start so later validators can reason about non-overlap and relative placement.

## Linked Open Verification

See especially these IDs in [open-verification.md](open-verification.md):

- `setup.reference-sheet-v4-cross-check`
- `setup.tournament-battle-plan-board`
- `setup.deployment-corps-relative-and-overlap`
- `hidden-info.multiplayer-secret-battle-plan`
- `terrain.region-table-and-quotas`
- `terrain.size-and-placement-geometry`
- `setup.camps-fortifications-obstacles`
- `setup.deployment-zone-math`
- `hidden-info.roster-disclosure-timing`
- `hidden-info.reveal-trigger-set`
