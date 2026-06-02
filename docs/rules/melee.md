# Melee Source Lock

Status: RV2-04 first source-lock baseline from Rules-v2 p.60-67; implementation-grade only after combat-factor table binding and ordered modifier application are manually accepted.

## Source References

- `docs/source/Rules_v2.md` `rv2.melee-core`, `rv2.melee-resolution-and-modifiers`, `rv2.melee-examples-and-camp-assault`, and `rv2.fortifications-obstacles-and-war-wagons`.
- Example crops: `rv2-p61-support-example-1-a`, `rv2-p61-support-example-2-a`, `rv2-p62-melee-resolution-table-a`, `rv2-p63-flank-rear-attack-a`, `rv2-p64-situation-modifier-example-a`, `rv2-p64-height-advantage-a`, `rv2-p65-melee-examples-a`, `rv2-p66-attacking-camp-example-a`, `rv2-p67-war-wagons-support-a`.
- Errata summary: `docs/rules/errata.md`, especially combat-factor, flank or rear, commander, terrain, and war-wagon clarifications.
- Open verification: `melee.main-unit-support-multiple-attack-and-modifiers`, `setup.camp-attack-and-defense-special-cases`.

## Scan-Confirmed Baseline

- Melee follows movement and shooting. The phasing player chooses local resolution order, but melee outcomes are simultaneous.
- Every unit in enemy contact is classified as `main unit`, `simple support`, or `melee support`. Corner-only contact is not enough for melee; partial conformation and `most in front` decide ambiguous main-unit cases.
- Simple support gives `+1`; melee support gives combat factor `+1` while ignoring disorder, commander presence, and special abilities for the support value itself.
- Support counts are limited by flank and rear geometry, and if more than one support candidate exists on the same flank the owner chooses which counts.
- Multiple attacks are a separate immediate effect. A newly coordinated flank or rear attack by a non-light attacker that fully conforms causes one immediate cohesion loss, capped at one per player sequence, before normal melee resolution.
- Melee resolution compares combat factors plus situation and terrain modifiers, applies quality to the die, then applies differential and final-result modifiers before mapping the result to cohesion loss or rout.
- First-round-only abilities such as `Furious charge` depend on charge context and front-edge charge reception, not merely on being in first contact.
- Flank or rear attack can reduce the defender combat factor to `0` when the attacker is a non-light unit fully conformed on flank or rear. Some cancellations still apply even when full conformation is absent.
- Light infantry in open terrain against specified heavy opponents is auto-routed rather than resolving normal melee, but not when fully protected by qualifying terrain or fortification conditions.
- Height, riverbank, fortification, obstacle, war-wagon, and camp-assault branches are special melee families and cannot be folded into one generic factor lookup.
- Camp assault is its own combat state: unfortified camp is automatically lost in melee; fortified camp uses special die thresholds, no ordinary modifiers, and no defender-inflicted losses.
- A looted camp remains on the battlefield as an obstacle and looting units become locked special-state units until successfully ordered away.
- Fortifications and obstacles shift front-edge logic, block wheel behind the barrier, and change support, cover, and mounted attack penalties.
- War wagons define their own contact model: all edges are front for combat, no flank/rear attack against them, no multiple attack against them, and only one enemy main unit fights a wagon at a time.

## Engine Invariants

- Melee needs explicit role classification output for every contacting unit before factor calculation begins.
- The solver pipeline must separate `combat factor`, `support`, `die modifier`, `final result modifier`, `immediate multiple-attack loss`, and `special auto-rout` stages.
- Camp, fortification, obstacle, and war-wagon states are not cosmetic terrain tags; they alter contact geometry, support legality, special branches, and victory accounting.
- Commander engagement must distinguish `attached to main melee unit`, `included commander`, and `melee support only`, because errata narrows which states count as fighting.

## P9-03TF Melee Factor Rules Freeze

Freeze date: 2026-05-29.

Scope: this freeze is the mandatory source baseline for `P9-03T`, `P9-03O`, `P9-03U`, `P9-03V`, and `P9-03W`.

### Canonical representative-lane factor matrix

Allowed status values:

- `approved`: source-anchored for current implementation.
- `source-open`: cannot be claimed closed yet.
- `blocked`: structurally unavailable until another dependency closes.

