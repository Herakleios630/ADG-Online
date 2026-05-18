# P6 TODO - Corps + Command System

Status: Complete - accepted by user on 2026-05-18; PR handoff in progress
Date drafted: 2026-05-17
Planner: GPT-5.5 preferred planner, drafted here by GPT-5.3-Codex per user request for immediate continuation
Future executor: GPT-5.4 preferred executor after explicit user approval
Intended branch: feature/p6-corps-command-system
Master plan: roadmap.md
Architecture source: docs/architecture.md
Governance source: docs/project-governance.md
Rules workspace: docs/rules/
Open verification source: docs/rules/open-verification.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/Reglettes.pdf, Konzepte/Reference_Sheet_V4.pdf

## Purpose

P6 implements the first command-conform command and corps layer on top of P5 movement legality.

P6 must provide deterministic corps activation context, command-point handling, command-range checks, in-command or out-of-command classification, and reducer-level gating for command-dependent movement actions.

P6 is not charge/conformation/combat. It is the command spine that later phases consume.

## Brainstorm Summary

The safest P6 path is validator-first and data-first.

Build pure command engine modules first:

- command range geometry and nearest-point measurement
- command context and corps ownership checks
- command-point ledger with auditable reasons
- in-command or out-of-command evaluator

Then wire strict reducer gates:

- no command-dependent movement confirmation without legal command context
- no cross-corps command bypass
- no out-of-phase command bypass

Finally add display-only command diagnostics:

- active corps and CP card
- in-command badges
- optional range visualization for testing

All UI is explanatory. Engine and reducer own legality.

## User-Requested P6 Rule Anchors (Reference-Sheet Driven)

These anchors are intentionally captured now for P6 and must be source-checked against Rules plus Errata during `P6-00`.

Sequence of play anchor for movement-phase corps activation:

- Activate one corps at a time during movement.
- Corps activation order is player-choice among corps not yet activated this movement phase.
- Once a corps is finished, it cannot be re-activated in the same movement phase.
- While a corps is active, player may move all units in that corps or leave units stationary.

Command points anchors:

- CP rolled when a corps is activated.
- Formula anchor: `CP = ceil((1D6 + commander value) / 2) + 1 free CP`.
- P6 engine must support deterministic dice plumbing and replay-safe roll logging.

Orders and CP-cost anchors relevant to P6 scope:

- `1 CP` to move a unit in command range.
- `+1 CP` for a unit out of command range.
- `+1 CP` for a difficult manoeuvre.
- `+1 CP` if commander is engaged in melee, except rallying the attached/included unit.
- Charge-specific and rally-specific CP costs are tracked as source anchors now, but any behavior that depends on P7+ combat lifecycle remains phase-gated.

Movement anchors to carry into P6 subset interfaces:

- Movement allowance baseline for current P6 fixture subset:
	- Medium Infantry `3 UD`
	- Heavy Infantry `2 UD`, or `3 UD` in operational-zone condition
	- Cavalry `4 UD`
	- Commander movement `5 UD`
- Difficult manoeuvre surcharge (`+1 CP`) must be represented in command-cost diagnostics for implemented P6 movement actions.
- Third-movement, interpenetration, disengage, full extension/contraction, and charge-coupled exceptions remain explicit source-tracked items and are not silently claimed as complete in P6 unless explicitly pulled in and validated.

ZOC anchor continuity from P5 into P6 command costs:

- ZOC-permitted movement set and ZOC exit handling remain governed by P5 plus open-verification boundaries.
- Any CP effects tied to ZOC exit actions must be source-tagged and blocked or allowed only within the approved P6 subset.

UI anchor:

- Optional animated die is allowed as display-only UX for CP roll presentation, but legal CP values must come from reducer/engine state.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Re-read this card, roadmap.md P6 section, docs/architecture.md command and movement sections, and docs/rules/open-verification.md command/movement entries.
2. Re-check relevant source pages and errata notes for the specific card scope.
3. Run git status --short --branch and protect unrelated user changes.
4. Give the user a short PM block brief before implementation edits.
5. Keep implementation inside P6 scope.

PM block brief must include:

- exact goal
- planned files
- new modules
- shell/UI versus state/engine scope split
- validation commands
- manual acceptance steps
- non-goals

After each completed card, update this file and report:

- completed card id and title
- files touched
- source assumptions checked
- validation run
- manual user review and expected result
- still-open next card or blocker

Context-loss rule: a future AI session should be able to resume from this file without reading the chat transcript.

## Global P6 Scope Guardrails

In scope:

- command-context state for active player, active corps, and command phase legality
- one-by-one corps activation lifecycle with open order and no re-activation in the same movement phase
- command range validation using the official nearest-point straight-line rule
- deterministic command-point generation and spending model for approved subset
- in-command and out-of-command classification with diagnostics
- movement budget gating tied to command legality for approved subset
- deterministic corps test fixture setup for both players
- reducer-owned blocking for illegal command state
- tests and browser smoke for approved P6 scope

Out of scope:

- no P7 charge/conformation implementation
- no P8+ combat systems
- no tournament-complete claim for unresolved command exceptions
- no AI behavior changes
- no multiplayer networking work

P6 subset discipline note:

- P6 may add command-cost hooks for charge/rally-related entries only as data/diagnostics placeholders.
- Actual charge, melee-support, and full rally behavior remains phase-gated until their owning phases.

Hard rules:

- Errata overrides base rules.
- Command legality is engine/reducer logic, never UI logic.
- Any unresolved command rule stays explicit as needs-source-check.
- P7 must not start until P6 is implemented, validated, manually accepted where required, and explicitly approved by the user.

## Working P6 Test Fixture Proposal (Requested By User)

This fixture is the baseline target for P6 testability and should be implemented in early P6 cards.

Per player corps composition:

- Corps 1: 1 General + 2 Cavalry
- Corps 2: 1 General + 2 Medium Infantry
- Corps 3: 4 Heavy Infantry with 1 included General

Placement baseline:

- all 3 corps placed side-by-side in each player deployment zone
- spacing should support both in-range and out-of-range command tests

Base profiles for P6 fixture:

- General base: circular, diameter 1 UD
- Medium Infantry base: square 1 UD x 1 UD
- Cavalry base: rectangle 1 UD x 0.75 UD
- Heavy Infantry base: rectangle 1 UD x 0.75 UD

Commander quality baseline for testability:

- Corps 1 General: Brilliant
- Corps 2 General: Competent
- Corps 3 General: Ordinary

Command range baseline:

- Ordinary: 4 UD
- Competent: 6 UD
- Brilliant: 8 UD

Command range measurement rule (source-locked by user quote):

- measure by a straight line between the nearest points on the commander base and the selected unit or group base

Movement budgets baseline (must stay source-checked in docs):

- Medium Infantry: 3 UD
- Heavy Infantry: 2 UD, or 3 UD in operational zone when movement starts more than 4 UD from enemies
- Cavalry: 4 UD
- Commander movement: 5 UD

CP generation and spending:

- implement rule-conform CP model as source-verified subset
- unresolved details remain needs-source-check until verified

Corps activation and replay requirements:

- each movement phase tracks `not-yet-activated`, `active`, and `spent` corps status deterministically
- activation order is player-selected from `not-yet-activated` corps only
- corps activation action and CP roll are logged for replay/audit

## Phase Status

- [x] P5 accepted complete by user
- [x] P6 planning requested by user
- [x] P6 brainstorm started with command-system fixture proposal
- [x] P6 execution board drafted
- [x] P6 execution board approved by user for implementation
- [x] P6 implementation branch prepared
- [x] P6 source review and verification updates completed
- [x] P6 command fixture model implemented
- [x] P6 command data model and corps context implemented
- [x] P6 command-range geometry validator implemented
- [x] P6 CP generation/spending validators implemented for the approved current subset
- [x] P6 initial in-command snapshot wiring implemented
- [x] P6 reducer gating integrated for command legality in the approved current subset
- [x] P6 diagnostics and UI overlays implemented
- [x] P6 automated and browser validation completed for the approved current subset
- [x] P6 demonstrated to user
- [x] P6 approved complete by user

## Definition Of Done

P6 is done when:

- [x] Command range checks use nearest-point straight-line measurement.
- [x] In-command and out-of-command state is deterministic and test-covered.
- [x] Corps ownership and active corps gates block illegal movement confirmations.
- [x] CP generation/spending is auditable and deterministic for approved subset.
- [x] Movement budget checks for approved troop subset are reducer-enforced and explained.
- [x] UI command diagnostics are display-only and reflect engine snapshots.
- [x] Automated tests cover normal and edge command cases.
- [x] Browser smoke confirms P6 interaction surfaces for the approved current subset.
- [x] roadmap.md, P6_todo.md, and docs/rules/open-verification.md are aligned with P6 status.
- [x] User explicitly approves readiness to proceed toward P7.

## Execution Cards

### [x] P6-00 - Source Lock And Scope Gate

Goal: confirm command-system source boundaries and freeze the approved P6 subset before implementation.

Planned files:

- P6_todo.md
- roadmap.md
- docs/rules/open-verification.md
- optional docs/rules/movement-source-notes.md update

Implementation steps:
1. Re-check command range, CP, commander quality effects, and in-command wording against rules and errata.
2. Add or refresh open-verification IDs for unresolved command details.
3. Mark verified versus needs-source-check boundaries for P6.
4. Confirm no P7 behavior is pulled into P6.

Non-goals:

- no engine code edits
- no UI changes

Validation:

- open-verification has explicit P6 blocker IDs
- roadmap and board are consistent

Manual acceptance:

- user approves source split strictness before P6-01

Stop condition:

- stop if core command assumptions remain ambiguous without explicit tracking

Expected result: P6 implementation starts with explicit rule-confidence boundaries.

Completed 2026-05-17:
- User explicitly approved P6 board execution and requested direct start with steps 1 and 2.
- Re-checked existing command-sensitive source notes in `docs/rules/movement-source-notes.md`, `docs/rules/sequence-of-play.md`, and `docs/rules/errata.md` against the current P6 planning boundary.
- Locked the user-provided command-range measurement anchor into P6 scope: straight-line distance between nearest points on commander base and selected unit/group base.
- Confirmed P6 sequence model boundary:
	- corps activated one-at-a-time in movement phase,
	- activation order is player-choice among not-yet-activated corps,
	- no same-phase re-activation after a corps is completed.
- Extended `docs/rules/open-verification.md` with explicit P6 blocker IDs for CP formula/rounding, command-cost composition, activation-lock semantics, and movement-command interactions that remain source-sensitive.
- Aligned P6 planning notes in `roadmap.md` to reflect approved board state and source-lock completion.

Files touched:
- `P6_todo.md`
- `docs/rules/open-verification.md`
- `roadmap.md`

Validation:
- planning docs are synchronized for current P6 start state
- no engine/state/UI code edited in P6-00

