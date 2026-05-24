# P7A TODO - Evade + Charge Movement Branches

Status: Complete for the accepted supported subset - user accepted P7A on 2026-05-21; residual terrain/obstacle completeness, recursive secondary-target continuation, and later conformation/combat follow-ons remain deferred to later approved phases
Date drafted: 2026-05-20
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Intended branch: feature/p7a-evade-charge-branches
Master plan: roadmap.md
Concept source: docs/charge-phase-procedure-concept.md
Rules workspace: docs/rules/
Open verification source: docs/rules/open-verification.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/Reference_Sheet_V4.pdf

Current active card: none - phase closed pending later approved follow-on phases

## Purpose

P7A turns the target-reaction gate from P7 into a playable basic evade and charge-movement branch system before P8 shooting begins.

P7A covers the single-unit foundation for charge procedure point 6 (`if all initial targets evade`) and the reusable hooks needed for point 7 and point 8. It is not full group charge completeness. It must make the first real evade branch understandable, deterministic, replay-ready, and honest about unsupported cases.

## Scope Decision

In scope for P7A:

- defender reaction decisions from the P7 reaction gate
- source-checked evade eligibility data for the supported unit subset
- deterministic dice/random plumbing for evade and adjusted charge distance
- isolated single-unit evade movement
- adjusted charge-distance calculation for a single charger
- non-impetuous stop/continue choice in the supported subset
- impetuous forced-continuation hook where source-checked
- caught-evader detection and state hooks without full P10 rout/victory resolution
- blocked-evade diagnostics for the first supported enemy-ZOC and obstacle cases
- secondary-target reaction hook skeleton without claiming full recursive chain completeness
- browser-visible evade path and charge follow-through previews

Out of scope for P7A:

- group evade splitting and subgroup dice rolls
- full point 7 partial-target group branch
- full point 8 group continuation
- terrain-complete evade and charge movement
- full interpenetration adjustment solver beyond simple supported cases
- table-exit army-loss integration beyond explicit state hooks
- full LI destruction/rout resolution beyond source-visible hooks
- melee combat factors, pursuit, rout, or victory

## GPT-5.4 Execution Contract

GPT-5.4 must execute P7A card by card and keep the branch flow stable for local hotseat first.

Recommended execution order for clean flow:

1. `P7A-00`
2. `P7A-01`
3. `P7A-02`
4. `P7A-03`
5. `P7A-06`
6. `P7A-04`
7. `P7A-05`
8. `P7A-07`
9. `P7A-08`
10. `P7A-09`

Execution rules for GPT-5.4:

- P7A starts only at `P7A-00`. Do not write engine, reducer, or UI code for evade branches before the source-lock card is completed and recorded in this board.
- Treat `P7A-00` as a hard gate, not as soft background reading. If the supported evade subset or die-table mapping remains source-open after that card, stop there and return the blocker instead of implementing approximations.
- Do not start `P7A-04` charge follow-through until `P7A-03` has produced a replay-ready evade result for the supported isolated subset.
- Pull `P7A-06` ahead of the nominal numbering because the reaction popup must not offer a false `Ausweichen` choice when the first supported blocked-evade checks can already prove the evade is blocked.
- `P7A-08` is presentation-only. It must render the state created by `P7A-03`, `P7A-04`, `P7A-05`, and `P7A-07`; it must not create legality or movement logic.
- If a required rule detail is still source-open after `P7A-00`, stop at the smallest honest blocker and ask the user instead of inventing behavior.
- After each completed card, update this file with files touched, validation run, manual acceptance instructions, and the next exact card to execute.

## P7A Kickoff Contract

This is the exact start condition after accepted P7 closure:

- Input state comes only from the accepted P7 handoff states: `no-evade-handoff` and `evade-required`.
- GPT-5.4 must preserve the accepted P7 browser flow unchanged while adding P7A work. Any regression in `Richtung bestaetigen`, reaction modal ownership, or handoff serialization blocks further P7A implementation until repaired.
- The first execution slice is documentation and state-contract closure only. The goal is to remove ambiguity around evade eligibility, blocked-evade, and adjusted-distance mapping before writing branch logic.
- The first implementation card after source lock should remain as small as possible: capability data and reaction evaluation, not evade movement plus follow-through in one step.
- P7A must keep the same rule-ownership boundary as P7: engine/reducer decide legality and branch state; UI only projects it.

## Player Flow Contract For P7A

P7A consumes the handoff state produced by P7. GPT-5.4 must preserve this exact flow:

1. If P7 hands off `no-evade`, skip evade resolution entirely and move on to the later P7B conformation entry state.
2. If P7 hands off `evade-required`, open an evade-resolution modal.
3. Before showing a real evade choice, run the currently supported blocked-evade checks.

Evade-resolution modal contract:

- If evade is currently `blocked-evade`, show the blocked reason and a single continue button; result becomes the same no-evade handoff path used by `cannot-evade`.
- If evade is legal in the supported subset, show the reacting unit, contact side, reorientation summary, distance policy, and projected evade path.
- If the current UX uses deterministic/manual roll choice, the roll selection happens inside this modal before final confirmation.
- The player then confirms the evade result; only after that may the charger follow-through branch begin.

Charger follow-through contract:

- If the charger is non-impetuous and the rules allow a stop/continue choice, that is a second explicit confirmation step after evade resolution.
- If the charger is impetuous in a source-closed supported case, continuation is automatic.
- If the adjusted charge catches the evader, show the caught status as state/explanation only; do not resolve melee or rout in P7A.
- If a secondary target is encountered, pause explicitly and surface a secondary-target event rather than silently continuing.

Default product decisions for P7A unless the user overrides them:

- User decision 2026-05-20: start with deterministic manual/debug roll choice first, because it is easier to validate and replay.
- Use one modal sequence per branch rather than multiple floating battlefield prompts.
- Keep the battlefield overlays visual and the decisive confirmations in the side panel or modal.

## User Decision Gates

The following user decisions should be reconfirmed before GPT-5.4 implements the affected cards:

- User decision 2026-05-20 for `P7A-02`: deterministic manual/debug roll choice first.
- User decision 2026-05-20 for `P7A-08`: keep the first hotseat evade flow as a simple blocking modal, not a privacy handoff screen.
- User decision 2026-05-20 for `P7A-04`: non-impetuous `stop` versus `continue` uses a battlefield side-panel command state, not a popup.

## Open P7A Questions For User Or Source Check

GPT-5.4 must ask or source-check before implementing affected behavior:

- Source check: exact die result mapping for evade distance and adjusted charge distance.
- Source check: exact troop categories and ability combinations that produce `may-evade`, `must-evade`, `cannot-evade`, and `blocked-evade` in the supported subset.
- Source check: whether the first blocked-evade subset may safely treat enemy-ZOC and simple physical blockers as no-evade continuation, or whether a distinct blocked outcome must be preserved longer.
- User choice: should the initial evade modal show the projected path before dice selection, after dice selection, or both as pre-roll and post-roll previews.

## Execution Cards

### [x] P7A-00 - Evade Source Lock And Data Contract

Goal: source-lock the supported evade and adjusted charge branch before implementation.

Planned files:

- docs/rules/charge.md
- docs/rules/open-verification.md
- docs/charge-phase-procedure-concept.md
- P7A_todo.md

Implementation steps:
1. Manually cross-check Rules p.43 and p.47-49 plus Errata against the OCR helper notes.
2. Extract supported unit categories and ability gates for `may-evade`, `must-evade`, `cannot-evade`, and `blocked-evade`.
3. Source-lock the adjusted charge and evade distance die tables.
4. List unsupported group, terrain, table-edge, and special-troop exceptions as explicit `needs-source-check` diagnostics.
5. Define the minimal state contracts for `EvadePlan`, `ChargeMovementResolution`, and `ReactionDecision` consumption.
6. Record the first exact follow-up implementation card after source lock. Unless a source blocker forces a stop, that next card should be `P7A-01`.

Non-goals:

- no engine code
- no UI work
- no implementation of dice or movement

Validation:

- markdown diagnostics pass
- open-verification IDs are explicit and not duplicated
- planning docs mention the same supported subset and the same explicit deferrals

Manual acceptance:

- user confirms the supported P7A subset and known deferrals

Stop condition:

- stop if the basic may/must/cannot/blocked evade categories cannot be source-locked for the supported unit subset
- stop if the adjusted-distance mapping or blocked-evade subset still requires guessed behavior

Expected result: P7A starts with clear rule boundaries and no invented evade eligibility.

Done means:

- `docs/rules/charge.md`, `docs/rules/open-verification.md`, and `docs/charge-phase-procedure-concept.md` agree on the same first supported evade subset.
- The board names the exact deferred items that still block later cards instead of leaving them implicit.
- GPT-5.4 can begin `P7A-01` without reopening fundamental source questions about reaction category or die-distance mapping.

Completion note 2026-05-20:

- `docs/rules/charge.md`, `docs/rules/open-verification.md`, and `docs/charge-phase-procedure-concept.md` now agree on the first supported P7A evade subset.
- The first supported reaction categories are now fixed for implementation as `may-evade`, `must-evade`, `cannot-evade`, and `blocked-evade`, with explicit first-pass limits on terrain, group handling, table exit, optional evade wheel, and full mounted exception completeness.
- Current workspace OCR helper extraction supports the adjusted-distance mapping `1 => movement -1 UD`, `2-5 => normal movement`, `6 => movement +1 UD` for both charge continuation and evade. This is now documented as an OCR-backed working lock, while the original page images remain authoritative if a contradiction appears later.
- Residual open-verification items now focus on later completeness and errata interactions rather than basic first-pass categorization.
- Next exact card: `P7A-01 - Unit Reaction And Evade Capability Data`.

