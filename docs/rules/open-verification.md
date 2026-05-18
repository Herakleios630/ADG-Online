# Open Rule Verification

This file tracks rule areas that must be checked directly against the source documents before implementation.

## How To Use This File

- This is the single tracker for unresolved rule-source questions in the repository.
- Add an item here whenever a rule summary depends on OCR help, uncertain page ordering, unclear diagrams, conflicting wording, or missing page references.
- Close an item only after the relevant authoritative source and errata have been checked directly.
- Do not leave unresolved rule uncertainty only inside feature docs such as `movement.md` or `terrain-and-setup.md`; link back here instead.

## Status Labels

- `open`: unresolved source question still blocks or weakens confidence.
- `ocr-check`: OCR helper text exists, but authoritative confirmation is still required.
- `errata-check`: base rule and errata interaction still needs direct confirmation.
- `resolved`: checked against the authoritative source and no longer blocks planning.

## Entry Format

Use this compact entry format for new items:

```markdown
- ID: setup.sequence.order
	Status: open | ocr-check | errata-check | resolved
	Area: setup | movement | zoc | charge | combat | army-lists | hidden-info
	Sources: Rules.pdf p.X, Errata_ADG_V4_English.pdf p.Y, merged.pdf helper
	Question: ...
	Why it matters: ...
	Next check: ...
```

## High Priority

- Standard 200-point profile: 200 points, three corps, mandatory camp, commander/camp budget, standard battlefield profile, and initiative inputs.
- Sequence of play and exact phase names.
- Complete pre-battle sequence: initiative, attacker/defender, region, terrain, terrain adjustment, camps/fortifications, battle plan, ambushes, deployment, dismounting, start battle.
- Terrain placement procedure: regions, compulsory terrain, selection quotas, legal terrain shapes, deployment zones, camps, fortifications, obstacles, roads, rivers, hills, and villages.
- Hidden information: battle plans, ambush contents, fake markers, flank marches, reveal triggers, hotseat player views, replay visibility.
- Deployment: corps zones, command range at deployment, commander placement, visible/off-table forces, dismounting order.
- Movement allowance table by troop type, terrain, road, and special state.
- Wheel, slide, turn, extension, contraction, interpenetration, and difficult maneuver restrictions.
- ZOC definition, exceptions, most-threatening enemy tie breakers, and ZOC movement permissions.
- Charge declaration, contact type, charge range, minimum advance, evade, and reaction rules.
- Conformation diagrams, shifting restrictions, incomplete conformation, already-in-contact cases, and errata amendments.
- Shooting ranges, line of sight, cover, terrain effects, target priorities, and results.
- Melee combat factors, support, multiple attacks, terrain penalties, abilities, quality, cohesion loss, and errata amendments.
- Rout, pursuit, rally, army cohesion, victory, and end-game conditions.
- Army list data conversion from printed lists and spreadsheet formulas.

## P4 Handoff Note

- P4 is accepted complete as a movement-command foundation only.
- Remaining post-P4 rule blockers were carried into later phases and must stay source-explicit here until verified: movement allowances by troop type, terrain movement effects, wheel/slide/turn edge cases beyond the approved subset, broader ZOC legality interpretation, group movement, difficult maneuvers, special troop exceptions, charge, and conformation.

## P5 Handoff Note

- P5 is accepted complete as a conservative ZOC + movement-legality foundation, including implemented active-player ownership and movement-phase gating plus display-only diagnostics overlays.
- Unresolved source-sensitive ZOC/movement interpretation items in this file remain open by design and must continue to surface as `needs-source-check` rather than being treated as tournament-complete coverage.

## Source Extraction Notes

- `Rules.pdf` and `ArmyLists1-82.pdf` produced almost no usable text through normal PDF extraction.
- `merged.pdf` is now available as an OCR working copy, but it is in the wrong internal order with army lists before rules and may contain OCR errors.
- OCR-derived facts from `merged.pdf` must be treated as helper text until confirmed against `Rules.pdf`, `ArmyLists1-82.pdf`, and `Errata_ADG_V4_English.pdf`.
- Rendered visual page sheets exist in the temporary extraction folder from the initial architecture pass, but durable rule summaries must be written here before implementation relies on them.
- Errata text was readable and should be summarized into `errata.md` before implementing affected systems.

