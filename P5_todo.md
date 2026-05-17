# P5 TODO - ZOC + Movement Validation

Status: Complete - user approved P5 complete on 2026-05-17; handoff docs aligned
Date drafted: 2026-05-17
Planner: GPT-5.5 preferred planner, drafted here by GPT-5.3-Codex per user request for immediate continuation
Future executor: GPT-5.4 preferred executor after explicit user approval
Intended branch: `feature/p5-zoc-movement-validation`
Master plan: `roadmap.md`
Architecture source: `docs/architecture.md`
Governance source: `docs/project-governance.md`
Rules workspace: `docs/rules/`
Open verification source: `docs/rules/open-verification.md`
Primary source PDFs: `Konzepte/Errata_ADG_V4_English.pdf`, `Konzepte/Rules.pdf`, `Konzepte/Reglettes.pdf`, `Konzepte/Reference_Sheet_V4.pdf`

## Purpose

P5 converts the P4 movement-command foundation into the first rule-conform legality layer for ZOC-sensitive movement.

P5 must add deterministic ZOC detection, most-threatening-enemy selection, movement-path sampling/splitting for mid-segment ZOC changes, and strict legality decisions with auditable diagnostics. P5 must also close the known post-P4 enforcement gaps for active-player ownership and strict command-vs-movement phase legality.

P5 is not charge/conformation or full CP economy. It is the ZOC and movement-legality backbone that later phases will build upon.

## Brainstorm Summary

The safest P5 shape is a validator-first phase, not a UI-first phase.

Build pure engine modules first:

- `engine/zoc` for ZOC geometry, applicability exceptions, and most-threatening-enemy ranking.
- `engine/movement` path splitting utilities so validators can reason about entering/leaving ZOC between start and end poses.
- `engine/validation` composition that returns explicit allowed/blocked movement intents with rule-grounded reasons.

Then wire reducer enforcement:

- block movement commands for non-active side units;
- block movement command actions outside legal battle phase context;
- keep all legality gates reducer/engine owned, never UI owned.

Finally add explanation UI for learning value without changing legality:

- toggleable enemy ZOC overlay layer;
- near-ZOC cue when a preview endpoint is within `0.5 UD` of entering an enemy ZOC;
- most-threatening-enemy visualization line (red) from moving unit to selected controlling enemy.

All UI overlays are explanatory. They do not define legality.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Re-read this card, `roadmap.md` P5 section, `docs/architecture.md` ZOC and movement sections, and `docs/rules/open-verification.md` ZOC/movement entries.
2. Re-check relevant source pages and errata notes for the specific card scope.
3. Run `git status --short --branch` and protect unrelated user changes.
4. Give the user a short PM block brief before implementation edits.
5. Keep implementation inside P5 scope.

PM block brief must include:

- exact goal;
- planned files;
- new modules;
- shell/UI versus state/engine scope split;
- validation commands;
- manual acceptance steps;
- non-goals.

After each completed card, update this file and report:

- completed card id and title;
- files touched;
- source assumptions checked;
- validation run;
- manual user review and expected result;
- still-open next card or blocker.

Context-loss rule: a future AI session should be able to resume from this file without reading the chat transcript.

## Global P5 Scope Guardrails

In scope:

- ZOC detection from enemy front geometry and footprint-aware checks;
- ZOC applicability exceptions that are source-verified for the approved P5 subset;
- deterministic most-threatening-enemy selection;
- movement preview path splitting/subsegment sampling for ZOC transition detection;
- strict movement legality decisions under ZOC for the approved subset;
- active-player ownership enforcement on movement commands;
- strict command-vs-movement phase legality enforcement for movement actions;
- rule-based diagnostics that distinguish verified checks from `needs-source-check` blockers;
- explanatory overlays for enemy ZOC, near-ZOC cue, and most-threatening-enemy line;
- automated tests and browser smoke for approved P5 scope.

Out of scope:

