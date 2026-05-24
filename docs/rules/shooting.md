# Shooting Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.56-59; implementation-grade only after ordered modifier-stack and overhead-fire edge cases are manually accepted.

## Source References

- `docs/source/Rules_v2.md` `rv2.shooting-core`, from `Rules_Color_300DPI.pdf` p.56-59.
- Example crops: `rv2-p56-shooting-ranges-table-a`, `rv2-p57-shooting-zone-a`, `rv2-p58-line-of-sight-a`, `rv2-p58-shooting-modifiers-a`, `rv2-p59-shooting-example-a`.
- Errata summary: `docs/rules/errata.md`, especially terrain, fortification, and combat clarifications that affect shooting.
- Open verification: `shooting.target-priority-los-and-melee-exclusions`.

## Scan-Confirmed Baseline

- Shooting happens in both player sequences where eligibility allows it, but the phasing player chooses local resolution order and all shots in the phase are treated as simultaneous.
- Only listed missile troops may shoot, and weapon or troop family determines range and shooting-zone geometry.
- Units that charged, evaded, disengaged, or retreated out of ZoC in the same sequence cannot shoot.
- Units in melee or in melee support cannot shoot, and enemy units in melee or melee support cannot be chosen as targets even if a nearby touching unit is not actually supporting.
- Medium and heavy artillery that moved or wheeled in the player's sequence cannot shoot in that same sequence. Other shooting troops may still shoot after moving, but not after a second or third move.
- Shooting eligibility requires target priority. Nearest directly in front has priority; if none is directly in front, the nearest unit in the shooting zone becomes the priority target; ties use `most in front`, then stable target retention until geometry changes.
- Line of sight is corner-to-point geometry from the shooting edge to a point on one target edge and must remain unblocked by units or terrain.
- Range is measured from any point of the shooting edge to any point on the target base. Normal shooting zone is a rectangle ahead with weapon depth and `1 UD` extra width on each side.
- Special shooting zones apply to light cavalry, light chariots, war wagons, and artillery.
- A target can only be shot once per shooting phase, so all contributing shooters are aggregated into one combined shot.
- Multiple shooters on one target choose one main shooter and up to `+3` support from eligible supporting units; light-troop support counts half, rounded up after totaling.
- Shooter and target each roll `1D6`; the target adds protection and the shooter adds circumstance modifiers. If the modified shooter total is higher, the target loses one cohesion point; shooting causes at most one cohesion loss per phase.
- Crossbows, firearms, longbows, incendiary shots, pavises, cover, fortifications, and overhead-fire cases alter protection or shot legality in ordered ways that matter to the solver.

## Engine Invariants

- Shooting needs explicit `eligibleToShootThisSequence`, `hasMovedThisSequence`, `moveCountThisSequence`, `isInMelee`, `isInMeleeSupport`, and `wasTargetedThisPhase` state rather than UI-only checks.
- Target priority, line of sight, shooting zone, and support aggregation are separate rule functions. None should be implied from a single nearest-enemy helper.
- Simultaneous results must preserve counterfire even when a unit becomes disordered or routed earlier in the same shooting phase.
- Protection modification order must be explicit so crossbow, firearm, longbow, incendiary, pavise, cover, and fortification cases do not stack incorrectly.

## Edge Cases And Test Hooks

- Priority tests: nearest directly in front, equally near `most in front`, no front target, stable repeated target, artillery over `4 UD`, and `360 degrees` light-cavalry shooting.
- Eligibility tests: moved artillery, second or third move, charged or evaded earlier, touching-but-not-supporting target, and targets already in melee support.
- Geometry tests: shooting zone boundaries, range equality, blocked line of sight, more-than-`1 UD` cover blockage, and overhead-fire exception families.
- Resolution tests: simultaneous exchange, multiple supporting shooters capped at `+3`, light-troop half-support rounding, and one cohesion loss maximum per phase.

## Open Verification

- Keep the protection-modifier order and overhead-fire families open in `docs/rules/open-verification.md` until they are split into explicit ordered predicates.
- Keep fortification, cover, and terrain interactions aligned with the terrain and barrier chapters so one shared geometry model decides both combat and shooting cover.