### [x] P7A-01 - Unit Reaction And Evade Capability Data

Goal: replace drill-only `chargeReactionProfile` shortcuts with source-shaped unit capability data for the supported subset.

Planned files:

- src/data/charge-drill-scenarios.js
- src/engine/charge/reaction.js
- src/engine/charge/reaction.test.js
- optional src/data/unit-capabilities.js

Implementation steps:
1. Add unit capability fields needed for evade: category, light/heavy class, key abilities, impetuous, impact, javelin, bow/crossbow markers.
2. Keep Charge Drill override hooks for testing, but make source-shaped capability evaluation the default path.
3. Return explicit diagnostics for missing capability data instead of guessing.
4. Add fixtures for may-evade, must-evade LI, cannot-evade, and blocked-source-open examples.

Non-goals:

- no full army-list data conversion
- no all-troop exception matrix
- no combat-factor implementation

Validation:

- focused reaction tests for supported capability categories
- Charge Drill fixture tests

Manual acceptance:

- user verifies the drill can still force all units to may-evade for testing

Stop condition:

- stop if capability fields would conflict with later army-builder schema needs

Expected result: reaction type is driven by rule-shaped data, with drill overrides preserved for testing.

Completion note 2026-05-20:

- `src/engine/charge/reaction.js` now evaluates source-shaped `chargeReactionCapability` data when no explicit drill/test override is present.
- Explicit `chargeReactionProfile` hooks remain available and continue to override capability evaluation for targeted drill and regression cases.
- The current first-pass capability evaluation now covers supported `may-evade`, `must-evade`, `cannot-evade`, and `blocked-evade` categorization, with malformed capability data escalating to `needs-source-check` instead of silently guessing.
- `src/data/charge-drill-scenarios.js` now seeds the drill with capability data instead of defaulting every unit to `may-evade`.
- Focused and slice-broader validation are green:
	- `node --test src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js`
	- `node --test src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`
- Next exact card: `P7A-02 - Dice And Replay Plumbing For Evade Branches`.

### [x] P7A-02 - Dice And Replay Plumbing For Evade Branches

Goal: add deterministic random/action context for evade and adjusted charge distance.

Planned files:

- src/engine/random/ or existing action-log helpers if available
- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/state/p0-state.js or focused charge state helper

Implementation steps:
1. Define a reusable die-roll claim/result object for P7A.
2. Support test-injected deterministic rolls.
3. Store roll reason, acting player, affected unit/group id, raw roll, modifiers if any, and mapped distance result.
4. Keep future replay compatibility with P13.

Non-goals:

- no global replay viewer
- no animation of dice
- no combat dice integration yet

Validation:

- tests for deterministic roll mapping and serialization

Manual acceptance:

- user accepts the initial dice UX policy: debug/manual first or automatic random first

Stop condition:

- stop if dice policy is undecided and would affect user-visible flow

Expected result: evade/charge adjustment rolls are deterministic and auditable.

Progress note 2026-05-20:

- `src/engine/charge/evade.js` now provides a first deterministic P7A roll seam: replay-shaped roll claims, roll results, and exact adjusted-distance mapping helpers for evade and adjusted charge distance.
- The current helper layer already preserves acting player, reacting unit, charging unit, target unit, raw `D6`, mapped distance outcome, modifier, resolved distance, and the `neverReduce` exception hook for heavy-infantry-style charge cases.
- `src/state/p0-state.js` now consumes that seam for the first real branch handoff: when a charge reaction resolves to `evade-required`, reducer state records a serializable pending evade-distance roll claim, and a focused `RESOLVE_CHARGE_BRANCH_DISTANCE` action can inject the `D6` and store the resolved result back into `chargePreview.branchDistanceRoll`.
- Focused validation is green:
	- `node --test src/engine/charge/evade.test.js src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js`
	- `node --test src/engine/charge/model.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js --test-name-pattern "charge preview model initializes|evade-required handoff creates and resolves a deterministic branch distance roll in state"`
	- `node --test src/engine/charge/model.test.js src/engine/charge/evade.test.js src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js`