- no full P6 CP generation/spending system;
- no P7 charge/conformation implementation;
- no full terrain-movement or all troop-exception completion unless source-verified and explicitly pulled into a small subset;
- no multiplayer or AI behavior implementation;
- no claim of tournament-complete movement legality.

Hard rules:

- Errata overrides base rules.
- ZOC legality is engine/reducer logic, never UI logic.
- Movement legality cannot be bypassed by drag speed or visual mode.
- Any unresolved rule remains explicit `needs-source-check` and blocked from official-claim language.
- P6 must not start until P5 is implemented, validated, manually accepted where required, and explicitly approved by the user.

## Shared P5 Constants And Assumptions

- P4 is accepted complete by user on 2026-05-17.
- Default profile remains `standard-200`.
- Battlefield profile remains `30 UD x 20 UD`, `120 cm x 80 cm`, `1 UD = 4 cm`.
- Unit geometry continues to use full rotated-rectangle footprints from P2/P3/P4.
- P4 movement commands (`advance`, `wheel`, `slide`) remain the command vocabulary for P5 legality work.
- Known carry-over blockers from P4 handoff must stay visible until source-verified and implemented.
- Baseline P5 validation fixture should include at least one unit for Player 1 and one unit for Player 2 on the battlefield to exercise enemy-ZOC interactions from the first engine tests onward.

## Phase Status

- [x] P4 accepted complete by user
- [x] P5 planning requested by user
- [x] P5 brainstorm completed
- [x] P5 execution board drafted
- [x] P5 execution board approved by user for implementation
- [x] P5 implementation branch prepared
- [x] P5 source review and verification updates completed
- [x] ZOC engine primitives implemented
- [x] Most-threatening-enemy selector implemented
- [x] Movement path splitting for ZOC transitions implemented
- [x] ZOC movement legality rules implemented for approved subset (manual acceptance reported by user on 2026-05-17)
- [x] Active-player/phase enforcement completed for movement actions
- [x] P5 diagnostics and overlays implemented
- [x] P5 automated and browser validation completed
- [x] P5 demonstrated to user
- [x] P5 approved complete by user

## Definition Of Done

P5 is done when:

- [x] Enemy ZOC computation is deterministic and footprint-aware for the approved subset.
- [x] Most-threatening-enemy selection is deterministic and tested for tie-breakers in the approved subset.
- [x] Movement preview validation detects entry/stay/exit of ZOC along the path, not only at start/end.
- [x] Movement commands are blocked when ownership or active-phase constraints are violated.
- [x] Diagnostics provide clear allowed/blocked reasons and preserve `needs-source-check` honesty.
- [x] Overlay cues (ZOC toggle, near-ZOC cue, most-threatening line) reflect engine data and do not decide legality.
- [x] Automated tests cover core and edge cases for P5 scope.
- [x] Browser smoke confirms command-panel and overlay behavior for P5 scope.
- [x] `roadmap.md`, `P5_todo.md`, and `docs/rules/open-verification.md` are aligned with final P5 status.
- [x] User explicitly approves readiness to proceed toward P6.

## Execution Cards

### [x] P5-00 - Branch And Scope Gate

Goal: establish clean P5 start conditions and lock the implementation boundary before engine edits.

Planned files:

- `P5_todo.md`
- `roadmap.md`
- no implementation files unless planning correction is required

Implementation steps:
1. Confirm P5 board approval for implementation.
2. Create/switch to `feature/p5-zoc-movement-validation` from updated `main`.
3. Re-check current open blockers and P5 in/out scope.
4. Confirm that owner/phase enforcement is in P5 scope.
5. Confirm a minimal two-side fixture baseline for P5 tests: at least one Player 1 unit and one Player 2 unit on battlefield.

Non-goals:

- no engine code edits;
- no UI changes;
- no P6 command-point work.

Validation:

- `git status --short --branch`
- planning docs are consistent

Manual acceptance:

- user confirms board approval and branch start

Stop condition:

- stop if board/branch approval is missing

Expected result: P5 implementation can begin on a clean branch with agreed scope.