| Attacker profile | Defender profile | Current lane status | Factor baseline | Source basis |
| --- | --- | --- | --- | --- |
| medium swordsmen | heavy spearmen | approved | attacker `+1`, defender `+1` | p.22 table row wording; no special mounted exceptions in this lane |
| heavy spearmen | medium swordsmen | approved | attacker `+1`, defender `+1` | p.22 table row wording; no open-terrain LI exception in this lane |
| heavy spearmen | light infantry javelin | source-open | conditional heavy-spearmen-vs-LMI branch is unresolved in current terrain-state seam | p.22 note depends on open-terrain condition not yet wired to deterministic lane closure |
| light infantry javelin | heavy spearmen | source-open | javelinmen taxonomy binding unresolved for representative profile mapping | p.22 javelin-family wording requires final taxonomy closure |
| medium cavalry impetuous | heavy cavalry impact | source-open | mounted-vs-mounted factors intentionally deferred | p.22 mounted rows plus errata wording still require direct transcription pass |
| heavy cavalry impact | medium cavalry impetuous | source-open | mounted-vs-mounted factors intentionally deferred | p.22 mounted rows plus errata wording still require direct transcription pass |
| any representative profile | camp / fortification / obstacle / war wagon special family | blocked | special-family branch required; generic lane factor binding is invalid | melee special branches in p.65-p.67 must not be collapsed into generic table lane |

Errata provenance policy for approved lanes:

- Every lane marked `approved` must carry explicit p.22 anchor plus any linked errata clarification.
- If an errata dependency is unresolved, lane status must be `source-open` and never upgraded by assumption.

### Modifier-stage freeze

Ordered ownership is fixed as:

1. combat factor (profile/table lane, including explicit to-0 branch when closed)
2. support stage
3. situation stage
4. terrain stage
5. die stage
6. final-result stage
7. result mapping (differential -> cohesion loss / rout)

Implementation constraint:

- Later cards may add entries inside a stage, but may not reorder stages.

### First-contact versus continuing combat freeze

- `first-contact` state means the first melee resolution cycle for that specific contact pairing.
- `continuing` state means subsequent cycles after first-contact has already been resolved once for that pairing.
- First-round-sensitive abilities (including impact/furious-charge families) are allowed only in `first-contact` lanes where source and errata confirm applicability.
- If applicability is not source-closed for a lane, emit explicit `source-open` diagnostics and do not silently apply the bonus.

### Flank/rear baseline freeze

- Flank/rear effect requires contact/conformation evidence; UI flags are not legal evidence.
- Defender combat-factor-to-`0` branch is only valid for source-closed formed-troop flank/rear lanes with required conformation evidence.
- Incomplete-conformation flank lane keeps explicit `+1 situation` branch as the conservative baseline when to-`0` preconditions are not met.
- Cancellation handling is branch-owned logic, not free-form modifier subtraction.

Cancellation baseline set for subsequent implementation cards:

- keep branch-specific cancellations explicit and source-anchored.
- if cancellation wording for a lane is unresolved, lane remains `source-open`.

### Residual source-open lanes after freeze

- mounted-vs-mounted factor closure (priority: cavalry-vs-cavalry).
- javelinmen representative taxonomy and LI branch exact binding.
- terrain-conditioned heavy-spearmen-vs-LI lane closure.
- complete flank/rear cancellation family extraction from direct source wording.
- first-contact ability timing closure for impact/furious-charge variants.

## Edge Cases And Test Hooks

- Role tests: main unit under incomplete conformation, front-corner simple support, true melee support on flank or rear, same-flank competing supporters, and corner-only non-melee contact.
- Multiple-attack tests: fresh flank contact, same-sequence multi-side engagement, fully conformed versus incomplete flank contact, and immediate rout before regular melee.
- Modifier tests: first-round-only abilities on front charge versus flank/rear, terrain-penalized mounted, height advantage, commander engaged bonus, and LI auto-rout exceptions.
- Special branch tests: fortified versus unfortified camp, looting lock, fortification/obstacle crossing fight, war-wagon support cancellation, and wagon main-unit selection.

## Open Verification

- Keep exact combat-factor table binding and ordered modifier scope in `docs/rules/open-verification.md` until the p.22 unit table and errata are checked together with the melee pages.
- Keep camp-loss, looting, and army-cohesion links aligned with rout and victory accounting so special-object combat never forks scoring logic.