- `src/state/p0-state.js` now also supports the second deterministic branch step: after a resolved evade-distance roll, reducer state can archive that first roll into `branchDistanceRoll.history`, start an `adjusted-charge-distance` claim, and resolve it against the charger's own movement budget.
- The first replay-ready branch history is now preserved in a serializable form instead of overwriting the prior roll when the second distance step starts.
- Heavy-infantry-style adjusted charge cases now consume the existing `neverReduce` hook through reducer-owned state, so the `1` result can still map to `movement -1 UD` while the resolved distance remains at the charger's minimum supported adjusted distance where applicable.
- Additional focused validation is green:
	- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js --test-name-pattern "charge branch distance state keeps serializable history|adjusted charge distance roll archives evade roll history and uses charger movement with heavy infantry never-reduce"`
- `P7A-02` is now complete for the approved scope: deterministic/manual roll choice first, serializable claim/result state for both evade and adjusted charge distance, and reducer-owned test injection for replay-safe branch continuation.
- Next exact card: `P7A-03 - Isolated Single-Unit Evade Plan`.

### [ ] P7A-03 - Isolated Single-Unit Evade Plan

Goal: compute the first real evade movement for one isolated target and expose that result visibly without claiming full obstacle or table-exit completeness.

Planned files:

- new src/engine/charge/evade.js
- new src/engine/charge/evade.test.js
- src/engine/charge/index.js

Implementation steps:
1. Consume the P7 reaction request and declaration snapshot.
2. Apply initial reorientation by contact side: front half-turn, flank quarter-turn, rear keep facing.
3. Apply adjusted evade distance from deterministic roll result.
4. Produce straight evade path and final pose.
5. Report unsupported obstacle, interpenetration, terrain, and table-edge cases as blocked or `needs-source-check`.

Non-goals:

- no obstacle avoidance
- no interpenetration adjustment
- no table exit resolution
- no group evade split

Validation:

- tests for front, flank, rear orientation and straight final pose
- focused battlefield render test for the current reducer-owned evade-plan projection

Manual acceptance:

- user verifies a single Charge Drill target visibly evades along the expected line

Stop condition:

- stop if contact-side data from P7 is insufficient to choose evade reorientation deterministically

Expected result: the first isolated target can actually evade instead of only pausing.

Progress note 2026-05-20:

- `src/engine/charge/evade.js` now includes the first real isolated evade-plan resolver for the supported subset: front contact half-turn, flank quarter-turn away from the charger, rear keep-facing, plus straight-line end-pose calculation from the resolved evade-distance roll.
- `src/state/p0-state.js` now consumes that engine result at the first reducer-owned seam: once an `evade-distance` roll is resolved, `chargePreview.evadePlan` stores the reacting unit, effective contact type, reoriented pose, straight end pose, and the roll result that produced it.
- The isolated evade plan now also escalates simple unsupported outcomes honestly instead of silently succeeding: table-edge exits and simple end-pose overlap/interpenetration cases are marked as `needs-source-check` with explicit evade diagnostics.
- `src/ui/p0-battlefield.js`, `src/ui/p0-app.js`, and `src/styles/p0-battlefield.css` now add the first manual hotseat surface for this card: after choosing `Ausweichen`, a small deterministic D6 dialog resolves the pending `evade-distance` claim, and the resulting evade corridor plus end ghost render directly from reducer-owned `chargePreview.evadePlan`.
- The battlefield projection now also exposes the already computed initial evade reorientation as its own intermediate ghost, so the current supported 1/4-turn and 1/2-turn cases are visible before the straight-line evade move continues.
- The first `P7A-06` sub-slice is now wired into the live reaction gate in a narrower rule-safe form: if enemy ZoC lies directly ahead of the reoriented front edge after the free evade reorientation, the reaction request is downgraded to `blocked-evade` before the dialog offers `Ausweichen`.
- The next `P7A-06` first-pass slice now also handles simple physical blockers less than `1 UD` directly ahead: the reaction gate tests whether a left or right slide of `<= 1 UD` would clear the lane, and only downgrades to `blocked-evade` when neither side opens a straight evade lane.
- The first `P7A-04` follow-through slice now exists in reducer-owned state: once the adjusted charge distance roll resolves, the charger stores a straight follow-through plan from the frozen charge start pose and the first reaction request records the resolved adjusted charge distance.
- The Charge Drill manual lane for that case has been repositioned so the blocker now starts behind the current target and only becomes a front-edge ZoC block after the target's free evade reorientation.
- The Charge Drill now also contains a dedicated manual lane for the simple physical blocked-evade case, with three blockers behind the current target that become the `< 1 UD` front blockers after the target's free evade reorientation.
- Focused and slice-broader validation are green:
	- `node --test src/engine/charge/evade.test.js --test-name-pattern "isolated evade plan|createChargeBranchRollClaim preserves|evade distance roll maps|adjusted charge distance honors|charge branch roll resolution rejects"`
	- `node --test src/engine/charge/model.test.js src/engine/charge/evade.test.js src/state/p0-state.test.js --test-name-pattern "charge preview model initializes|isolated evade plan|evade-required handoff creates and resolves a deterministic branch distance roll in state"`
	- `node --test src/engine/charge/evade.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js --test-name-pattern "isolated evade plan|evade-required handoff creates and resolves a deterministic branch distance roll in state|battlefield renders the current evade plan corridor and ghost after the evade-distance roll resolves"`
	- `node --test src/engine/charge/model.test.js src/engine/charge/evade.test.js src/engine/charge/reaction.test.js src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`
- This card remains open because the current plan is still the isolated straight-line subset only. Full obstacle/terrain handling, richer blocked-versus-source-open continuation policy, and the later dedicated evade presentation/confirmation flow are still not wired.

Manual spot-check now possible:

- Start a Direct Battle.
- Select `test-unit-1`, start a charge, set `test-unit-3` as target, leave the start manoeuvre at `none`, and confirm the charge direction.
- Choose `Ausweichen` in the reaction dialog.
- The pending D6 dialog should appear immediately; clicking a die result should close the dialog and show the evade corridor plus evade end ghost on the battlefield.
- The same resolved view should now also show the intermediate reorientation pose before the corridor begins.
- In the first supported blocked case, the reaction dialog should instead show `Ausweichen blockiert` and only the continue path, with no `Ausweichen` button.
- The manual drill anchor for that blocked case is now `P1 Evade ZoC Charger` against `P2 Evade ZoC Blocked Target`, with `P1 Evade ZoC Sentry` starting behind the target in the current position but ending directly ahead of the target's front edge after the free evade reorientation.
- The manual drill anchor for the simple blocker case is now `P1 Evade Blocker Charger` against `P2 Evade Blocked By Blockers Target`, with `P1 Evade Front Blocker`, `P1 Evade Left Blocker`, and `P1 Evade Right Blocker` starting behind the target so the charge stays legal but the reoriented evade lane has no `<= 1 UD` slide exit.

### [ ] P7A-04 - Adjusted Charge Follow-Through

Goal: resolve the charger's movement after all initial targets evade for the supported single-unit case.

Planned files:

- src/engine/charge/path.js
- src/engine/charge/contact.js
- src/engine/charge/evade.js
- src/state/p0-state.js or focused charge helper

Implementation steps:
1. Compute adjusted charge distance for the charger.
2. Preserve HI never reducing charge distance where source-locked.
3. Apply non-impetuous minimum advance and stop/continue choice for the supported subset.
4. Preserve impetuous forced-continuation hook where source-locked.
5. Re-run contact detection along the adjusted charge path.

Non-goals:

- no full uncontrolled-charge exception matrix
- no group movement continuation
- no terrain-complete stop policy

Validation:

- tests for movement -1, normal, movement +1, HI no-reduction, and minimum advance

Manual acceptance:

- user verifies charger follow-through in Charge Drill after target evades

Stop condition:

- stop if adjusted charge die table or HI exception is not source-closed

Expected result: an evaded initial target produces a deterministic charger follow-through branch.

Progress note 2026-05-20:

- `src/ui/battlefield-command-panel.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/styles/p0-battlefield.css` now expose the first visible `P7A-04` slice instead of leaving the follow-through only in reducer state.
- After an evade-distance result resolves, the command panel now offers an explicit `Adjusted Charge wuerfeln` step that starts the second deterministic branch roll through the existing reducer action.
- The battlefield dialog now handles both branch-roll reasons honestly: first `Ausweichdistanz bestimmen`, then `Adjusted Charge-Distanz bestimmen` for the charger's follow-through.
- Once the second roll resolves, the current straight follow-through corridor and end ghost render directly from reducer-owned `chargePreview.chargeMovementPlan`.
- `src/engine/charge/evade.js` and `src/state/p0-state.js` now extend that same reducer-owned follow-through slice with a first post-evade contact re-check over the existing charge-contact engine instead of bespoke path logic.
- The current `chargePreview.chargeMovementPlan` now preserves a serializable `contactState` snapshot for the straight follow-through subset, so later cards can distinguish `caught evader`, earlier enemy contact, and no-contact continuation from the same branch state.
- Focused UI validation is green:
	- `node --test src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js --test-name-pattern "adjusted charge|follow-through|evade"`
- Focused reducer and engine validation is green:
	- `node --test src/engine/charge/evade.test.js src/state/p0-state.test.js --test-name-pattern "follow-through|caught|adjusted charge"`
- `src/engine/charge/evade.js`, `src/state/p0-state.js`, `src/ui/battlefield-command-panel.js`, and `src/ui/p0-app.js` now add the first reducer-owned non-impetuous continuation-choice slice for the supported no-contact subset.
- After the adjusted charge roll resolves without forced continuation or earlier contact, the follow-through plan now preserves a serializable `continuationChoice` contract with minimum advance, maximum advance, and pending selection metadata.
- The battlefield side panel now exposes the explicit `Stop at ... UD` and `Continue to ... UD` actions for that pending subset, and the reducer applies the selected branch by clamping the follow-through pose to the minimum advance or preserving the full adjusted path.
- Focused continuation validation is green:
	- `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "continuation|adjusted charge|follow-through"`
- `src/engine/charge/model.js`, `src/state/p0-state.js`, and `src/ui/battlefield-command-panel.js` now preserve and project a reducer-owned `followThroughResolution` summary so the first visible distinction between `caught evader`, `secondary target pause`, and `friendly blocker` no longer depends on raw contact-engine details in the UI.
- The command panel helper and why-card now surface that distinction directly from reducer-owned state, and focused validation is green:
	- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "follow-through|caught|secondary|continuation|serializable placeholder spine"`