Completed 2026-05-17:
- User explicitly approved continuation with `P5-00`.
- Created and switched to `feature/p5-zoc-movement-validation`.
- Reconfirmed the P5 scope includes owner/active-player movement gating and strict command-vs-movement phase legality.
- Added the practical baseline fixture assumption for P5 validation: at least one unit per side on battlefield so ZOC and most-threatening checks are testable from the first implementation card.
- Branch creation was done from the current accepted dirty worktree carry-over; to avoid risking local changes, `checkout main`/`pull` were intentionally skipped for this step and the branch switch was kept non-destructive.

Files touched:
- `P5_todo.md`

Validation:
- `git status --short --branch`

Manual acceptance:
- user requested continuation with `P5-00` and the additional two-side fixture baseline.

Still open:
- Next card is `P5-01 - Source Review And Open Verification Refresh`.

### [x] P5-01 - Source Review And Open Verification Refresh

Goal: confirm exact P5 subset rules and explicitly track unresolved ZOC/movement blockers.

Planned files:

- `docs/rules/open-verification.md`
- optional focused source note in `docs/rules/`
- `P5_todo.md`

Implementation steps:
1. Re-check ZOC definitions, exceptions, most-threatening priorities, and movement permissions under ZOC.
2. Re-check errata-sensitive turn/slide/wheel interactions in ZOC context.
3. Refresh open-verification entries with concrete IDs for each unresolved P5 blocker.
4. Mark which P5 facts are `verified`, `placeholder`, and `needs-source-check`.

Non-goals:

- no engine behavior changes;
- no silent assumption closures.

Validation:

- open-verification contains explicit P5 blocker IDs

Manual acceptance:

- user reviews strictness of the source split before implementation

Stop condition:

- stop if source ambiguity would force guessing core legality

Expected result: P5 implementation proceeds with explicit rule-confidence boundaries.

Completed 2026-05-17:
- Re-checked current P5 source boundary against `docs/rules/movement-source-notes.md`, `docs/rules/errata.md`, and architecture/governance constraints.
- Added explicit P5 ZOC/movement legality blocker IDs to `docs/rules/open-verification.md` for:
	- ZOC definition geometry/range
	- most-threatening priority and tie-breaks
	- legal movement options while ZOC-constrained
	- mid-segment ZOC entry/exit checkpoints
	- terrain/non-exerting ZOC exceptions
	- active-player/phase movement legality gating
	- turn/wheel/slide interactions under ZOC
- Extended `docs/rules/movement-source-notes.md` with a P5 source-split update that links these new blockers and preserves honest `needs-source-check` handling for unresolved source-sensitive behavior.
- Kept this card documentation-only with no engine/state/UI implementation.

Files touched:
- `docs/rules/open-verification.md`
- `docs/rules/movement-source-notes.md`
- `P5_todo.md`

Validation:
- open verification now contains concrete P5 blocker IDs aligned to planned P5 cards.

Manual acceptance:
- user reviews whether the source split is strict enough for starting `P5-02` without silent assumptions.

Still open:
- Next card is `P5-02 - ZOC Geometry Primitives`.

### [x] P5-02 - ZOC Geometry Primitives

Goal: implement pure, testable enemy ZOC detection primitives for the approved subset.

Planned files:

- `src/engine/zoc/` new modules
- `src/engine/zoc/*.test.js`
- `src/engine/index.js` (if export wiring is needed)

Implementation steps:
1. Add ZOC-zone geometry derivation from enemy front edge and footprint.
2. Add helper checks for candidate unit pose inside/outside specific enemy ZOC.
3. Add source-status metadata hooks for exceptions not yet implemented.
4. Add deterministic fixtures and edge-case tests.

Non-goals:

- no most-threatening selector yet;
- no movement command wiring yet;
- no UI overlays yet.

Validation:

- focused engine tests
- `npm run test`

Manual acceptance:

- none (pure engine card)

Stop condition:

- stop if geometry API cannot express required future tie-break checks cleanly

Expected result: reusable ZOC primitives exist with deterministic test coverage.

