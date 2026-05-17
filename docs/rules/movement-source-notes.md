# Movement Source Notes

Status: planning source-status map for P4; not a complete movement extract

This file records what is currently strong enough to guide P4 planning, what remains placeholder-only, and what is still blocked pending direct source verification.

The authoritative sources remain `Errata_ADG_V4_English.pdf`, `Rules.pdf`, and `Reglettes.pdf`. This note is working knowledge only.

## Verified Enough For P4 Planning

- Official movement after P0 requires command context. At minimum, P4 must not present movement as official AdG legality without active player, active corps, commander hook, command range hook, CP availability placeholder, and in-command facts.
- P4 may safely build a declarative movement-command architecture before all movement-rule details are verified.
- Full-footprint battlefield bounds remain a valid physical invariant for movement previews and confirmations, independent of later ZOC, terrain, or contact legality.
- Errata already matters for movement turns and ZOC-sensitive movement, so P4 must keep source-status diagnostics rather than implying a full official validator.

## Candidate P4 Facts That Are Plausible But Still Need Direct Phase Check

These are useful for P4 planning, but should not be treated as fully verified implementation law until the authoritative source pages are rechecked in the P4 phase:

- Movement is performed corps by corps.
- A movement order requires command context and usually CP or a free-command case.
- Units may move individually or as groups.
- A wheel is measured by the outer front corner that moves farthest.
- A slide is up to `1 UD` and counts as movement distance except where later rules say otherwise.
- A unit normally performs only one slide in a movement phase.
- A wheel cannot be combined with an extension.
- If different terrain types are crossed in one move, the lowest relevant allowance applies.
- Roads can allow open-terrain movement in specified cases.

## Errata-Sensitive P4 Areas

- Quarter-turn and half-turn combinations are restricted by errata, with light-troop exceptions.
- Light troops have corrected free-turn wording that affects turn accounting.
- ZOC-related movement permissions and some turn-in-place cases are errata-sensitive.
- Interpenetration wording is errata-sensitive and must not be guessed from geometry behavior.

## Placeholder-Only Or Deferred For P4

- Full group movement logic.
- Extension and contraction.
- Difficult maneuvers and exact CP costs.
- Terrain movement penalties and road exceptions as applied validators.
- Friendly overlap exceptions during legal group wheel cases.
- Special troop movement exceptions.
- Mid-segment ZOC entry handling.
- Contact, charge movement, conformation, pursuit, evade, and rout movement.

## P4 Implementation Boundary

The safest P4 implementation boundary is:

- command-context skeleton first;
- declarative movement-command model second;
- advance, wheel, and slide previews plus confirmations next;
- explicit `needs-source-check` diagnostics for terrain, ZOC, group movement, difficult maneuvers, and special troop cases.

Open verification:

- `movement.command-context-minimum`
- `movement.allowances-and-road-terrain`
- `movement.wheel-measurement-and-pivot`
- `movement.slide-distance-and-frequency`
- `movement.group-movement-and-reshape`
- `movement.turns-difficult-maneuvers-and-errata`
- `movement.special-troops-and-interpenetration`