## P1-00 Source Inventory Snapshot

- Available authoritative sources in `Konzepte/`: `Errata_ADG_V4_English.pdf`, `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`, `Reglettes.pdf`, `Konzept.pdf`, `Reference_Sheet_V4.pdf`.
- Available OCR helper in `Konzepte/`: `merged.pdf`.
- Current practical reading status:
	- `Errata_ADG_V4_English.pdf`: text-readable.
	- `Konzept.pdf`: text-readable.
	- `Army_list_spreadsheet_V4 (1).xlsx`: spreadsheet-readable.
	- `Reglettes.pdf`: partially text-readable.
	- `Reference_Sheet_V4.pdf`: tournament quick-reference source, currently not text-readable through the available local tools; use as a manual cross-check, not as an override over errata or the full rulebook.
	- `Rules.pdf`: effectively image-based for normal extraction.
	- `ArmyLists1-82.pdf`: effectively image-based for normal extraction.
	- `merged.pdf`: OCR-searchable helper with wrong section order and imperfect accuracy.
- No source file is missing, but OCR uncertainty remains an open verification concern rather than a blocker.

## P3-00 Reference Sheet And Tournament Setup Notes

- ID: setup.reference-sheet-v4-cross-check
	Status: open
	Area: setup
	Sources: `Reference_Sheet_V4.pdf`, `Rules.pdf`, `Errata_ADG_V4_English.pdf`
	Question: which setup, terrain, deployment, ambush, flank-march, and battle-plan details from the tournament reference sheet should be used as quick-reference confirmations for P3?
	Why it matters: the reference sheet is used in tournament practice, but it must cross-check rather than override the full rules and errata.
	Next check: manually compare the reference sheet against the setup and terrain sections before implementing any official setup validator.

- ID: setup.tournament-battle-plan-board
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, tournament practice note from user
	Question: what exact official meaning and timing attach to the tournament battle-plan sheet, including left/center/right corps assignment, flank march assignment, and ambush marker contents?
	Why it matters: P3 should model the practical battle-plan UI as private setup data without confusing its three sectors with battlefield terrain/deployment sectors.
	Next check: verify battle-plan, ambush, and flank-march wording against the rulebook, errata, and reference sheet.

- ID: setup.deployment-corps-relative-and-overlap
	Status: open
	Area: setup
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, `Errata_ADG_V4_English.pdf`
	Question: what exact constraints govern corps relative deployment, unit overlap prevention, ambush/off-table exceptions, commander placement, and legal zone membership during deployment?
	Why it matters: P3 can add placeholder non-overlap and footprint hooks, but official deployment validators need exact source wording before claiming legality.
	Next check: verify deployment and battle-plan sections directly against source PDFs and errata.

- ID: hidden-info.multiplayer-secret-battle-plan
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, `Reference_Sheet_V4.pdf`, future multiplayer visibility policy
	Question: exactly which battle-plan, flank-march, ambush, fake-marker, and off-table facts must remain secret in player views and multiplayer payloads, and when do they become public?
	Why it matters: future multiplayer must not accidentally serialize private setup truth to the opponent.
	Next check: verify setup disclosure, reveal, ambush, and flank-march wording, then map each hidden data class to a visibility rule.

## P1-02 Standard 200 Notes

- ID: standard-200.budget-table.values
	Status: open
	Area: setup
	Sources: `Rules.pdf` budget section, `Army_list_spreadsheet_V4 (1).xlsx` `Standard format (200 pts)` sheet
	Question: what are the exact commander, camp, sacred camp, fortified camp, fortification, and obstacle budget values for Standard 200?
	Why it matters: P3 and P11 cannot safely validate camps or roster spending without the exact table values.
	Next check: direct page-by-page confirmation against the rulebook plus spreadsheet cross-check.