Completed 2026-05-17:
- Added a dedicated `src/engine/zoc/` foundation module with deterministic ZOC geometry primitives:
	- enemy front-band local bounds derivation from footprint and range
	- point-in-ZOC evaluation in enemy local space
	- footprint-aware unit sampling (center + corners) for ZOC checks
	- enemy-contact aggregation that filters same-owner units and returns deterministic ordering
- Added explicit source-status and exception-hook metadata surfaces so unresolved terrain/non-exerting exception rules stay visible as `needs-source-check` hooks rather than hidden assumptions.
- Kept this card engine-only: no reducer/UI wiring and no most-threatening selector yet.

Files touched:
- `src/engine/zoc/geometry.js`
- `src/engine/zoc/index.js`
- `src/engine/zoc/geometry.test.js`
- `P5_todo.md`

Validation:
- `npm run test -- src/engine/zoc/geometry.test.js`
- `npm run test`

Manual acceptance:
- none (pure engine card)

Still open:
- Next card is `P5-03 - Most-Threatening Enemy Selector`.

### [x] P5-03 - Most-Threatening Enemy Selector

Goal: implement deterministic selection logic for controlling enemy when multiple ZOCs overlap.

Planned files:

- `src/engine/zoc/most-threatening.js` (or equivalent)
- `src/engine/zoc/*.test.js`
- optional integration hooks in movement validation modules

Implementation steps:
1. Implement ranking/tie-break algorithm for approved P5 subset.
2. Return structured explanation payload with ranking factors.
3. Preserve unresolved tie-break rules as `needs-source-check` where required.
4. Test front-nearest, coverage-tie, and flank/rear edge cases for approved subset.

Non-goals:

- no charge target logic;
- no conformation logic.

Validation:

- focused selector tests
- `npm run test`

Manual acceptance:

- none (pure engine card)

Stop condition:

- stop if tie-break rules remain source-ambiguous for core cases

Expected result: movement validation can identify one controlling enemy deterministically.

Completed 2026-05-17:
- Added `src/engine/zoc/most-threatening.js` with deterministic P5 subset ranking:
	- nearest front-distance to the enemy front ZOC boundary
	- then higher footprint coverage inside ZOC
	- then smaller lateral offset
	- then deterministic enemy id fallback
- Added structured selector outputs with ranking explanation, candidate list, and explicit `needs-source-check` unresolved references when top candidates remain tied on implemented metrics.
- Added integration helper that derives contacts from current ZOC geometry primitives and selects most threatening enemy for a target unit.
- Extended `src/engine/zoc/geometry.js` result payload with local-band bounds needed by ranking metrics.
- Added focused tests for nearest-front, coverage tie-break, lateral tie-break, unresolved tie handling, geometry-backed integration, and no-contact case.

Files touched:
- `src/engine/zoc/geometry.js`
- `src/engine/zoc/index.js`
- `src/engine/zoc/most-threatening.js`
- `src/engine/zoc/most-threatening.test.js`
- `P5_todo.md`

Validation:
- `npm run test -- src/engine/zoc/most-threatening.test.js src/engine/zoc/geometry.test.js`
- `npm run test`

Manual acceptance:
- none (pure engine card)

Still open:
- Next card is `P5-04 - Movement Path Splitting For ZOC Transitions`.

### [x] P5-04 - Movement Path Splitting For ZOC Transitions

Goal: detect path events where movement enters/exits/stays within ZOC mid-segment.

Planned files:

- `src/engine/movement/` path sampling/splitting utilities
- `src/engine/movement/*.test.js`
- `src/engine/movement/validation.js`

Implementation steps:
1. Add path sampling/splitting strategy for `advance`, `wheel`, `slide` previews.
2. Detect ZOC transition events against split points.
3. Add deterministic event records consumable by legality validator.
4. Test mid-segment entry/exit and near-boundary precision cases.

Non-goals:

- no final legality decisions yet;
- no UI overlays yet.

Validation:

- focused movement tests
- `npm run test`

Manual acceptance:

- none (pure engine card)

Stop condition:

- stop if numeric precision causes unstable transition decisions without robust tolerances

Expected result: validator receives robust path-event data rather than only start/end poses.

Completed 2026-05-17:
- Added `src/engine/movement/path-splitting.js` with deterministic path sampling utilities:
	- segment pose interpolation with UD-scaled sampling density
	- chained preview splitting without duplicate segment-start samples
	- ZOC transition analysis across sampled path checkpoints
- Added transition analysis outputs that record in/out ZOC changes and most-threatening-id changes per checkpoint.
- Added focused tests in `src/engine/movement/path-splitting.test.js` for deterministic interpolation, chained segment handling, and mid-segment ZOC entry detection.
- Exported path-splitting functions through `src/engine/movement/index.js` for validator integration.

Files touched:
- `src/engine/movement/path-splitting.js`
- `src/engine/movement/path-splitting.test.js`
- `src/engine/movement/index.js`

Validation:
- `npm run test -- src/engine/movement/path-splitting.test.js`
- `npm run test`

Manual acceptance:
- none (pure engine card)

Still open:
- Next card is `P5-05 - ZOC Movement Legality Rules (Approved Subset)`.

### [ ] P5-05 - ZOC Movement Legality Rules (Approved Subset)

Goal: enforce approved subset of ZOC movement permissions/restrictions using path-event data.

Planned files:

- `src/engine/movement/validation.js`
- `src/state/p0-movement.js`
- related tests in `src/engine/movement/` and `src/state/`

Implementation steps:
1. Add legality rules for entry/stay/exit decisions in approved subset.
2. Bind legality to most-threatening enemy output.
3. Produce structured blocked/allowed diagnostics with action alternatives where possible.
4. Keep unresolved areas explicit as `needs-source-check`.

Non-goals:

- no charge/conformation enforcement;
- no full terrain-exception completion unless source-verified and explicitly approved.

Validation:

- focused validation tests
- `npm run test`

Manual acceptance:

- user runs movement interactions that should now reject/allow according to P5 subset

Stop condition:

- stop if diagnostics cannot explain blocked states clearly enough for rule learning

Expected result: movement preview/confirm reflects first rule-conform ZOC legality layer.

Agent implementation + validation completed 2026-05-17 (manual acceptance pending):
- Integrated P5 path-splitting/ZOC transition analysis into movement validation.
- Added `zoc-subset-legality` diagnostics that block accepted previews when sampled paths enter or remain in enemy ZOC under the approved current subset.
- Added explicit `zoc-mid-segment-checks` diagnostics to surface checkpoint sampling and source-status transparency.
- Updated confirmation gating so invalid validation snapshots force confirmation state to `blocked`.
- Enforced confirmation readiness checks in `confirm advance/wheel/slide` reducers so blocked confirmations cannot apply movement.
- Added reducer and validation tests for ZOC-blocked confirmation paths.
- Added a second baseline battlefield fixture unit (`test-unit-2`, player-2) to support enemy-ZOC interactions in state-level testing.

Files touched:
- `src/engine/movement/validation.js`
- `src/engine/movement/validation.test.js`
- `src/state/p0-movement.js`
- `src/state/p0-advance.js`
- `src/state/p0-wheel.js`
- `src/state/p0-slide.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`

Agent validated:
- `npm run test -- src/engine/movement/path-splitting.test.js src/engine/movement/validation.test.js src/state/p0-state.test.js`
- `npm run test`

Manual acceptance (pending user):
- Run the P5-05 manual battlefield checklist before this card is marked complete.

Still open:
- Next card after manual acceptance is `P5-06 - Owner And Phase Enforcement For Movement Commands`.

### [x] P5-06 - Owner And Phase Enforcement For Movement Commands

Goal: close known P4 carry-over gaps by enforcing active-player ownership and strict movement-phase legality.

Planned files:

- `src/state/p0-movement.js`
- `src/state/p0-state.js`
- `src/ui/p0-battlefield.js`
- `src/ui/battlefield-command-panel.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.test.js`