- `src/engine/charge/evade.js` now also marks the first source-checked impetuous case explicitly: when no earlier contact interrupts the path and the adjusted distance exceeds the minimum advance, impetuous chargers auto-select full continuation instead of exposing a stop-or-continue choice.
- The command panel now explains that forced full continuation and keeps the stop/continue buttons hidden for that source-checked subset, with focused validation green:
	- `node --test src/engine/charge/evade.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "impetuous|continuation|follow-through"`
- `src/engine/charge/model.js`, `src/state/p0-state.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/ui/battlefield-command-panel.js` now preserve the next explicit pause in that same follow-through chain: if the adjusted charge first meets another enemy, the second reaction can be recorded as its own reducer-owned decision instead of living only as an unresolved placeholder.
- The battlefield now renders a dedicated `Sekundaerziel-Reaktion` dialog for that paused contact, the app dispatch layer binds a distinct `resolve-secondary-charge-reaction` action, and the command panel keeps the recorded decision visible after the dialog closes.
- Additional focused validation is green:
	- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "secondary reaction|secondary target|follow-through|serializable"`
- `src/state/p0-state.js` now also turns the first secondary `evade` choice into a real second branch-roll seam instead of a dead-end marker: the paused secondary target can raise its own `evade-distance` claim, the second evade plan resolves from the claim snapshot, and the paused follow-through summary stays intact while the wider recursive chain remains out of scope.
- `src/ui/p0-battlefield.js` and `src/ui/battlefield-command-panel.js` now surface that follow-up honestly: after a secondary target chooses `Ausweichen`, the battlefield shows the second D6 distance dialog and the side panel no longer offers a false second primary `Adjusted Charge wuerfeln` action.
- Additional focused validation is green:
	- `node --test src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "secondary target|secondary reaction|secondary evade|follow-through"`
- `src/state/p0-state.js` now also closes the first supported secondary `no-evade` branch onto the existing explicit handoff seam: when the paused secondary target does not evade, the preview moves into `no-evade-handoff` with a reducer-owned `handoffStatus` instead of lingering in the generic paused `evade-required` state.
- `src/ui/battlefield-command-panel.js` now explains that secondary no-evade completion specifically, and the secondary reaction modal no longer remains open once that local decision is complete.
- Additional focused validation is green:
	- `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "secondary target|secondary reaction|no-evade|follow-through"`
- `src/state/p0-state.js` now also reanchors the active charge target when that paused second defender becomes the effective contact anchor: `intent`, `declarationSnapshot`, and the serialized `followThroughResolution.selectedTargetId` switch to the secondary defender for the supported secondary `no-evade` and `evade` branches, while the broader recursive chain still remains out of scope.
- `src/ui/battlefield-command-panel.js` now reads the original primary target from the primary reaction snapshot when deciding whether a visible branch roll still belongs to the first target, so the secondary reanchor does not resurrect a false second primary adjusted-charge action.
- Additional focused validation is green:
	- `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "secondary target|secondary reaction|no-evade|evade|follow-through"`
- `P7A-04` remains open: uncontrolled-charge exception breadth, broader terrain/obstacle completeness, and secondary-target recursive reaction handling are still not wired.

### [ ] P7A-05 - Caught Evader Hooks

Goal: detect when the adjusted charge catches an evading target and preserve the later combat/rout consequences as state hooks.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/contact.js
- src/state/p0-state.js or focused charge helper

Implementation steps:
1. Detect charger contact with the evader after evade movement.
2. Mark caught evader status and rear-attack combat posture for later P9.
3. Add cohesion-loss hook without resolving full P10 rout/victory.
4. Preserve light-charger exception if source-locked.

Non-goals:

- no full cohesion/rout/victory integration
- no melee factor calculation

Validation:

- tests for caught and not-caught cases

Manual acceptance:

- user verifies caught status is visible but combat is not resolved yet

Stop condition:

- stop if caught timing cannot be separated safely from later melee/rout phases

Expected result: caught evaders are represented without pretending P9/P10 are complete.

Progress note 2026-05-20:

- `src/state/p0-state.js` now consumes the new straight follow-through `contactState` hook to mark `reactionRequests[0].caughtByCharger` when the adjusted charge actually reaches the evader's resolved end pose.
- The current P7A slice stays deliberately narrow: this is a reducer-owned caught/not-caught state hook only, not yet a full caught-evader UX, combat posture flow, cohesion-loss resolver, or rout/victory consequence.
- Focused validation is green:
	- `node --test src/engine/charge/evade.test.js src/state/p0-state.test.js --test-name-pattern "follow-through|caught|adjusted charge"`
- `src/engine/charge/model.js`, `src/state/p0-state.js`, and `src/ui/battlefield-command-panel.js` now extend that same caught-evader slice with the first serializable later-phase hooks: the caught result marks a rear-attack combat posture and a pending `1` cohesion-loss hook instead of leaving those later consequences implicit.
- The current hook remains intentionally incomplete and honest: the light-charger exception is still recorded as pending rather than resolved, and no P9/P10 combat, rout, or victory handling is applied yet.
- Additional focused validation is green:
	- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js --test-name-pattern "caught|secondary|follow-through|serializable"`