- ID: standard-200.initiative-inputs
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`
	Question: which exact inputs and modifiers are required before attacker or defender decision and region choice in Standard 200?
	Why it matters: P3 setup flow and later deterministic setup state need the exact pre-battle input model.
	Next check: verify the setup sequence directly against rulebook and errata.

- ID: standard-200.commander-exceptions
	Status: open
	Area: army-lists
	Sources: `Rules.pdf`, `ArmyLists1-82.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: are there any Standard 200 exceptions or special interactions for allied or unreliable commanders that affect required data fields?
	Why it matters: P1 should not overstate the commander structure if later list validation needs special cases.
	Next check: cross-check army-list and spreadsheet notes against the authoritative printed or PDF source.

## P1-04 Sequence And Setup State-Machine Notes

- ID: setup.sequence.public-private-boundaries
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`, `merged.pdf` helper
	Question: which setup decisions are public immediately, which remain private, and which become visible only through later reveal rules?
	Why it matters: P3 setup flow and hidden-info model must know exactly which state outputs are visibility-scoped.
	Next check: verify battle plan, ambush, flank march, deployment, and dismount timing directly against authoritative sources.

- ID: setup.sequence.locked-transitions
	Status: open
	Area: setup
	Sources: `Rules.pdf` setting up section, `Errata_ADG_V4_English.pdf`
	Question: which setup decisions lock immediately and which can still be changed by later terrain adjustment or setup steps?
	Why it matters: the setup reducer cannot safely enforce state transitions without knowing what becomes immutable at each step.
	Next check: direct rulebook pass over setup order and adjustment language.

- ID: turn.loop.phase-order
	Status: open
	Area: setup
	Sources: `Rules.pdf` overview and command or phase sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact official battle-phase names and order, and are any steps simultaneous or conditional?
	Why it matters: P4-P10 need a stable lifecycle skeleton before detailed validators are attached.
	Next check: verify phase order from the authoritative rulebook and errata.

## P1-05 Terrain And Setup Blockers

- ID: terrain.region-table-and-quotas
	Status: open
	Area: setup
	Sources: `Rules.pdf` terrain and setup sections, `merged.pdf` helper
	Question: what is the exact region table, including compulsory terrain and terrain-selection quotas for Standard 200 setup?
	Why it matters: P3 cannot model legal terrain selection without the authoritative region and quota structure.
	Next check: direct rulebook pass over region and terrain-selection pages.

- ID: terrain.size-and-placement-geometry
	Status: open
	Area: setup
	Sources: `Rules.pdf` terrain description and setup sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact size limits, overlap restrictions, edge constraints, and road or river placement rules for terrain pieces?
	Why it matters: P3 needs a geometry-ready placement validator boundary even before full terrain interaction logic exists.
	Next check: verify terrain dimension and placement language directly against the rulebook and errata.

- ID: setup.camps-fortifications-obstacles
	Status: open
	Area: setup
	Sources: `Rules.pdf` setup section, `Errata_ADG_V4_English.pdf`, `Army_list_spreadsheet_V4 (1).xlsx`
	Question: what are the exact legality, budget, and placement rules for camps, sacred camps, fortified camps, fortifications, obstacles, and stakes?
	Why it matters: P3 and P11 cannot safely model setup objects or point impacts without exact rules.
	Next check: verify camp and fortification sections directly, then cross-check against format profile assumptions.

- ID: setup.deployment-zone-math
	Status: open
	Area: setup
	Sources: `Rules.pdf` deployment and setup sections, `Errata_ADG_V4_English.pdf`
	Question: what are the exact deployment-zone boundaries and any terrain or battle-plan interactions that alter them?
	Why it matters: P3 deployment planning must not rely on the P0 visual guide once official setup begins.
	Next check: direct source verification of deployment-zone diagrams and wording.

## P1-06 Hidden Information And Player-View Notes

- ID: hidden-info.roster-disclosure-timing
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf` setup and deployment sections, `merged.pdf` helper
	Question: when does the opponent legally know full roster content, corps assignment details, and hidden declarations during standard setup?
	Why it matters: player-view filtering and hotseat privacy cannot be modeled safely without the disclosure boundary.
	Next check: verify setup and deployment wording directly in authoritative sources.

