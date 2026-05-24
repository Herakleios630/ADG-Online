# Zone Of Control Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.35-38; implementation-grade only after errata/manual acceptance of tie-break and terrain-suppression details.

## Source References

- `docs/source/Rules_v2.md` `rv2.zone-of-control`, from `Rules_Color_300DPI.pdf` p.35-38.
- Example crops: ZoC definition, most-threatening enemy, prohibited move, legal advance, flank protection, interposed-unit special case, involuntary exit, terrain-sensitive ZoC, and cavalry-in-rough example box.
- Errata summary: `docs/rules/errata.md` movement and ZOC notes.
- Open verification IDs: `zoc.definition-front-geometry-and-range`, `zoc.most-threatening-priority-and-tie-breaks`, `zoc.allowed-movement-while-constrained`, `zoc.voluntary-exit-via-evade-side-effects`, `zoc.mid-segment-entry-exit-detection`, `zoc.terrain-suppression-and-non-exerting-cases`, `movement.zoc-turn-slide-wheel-interactions`.

## Scan-Confirmed Baseline

- A unit is in enemy ZoC when it is directly in front of the enemy and less than `1 UD` from that enemy front edge.
- The practical test uses a `1 UD` square aligned to the enemy front edge; covered base means inside ZoC, touching only means exactly `1 UD` and outside.
- Units can exert ZoC through friendly troops they are allowed to interpenetrate.
- When several enemy ZoCs apply, only the most threatening enemy constrains movement. If several enemies remain equally threatening, the constrained unit's owner chooses.
- Most-threatening priority first favors enemies in front of the unit, then flank/rear coverage if no front threat applies. Nearness and amount of front-edge coverage break ties.
- While constrained by the most threatening enemy, a unit may stay still, charge that enemy, or align/get closer by controlled advance, wheel, quarter-turn, or half-turn.
- Such constrained movement may not end less aligned, may not move any front-edge point farther from the enemy front edge, may not let a front-edge point that began inside ZoC leave it, must preserve a possible front-edge contact direction, and cannot slide.
- A group may extend or contract in ZoC only if no unit leaves the enemy ZoC.
- A charge by a unit in or entering ZoC must target the most threatening enemy, except for the p.37 interposed-enemy special case.
- Troops that can evade may voluntarily exit ZoC by making an evade move in their own turn, using the most threatening enemy as the initial reference.
- Troops that cannot evade leave by facing the most threatening enemy if needed, then backing straight away: foot `1 UD`, mounted `2 UD`.
- Voluntary ZoC exit is a difficult manoeuvre, costs `2 CP`, disorders the unit, cannot be performed by a group, and prevents contact or shooting during that action.
- Mounted troops whose rear is in the ZoC of a slower enemy may move straight ahead their full allowance for `1 CP` without disorder, including as a group.
- Involuntary ZoC exits are allowed for specified forced movement families such as conformation assistance, interpenetration displacement, and group column-to-line change.
- Camps, artillery, and war wagons do not exert ZoC, though they can be constrained by enemy ZoC.
- Light infantry ZoC depends on terrain and legal charge/fight relationships.
- ZoC is ignored by units completely behind friendly fortifications, obstacles, or an intervening friendly unit.
- A unit engaged in melee stops exerting ZoC.
- ZoC is not exerted into, from, or out of terrain that penalizes the unit in combat, and evading units ignore enemy ZoC during evade movement.

## Engine Invariants

- ZoC detection is footprint geometry, not center distance.
- `mostThreateningEnemyId` must be computed deterministically and stored in diagnostics whenever ZoC constrains an action.
- ZoC exertion depends on unit type, terrain, melee state, interpenetration permissions, and intervening friendly objects.
- Movement under ZoC must be path-aware enough to detect illegal front-edge departure, loss of alignment, forbidden slide, and redirection to interposed enemies.
- Voluntary ZoC exit is a separate action branch with CP, disorder, no-group, no-contact, and no-shoot consequences; it is not a normal retreat animation.

## Edge Cases And Test Hooks

- Exactly `1 UD` should be outside ZoC; less than `1 UD` directly in front should be inside.
- Multiple-ZoC tests should cover front enemy, flank/rear-only enemy, equal threats, nearest threat, and larger front-edge coverage.
- Constrained movement tests should cover legal advance toward front contact, illegal slide, less-aligned ending, front-edge point leaving ZoC, and interposed-enemy redirection.
- Terrain tests should cover cavalry in rough against medium infantry, light infantry in open, light infantry in rough/difficult, melee-engaged units no longer exerting ZoC, and fortification/obstacle shielding.
- Exit tests should split evade-capable voluntary exit, non-evader backing exit, mounted rear-ZoC fast exit, involuntary conformation/interpenetration exit, and blocked exit.

## Open Verification

- Keep most-threatening tie-break exactness open as `errata-check`; the baseline is strong enough for solver design but not yet manual-accepted.
- Keep terrain-suppression cases open until terrain/combat-penalty definitions are hardened in the later terrain and melee RV2-04 passes.
- Keep voluntary exit via evade side effects open until the evade chapter and ZoC wording are checked together for imported `cannot shoot`, table-exit, and end-facing consequences.