Manual acceptance:
- user approved board start and requested execution of steps 1 and 2.

Still open:
- Next card is `P6-01 - Deterministic Corps Fixture Setup`.

### [x] P6-01 - Deterministic Corps Fixture Setup

Goal: implement the approved two-player, three-corps command test fixture for practical P6 validation.

Planned files:

- src/state/p0-state.js
- src/state/p0-state.test.js
- optional fixture helper module under src/state/
- optional UI labeling adjustments if required for test clarity

Implementation steps:
1. Add the requested corps compositions for both players.
2. Apply requested base profiles (general circle, unit rectangles/square).
3. Set commander qualities per corps (Brilliant, Competent, Ordinary).
4. Place corps side-by-side in deployment zones for command-range testability.
5. Add stable ids for player/corps/unit references to support deterministic tests.

Non-goals:

- no CP logic yet
- no command gating yet

Validation:

- focused fixture tests
- npm run test

Manual acceptance:

- user verifies battlefield fixture readability and practical spacing

Stop condition:

- stop if fixture cannot support both in-range and out-of-range tests

Expected result: practical command-system scenario is available from initial P6 tests.

Progress update 2026-05-17 (agent-side complete, manual acceptance pending):
- Replaced legacy standalone test units with deterministic P6 command fixture units for both players in `src/state/p0-state.js`.
- Fixture now contains the requested corps composition per player:
	- Corps 1: `1 General + 2 Cavalry`
	- Corps 2: `1 General + 2 Medium Infantry`
	- Corps 3: `4 Heavy Infantry`, including one unit with included general metadata.
- Added requested commander qualities and command ranges to fixture metadata:
	- `Brilliant` -> `8 UD`
	- `Competent` -> `6 UD`
	- `Ordinary` -> `4 UD`
- Added base profile metadata to fixture units:
	- general `circle` base (`1 UD` diameter represented as `1 x 1` footprint)
	- medium infantry `square` (`1 x 1 UD`)
	- cavalry and heavy infantry `rectangle` (`1 x 0.75 UD`)
- Added deterministic stable ids and corps ids for both players to support later command tests.
- Added visual differentiation hooks:
	- generals render as round bases,
	- included-general heavy infantry units show a `G+` token marker,
	- dotted command-range rings render around commander-bearing units as a display-only helper.
- Added focused tests in `src/state/p0-state.test.js` for composition, qualities/ranges, base dimensions, and deployment-zone orientation assumptions, and updated legacy coordinate assumptions to fixture-relative assertions.