- ID: hidden-info.reveal-trigger-set
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf` ambush and flank march sections, `Errata_ADG_V4_English.pdf`
	Question: which reveal triggers are mandatory, optional, distance-based, line-of-sight-based, or phase-specific?
	Why it matters: reveal events need explicit legality and logging rules instead of ad hoc UI behavior.
	Next check: direct ambush and flank-march source pass with errata cross-check.

- ID: hidden-info.player-view-explanations
	Status: open
	Area: hidden-info
	Sources: `Rules.pdf`, future UI explanation policy
	Question: what explanation text may safely be shown to a player when the canonical validator knows hidden enemy data that the player should not know?
	Why it matters: explanation panels can leak hidden state even if battlefield objects are filtered correctly.
	Next check: keep as a planning constraint now and revisit once hidden-info source review and explanation surfaces are deeper.

## P1-08 Review And P2 Readiness Notes

- P1 review handoff status: documentation foundation accepted complete by the user on 2026-05-16; P2 may move into brainstorming and execution-board preparation.
- Geometry readiness note: the current open verification set does not block P2 pure geometry work for rotated rectangles, facing, and front or flank or rear relationships.
- Geometry boundary note: P2 should depend on `BaseProfile` dimensions and orientation conventions from the P1 planning docs, not on terrain, setup, movement allowance, or hidden-info rule confirmation.
- Carry-forward warning: setup, terrain, disclosure, and phase-order open items remain blockers for P3+ and must stay in this tracker until checked against authoritative sources.

## P4-01 Movement Command Notes

- ID: movement.command-context-minimum
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement and command sections, `Errata_ADG_V4_English.pdf`, `Reglettes.pdf` as distance helper only
	Question: what exact command-context facts must exist before an advance, wheel, or slide can be treated as a legal movement order rather than a geometry preview?
	Why it matters: P4 must not claim official movement legality without the minimum active player, corps, commander, command range, CP, and in-command facts.
	Next check: direct phase review of movement-order wording, command prerequisites, and any free-command cases.

- ID: movement.allowances-and-road-terrain
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement section, `Reglettes.pdf`, `Errata_ADG_V4_English.pdf`
	Question: what are the exact movement allowance tables by troop class, terrain crossed, road case, and special state for the P4 subset?
	Why it matters: P4 can preview geometry, but cannot validate legal move distance without the authoritative allowance table and terrain interaction.
	Next check: direct rulebook plus ruler cross-check for movement categories and road exceptions.

- ID: movement.wheel-measurement-and-pivot
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement diagrams or wheel wording, `Reglettes.pdf`, `Errata_ADG_V4_English.pdf`
	Question: what exact pivot geometry, measurement method, and edge-case restrictions define a legal wheel for units and groups?
	Why it matters: P4 wants wheel preview and distance accounting, but incorrect pivot or distance measurement would poison later movement and charge logic.
	Next check: direct page and diagram verification for wheel measurement, especially outer-front-corner distance and pivot side assumptions.

- ID: movement.slide-distance-and-frequency
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement section, `Errata_ADG_V4_English.pdf`
	Question: what exact limits govern slide distance, slide direction, and how many slides a unit or group may perform in one movement phase?
	Why it matters: P4 intends to include slide as a first movement command, but the cap and allowed repetition must be source-checked before official legality claims.
	Next check: direct source pass over slide wording plus any errata-sensitive exceptions.

- ID: movement.group-movement-and-reshape
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement section, `Errata_ADG_V4_English.pdf`
	Question: what exact rules govern starting and ending as a group, temporary splits, extension, contraction, overlap allowances, and re-forming during movement?
	Why it matters: the first P4 slice intentionally defers full group movement, but the command model must preserve the right hooks for a later complete implementation.
	Next check: verify group movement and frontage-change wording before any group validator is implemented.

- ID: movement.turns-difficult-maneuvers-and-errata
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement section, `Errata_ADG_V4_English.pdf`
	Question: what exact costs and restrictions apply to quarter-turns, half-turns, difficult maneuvers, and multi-turn combinations, especially for light troops?
	Why it matters: P4 may defer these moves, but the source split must be explicit because they constrain the later movement-command family.
	Next check: direct errata-led review of turn restrictions and difficult-maneuver cases.

- ID: movement.special-troops-and-interpenetration
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` troop movement exceptions, `Errata_ADG_V4_English.pdf`
	Question: which special troop classes and interpenetration cases alter the standard movement-command assumptions for the P4 subset?
	Why it matters: P4 must not make a generic movement engine look rules-complete if major troop-class exceptions and interpenetration permissions are still unresolved.
	Next check: verify movement exceptions for light troops, war wagons, heavy artillery, cataphracts, pikemen, elephants, scythed chariots, and interpenetration cases.