Implementation steps:
1. Added `isMovementCommandAllowed(gameState)` guard to `p0-movement.js`.
2. Applied guard to `reduceSelectMovementCommand`, `reduceSetMovementDraft`, `reduceSetMovementPreview`.
3. Added `isMovementCommandAllowed` import to `p0-state.js` and applied guard to all 9 movement action cases: `SET_ADVANCE_MODE` (activate only), `SET_ADVANCE_PREVIEW_DISTANCE`, `CONFIRM_ADVANCE`, `SET_WHEEL_MODE` (activate only), `SET_WHEEL_PREVIEW_ANGLE`, `CONFIRM_WHEEL`, `SET_SLIDE_MODE` (activate only), `SET_SLIDE_PREVIEW_DISTANCE`, `CONFIRM_SLIDE`.
4. Computed `canIssueMovementCommands` in `p0-battlefield.js` and passed to `renderAdvanceCommandPanel`.
5. Updated button `disabled` logic in `battlefield-command-panel.js` to use `canIssueMovementCommands`.
6. Updated `advanceToBattlefield` helper in both test files to set `currentPhaseId: 'movement'`.
7. Updated `completeSetupToBattle`-based test to explicitly switch to movement phase.
8. Added 8 new P5-06 reducer tests covering wrong-player and wrong-phase blocking, plus player-2 positive case.

Non-goals achieved:

- no CP economy;
- no corps activation sequence.

Validation:

- `npm run test` → 139 pass, 0 fail

Manual acceptance (pending user):

- Select unit-1 with active player = player-2 → Advance/Wheel/Slide buttons disabled, advance rejected by reducer.
- Switch to player-1, phase = command → buttons still disabled.
- Switch to player-1, phase = movement → buttons enabled, advance works.
- Switch active player to player-2, select unit-2 → buttons enabled, unit-2 can advance.

Files touched:
- `src/state/p0-movement.js`
- `src/state/p0-state.js`
- `src/ui/p0-battlefield.js`
- `src/ui/battlefield-command-panel.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.test.js`
- `P5_todo.md`

Still open:
- Next card is `P5-07 - P5 Diagnostics And Learning Overlays`.

### [ ] P5-07 - P5 Diagnostics And Learning Overlays

Goal: expose P5 legality state and helper overlays without moving rule logic into UI.

Planned files:

- `src/ui/battlefield-command-panel.js`
- `src/ui/p0-battlefield.js`
- `src/styles/` relevant partials
- UI tests as needed

Implementation steps:
1. Add toggleable enemy ZOC overlay rendering from engine snapshots.
2. Add near-ZOC cue for preview endpoints within `0.5 UD` threshold.
3. Add most-threatening-enemy red-line visualization tied to validator output.
4. Keep overlay rendering passive (display-only), never legality-owning.

Non-goals:

- no UI-side rule shortcuts;
- no visual claim of full rules completeness.

Validation:

- focused UI tests
- `npm run test`
- `npm run build`

Manual acceptance:

- user validates overlay toggles and cue readability in browser

Stop condition:

- stop if overlays misrepresent validator state or imply unsupported rule coverage

Expected result: player gets actionable, honest ZOC feedback during movement previews.

Progress update 2026-05-17 (in progress):
- Added structured ZOC facts to movement validation snapshots in `src/engine/movement/validation.js`:
	- `contactMode`: `none | enters | remains | exits | transient`
	- `startsInEnemyZoc`, `endsInEnemyZoc`, `encountersEnemyZoc`, `transitionCount`
	- `mostThreateningEnemyId` for UI projection without UI-side rule logic.
