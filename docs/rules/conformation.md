# Conformation

Status: P7B-00 working source-lock baseline from Rules-v2 p.50-54 plus current errata notes; implementation-grade for the approved first single-unit subset, but not rule-complete beyond the remaining open-verification items.

## Planning Boundary

- P7 first pass is single-unit charge contact followed by single-unit conformation preview.
- Conformation is not a visual snap. It must be an explainable candidate-selection process with blocked, incomplete, complete, or optional outcomes.
- Conformation shifting is distinct from any charge-start slide/shift.
- Full group conformation and large multi-unit chains are deferred from the first P7 pass.

## Source-Locked Or User-Locked Planning Facts

- Conformation must be explainable from reducer/engine state, not improvised in the UI.
- The most-threatening enemy and ZOC context from P5 remain relevant inputs to conformation.
- Errata already indicates that rear-corner alignment can matter in specific blocked flank-contact cases and that shifting restrictions include unit-type exceptions.

## RV2-04 Recalibrated Source Lock

The Rules-v2 scan-confirmed pass on p.50-54 is now the working source baseline for the first P7B subset. That tighter source pass lets P7B stop treating all conformation geometry as one broad OCR-era question.

Source-locked candidate facts for the first P7B subset:

- Conformation is a distinct step after contact and before combat; it is not part of the charge move itself.
- Any unit in enemy contact, including corner-only contact, may need to conform.
- After a charge, the phasing player's units conform first, and they do so against the most-threatening enemy.
- The scan-confirmed examples support a slide-then-pivot reading for post-charge conformation geometry.
- A melee or melee-support unit normally tries to align front edge to front edge or front corner to front corner.
- In flank or rear attacks, front-corner to enemy-rear-corner alignment is a real complete-conformation outcome in physically blocked cases; errata narrows this so it cannot be used to bypass ZOC restrictions.
- A unit in simple support uses support geometry instead of normal attack geometry and aligns front-corner to front-corner or flank to flank depending on the available support position.
- Conformation must be as complete as possible. If full alignment is impossible, incomplete conformation is a real rules state rather than an automatic failure.
- A unit does not have to enter terrain that penalizes it in melee in order to conform fully, though this creates an optional-choice boundary rather than a free geometry shortcut.
- If several friendly units are in the ZoC of the same enemy, first entry into that ZoC matters for deciding which one conforms to that enemy.
- Flank or rear conformation is forbidden when full conformation on that side is impossible because of enemy ZoCs, except for the narrower interposition-style special case already noted in the source corpus.
- Friendly shifting is permitted only as a constrained helper to make space for conformation, using the minimum number of units and the minimum distance, with rearward movement preferred before flankward movement.
- A shifted unit in support must remain in support after the shift.
- A shifted non-light unit may not later move or rally in the same movement phase; light troops keep the explicit exception.
- War wagons, heavy artillery, and units defending behind fortifications, obstacles, or stakes remain special cases and should default to exception-layer handling rather than the generic candidate solver.

Working solver predicates from the scan-confirmed pass:

- `complete conformation` means the unit reaches one of the source-backed target relationships for its case: front-edge to front-edge, front-corner to front-corner, flank/rear alignment, or the errata-limited rear-corner blocked-flank outcome.
- `incomplete conformation` is the real fallback when some legal contact remains but full completion is impossible because of terrain, table edge, or unshiftable friends.
- `blocked` should be reserved for cases where the rules forbid the attempted flank/rear attack or other requested outcome entirely, not merely where the unit must fall back to an incomplete but still legal contact state.
- `optional` should be reserved for terrain-sensitive full-conformation choices where the source text explicitly says the unit need not enter penalizing terrain but may choose to do so.
- `principal opponent` should be treated as the enemy the unit must end most clearly aligned against after conformation, so the solver must reject any candidate that leaves the unit more aligned with a different enemy than with the one controlling the conformation.

Current P7B-04 implementation boundary:

- The single-unit solver now treats table-edge and simple friendly-blocker failures as explicit `incomplete` outcomes instead of overstating them as blocked failed charges.
- The solver only emits an `optional` terrain choice when explicit terrain-conformation facts say that full conformation would enter penalizing terrain; there is still no general terrain engine or automatic terrain-choice selection.
- War wagons, heavy artillery, and defensive-barrier cases currently return `needs-source-check` / `source-open` diagnostics rather than pretending to resolve a generic conformation result.

Working measurable test for `principal opponent` in the first subset:

- Prefer the candidate where the controlling enemy keeps the strongest source-backed contact relationship after conformation: complete edge-to-edge or allowed corner relationship beats incomplete contact.
- If two candidates preserve the same contact class, prefer the one that gives the controlling enemy the longer or clearer shared contact span rather than a thinner incidental touch to another enemy.
- If that is still tied, prefer the candidate with the smaller lateral misalignment against the controlling enemy.
- If the geometry still ties on those implemented checks, keep the result deterministic by enemy id but mark the candidate set as still needing a deeper source/errata tie-break.

## First Supported P7B Subset

Supported for the first conformation foundation:

- single charging unit or single conforming phasing unit
- front, flank, rear, and reducer-selected `rear-or-flank` candidate generation
- complete, incomplete, blocked, and explicit choice-required outcomes
- most-threatening-enemy input reuse from existing ZOC/contact state
- simple one-unit shifting skeleton only when it stays inside the source-locked minimality rules

Deferred or blocker-only for the first subset:

- full group conformation and same-enemy multi-unit ordering
- full support-network solving
- terrain-choice UX beyond explicit blocker or optional-choice surfacing
- column special-case geometry beyond explicit diagnostics
- pursuit-specific and already-in-melee cleanup breadth beyond what the charge handoff must preserve for later phases

## Source-Check Questions For P7

- What exact solver predicates should distinguish complete front-edge, front-corner, and rear-corner outcomes from merely incomplete contact in the supported single-unit subset?
- Which terrain-sensitive conformations must become explicit player choice states, and which remain blocked until a later terrain slice?
- Which already-in-contact and support-driven conformation cases should stay diagnostic-only in first P7B instead of being claimed complete?
- Which shift-permitted versus shift-forbidden unit families need direct errata-backed solver flags beyond the currently known war-wagon, heavy-artillery, and defensive-barrier exceptions?
- What exact measurable test should the solver use to decide that a candidate is aligned with its `principal opponent` rather than more aligned with a different enemy, once the current working checks for contact completeness, contact span, and lateral misalignment have been implemented?

## Engine Design Implications

- Conformation should produce candidate poses, reasons for acceptance/rejection, and one deterministic selected result.
- If no complete candidate exists, the engine must preserve the best incomplete or blocked explanation rather than hiding failure behind geometry.
- Shifting should be modeled as a separate micro-operation plan attached to conformation, not as player-issued movement.
- The candidate layer should treat `choice-required` as first-class state whenever more than one legal complete or optional outcome exists; the first UX must not silently auto-pick.
- Contact classification, most-threatening-enemy selection, and conformation candidate generation should remain separate stages so P7B does not smuggle charge logic into the conformation solver.

## Non-Claims

- This file does not yet establish group conformation.
- This file does not yet establish melee-factor support effects.
- This file does not yet establish post-combat pursuit or rout interactions.

## Open Verification

- The remaining implementation-facing uncertainty is now narrower than the older planning note suggested: exact geometry predicates for candidate ranking and direct errata confirmation of non-shiftable family exceptions remain open in `open-verification.md`, but they no longer block the approved first single-unit P7B subset.