- `P7A-05` remains open: light-charger exception handling is still not closed, and the new caught-evader hooks are still explanatory state only, not real melee/cohesion application.

### [ ] P7A-06 - Blocked Evade First Pass

Goal: implement the first source-backed blocked-evade diagnostics.

Planned files:

- src/engine/charge/evade.js
- src/engine/zoc/ as reused helpers if needed
- src/engine/charge/evade.test.js

Implementation steps:
1. Check enemy-ZOC blocked evade after initial reorientation for supported cases.
2. Check simple obstacle/friendly/enemy blocker less than 1 UD ahead if it cannot be avoided by a 1 UD slide.
3. Return `blocked-evade` and continue as no-evade branch where source-locked.
4. Keep complex obstacle avoidance and interpenetration as explicit later diagnostics.

Non-goals:

- no full obstacle avoidance pathing
- no terrain-complete behavior

Validation:

- tests for enemy-ZOC block and simple physical block

Manual acceptance:

- user verifies blocked evade is clear in the reaction modal

Stop condition:

- stop if blocked-evade wording remains too uncertain for a deterministic subset

Expected result: not every evade-capable target can magically leave; blocked cases are visible and deterministic.

### [ ] P7A-07 - Secondary Target Hook Skeleton

Goal: preserve the event model for secondary targets without claiming full chain completeness.