- Sharpened `zoc-subset-legality` diagnostic wording to distinguish path contact mode (`enters`, `remains`, `exits`, `transient`) while keeping current approved conservative subset gating.
- Added a display-only most-threatening line overlay in `src/ui/p0-battlefield.js` + `src/styles/p0-battlefield.css` tied to validation snapshot data.
- Updated ZOC overlay reference to use movement preview endpoint pose (when an accepted preview exists), improving near-contact visual relevance during previews.
- Added a near-ZOC cue overlay at the `0.5 UD` threshold in `src/ui/p0-battlefield.js` + `src/styles/p0-battlefield.css`, based on footprint sample-point distance to enemy ZOC band geometry.
- Added a source-gated ZOC relaxation candidate hook in `src/engine/movement/validation.js`:
	- no legality relaxation applied yet,
	- explicit `needs-source-check` diagnostic (`zoc-relaxation-candidate`) when most-threatening + advance path context indicates a plausible future subset opening.
- Added three-enemy support fixture shape for practical most-threatening checks in live movement validation:
	- player-2 center enemy `test-unit-2`, plus left/right supporters `test-unit-3` and `test-unit-4` in `src/state/p0-state.js`.
	- deployment placeholders remain intentionally scoped to `test-unit-1` and `test-unit-2` to keep setup-card assumptions stable.
- Implemented conservative source-gated legality opening in `src/engine/movement/validation.js` for ZOC-constrained movement:
	- `advance`/`wheel` can be accepted while ZOC-constrained only when movement closes center-distance to the most-threatening enemy and sampled path stays contact-free against that enemy footprint,
	- blocked outcome is retained when no closing trend is present or contact would be created,
	- explicit `needs-source-check` diagnostic remains for this relaxation as non-final rule coverage.
- Added/updated tests:
	- `src/engine/movement/validation.test.js` now covers allowed close-without-contact and blocked contact scenarios,
	- `src/engine/zoc/most-threatening.test.js` adds a left-center-right support-cluster selector check,
	- `src/state/p0-state.test.js` adds reducer-level allow/block confirmation checks for the new conservative subset.
- Added focused assertion coverage in `src/engine/movement/validation.test.js` for structured ZOC facts.
- Automated validation: `npm run test` -> 139 pass, 0 fail (after each sharpening step).
- Automated validation after conservative subset opening + support fixtures: `npm run test` -> 142 pass, 0 fail.
- Added final P5-08 validation package run:
	- `npm run test` -> 142 pass, 0 fail
	- `npm run build` -> success
- User manual validation report: "getestet und klappt" for the new ZOC-sharpened behavior and fixtures.
- Still open inside P5-07:
	- none inside P5-07 card scope.

### [x] P5-08 - Validation Package And Handoff

Goal: run full validation for P5 scope and close phase documentation consistently.

Planned files:

- `P5_todo.md`
- `roadmap.md`
- optional updates in `docs/rules/open-verification.md`

Implementation steps:
1. Run full test suite and build.
2. Run focused browser smoke for approved P5 interactions.
3. Record residual blockers honestly as post-P5 items.
4. Align roadmap and board status for handoff.

Non-goals:

- no follow-on P6 implementation;
- no undocumented manual acceptance claims.

Validation:

- `npm run test`
- `npm run build`
- local browser smoke

Manual acceptance:

- user validates defined manual smoke checklist and reports acceptance

Stop condition:

- stop if any P5 success criterion is not met or is unverifiable

Expected result: P5 closes as an honest, tested ZOC + movement-legality foundation.

Completed 2026-05-17:
- Ran full validation package on current branch:
	- `npm run test` -> 142 pass, 0 fail
	- `npm run build` -> success
- User reported manual acceptance for P5 scope: "getestet und klappt" and explicitly approved P5 as complete.
- Aligned phase governance docs for handoff consistency:
	- `P5_todo.md`
	- `roadmap.md`
	- `docs/rules/open-verification.md`
- Kept unresolved source-sensitive movement/ZOC interpretation explicitly open in verification tracking to avoid tournament-complete claims.

Files touched:
- `P5_todo.md`
- `roadmap.md`
- `docs/rules/open-verification.md`

Validation:
- `npm run test`
- `npm run build`

Manual acceptance:
- user confirmed P5 behavior and phase completion.

Still open:
- P6 is not implemented yet and remains phase-gated pending approved P6 execution scope.