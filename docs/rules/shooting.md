# Shooting Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.56-59; P8-00 approves only a bounded first implementation subset. Broad shooting remains implementation-grade only after ordered modifier-stack and overhead-fire edge cases are manually accepted.

## P8-00 First Implementation Boundary

Approved on 2026-05-28 for planning only; P8 Coding remains blocked until P7B reviewer/user acceptance.

The first P8 subset may implement:

- shared-profile shooting identities for `sp-light-missile-foot`, `sp-mounted-bow`, and `sp-none`;
- normal front-edge rectangular shooting zones only;
- unit-blocker line of sight using the corner-to-target-edge model;
- nearest-front and nearest-in-zone target priority for the supported normal-zone cases;
- one target per shooting phase, one main shooter, support capped at `+3`, and light-troop half-support rounding;
- deterministic opposed `D6` shooting records, source-checked target protection for the first profiles, support bonus, simultaneous-result metadata, and one cohesion loss maximum.

The first P8 subset must defer:

- light cavalry `360 degrees` shooting;
- light chariot rear-edge shooting, war-wagon flank-edge choice, artillery extended zones, elephant light artillery, and all other special-zone families;
- terrain, cover, ambush, and more-than-`1 UD` cover blockers except as source-open diagnostics;
- crossbow, firearm, longbow, incendiary, pavise, cover, fortification, shooting-from-cover, difficult-terrain, and formed-infantry-versus-mounted modifier/protection interactions;
- all overhead-fire cases;
- stable target retention across later turns unless geometry-change tracking is implemented honestly.

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
- Multiple shooters on one target choose one main shooter and up to `+3` support from eligible supporting units; light-troop support counts half, rounded up after totaling. A supporting shooter must be eligible to shoot that same target, including target-priority legality for that shooter.
- Shooter and target each roll `1D6`; the target adds protection and the shooter adds circumstance modifiers. If the modified shooter total is higher, the target loses one cohesion point; shooting causes at most one cohesion loss per phase.
- Crossbows, firearms, longbows, incendiary shots, pavises, cover, fortifications, and overhead-fire cases alter protection or shot legality in ordered ways that matter to the solver.

## Engine Invariants

- Shooting needs explicit `eligibleToShootThisSequence`, `hasMovedThisSequence`, `moveCountThisSequence`, `isInMelee`, `isInMeleeSupport`, and `wasTargetedThisPhase` state rather than UI-only checks.
- Target priority, line of sight, shooting zone, and support aggregation are separate rule functions. None should be implied from a single nearest-enemy helper.
- Simultaneous results must preserve counterfire even when a unit becomes disordered or routed earlier in the same shooting phase.
- Protection modification order must be explicit so crossbow, firearm, longbow, incendiary, pavise, cover, and fortification cases do not stack incorrectly.

## Guided Procedure UX Constraints

- The phasing player chooses local shooting order. A guided shooting procedure may visually sort ranged units for readability, but it must not auto-drive official play as a left-to-right queue. After the phase-start popup, eligible unresolved shooters should be selectable by the phasing player.
- Shooting remains optional. The procedure must offer a reducer-owned pass/skip completion path and must not label every eligible unit as forced to fire.
- Phase-start popups may summarize shooting readiness, but the counts must come from engine/state projections: total ranged units, ranged units eligible to shoot now, ranged units blocked by sequence/melee/movement restrictions, and source-open/deferred cases.
- Selecting a shooter should derive the target from target priority. If exactly one priority target exists, it should be auto-selected; if several equal-priority targets remain, the player chooses among those tied targets only.
- Support is target-bound. A unit may support a combined shot only if it can legally shoot the selected target under its own eligibility, range, line of sight, and target-priority state. If its own priority target is different, it cannot be counted as support for this shot.
- If several unresolved shooters share the same legal priority target, the player chooses the main shooter and the other eligible same-target shooters may support, subject to the support cap and light-troop half-support rule.
- Battlefield status colours during the guided procedure must be derived from the same reducer state: active shooter normal plus active overlay, blocked ranged unit red front strip, unprocessed ranged unit yellow front strip, finished ranged unit green front strip, and non-ranged melee-only units muted as whole tokens.
- A finished ranged unit may have fired, supported a combined shot, or passed. The green finished marker means the optional shooting decision is complete, not that a shot necessarily happened as the main shooter.
- Simultaneous result timing means earlier UI-order shooting records cannot reduce later same-phase shooting eligibility, dice inputs, protection/modifier inputs, or target retaliation until the simultaneous application step applies pending effects.

## Edge Cases And Test Hooks

- Priority tests: nearest directly in front, equally near `most in front`, no front target, stable repeated target, artillery over `4 UD`, and `360 degrees` light-cavalry shooting.
- Eligibility tests: moved artillery, second or third move, charged or evaded earlier, touching-but-not-supporting target, and targets already in melee support.
- Geometry tests: shooting zone boundaries, range equality, blocked line of sight, more-than-`1 UD` cover blockage, and overhead-fire exception families.
- Procedure tests: phasing-player chosen shooting order, no automatic left-to-right active shooter, auto-selection of a sole priority target, tied-priority target choice, same-priority support eligibility, and completion of the main shooter plus included supporters.
- Resolution tests: simultaneous exchange, multiple supporting shooters capped at `+3`, light-troop half-support rounding, and one cohesion loss maximum per phase.

## Open Verification

- Keep the protection-modifier order and overhead-fire families open in `docs/rules/open-verification.md` until they are split into explicit ordered predicates.
- Keep fortification, cover, and terrain interactions aligned with the terrain and barrier chapters so one shared geometry model decides both combat and shooting cover.