Planned files:

- src/engine/charge/contact.js
- src/engine/charge/reaction.js
- src/state/p0-state.js or focused charge helper

Implementation steps:
1. Detect a new enemy contacted during adjusted charge follow-through.
2. Emit a secondary-target event with its own reaction request.
3. Block or pause recursive resolution unless the case is explicitly supported.
4. Preserve maximum adjusted movement allowance from the original branch.

Non-goals:

- no unlimited reaction recursion
- no group continuation
- no point 8 completeness claim

Validation:

- tests for secondary-target event creation and source-gated pause

Manual acceptance:

- user verifies secondary targets are identified rather than silently contacted

Stop condition:

- stop if secondary-target state would cause ambiguous nested actions

Expected result: point 8 has a future-safe event boundary.

Progress note 2026-05-20:

- `src/state/p0-state.js` now adds the first reducer-owned `P7A-07` skeleton on top of the existing `secondary-target` follow-through pause: when the adjusted charge first hits another enemy before the evader, the preview preserves a second serializable reaction request for that defender instead of only a summary label.
- The current skeleton stays deliberately narrow and honest: the new secondary request remains paused in reducer state even when its derived reaction type would otherwise auto-complete, so no implicit recursive follow-through chain is claimed yet.
- Focused validation is green:
	- `node --test src/state/p0-state.test.js --test-name-pattern "secondary|follow-through|reaction"`
- The skeleton now also owns the first explicit reaction-decision handoff for that paused contact: `secondaryReactionDecision` records the second target's local choice and marks the paused request complete without attempting recursive continuation.
- `src/ui/p0-battlefield.js` and `src/ui/battlefield-command-panel.js` project that narrow handoff honestly as a dedicated secondary-target modal plus a recorded-reaction summary, so the browser flow no longer hides whether the second target has already answered.
- The current skeleton now reaches one step further for the supported `evade` branch: the secondary target can open its own deterministic evade-distance D6 step, but the follow-through chain still stops there rather than claiming full secondary adjusted-charge recursion.
- The current skeleton also closes the supported secondary `no-evade` answer onto the shared handoff state, but it still does not continue recursively into broader point-8 adjusted-charge handling.
- `P7A-07` remains open: no recursive resolution UI, no multi-step chain handling, and no broader point-8 completeness are wired yet.

### [ ] P7A-08 - Evade And Follow-Through UI

Goal: make evade branch state visible and usable in the battlefield UI.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css
- relevant UI tests

Implementation steps:
1. Show reaction decision, evade path, adjusted charge path, caught status, and secondary-target pause state.
2. Keep UI as read-only projection of engine/reducer output.
3. Provide clear hotseat handoff/waiting language.
4. Keep battlefield text minimal; use side panel for explanations.

Non-goals:

- no UI-owned legality
- no multiplayer transport

Validation:

- focused render tests
- browser smoke in Charge Drill

Manual acceptance:

- user can understand who is reacting, where the target evades, and how far the charger follows

Stop condition:

- stop if UI cannot distinguish declared path, evade path, and follow-through path clearly

Expected result: P7A branches are playable and inspectable in the browser.

Progress note 2026-05-20:

- `src/ui/battlefield-command-panel.js` now projects the paused secondary-target request more explicitly instead of only showing a generic follow-through summary: the why-card now includes a `Next reaction` row with the secondary defender and its derived reaction type.
- The same side-panel helper text now names that paused follow-up reaction directly, so the current hotseat state no longer hides which defender would react next after the follow-through pause.
- `src/ui/p0-battlefield.js` and its render tests now also keep the visual target anchor honest after the first secondary branch resolves: once the second defender becomes the effective contact anchor, the battlefield token highlight moves from the original evader to that secondary defender instead of silently staying on the stale primary target.
- Browser smoke for the running Vite bundle is now clean for this exact path: the secondary reaction pause appears first, the later secondary `no-evade` helper copy names `Sekundaerziel Test 4`, the selected charge-target highlight moves to that unit, and no false second primary `Adjusted Charge wuerfeln` action reappears.
- Focused validation is green:
	- `node --test src/ui/battlefield-command-panel.test.js --test-name-pattern "secondary|caught|follow-through"`
	- `node --test src/ui/p0-battlefield.test.js --test-name-pattern "secondary target|evade-distance|adjusted-charge|charge target"`

### [x] P7A-09 - Validation And Handoff

Goal: close P7A with automated, browser, and documentation validation.

Planned files:

- P7A_todo.md
- roadmap.md
- docs/rules/open-verification.md

Implementation steps:
1. Run focused and full test suites.
2. Run build.
3. Browser-smoke no-evade, may-evade, caught, not-caught, and blocked-evade supported cases.
4. Record unsupported cases honestly for P7B/P8/P10/post-P16.

Non-goals:

- no P7B conformation implementation
- no P8 shooting implementation

Validation:

- `npm run test`
- `npm run build`
- browser smoke on local Vite app

Manual acceptance:

- Enter the battlefield through `Neues Spiel` -> `Charge Drill`, then activate `Corps I` for the smoke lanes below.
- Front evade visibility: select `P1 Front Charger`, start a charge against `P2 Front Target`, choose `Ausweichen`, and resolve the evade D6 as `6`; the target should visibly evade along the projected line and no combat should resolve.
- Front no-evade handoff: repeat that same lane but choose `Nicht ausweichen`; the flow should land in the explicit `No-Evade-Handoff` state without pretending conformation or combat is already complete.
- Front not-caught follow-through: repeat the front evade lane with evade D6 `6`, then resolve `Adjusted Charge wuerfeln` as `1`; the charger should follow through visibly without marking the evader as caught.
- Front caught follow-through: repeat the front evade lane with evade D6 `6`, then resolve `Adjusted Charge wuerfeln` as `2`; the side panel should show the caught-evader hook with `Rear-Attack-Hook` and pending `1 Cohesion Loss`, but still no melee/rout resolution.
- Blocked evade by ZoC: select `P1 Evade ZoC Charger`, charge `P2 Evade ZoC Blocked Target`, and confirm direction; the reaction modal should show `Ausweichen blockiert`, omit the normal evade button, and leave only the supported continue/no-evade path.
- Blocked evade by simple blockers: select `P1 Evade Blocker Charger`, charge `P2 Evade Blocked By Blockers Target`, and confirm direction; the reaction modal should again show `Ausweichen blockiert` without a normal evade choice.
- Final acceptance question: confirm that across those supported lanes it remains clear who is reacting, where the target evades, how far the charger follows, and that the branch looks ready to hand off to later conformation work.

Stop condition:

- stop if the supported evade branch cannot be replayed deterministically

Expected result: P7A closes as a basic but real single-unit evade and charge follow-through foundation before P7B.

Progress note 2026-05-20:

- Agent-side closeout validation is currently green for the implemented subset: `npm run test` passes, `npm run build` passes, and the local browser smoke for the supported secondary-target reanchor path confirms the live bundle matches reducer/test expectations.
- The browser smoke now covers one more honest edge of the supported subset: after an initial target evades and the straight follow-through pauses on a second defender, the later secondary `no-evade` handoff keeps the state re-anchored on that defender instead of drifting back to the original declared target.

Closeout note 2026-05-21:

- User manual acceptance is complete for the supported evade/follow-through subset.
- P7A now closes as an accepted single-unit evade and adjusted-charge foundation, not as full rule-complete evade/conformation/combat handling.
- Broader terrain/obstacle completeness, recursive secondary-target continuation, and later conformation/combat application remain explicitly deferred to later approved phases.