## P5-01 ZOC And Movement-Legality Notes

- P5 source-review status: ZOC and strict movement legality remain source-sensitive; this section lists the concrete blocker IDs that must stay explicit during P5 implementation.
- P5 implementation reminder: unresolved items below must be surfaced as `needs-source-check` diagnostics rather than silently treated as full official legality.

- ID: zoc.definition-front-geometry-and-range
	Status: open
	Area: zoc
	Sources: `Rules.pdf` movement/ZOC sections, `Errata_ADG_V4_English.pdf`
	Question: what exact geometric condition defines being in enemy ZOC, including front orientation constraints and distance threshold details?
	Why it matters: P5 ZOC detection must be deterministic and rule-conform; a wrong zone definition invalidates all downstream movement legality.
	Next check: direct source pass over base ZOC wording/diagrams and any errata wording that changes geometry or threshold interpretation.

- ID: zoc.most-threatening-priority-and-tie-breaks
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` ZOC and conformation-related sections, `Errata_ADG_V4_English.pdf`
	Question: what is the exact priority order and tie-break logic for selecting the most threatening enemy when multiple ZOCs apply?
	Why it matters: P5 movement legality and later conformation/charge behavior depend on one deterministic controlling enemy selection.
	Next check: direct source and errata cross-check of nearest/front/flank-rear priority and tie handling.

- ID: zoc.allowed-movement-while-constrained
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` movement/ZOC sections, `Errata_ADG_V4_English.pdf`
	Question: which exact movement options are legal while constrained by the most threatening enemy ZOC (including facing/aligning/closing/charge-related allowances)?
	Why it matters: P5 cannot enforce entry/stay/exit legality without a source-backed action set for units currently in ZOC.
	Next check: direct errata-led pass on clarified ZOC permissions and movement prohibitions.

- ID: zoc.mid-segment-entry-exit-detection
	Status: open
	Area: zoc
	Sources: `Rules.pdf` movement procedure context, `Errata_ADG_V4_English.pdf`
	Question: which transitions during a movement segment must be treated as immediate legality checkpoints when a path enters or exits ZOC between start and end poses?
	Why it matters: P5 path splitting/sampling must know when legality changes during a segment instead of checking only endpoints.
	Next check: validate whether the rule wording requires point-in-time transition checks and any immediate restrictions once ZOC is entered.

- ID: zoc.terrain-suppression-and-non-exerting-cases
	Status: errata-check
	Area: zoc
	Sources: `Rules.pdf` terrain/ZOC interactions, `Errata_ADG_V4_English.pdf`
	Question: which terrain states and unit categories suppress exerting or receiving ZOC, and what exact exceptions apply?
	Why it matters: false-positive ZOC enforcement is likely unless terrain and non-exerting exceptions are codified from source.
	Next check: errata-first review of terrain-penalized-combat ZOC suppression and unit-type exceptions.

- ID: movement.active-player-and-phase-legality
	Status: open
	Area: movement
	Sources: `Rules.pdf` sequence/command/movement sections, `Errata_ADG_V4_English.pdf`
	Question: what exact lifecycle conditions gate legal movement proposals (active player ownership, active corps context, legal battle phase)?
	Why it matters: P4 intentionally left this incomplete; P5 must add strict gating for ownership and phase legality without guessing lifecycle details.
	Next check: verify sequence and command context wording against phase-order source checks and movement-order prerequisites.

- ID: movement.zoc-turn-slide-wheel-interactions
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement/ZOC sections, `Errata_ADG_V4_English.pdf`
	Question: how do turn, wheel, and slide permissions/restrictions change when a unit starts in ZOC, enters ZOC mid-move, or faces rear/flank ZOC cases?
	Why it matters: P5 legality for segmented `advance`/`wheel`/`slide` previews depends on these interaction rules and errata clarifications.
	Next check: errata-led source check for in-place turning allowances, alignment-before-charge allowances, and blocked lateral movement cases under ZOC.

