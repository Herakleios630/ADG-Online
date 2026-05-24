# Rout And Pursuit Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.68-69; implementation-grade only after end-of-sequence cascade ordering and army-cohesion accounting are manually accepted.

## Source References

- `docs/source/Rules_v2.md` `rv2.routed-units-and-elephant-rampage` and `rv2.pursuit-and-army-rout`.
- Example crops: `rv2-p68-elephant-rampage-table-a`, `rv2-p68-routing-example-a`, `rv2-p69-army-cohesion-losses-a`, `rv2-p69-army-rout-example-a`.
- Errata summary: `docs/rules/errata.md`, especially combat and pursuit clarifications.
- Open verification: `pursuit.mandatory-optional-matrix-and-contact-branch`, `rout.routed-unit-movement-and-elephant-rampage`, `army-cohesion.loss-accounting-and-simultaneous-rout`.

## Scan-Confirmed Baseline

- A unit that loses all cohesion is routed and removed, but routing and pursuit are resolved only at end of the player sequence after combats finish.
- Routed melee units may first reorient toward the main enemy if they were attacked only on flank or rear. Routed-from-shooting units do not reorient.
- Friendly units directly behind the routed unit and within less than `1 UD` lose one cohesion point as the rout passes through them, creating possible cascades.
- Artillery, war wagons, and scythed chariots route without collateral effect; routing LI only affects other LI; routing elephants trigger elephant rampage instead of normal rearward collateral.
- Elephant rampage chooses direction by `1D6` and can hit both friendly and enemy units except LI, potentially causing further rout cascades.
- Only the phasing player's units pursue.
- Pursuit is a straight move up to `1 UD` that ignores enemy ZoC. Elephants and impetuous units that pursue must move the full `1 UD`.
- War wagons, artillery, and expendable levies never pursue.
- Pursuit is optional for non-impetuous units and mandatory for elephants and impetuous troops except for the listed exception matrix.
- No pursuit occurs if the unit still has front-edge contact with enemies on flank or rear; it conforms instead to one of those enemies.
- If pursuit contacts a new enemy, the pursuer conforms immediately, the enemy may evade if allowed, and the resulting fight is scheduled for the next melee phase and is not a charge.
- New flank or rear contact during pursuit can trigger the same immediate multiple-attack cohesion loss logic, but if that makes the enemy rout there is no further subsequent pursuit.
- Army-rout check happens at end of each player's sequence. Army cohesion value equals current unit count, with fortified or sacred camp as an extra unit, and off-table flank-march or ambush troops excluded from current value.
- Army-cohesion losses use the page table: disorder, table exit, routed units, lost commanders, lost camps, and fortified or sacred camps each contribute specific values. Expendables count neither toward army cohesion value nor losses.
- If both armies rout in the same check, the game is a draw by simultaneous rout.

## Engine Invariants

- Rout and pursuit are delayed sequence-end event chains, not immediate inline effects inside each melee resolution call.
- End-of-sequence processing needs deterministic ordering for reorientation, collateral rout propagation, elephant rampage, pursuit eligibility, pursuit contact, and army-rout check.
- Army-cohesion accounting needs separate current-value and accumulated-loss models so off-table units, expendables, camps, and commander losses score correctly.
- Pursuit contact must preserve the distinction between `not a charge`, `immediate conformation`, `enemy may evade`, and `next melee phase combat`.

## Edge Cases And Test Hooks

- Rout tests: shot-routed versus melee-routed orientation, rear collateral under `1 UD`, LI-only collateral, artillery/wagon/chariot no-collateral case, and elephant rampage direction branches.
- Pursuit tests: optional versus mandatory pursuit, no-pursue exception matrix, full `1 UD` elephant or impetuous pursuit, flank-or-rear remaining enemy contact stopping pursuit, and new-enemy contact branch.
- Army-rout tests: current-value exclusion for ambush/flank-march absentees, expendable exclusion, commander-value loss scoring, camp loss scoring, and simultaneous rout draw.

## Open Verification

- Keep the no-pursue exception matrix and contact-new-enemy branch open in `docs/rules/open-verification.md` until each branch is pinned to exact solver predicates.
- Keep army-cohesion accounting open until setup-state interactions for ambush, flank march, sacred camp, and off-table losses are checked against the setup source-locks.