Files touched:
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0-battlefield.css`
- `P6_todo.md`

Validation:
- `npm run test -- src/state/p0-state.test.js` -> pass
- `npm run test` -> 145 pass, 0 fail
- `npm run build` -> success

Manual acceptance:
- user confirmed on 2026-05-18 that the fixture readability/spacing is acceptable (`P6-01 passt`)

Still open:
- Next card is `P6-03 - Command Range Geometry Validator`.

### [x] P6-02 - Command Data Model And Corps Context

Goal: define serializable command state and corps activation context used by validators and reducers.

Planned files:

- src/state/p0-state.js
- src/state/p0-state.test.js
- src/state/p0-movement.js
- new command-state modules under src/state/

Implementation steps:
1. Add active corps and commander references in command context state.
2. Add command quality/range fields on commander entities.
3. Add movement-phase corps activation lifecycle (`not-yet-activated`, `active`, `spent`) with no same-phase re-activation.
4. Add deterministic hooks for CP pool state and corps activation roll records.
5. Ensure state remains serializable and replay-friendly.

Non-goals:

- no CP generation algorithm yet
- no range geometry yet

Validation:

- focused state/reducer tests
- npm run test

Manual acceptance:

- user verifies command context presentation is understandable

Stop condition:

- stop if context model duplicates rule tables instead of referencing them

Expected result: command systems can read one stable context surface.

Completed 2026-05-17:
- Expanded `src/state/p0-command-context.js` into a serializable corps lifecycle model with `not-yet-activated`, `active`, and `spent` statuses plus activation history and deterministic reset helpers.
- Added CP, commander, and in-command skeleton fields needed by later P6 validators without introducing CP arithmetic yet.
- Wired `src/state/p0-state.js` to initialize the corps lifecycle from the current battle plan, preserve active corps selection across battle-phase changes, and expose a `complete-active-corps` reducer action for later UI wiring.
- Added focused state tests for corps activation, completion, phase persistence, and serializability in `src/state/p0-state.test.js`.

Files touched:
- `src/state/p0-command-context.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`

Validation:
- `npm run test -- src/state/p0-state.test.js` -> pass
- `npm run test` -> 151 pass, 0 fail
- `npm run build` -> success

Manual acceptance:
- user confirmed during later P6 diagnostics work on 2026-05-18 that the command-context presentation is understandable enough for the current command/CP cards

Still open:
- no blocker inside this card; later command-cost and attach/detach work continues in subsequent P6 cards.

### [x] P6-03 - Command Range Geometry Validator

Goal: implement nearest-point straight-line command range checks as pure engine geometry.

Planned files:

- new src/engine/command/range.js
- new src/engine/command/range.test.js
- src/engine/geometry/index exports as needed
- src/engine/command/index.js

Implementation steps:
1. Implement nearest-point search between commander base and selected unit/group footprint.
2. Compute straight-line distance and threshold comparison by commander quality range.
3. Return diagnostic payload with measured distance and nearest points for explanations.
4. Add deterministic tie handling and boundary tests.

Non-goals:

- no reducer gating yet
- no CP spending yet

Validation:

- npm run test -- src/engine/command/range.test.js
- npm run test

Manual acceptance:

- user verifies range behavior at exact boundary values

Stop condition:

- stop if geometry cannot consistently handle circle-to-rectangle and circle-to-group checks

Expected result: command range legality is deterministic and explainable.

Progress update 2026-05-18 (agent-side complete, manual acceptance pending):
- Added pure command-range geometry under `src/engine/command/range.js` with deterministic nearest-point measurement between commander footprint and target footprint.
- Implemented circle-to-circle, circle-to-rectangle, rectangle-to-circle, and rectangle-to-rectangle command-distance handling with explicit overlap collapse to `0 UD`.
- Added group-target measurement that deterministically keeps the first equally-close unit instead of oscillating on ties.
- Added focused tests in `src/engine/command/range.test.js` for nearest-point distance, strict boundary exclusion, just-inside inclusion, overlap handling, and group target selection.

Files touched:
- `src/engine/command/index.js`
- `src/engine/command/range.js`
- `src/engine/command/range.test.js`

Validation:
- `node --test src/engine/command/range.test.js` -> pass
- `npm run test` -> pass
- `npm run build` -> pass

Manual acceptance:
- user requested on 2026-05-18 strict `< range` boundary handling like ZoC and later accepted the practical command-range behavior during the P6 smoke run

Still open:
- no blocker inside this card; later CP and command-flow work continues in subsequent P6 cards.

### [x] P6-04 - CP Generation And Spending Core

Goal: implement deterministic CP ledger and core generation/spending checks for approved subset.

Planned files:

- new src/engine/command/cp.js
- new src/engine/command/cp.test.js
- src/engine/command/index.js
- reducer integration files under src/state/

Implementation steps:
1. Implement CP generation model from source-verified subset, including the formula anchor `ceil((1D6 + commander value) / 2) + 1 free CP` once confirmed in `P6-00`.
2. Implement CP spending checks and insufficient-CP blocking for approved movement-command subset (`in-range`, `out-of-range`, `difficult manoeuvre` surcharges where applicable).
3. Add auditable CP ledger entries with reason codes, including activation roll and per-command cost components.
4. Keep unresolved source-sensitive details explicit as needs-source-check, including charge/rally-specific cases that depend on later phase systems.

Non-goals:

- no full phase-loop overhaul
- no charge/conformation interaction

Validation:

- focused CP tests
- npm run test

Manual acceptance:

- user reviews CP ledger readability in diagnostics

Stop condition:

- stop if CP behavior requires unresolved rule assumptions not tracked in open verification

Expected result: CP legality can be enforced and explained.

Progress update 2026-05-18 (engine core complete, initial reducer wiring complete, base spending slice complete):
- Added pure CP generation and spending helpers under `src/engine/command/cp.js` with explicit `needs-source-check` source status instead of pretending the formula is fully source-closed.
- Kept the unresolved commander-value mapping out of reducer state by requiring an explicit numeric `commanderValue` input for generation.
- Implemented additive CP cost breakdowns for the approved P6 subset: base order, out-of-command surcharge, difficult manoeuvre surcharge, and commander-engaged surcharge.
- Added auditable ledger entries and deterministic insufficient-CP failure handling, covered by focused tests in `src/engine/command/cp.test.js`.
- Wired first reducer-side CP activation state into `src/state/p0-command-context.js`: selecting an active corps now creates a deterministic placeholder activation roll, stores it in activation history, and seeds command-point state for the active corps.
- Movement previews now evaluate the approved subset order cost against the active corps CP pool using the frozen order-start command snapshot, and mark confirmation blocked when the current order would exceed remaining CP.
- Movement confirms now spend the approved reducer-backed subset cost (`base order`, plus current `out-of-command` surcharge when applicable) and append auditable ledger entries with the acting unit id.
- Free commander movement now also consumes the corps' `free CP` when a non-included commander actually starts moving; split follow-up drag confirms within the same 5 UD move do not double-charge, and `Reset commander move` refunds that free CP back into the ledger/state snapshot.
- The same free CP is no longer hard-wired to the solo-general drag only: commander-led unit orders can now optionally assign that free CP to the base order cost when the active commander is included in the selected unit, and the same hook is ready for a later attached non-included commander via `commandContext.commander.attachedUnitId`.
- Added a separate display-only difficult-manoeuvre classification seam for movement previews so P6 can distinguish `no`, `yes`, and `needs-source-check` without prematurely charging unresolved manoeuvre surcharges.
- This reducer slice intentionally uses replay-safe placeholder roll derivation plus the current fixture commander qualities only; final dice plumbing and source-backed commander-value mapping still require closure before the board can claim full P6-04 completion.

Files touched:
- `src/engine/command/cp.js`
- `src/engine/command/cp.test.js`
- `src/engine/command/index.js`
- `src/state/p0-command-context.js`
- `src/state/p0-movement.js`
- `src/state/p0-advance.js`
- `src/state/p0-slide.js`
- `src/state/p0-wheel.js`
- `src/state/p0-state.test.js`
- `src/engine/movement/manoeuvre-classification.js`
- `src/engine/movement/manoeuvre-classification.test.js`
- `src/engine/movement/validation.js`
- `src/engine/movement/validation.test.js`

Validation:
- `node --test src/engine/command/cp.test.js` -> pass
- `node --test src/state/p0-state.test.js` -> pass
- `npm run test` -> pass
- `npm run build` -> pass

Manual acceptance:
- user accepted the practical CP readout/ledger readability during the later P6 diagnostics smoke on 2026-05-18

Still open:
- Difficult-manoeuvre and commander-engaged spend integration remain open as later source-checked refinements, but they no longer block this completed approved-subset card.
- Final replay-safe dice plumbing and source-backed commander-value mapping remain follow-up refinement items beyond this rough functional pass.

### [x] P6-05 - In-Command Classifier And Reducer Gating

Goal: enforce command legality through reducer-owned gates for movement confirmations.

Planned files:

- src/engine/movement/validation.js
- new src/engine/command/in-command.js
- new src/engine/command/in-command.test.js
- src/state/p0-movement.js
- src/state/p0-advance.js
- src/state/p0-wheel.js
- src/state/p0-slide.js
- src/state/p0-state.test.js

Implementation steps:
1. Add in-command/out-of-command evaluation by active corps and commander range.
2. Integrate command checks into movement validation snapshots.
3. Block illegal confirm actions in reducers.
4. Add explicit diagnostics for blocked reasons.

Non-goals:

- no UI-owned legality
- no later-phase charge behavior

Validation:

- focused movement/command tests
- npm run test

Manual acceptance:

- user verifies expected blocked and allowed cases in practical fixture

Stop condition:

- stop if any command gate can be bypassed by UI flow

Expected result: command legality is enforced on action confirmation.

Progress update 2026-05-18 (initial snapshot slice complete, full gating still open):
- Added pure `src/engine/command/in-command.js` to evaluate selected-unit command status against the active corps commander using the existing nearest-point command-range geometry.
- Wired reducer-side snapshot refresh into active-corps selection, active-player/phase changes, corps completion, and unit selection via `syncCommandContextSnapshots(...)` in `src/state/p0-command-context.js`.
- The command-context panel now shows a real commander resolution plus a first `In Command` / `Out of Command` label for the selected unit instead of only placeholder copy.
- Battlefield rendering now draws a green or orange line from the selected unit to the active commander so the current command snapshot is visible directly on the table.
- Added a movement-side frozen order snapshot so command status is captured at order start and then preserved across chained move commands in the same preview flow.
- User later source-closed the timing rule from `Rules.pdf` p.26: `Command range is evaluated at the moment the order is given. A commander can give an order, move to get in range and give another order.` This confirms the frozen snapshot for one move/order while requiring a fresh check for later second or third moves.
- Current reducer gating now uses that frozen snapshot to evaluate approved subset CP affordability during preview and to charge the same order state during confirm. Hard enforcement for unresolved manoeuvre surcharges and later command exceptions still remains open.
- Movement validation now escalates `no active corps`, `active corps commander unresolved`, and `selected unit is outside the active corps` from placeholder copy into explicit blocking `command legality` diagnostics, so reducer confirms cannot advance through those illegal command states even if a preview object exists.
- Movement validation now keeps ordinary current-subset advance/wheel/slide previews confirmable with a verified `no difficult trigger detected` diagnostic, but hard-blocks source-sensitive difficult-manoeuvre cases such as explicit future markers or special-troop hints until the difficult-manoeuvre classification and CP path are source-closed.
- Movement validation and current-order CP diagnostics now also hard-block confirmation when the active commander snapshot is marked `engaged in combat`, so the current P6 subset does not silently underprice orders while the commander-engaged surcharge wording and additive resolution remain source-open.

Files touched:
- `src/engine/command/in-command.js`
- `src/engine/command/index.js`
- `src/engine/movement/validation.js`
- `src/engine/movement/validation.test.js`
- `src/state/p0-command-context.js`
- `src/state/p0-movement.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-battlefield.test.js`
- `src/styles/p0-battlefield.css`
- `src/ui/battlefield-side-panel.js`

Validation:
- `node --test src/state/p0-state.test.js` -> pass
- `npm run test` -> pass
- `npm run build` -> pass

Manual acceptance:
- user confirmed during the 2026-05-18 smoke run that the command snapshot, commander resolution, and blocked-case behavior are practically correct for the approved subset

Still open:
- Difficult-manoeuvre CP charging, commander-engaged CP charging, and broader later command exceptions remain follow-up refinement items beyond this completed approved-subset gating card.
- CP roll generation still uses the current deterministic placeholder plumbing until later replay-safe dice closure.

### [x] P6-06 - Movement Budget Subset Integration

Goal: apply approved troop movement budget subset under command context.

Planned files:

- src/engine/movement/validation.js
- src/engine/movement/validation.test.js
- src/state/p0-state.test.js
- optional movement budget table module under src/engine/movement/

Implementation steps:
1. Integrate movement budget checks for Medium Infantry, Heavy Infantry, and Cavalry.
2. Implement Heavy Infantry operational-zone condition from approved subset.
3. Integrate difficult-manoeuvre CP surcharge hooks for implemented movement actions when command-cost conditions are met.
4. Keep source-sensitive details explicit as needs-source-check if unresolved.
5. Add deterministic diagnostics for budget, operational-zone, and command-cost decisions.

Non-goals:

- no full all-troop movement table
- no terrain-complete movement model

Validation:

- focused movement budget tests
- npm run test

Manual acceptance:

- user verifies budget behavior with near/far enemy start positions

Stop condition:

- stop if operational-zone trigger cannot be measured deterministically

Expected result: approved P6 movement budget subset is enforced and testable.

Progress update 2026-05-18 (first enforcement slice complete, card still open):
- Added a dedicated movement-budget helper under `src/engine/movement/budget.js` for the approved current subset instead of leaving allowance logic buried in UI/reducer constants.
- Movement validation now enforces and explains the approved subset budgets for `cavalry`, `medium-infantry`, and `heavy-infantry` in `src/engine/movement/validation.js`.
- Heavy infantry now evaluates a deterministic operational-zone allowance using nearest-footprint enemy distance at order start:
	- `> 4 UD` from nearest enemy footprint -> `3 UD`
	- otherwise -> `2 UD`
- Advance and wheel preview clamps now use the same subset budget source, so over-budget previews are curtailed before confirm instead of only failing at validation time.
- Current implementation intentionally leaves the separate free-commander `5 UD` path untouched; this slice does not yet widen generic movement-budget handling beyond the approved troop subset card scope.
- Battlefield command-panel helper copy and summary labels now consume the same subset budget source, so medium infantry explicitly shows the `3 UD` P6 budget and heavy infantry explains whether the `2 UD` or `3 UD` operational-zone case is active.
- Added focused validation coverage in `src/engine/movement/validation.test.js` for medium-infantry over-budget blocking plus heavy-infantry operational-zone allowed/blocked cases.
- Added focused reducer coverage in `src/state/p0-state.test.js` for medium-infantry and heavy-infantry preview clamps.
- Added focused UI coverage in `src/ui/battlefield-command-panel.test.js` for medium-infantry budget messaging plus heavy-infantry operational-zone messaging.

Files touched:
- `src/engine/movement/budget.js`
- `src/engine/movement/validation.js`
- `src/engine/movement/validation.test.js`
- `src/state/p0-advance.js`
- `src/state/p0-wheel.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/p0-app.js`
- `src/ui/battlefield-command-panel.test.js`

Validation:
- `node --test src/engine/movement/validation.test.js` -> pass
- `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js` -> pass
- `node --test src/ui/battlefield-command-panel.test.js` -> pass
- full `npm run test` -> pass
- `npm run build` -> pass

Manual acceptance:
- user confirmed on 2026-05-18 that the current movement-budget subset behaves correctly in practical smoke testing

Still open:
- Difficult-manoeuvre CP surcharge integration, terrain/road movement effects, and broader troop tables remain later refinement items, not blockers for this completed subset card.

### [x] P6-07 - Command Diagnostics UI (Display-Only)

Goal: provide practical command diagnostics surfaces without moving legality into UI.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css

Implementation steps:
1. Show active corps, commander quality, command range, and CP status.
2. Show in-command/out-of-command state for selected unit.
3. Show current movement-phase corps activation progress (remaining, active, spent).
4. When an active corps is selected, render all units of that corps with a color-coded outline: yellow for currently active/pending units, green for units already resolved this phase, and red for units with unresolved mandatory movement (future hook), while preserving a stronger selected-unit outline.
5. Optionally render command-range helper visualization for testing.
6. Optional: display-only animated die result for CP roll events from reducer snapshots.
7. Ensure all UI values come from engine/reducer snapshots.

Non-goals:

- no UI decisions about legal/illegal command state

Validation:

- focused UI tests
- npm run test
- npm run build

Manual acceptance:

- user verifies readability and debugging value of command diagnostics

Stop condition:

- stop if UI implies unverified command claims as final rules

Expected result: command behavior is easy to understand and debug during tests.

Progress update 2026-05-18 (first diagnostics slice complete, card still open):
- Extended the existing right-side command-context card in `src/ui/battlefield-side-panel.js` so it now renders movement-phase corps progress directly from `commandContext.corpsActivation` instead of showing only commander/CP/in-command snapshots.
- The side panel now exposes aggregate counts for:
	- `Corps offen`
	- `Corps aktiv`
	- `Corps verbraucht`
- The same card now lists each corps with its current activation status (`not-yet-activated`, `active`, `spent`) so the current movement-phase progression is visible without opening debug tooling.
- Battlefield unit tokens now also expose corps progress directly on the table in `src/ui/p0-battlefield.js`:
	- active corps units stay yellow while still pending,
	- active corps units flip green once they have stayed or moved,
	- selected units keep the stronger selected outline,
	- completed corps remain visibly marked as spent even though their tokens are disabled for selection.
- The right-side command-context card now also renders a first CP readout from reducer state instead of only a single CP label:
	- available CP,
	- spent CP,
	- free CP,
	- last activation roll,
	- and the most recent ledger entries.
- The same right-side command-context card now also gives that activation snapshot a more readable visual anchor: a dedicated `Aktivierungswurf` block shows the current D6 result plus the rolled-CP and free-CP start components derived from the existing ledger/state snapshot.
- The same right-side command-context card now also shows a live current-order CP preview before confirmation when a legal preview exists, including total cost, free-CP usage, and the current component breakdown from the reducer-derived order snapshot.
- The same right-side command-context card now also surfaces current order-level block reasons from reducer snapshots when a move is not cleanly confirmable, so `commander engaged`, `command-point cost`, `command legality`, and `difficult manoeuvre` blockers are visible without opening the left detail drawer.
- The same right-side command-context card now also exposes the resolved commander profile more directly: a dedicated `Kommandeurprofil` block shows the current commander quality and command range in `UD` and `cm`, so the command-range snapshot is easier to read without parsing the longer commander label.
- The left command panel now exposes an explicit toggle for eligible commander-led unit moves so the player can choose whether the corps free CP should pay the current base order or be saved for a later commander-led move.
- The left setup column now keeps the primary `Naechster Schritt` / `In die Schlacht` action at the very top during setup instead of burying it below terrain and setup helper cards, so step progression remains reachable in every setup step.
- The battlefield reset action is now explicitly scoped to the selected unit (`Einheit zuruecksetzen`) and no longer reads like a whole-table reset.
- Resetting a selected unit now also refunds that unit's already-spent approved P6 CP entries from the command-point ledger, including free-CP consumption, so the active corps CP display returns to the same state as the restored unit baseline.
- Added a focused battlefield render test in `src/ui/p0-battlefield.test.js` to verify that spent, active, and not-yet-activated corps states all appear in the rendered command-context card.
- Extended battlefield render coverage in `src/ui/p0-battlefield.test.js` to verify pending/done token classes for the active corps plus visible spent-corps token marking after corps completion.
- Extended battlefield render coverage in `src/ui/p0-battlefield.test.js` again to verify the CP summary and recent ledger entries in the command-context card after an actual movement order spend.
- Extended focused UI/reducer coverage again so included-commander host units can consume the free CP on demand and the command panel exposes that choice explicitly.
- Extended focused reducer/engine coverage so selected-unit resets restore the completed-setup baseline, leave other units untouched, and refund consumed CP from that unit's ledger trail.
- The battlefield now renders the active command envelope more directly: the resolved commander gets a persistent visible command-range ring with an `UD` label, so the current corps range snapshot is readable on-table without hovering hidden debug helpers.
- The right-side command-context card now also renders a compact `CP Bilanz` section that separates activation pool, normal CP available, free CP available, and already consumed CP, so ledger totals are easier to interpret at a glance.
- The activation-roll block now renders the current D6 face with pip layout in addition to the numeric result, so the display-only dice presentation is stronger without moving any roll logic out of reducer state.
- The activation-roll block now also exposes the current generation formula directly from reducer snapshot inputs, so the player can see the concrete `(Wurf + Generalwert) / 2` contribution behind the shown `Wurf-CP` result instead of only the final value.
- Active-corps units with unresolved `mandatoryMovementPending` / `mustMoveThisPhase` flags now show an explicit red battlefield badge on top of the existing red outline, so the future mandatory-move hook is visible on the table instead of living only in CSS state.
- Fixed a real round-flow bug in `src/state/p0-round.js`: when player 1 finished all corps and stepped through the placeholder battle phases, player 2 could reach an empty `Bitte erstes Corps fuer Aktivierung waehlen` dialog because the corps-activation cycle was not reset per turn. `ROUND_BEGIN` now resets the turn-local corps lifecycle for the entering player before opening corps selection.
- Added a reducer-owned smoke toggle for blocked-order diagnostics: the battle command panel can now temporarily mark the active commander as `engaged in combat`, which reproduces the existing P6 blocked diagnostic path without inventing new combat rules or moving legality into UI.

Files touched:
- `src/engine/command/cp.js`
- `src/engine/command/cp.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-side-panel.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/battlefield-command-panel.test.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0-battlefield.css`
- `src/ui/p0-battlefield.test.js`

Validation:
- `node --test src/ui/p0-battlefield.test.js` -> pass
- `node --test src/engine/command/cp.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js` -> pass
- full `npm run test` -> pass (`229` tests)
- `npm run build` -> pass
- follow-up focused blocked-case validation after smoke-toggle addition: `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js` -> pass
- follow-up full validation after smoke-toggle addition: `npm run test` -> pass (`231` tests), `npm run build` -> pass

Manual acceptance:
- user confirmed on 2026-05-18 that the right-side command context shows corps progression counts and per-corps statuses understandably during movement activation.
- user confirmed on 2026-05-18 that the `Aktivierungswurf` block is readable and that the follow-up visible formula explanation now passes practical review.
- user confirmed on 2026-05-18 that activating different corps updates the right-side `Kommandeurprofil` block to the expected fixture values.

Still open:
- Mandatory movement is still only a future hook in the approved P6 subset; the red badge remains display-only plumbing and not a rule-complete gameplay path.

### [x] P6-08 - Validation Package And Handoff

Goal: run full validation package and close P6 docs consistently.

Planned files:

- P6_todo.md
- roadmap.md
- optional docs/rules/open-verification.md updates

Implementation steps:
1. Run full test suite and build.
2. Run focused browser smoke for approved P6 interactions.
3. Record residual blockers honestly as post-P6 items.
4. Align roadmap and board status for handoff.

Non-goals:

- no follow-on P7 implementation
- no undocumented manual acceptance claims

Validation:

- npm run test
- npm run build
- local browser smoke

Manual acceptance:
- user validates this manual smoke checklist and reports acceptance:
	- [x] Setup flow: user confirmed on 2026-05-18 that `Naechster Schritt` stays at the top and `In die Schlacht` appears there on `Bereit`.
	- [x] Setup baseline reset: user confirmed on 2026-05-18 that reset returns to the completed-setup pose.
	- [x] Reset scope: user confirmed on 2026-05-18 that reset is selected-unit-scoped.
	- [x] CP reset refund: user confirmed on 2026-05-18 that CP are refunded correctly on reset.
	- [x] CP balance readability: user marked the CP section as acceptable on 2026-05-18.
	- [x] Dice presentation and formula readability: user accepted the follow-up formula display on 2026-05-18.
	- [x] Commander profile readability: user confirmed on 2026-05-18 that the profile display seems correct.
	- [x] Command range snapshot: user confirmed on 2026-05-18 that the snapshot and halo/link behavior seem correct.
	- [x] Corps progression: user confirmed on 2026-05-18 that corps progression display is correct.
	- [x] Movement budget subset: user confirmed on 2026-05-18 that current budget behavior is correct.
	- [x] Blocked diagnostics: user confirmed on 2026-05-18 that movement is blocked in the reproducible `commander engaged` smoke case.
	- [x] Mandatory-move hook: user accepted this as display-only future-hook plumbing on 2026-05-18.
	- [x] Player-switch round flow: fixed on 2026-05-18 after user report; automated regression now covers full player-1 corps exhaustion, player-2 corps selection, and next-round restart.
	- [x] P6-08 handoff package: for this rough functional pass, the remaining `commander engaged +1 CP` pricing closure is explicitly carried forward as later source-checked refinement instead of blocking P6-08 completion.

Stop condition:

- stop if any P6 success criterion is not met or unverifiable

Expected result: P6 closes as an honest, tested corps and command foundation.

Completed 2026-05-18:
- Automated validation, browser/manual smoke, roadmap alignment, and P6 handoff notes are complete for the approved current subset.
- Remaining command-pricing refinement around `commander engaged`, attached/included exceptions, and later combat-coupled rule detail is explicitly carried forward in `docs/rules/open-verification.md` instead of blocking this handoff card.
- No open P6 engineering card remains; P6-09 is accepted as the final rough-functional P6 slice.

### [x] P6-09 - Commander Attach/Detach Command (Movement-Only Skeleton)

Goal: add reducer-owned command actions so non-included commanders can attach to or detach from eligible nearby units during movement-phase command flow.

Planned files:

- src/state/p0-state.js
- src/state/p0-state.test.js
- src/state/p0-movement.js
- src/ui/battlefield-command-panel.js
- src/ui/p0-battlefield.js
- docs/rules/open-verification.md

Implementation steps:
1. Add explicit commander actions for `attach` and `detach` as command commands (not wheel/slide).
2. Implement range-gated target picking and deterministic placement rule for attach (commander placed behind the target unit by rule-backed geometry).
3. Mark attached state in serializable unit/commander relation data.
4. Add detach action and deterministic post-detach placement baseline.
5. Keep combat-lock restrictions phase-gated for P7+ and represent unresolved parts as source-status diagnostics.

Non-goals:

- no full melee/contact lock behavior in P6
- no commander risk/combat bonus rules

Validation:

- focused reducer tests for attach/detach legality
- npm run test
- npm run build

Manual acceptance:

- user verifies attach target flow and detach flow in movement phase

Stop condition:

- stop if attach/detach legality depends on unresolved contact/combat edge cases that are not yet source-locked

Expected result: commander attach/detach interaction surface exists as movement-phase command actions, while combat-coupled restrictions remain explicitly gated for P7+.

Completed 2026-05-18 (user-accepted rough-functional movement-only skeleton):
- Added a reducer-owned attach preview flow in `src/state/p0-state.js` for the selected non-included active-corps commander instead of instant UI-owned attachment mutation.
- Attach now follows a practical movement-phase sequence:
	- select the commander
	- start `Kommandeur anhaengen`
	- see the remaining commander movement radius on-table
	- click an eligible host in range
	- see the commander ghost already placed behind that host
	- confirm to finalize the attachment
- Attach legality is currently gated to the active player's active corps, excludes commander targets and already-hosting units, and uses a deterministic movement-phase-only distance gate based on the current `5 UD` commander-move bridge already present in P6.
- The attached relation is now serializable on unit state:
	- commander unit stores `attachedUnitId`
	- host unit stores `attachedCommanderId`
- Attach places the commander deterministically behind the selected host unit using rotation-aware geometry, and the active command-context snapshot now exposes that attached host relation.
- When an attached host confirms an advance, wheel, or slide, the attached commander is automatically re-synced behind that host so the rough-functional movement-phase skeleton remains visually and state-wise coherent.
- Attached non-included commanders are no longer treated as freely draggable standalone commanders while attached or while an attach preview is pending.
- The left command panel now exposes `Kommandeur anhaengen` only from reducer-owned state; voluntary detach during the same movement phase is no longer offered.
- Voluntary detach within the same turn is now treated as disallowed in this P6 slice, and the temporary attachment relation is instead cleared automatically on player turn end.
- Current P6 implementation intentionally keeps combat/contact locks and the exact source-closed CP pricing/timing around attach plus end-of-turn release out of scope and tracked in `docs/rules/open-verification.md`.

Files touched:
- `src/state/p0-command-context.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/battlefield-command-panel.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `docs/rules/open-verification.md`
- `roadmap.md`
- `P6_todo.md`

Validation:
- `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js` -> pass
- full `npm run test` -> pass (`233` tests)
- `npm run build` -> pass
- final P6 closeout validation on 2026-05-18: `npm run test` -> pass (`241` tests), `npm run build` -> pass

Manual acceptance:
- user accepted closing P6 for now on 2026-05-18 after the commander attach flow, ghost preview, confirm, follow-move behavior, no-voluntary-detach behavior, and simplified `Bewegung beenden` movement-end behavior were implemented and focused-validation green.

Carried forward:
- Source-closed cost/timing for attach orders and automatic end-of-turn release is not yet verified against Rules plus Errata and remains a later refinement item.
- Contact/melee lock restrictions remain intentionally deferred to P7+.