## P6-00 Command-System Source Lock Notes

- P6 source-review status: corps activation order, command points, command-cost modifiers, and command-coupled movement limits are source-sensitive; this section lists concrete blocker IDs for the approved P6 subset.
- P6 implementation reminder: unresolved items below must be surfaced as `needs-source-check` diagnostics rather than treated as tournament-complete command legality.

- ID: command.corps-activation-order-and-lock
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement/command sequence sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: what exact sequence constraints apply to corps activation choice, completion lock, and re-activation prohibition within one movement phase?
	Why it matters: P6 must enforce one-by-one corps activation without allowing replay-breaking or rule-breaking re-activation.
	Next check: direct source pass over movement sequence wording and any errata clarifications.

- ID: command.range-nearest-point-measurement
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` command range wording, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm that command range uses straight-line distance between nearest points on commander base and selected unit/group base in all relevant cases, including grouped movement and boundary-equality cases.
	Why it matters: P6 command range validator depends on this geometric invariant; ambiguity would create non-deterministic in-command classification at range boundaries.
	Next check: verify exact wording, group treatment, and inclusive/exclusive boundary handling from authoritative source text.

- ID: command.cp-formula-and-rounding
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` command points section, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm exact CP formula, rounding direction, and free-CP handling, including commander-value mapping and any exceptions.
	Why it matters: CP generation must be deterministic and auditable; wrong rounding or value mapping invalidates all order costs.
	Next check: direct command-points source check for formula and examples.

- ID: command.order-cost-components
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` orders section, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which exact CP components are additive for an order (in-range base cost, out-of-range surcharge, difficult manoeuvre surcharge, commander-engaged surcharge), what is the official resolution order, and does the commander-engaged `+1 CP` apply specifically when the moved unit is not the commander's own attached or included group?
	Why it matters: P6 command-cost diagnostics and reducer gates need deterministic component accounting.
	Next check: direct orders wording pass with explicit additive examples, especially the commander-in-combat exception boundary for attached or included groups. Current P6 policy is conservative: unresolved difficult-manoeuvre and commander-engaged cases block movement confirmation instead of being auto-priced from incomplete source closure.

- ID: command.order-timing-in-command-snapshot
	Status: resolved
	Area: movement
	Sources: `Rules.pdf` p.26, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: is out-of-command cost checked when the order is given, so a unit or group that starts in command keeps the normal order cost even if its later movement path ends outside command range?
	Why it matters: P6 should freeze order-cost command status at order start if that is the official rule, instead of re-pricing later sub-moves in the same declared order.
	Next check: resolved for timing by the page-26 rule text reported by the user: `Command range is evaluated at the moment the order is given. A commander can give an order, move to get in range and give another order.` Later second or third moves must therefore perform a fresh command-range check when that new order is given.

- ID: command.rally-and-charge-cp-gating
	Status: open
	Area: movement
	Sources: `Rules.pdf` orders/charge/rally sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: how should rally and uncontrolled-charge CP entries be represented before full charge/melee lifecycle phases are implemented?
	Why it matters: P6 must avoid fake completeness while still preserving correct future CP hooks.
	Next check: define a source-backed placeholder policy for pre-P7/P9 command costs.

- ID: command.attach-detach-cost-and-timing
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` commander movement and orders wording, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: for a non-included commander attaching during movement, what is the exact official cost/timing model: does the attach sequence consume only the commander's movement allowance, also consume the corps free CP or a normal order cost, when exactly does the relation end, and what exact restrictions apply if enemies/contact/combat are involved? Current P6 reading from the user's direct rules summary treats voluntary same-turn detach as not allowed.
	Why it matters: P6 now exposes a movement-only attach preview skeleton and automatic turn-end release, but exact tournament-legal pricing, release timing, and contact constraints must be source-closed before this path can be claimed rule-complete.
	Next check: direct source pass over commander movement and attached/included wording, with explicit confirmation of cost examples, end-of-turn release wording, and combat/contact exceptions.

- ID: movement.multiple-move-and-third-move-restrictions
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` movement multiple-movements sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: what exact constraints govern movement counts, 4 UD enemy-distance condition, and third-movement restrictions by troop class and commander presence once order atomicity is assumed?
	Why it matters: P6 movement budget and command-cost legality can be wrong if repeated movement constraints are omitted or misapplied.
	Next check: direct source pass over movement-count restrictions and exception classes. Order atomicity itself is now treated as source-closed from the user-supplied `Rules.pdf` quotations: `Each CP allows one move order to be given to a unit or a group of units`, `The player then performs ... all the movement, charges and rally attempts ... up to the CP available`, and `A movement can be performed by a unit or a group of units.` Remaining open work is the exact third-move and exception structure, not whether one order may be paused and interleaved with another.

- ID: movement.order-atomicity-and-no-interleaving
	Status: resolved
	Area: movement
	Sources: `Rules.pdf` command/orders wording as quoted by the user on 2026-05-18, `Errata_ADG_V4_English.pdf`
	Question: may a unit or group begin a movement order, pause it, activate another unit/group, and then return to finish the first order?
	Why it matters: reducer movement flow must know whether an order is one atomic action or a pausable sequence.
	Next check: resolved for P6. Treat one CP as one fully resolved move order for one unit/group, with no interleaving between units. Remaining multiple-move edge cases stay tracked separately under `movement.multiple-move-and-third-move-restrictions`.

- ID: movement.difficult-manoeuvre-classification
	Status: errata-check
	Area: movement
	Sources: `Rules.pdf` difficult manoeuvre sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: which maneuvers are classified as difficult for standard and unmanoeuvrable cases, and how this classification interacts with CP surcharges?
	Why it matters: P6 uses difficult-manoeuvre as a CP-cost input; misclassification corrupts command legality.
	Next check: source/errata cross-check for quarter-turn, half-turn, extension/contraction, reduced movement, ZoC-exit cases, special troop exceptions, and third-movement cases. Current policy is conservative: P6 keeps ordinary current-subset moves confirmable with a verified `no difficult trigger detected` result, but source-sensitive or explicitly marked difficult-manoeuvre cases now block confirmation instead of remaining advisory-only. The live reducer still does not auto-charge difficult-manoeuvre CP from the present advance/wheel/slide subset until the trigger set is source-closed.

- ID: movement.commander-movement-budget
	Status: open
	Area: movement
	Sources: `Rules.pdf` commander movement sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm commander movement allowance and restrictions, including interactions with corps command effects in the same phase.
	Why it matters: P6 fixture and command-range expectations depend on correct commander movement behavior.
	Next check: direct commander movement wording check plus errata cross-reference.

- ID: command.commander-attach-detach-legality
	Status: open
	Area: movement
	Sources: `Rules.pdf` commander movement and command sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: confirm exact legality, cost, and placement procedure when a non-included commander attaches to or detaches from a unit, including range limits and whether wheel/turn is involved.
	Why it matters: P6 commander command-actions must be reducer-deterministic and rule-conform; placement ambiguity would break replay consistency.
	Next check: direct source pass over commander join/leave wording and diagrams, with errata cross-check.

- ID: command.commander-detach-combat-lock-timing
	Status: open
	Area: movement
	Sources: `Rules.pdf` movement/melee/contact lifecycle sections, `Errata_ADG_V4_English.pdf`, `Reference_Sheet_V4.pdf`
	Question: in which combat/contact states a commander may no longer leave an attached unit, and at what exact timing this lock applies or ends.
	Why it matters: attach/detach can be staged in P6, but combat-lock behavior must remain correctly phase-gated for P7+ without illegal early assumptions.
	Next check: verify contact/melee timing language and commander-engagement errata interaction.

## P2-01 Geometry Assumptions Note

- P2 documentation boundary: geometry labels such as `front`, `leftFlank`, `rightFlank`, `rear`, `boundary`, and `ambiguous` are accepted as pure geometry/debug outputs for this phase.
- P2 non-claim reminder: these labels do not by themselves establish official AdG legality for movement, charge, ZOC, conformation, contact, combat, setup, or terrain interaction.
- P2 dependency reminder: base dimensions and pose are sufficient for current geometry work; unresolved setup, terrain, disclosure, and phase-order questions remain carried forward for P3+.
