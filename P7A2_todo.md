# P7A2 TODO - Evade Move Completion Gate

Status: In progress - split after validated core and first slide-choice slices. This board is not complete: P7A2-00, P7A2-02, P7A2-03, P7A2-04, P7A2-07, P7A2-08, and P7A2-09 still contain open work before P7A2 can be accepted or used to unblock P7B.
Date drafted: 2026-05-21
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Intended branch: feature/p7a2-evade-move-completion
Master plan: roadmap.md
Concept source: docs/charge-phase-procedure-concept.md
Rules workspace: docs/rules/
Rules source corpus target: docs/source/Rules_v2.md plus the RV2 source-lock workspace notes in docs/rules/; docs/source/rules.md remains legacy planning support only
Open verification source: docs/rules/open-verification.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, docs/source/new scan/Rules_Color_300DPI.pdf, Konzepte/Rules.pdf
Rules-v2 source gate: the charge/evade source-lock baseline from RV2-04 is now the working planning basis; before implementation, keep RV2-05A recalibration aligned for charge-facing boards and get explicit user approval for the phase start

Implementation update 2026-05-23 - completed core slice only:

- Added a replay-safe `evadeMove` state spine with committed/pending/source-open status, final pose, avoidance steps, cannot-shoot hook, and repeated-evade hook.
- The reducer now commits source-closed no-choice evades into `game.units` before adjusted charge distance can start.
- A supported single legal final-overlap slide is now path-producing: it records the side, slide distance, intermediate pose, remaining straight distance, and final pose, and deducts slide distance from the evade distance.
- `START_ADJUSTED_CHARGE_DISTANCE_ROLL` is gated on committed evade state instead of the mere existence of an evade D6 result.
- Adjusted charge follow-through now consumes the committed evader state, with legacy `evadePlan` retained only as preview/replay context.
- Focused and full validations are green: targeted P7A2 tests, `npm test` with 378 passing tests, and `npm run build`.
- Browser tooling reached the live Charge Drill and charge reaction flow, but the D6 overlay interaction was not stable enough to claim a full browser end-to-end P7A2 smoke; keep manual acceptance open.

Split decision 2026-05-23:

- Treat the committed-evade gate as a validated P7A2 core slice, not as phase completion.
- Keep the card checkboxes open unless every implementation step, validation item, and manual acceptance item in that card is satisfied.
- Next safe implementation split: finish P7A2-00 source lock first, then P7A2-02/P7A2-04 for slide/block plus final movement resolver, then P7A2-03/P7A2-07 for wheel and choice UI, then P7A2-08/P7A2-09 for hooks, browser smoke, and handoff.
- Do not start P7B until P7A2-09 is complete and user manual acceptance is recorded.

Implementation update 2026-05-23 - slide-choice slice:

- The Charge Drill source-open blocker from the live screenshot is now represented as `choice-required` when both legal final-overlap slide candidates exist, instead of blocking the flow as source-open.
- `evadeMove` now preserves `avoidanceCandidates` for replay/UI, and reducer action `SELECT_EVADE_AVOIDANCE_CHOICE` commits the selected slide candidate into canonical `game.units` before adjusted charge distance can start.
- The command panel keeps `Adjusted Charge wuerfeln` hidden until after the selected evade movement is committed.
- Focused validations for this slice are green: reducer choice commit, command-panel choice buttons, model/engine/reducer/UI P7A2 tests, and a direct Node simulation of the screenshot flow.
- This does not close P7A2-02/P7A2-04/P7A2-07 because direct-blocker integration, wheel, table exit, light-troop end half-turn, committed trail rendering, and browser/manual acceptance remain open.

Implementation update 2026-05-23 - evade hotseat handoff popup:

- A reducer-owned `evadeChoiceHandoff` now blocks the defender-side choice behind a real popup instead of silently hiding the next step.
- After a `choice-required` evade result, the battlefield switches to `hotseat-handoff`, shows an explicit `Bitte Spieler B den Ausweichzug machen` style popup, and only exposes left/right evade buttons after `OK`.
- Acknowledging the popup switches the privacy view to the reacting player's view; committing the evade choice returns to the prior view and hands adjusted charge back to the charger side.
- Focused battlefield/command-panel/reducer tests and the full test suite are green for this popup slice.

## Purpose

P7A2 closes the rule-timing gap between accepted P7A and planned P7B: if a defender evades, the evade movement must be resolved and committed before the charger rolls adjusted charge distance and before any later conformation state is built.

P7A already provides a reducer-owned `evadePlan`, adjusted-distance dice, basic reorientation, first blocked-evade checks, caught-evader hooks, and secondary-target anchoring for the accepted supported subset. P7A2 turns the evader from a ghost-only preview into a branch-authoritative board state with explicit evade path choices, blockers, slide cost, and commit status.

## Rule Invariant

The defended invariant for P7A2 is:

- Target reaction happens before the all-initial-targets-evade charge branch.
- The evading unit completes its evade movement first.
- Only after that resolved evade state exists may the charging unit roll adjusted charge distance and continue, catch the evader, hit a secondary target, stop, or hand off to conformation.

This is source-shaped by the charge procedure point 3 target reaction, point 6 all-initial-targets-evade branch, and the evade procedure pages for blocked evade, evade direction, adjusted evade distance, and evade movement. The working details now come from the Rules-v2 scan-confirmed corpus and the charge source-lock workspace; `P7A2-00` exists to pin the remaining errata-sensitive and solver-boundary details before implementation, not to reopen broad chapter readability.

## Current Code Audit

Observed current implementation after the first core slice:

- `src/engine/charge/evade.js` computes free reorientation, D6 distance, straight end pose, simple direct blocker clearance options, a first single legal final-overlap slide candidate, and adjusted charge follow-through contact state.
- `evaluateSimpleBlockedEvade(...)` can detect whether a blocker less than `1 UD` ahead can be cleared by a left/right slide of `1 UD` or less, but direct-blocker path application is still open.
- `resolveIsolatedSingleUnitEvadePlan(...)` creates `startPose`, `reorientedPose`, `endPose`, distance, roll result, avoidance metadata, and diagnostics. It treats table edge and unresolved final overlap/interpenetration as `needs-source-check`; one legal final-overlap slide can now be applied and deducted, and two legal final-overlap slide candidates now create a reducer-owned choice.
- `src/engine/charge/reaction.js` blocks evades when the post-reorientation front is inside enemy ZoC or when a simple direct blocker has no supported slide clearance. If a slide exists, the reaction is allowed, but the chosen slide is not preserved.
- `src/state/p0-state.js` now stores `chargePreview.evadeMove`, auto-commits source-closed no-choice evades, commits selected final-overlap slide choices, mutates `game.units`, and blocks `START_ADJUSTED_CHARGE_DISTANCE_ROLL` until committed evade state exists.
- `resolveAdjustedChargeFollowThroughContactState(...)` can consume committed `evadeMove` state and the canonical moved unit instead of only a ghost override.
- `src/ui/p0-battlefield.js` still renders evade reorientation, corridor, and end ghost from `evadePlan`; it does not yet clearly distinguish pending preview, player choice, and committed trail/token states for the full P7A2 scope.

Primary gap:

- The original ghost-only timing gap is closed for the validated source-closed no-choice subset and the first final-overlap slide-choice subset, but P7A2 still lacks direct-blocker slide application, wheel, obstacle wheel, table-exit, light-troop end half-turn, committed trail rendering, and manual browser acceptance.

## Supported Scope

P7A2 remains single-unit-first and applies to the current charge drill / local hotseat model.

In scope:

- source-locked evade timing contract before adjusted charge distance
- reducer-owned `evadeMove` or equivalent committed result model
- free initial reorientation already supported by P7A, preserved with stronger commit metadata
- adjusted evade D6 result and maximum evade distance
- optional direction wheel as part of the complete P7A2 flow because it affects charger follow-through
- direct blocker detection after reorientation
- simple slide avoidance up to `1 UD`, with slide distance deducted from evade distance
- mandatory player choice when both left and right slide outcomes are legal
- auto-commit for no-choice evades after a clear player-facing notice
- blocked-evade result when neither supported slide nor supported manoeuvre can avoid the obstacle
- obstacle wheel as part of the supported P7A2 evade flow
- straight evade movement up to the remaining adjusted distance
- enemy ZoCs ignored during the actual evade movement after the initial blocked-ZoC check, where source-locked
- cannot-shoot-after-evading flag hook
- repeated-evade counter/status hook
- table-edge exit resolution for evading units
- light-troop free half-turn at the end of the evade move
- explicit terrain outcomes as either source-locked implementation or blocking diagnostics, depending on `P7A2-00`
- committed evader pose before adjusted charge D6
- charger follow-through uses canonical post-evade unit state rather than a ghost-only override
- UI distinction between pending evade preview, pending choice, and committed evader token

Out of scope unless the user explicitly expands P7A2:

- group evade movement and mixed-move allowance subgroups
- interpenetration resolution and pass-through placement
- full terrain movement-cost system if the source/data model remains too open
- full army-cohesion/victory accounting after table-exit loss if that belongs in P10
- full secondary-target recursion beyond the current first secondary pause
- conformation, shifting during conformation, melee factors, pursuit, rout, and army cohesion
- official tournament-complete evade coverage

## Confirmed User Decisions

Confirmed on 2026-05-21 for P7A2 planning:

- Player-facing evade choice is limited to the initial branch. The defender chooses between the optional direction-wheel branch and the no-direction branch; inside that branch the solver maximizes legal end distance automatically and uses deterministic tie-breaks only when still necessary.
- No-choice evades: show a clear notice and then auto-commit.
- Complete flow: include the optional evade-direction wheel because it affects the charger's follow-through and catch/secondary-target logic.
- Obstacle wheel: include obstacle-wheel handling, not only slide/block.
- Combined obstacle avoidance: source check now confirms that an evade may still use a later slide to avoid a new obstacle after the optional direction wheel, with normal evade-distance deduction and the printed one-slide / total-wheel-limit constraints.
- Table exit: include table-exit resolution for evading units.
- Light troops: include the free half-turn at the end of their evade move, even though normal movement half-turn is not generally implemented yet.
- Cannot shoot and related after-evade effects: include the phase/state hooks now.

Remaining source-lock details for `P7A2-00`:

- adjusted charge and adjusted evade distance are already scan-confirmed in the Rules-v2 pass as `1-2 = movement - 1 UD`, `3-4 = normal movement`, `5-6 = movement + 1 UD`; keep only the errata-overrides-base confirmation open
- treat optional direction wheel and obstacle wheel with the ordinary single-unit wheel baseline unless evade wording or errata overrides it: pivot on an outer front corner, measure the opposite front corner, maximum `90 degrees`; keep open only for direct evade-specific wording or errata that changes cost/accounting
- table exit is source-backed enough for P7A2 to commit removal from play now and store a deferred army-cohesion/victory hook for P10; keep open only for exact downstream accounting semantics, not for whether evade itself resolves
- light-troop end half-turn is source-backed enough to stay in scope, but the exact family wording still needs direct errata confirmation before we collapse it into a broader capability flag
- exact reset boundary for cannot-shoot and repeated-evade phase flags
- visual example coverage for blocked evade, evade movement, charge continuation after evade, interpenetration/burst-through deferrals, and catching evaders from `RULES_V2_todo.md` RV2-02/RV2-02A

## Execution Cards

Card status convention after the 2026-05-23 correction:

- `[x]` means every listed implementation step, validation item, manual acceptance item, and stop condition for that card is satisfied.
- `[ ] ... (partial)` means useful code or documentation exists, but the card remains open and must not be treated as accepted.
- P7A2 is not complete until P7A2-09 is complete and user manual acceptance is recorded.

### [ ] P7A2-00 - Source Lock And Branch Contract

Goal: verify the exact evade movement contract before any implementation.

Planned files:

- docs/source/Rules_v2.md after the Rules-v2 pass is accepted
- docs/source/rules-v2-examples/index.md after example extraction is accepted
- RULES_V2_todo.md
- docs/source/rules.md as legacy planning support only
- docs/rules/charge.md
- docs/rules/open-verification.md
- docs/charge-phase-procedure-concept.md
- P7A2_todo.md

Implementation steps:
1. Confirm that the RV2-04 charge/evade source-lock entries and the current RV2-05A recalibration notes still align across `docs/source/Rules_v2.md`, `docs/rules/charge.md`, and this board; do not block on unrelated later rule areas.
2. Manually cross-check Rules p.43 and p.47-49 plus errata against `docs/source/Rules_v2.md`, `docs/source/rules-v2-examples/index.md`, and the original scan pages for target reaction, all-initial-targets-evade, blocked evade, evade direction, adjusted evade distance, evade movement, catching evaders, and no-shoot-after-evade.
3. Review extracted visual examples, yellow example boxes, and diagrams related to evade/charge continuation; do not rely only on OCR text or the older `docs/source/rules.md` digest.
4. Record the invariant that the evader's movement is resolved before adjusted charge distance.
5. Source-lock the confirmed P7A2 scope: initial-branch choice, no-choice notice plus auto-commit, optional direction wheel, obstacle wheel, table exit, light-troop end half-turn, cannot-shoot hooks, and repeated-evade hooks.
6. Convert only source contradictions or unreadable details into explicit `needs-source-check` language; do not shrink confirmed scope merely because implementation is harder.

Non-goals:

- no engine code
- no UI work
- no conformation implementation

Validation:

- markdown review only
- open-verification entries align with this board

Manual acceptance:

- user confirms the source-locked implementation details and any remaining source-verification warnings

Stop condition:

- stop if the PDF text or errata contradicts the assumed timing or slide-cost contract
- stop if the Rules-v2 example extraction is incomplete for an evade/charge visual example that affects P7A2 legality

Expected result: P7A2 starts from source-backed details for the complete supported evade flow.

Source-lock delta from RV2-04/RV2-05A on 2026-05-23:

- The Rules-v2 scan-confirmed pass now closes the adjusted-distance table and the ordered `reaction -> committed evade move -> adjusted charge distance` timing as the working implementation baseline.
- RV2-05A recalibration now treats this board as downstream of that baseline rather than as waiting on generic Rules-v2 readiness.
- Remaining P7A2-00 source risk is now concentrated on errata-sensitive details and solver boundaries, not on broad OCR uncertainty about the evade chapter.
- The wheel baseline for P7A2 can now be treated as inherited from the scan-confirmed single-unit movement wheel geometry unless evade wording or errata overrides it.
- Table-exit evade outcomes no longer need to block P7A2 commit logic; the current source-backed plan is immediate removal plus a deferred P10 accounting hook.
- The main unresolved content question is now the exact `light troops` family wording for the end-of-evade free half-turn, plus reset timing for after-evade flags.

### [ ] P7A2-01 - Evade Commit Model (partial)

Goal: add a serializable model for pending, chosen, blocked, and committed evade movement.

Planned files:

- src/engine/charge/model.js
- src/engine/charge/model.test.js
- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/state/p0-state.js if reducer shape needs integration

Implementation steps:
1. Define an `EvadeMoveResolution` shape or equivalent inside the charge model.
2. Store reacting unit, acting player, declaration snapshot, start pose, reoriented pose, adjusted distance result, avoidance steps, spent distance, final pose, commit status, and diagnostics.
3. Preserve source status and replay-safe choice identifiers for slide, direction-wheel, obstacle-wheel, and end-half-turn decisions.
4. Keep `evadePlan` compatibility or migrate it without breaking existing UI tests.

Non-goals:

- no application of movement yet
- no new browser UI yet
- no interpenetration result model beyond explicit unsupported diagnostics

Validation:

- focused model serialization tests
- existing charge model tests

Manual acceptance:

- none unless the model exposes a user-facing choice question

Stop condition:

- stop if the model cannot preserve enough evidence to replay the evade path and later adjusted charge branch

Expected result: reducer and engine have a stable data spine for actual evade resolution.

Progress 2026-05-23:

- Core `evadeMove` state spine exists and is serialized through the charge preview.
- Model tests cover the committed replay facts for the current subset.

Still open before this card can close:

- Confirm the shape preserves enough explicit choice identifiers for the initial branch, direction wheel, obstacle wheel, table exit, and light-troop end half-turn.
- Add or update tests once those choices exist, rather than relying only on generic `avoidanceSteps`.

### [ ] P7A2-02 - Slide And Block Solver (partial)

Goal: turn the current simple clearance-slide check into a path-producing solver for the supported single-slide case.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/engine/geometry/ helpers if reusable footprint projections are needed

Implementation steps:
1. Reuse `evaluateSimpleBlockedEvade(...)` as the first source of direct blockers after reorientation.
2. Produce legal avoidance candidates with side, distance, spent distance, intermediate pose, remaining evade distance, and blocker evidence.
3. Deduct slide distance from the adjusted evade distance.
4. Preserve only real initial-branch choices as `choice-required`; within a chosen branch, solve later legal slides and wheels automatically for maximum distance.
5. Mark no-choice legal slide/no-slide paths as auto-commit eligible with a player-facing notice.
6. Keep enemy-ZoC blocked checks separate from physical obstacle blocked checks.

Non-goals:

- no interpenetration
- no chain obstacles
- no group contraction

Validation:

- tests for no blocker, blocked by enemy ZoC, blocked by obstacle, no-direction branch auto-selection, initial branch choice, and slide distance reducing final movement

Manual acceptance:

- user verifies that a simple side-clearance case visually offers or applies the expected slide

Stop condition:

- stop if the supported slide cannot be represented without mixing UI choice logic into engine code

Expected result: P7A2 can explain and apply the first real slide/block evade cases.

Progress 2026-05-23:

- A first single legal final-overlap slide can produce path metadata and deduct slide distance from remaining evade distance.
- The first both-side final-overlap slide case now becomes a `choice-required` reducer state instead of source-open, and the selected side commits to canonical board state.
- Direct-blocker clearance from `evaluateSimpleBlockedEvade(...)` now feeds the evade resolver as a real path-producing branch instead of remaining diagnostic-only.
- One-side direct-blocker clearance now auto-commits with deducted slide distance, and the broader no-direction branch now auto-selects the best legal slide path instead of surfacing left/right micro-choices.
- Focused engine tests cover that one-side slide case.
- Focused reducer/UI tests cover the both-side final-overlap slide choice in the Charge Drill, and a reducer test now confirms single-side direct-blocker auto-commit into canonical `game.units`.

Still open before this card can close:

- Add reducer/UI coverage that live solver output no longer exposes obsolete left/right micro-choices inside the no-direction branch.
- Add the remaining blocked-case matrix for enemy-ZoC blocked, physical blocker with no legal slide, and wider slide-distance deduction coverage in reducer/UI flow.

### [ ] P7A2-03 - Direction Wheel And Obstacle Wheel Solver

Goal: implement the non-straight evade manoeuvres that affect final pose and charger follow-through.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- docs/rules/charge.md
- docs/rules/open-verification.md
- P7A2_todo.md

Implementation steps:
1. Source-check the optional wheel to match the charge direction after initial reorientation.
2. Source-check the later obstacle wheel with maximum `90 degrees`, minimum necessary deviation, and distance cost.
3. Implement legal wheel candidates with cost, resulting direction, remaining evade distance, and blocker evidence.
4. Require player choice when several legal wheel outcomes are materially different.
5. Keep wheel-required cases non-committable only when source verification fails or the geometry is outside the approved single-unit scope.

Non-goals:

- no free-form player drawing of evade paths
- no normal movement wheel reuse if it obscures evade-specific costs and limits

Validation:

- tests for optional direction wheel, obstacle wheel, wheel-cost deduction, maximum-90-degree limit, and blocked/source-open wheel-required cases

Manual acceptance:

- user confirms the wheel choice UI and expected charger follow-through after a wheeled evade

Stop condition:

- stop if exact wheel distance/cost cannot be source-locked well enough for deterministic replay

Expected result: P7A2 has source-backed direction-wheel and obstacle-wheel results that feed final evade pose and charger follow-through.

Progress 2026-05-24:

- The evade solver now reuses the single-unit wheel baseline from the movement engine instead of inventing a second wheel geometry path.
- Optional direction-wheel candidates can now be generated when the reoriented evade direction differs from the frozen charge direction by up to `90 degrees`, with wheel cost deducted from remaining evade distance.
- A stable supported obstacle-wheel fixture is now covered as well: when a direct blocker leaves no legal slide lane, the solver can expose `obstacle-wheel` defender choices with replay-safe candidate IDs and committed final poses.
- The evade choice pipeline is now candidate-driven rather than slide-only: reducer choice resolution accepts replay-safe candidate IDs, and the current command-panel UI can render generic evade candidates such as the no-direction branch and `direction-wheel`.
- Focused engine coverage now proves both an optional direction-wheel choice case and a supported obstacle-wheel choice case, and focused reducer/UI tests prove that the generalized candidate-choice path still commits supported evade choices before adjusted charge distance.
- Rules-v2 source check confirmed that the evade procedure is not limited to a single avoidance primitive, and the current solver now carries chained candidate paths as well: after the optional direction wheel, the later evade move can expose a supported later slide or later obstacle-wheel branch with replay-safe multi-step avoidance data.
- Focused engine, reducer, and battlefield-facing UI coverage now includes a concrete `direction-wheel -> later slide` fixture so the printed combined evade sequence is no longer only documented; it is exercised in code.
- Evade slide distances are now geometry-derived instead of coarse `0.25 UD` guesses when a blocker is only partially behind the evader, so supported slide candidates can use the true shorter minimum offset instead of defaulting to `1 UD`.
- Player-facing evade choice is now narrower in the supported subset: the solver keeps the explicit `straight` versus `direction-wheel` branch decision, but otherwise auto-selects the legal candidate that ends farthest from the charger unless a remaining branch is a real tie/`50-50` case.
- The later obstacle-avoidance solver no longer stops after one later wheel: a supported evade can now chain one slide plus multiple later obstacle wheels within the printed later-move `90 degrees` budget, and focused engine coverage now includes a concrete multi-wheel path case.
- Battlefield rendering now shows intermediate trail ghosts for chained evade candidates and generic step-based labels, so supported multi-step choices read more like a movement path than an isolated end token.
- Battlefield evade choice now has a first movement-style input slice as well: compact branch handles render at the reoriented evader for the surviving initial choices, while the solver still owns later distance-maximizing follow-up steps and the command-panel buttons remain as fallback.
- Battlefield evade choice now supports a real stepwise learning path: clicking a visible node no longer commits the move, but instead advances one level in the legal evade tree, filters the visible subtree end ghosts, and leaves direct endpoint quick-picks available as a parallel shortcut.

Still open before this card can close:

- Add wider blocked/source-open wheel-required coverage beyond the first stable obstacle-wheel fixture.
- Expand the current node-by-node evade tree into fuller battlefield-native gestures and decide when the command-panel fallback buttons can safely disappear.

### [ ] P7A2-04 - Evade Movement Resolver (partial)

Goal: compute the final single-unit evade movement path after D6 and any supported choices.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/engine/charge/index.js

Implementation steps:
1. Resolve free initial reorientation from the P7A contact snapshot.
2. Apply selected or automatic supported avoidance step.
3. Move in a straight line up to remaining adjusted evade distance.
4. Ignore enemy ZoCs during the actual evade move where source-locked, while preserving the initial blocked-ZoC check.
5. Apply light-troop end half-turn where source-locked.
6. Resolve table-edge exit for evading units while preserving P10 hooks for army-cohesion/victory accounting if needed.
7. Detect final overlap, enemy camp, and terrain-source-open outcomes as committed result, blocked result, or `needs-source-check` according to `P7A2-00`.
8. Produce a complete path segment list for rendering and replay.

Non-goals:

- no interpenetration placement
- no group contraction
- no P10 army-cohesion/victory accounting unless reduced to a stored hook

Validation:

- tests for straight front evade, flank quarter-turn evade, rear evade, slide plus straight distance, direction wheel, obstacle wheel, light-troop end half-turn, table-edge exit, and final overlap unsupported

Manual acceptance:

- user verifies one straight and one slide-based evade in the browser

Stop condition:

- stop if final-pose legality depends on terrain/interpenetration rules outside the approved P7A2 subset

Expected result: every supported P7A2 evade can produce a final board pose or a clear non-committable diagnostic.

Progress 2026-05-23:

- Straight no-choice evades and the current one-side final-overlap slide can produce committed board poses.
- A selected two-side final-overlap slide choice now produces a committed board pose and unlocks adjusted charge distance.
- Supported direct-blocker slide application now also produces committed board poses for one-side auto-commit and two-side player-choice cases.
- Optional direction-wheel and supported obstacle-wheel candidates now feed the same supported evade choice pipeline, with focused reducer coverage proving committed wheel-selected outcomes before adjusted charge distance.
- Source-open final overlap and table-edge diagnostics still block commit.

Still open before this card can close:

- Implement or explicitly source-block direction wheel, obstacle wheel, table-edge exit, and light-troop end half-turn.
- Produce a complete path segment list for rendering and replay beyond the current preview ghost.

### [ ] P7A2-05 - Reducer Commit Boundary (partial)

Goal: require an actual evade commit before adjusted charge distance can start.

Planned files:

- src/state/p0-state.js
- src/state/p0-state.test.js
- src/engine/charge/model.js

Implementation steps:
1. Add reducer state/actions for pending evade path choice and committed evade result.
2. After evade D6, create a pending evade movement resolution instead of treating the roll alone as enough.
3. Auto-commit source-closed no-choice paths after storing a player-facing notice; require explicit confirmation for player choices, source warnings, or materially different path options.
4. Mutate `game.units` to the committed evader final pose or stored removal/loss hook before adjusted charge distance roll can be claimed.
5. Gate `START_ADJUSTED_CHARGE_DISTANCE_ROLL` on committed evade status, not merely on `branchDistanceRoll.result`.
6. Preserve secondary-target reanchoring behavior for the first supported secondary target.

Non-goals:

- no conformation completion
- no melee application
- no hidden UI-side state mutation

Validation:

- reducer tests prove adjusted charge cannot start before evade commit
- reducer tests prove no-choice legal evades auto-commit after notice
- reducer tests prove committed evader pose updates `game.units` or table-exit/loss hook state
- reducer tests prove roll history and replay context survive the new commit boundary

Manual acceptance:

- user confirms the branch flow: reaction, evade D6, no-choice notice/auto-commit or player choice, adjusted charge D6

Stop condition:

- stop if committing the evader would break replay-ready branch history or secondary-target snapshots

Expected result: P7A2 enforces the correct rule timing in canonical game state.

Progress 2026-05-23:

- `START_ADJUSTED_CHARGE_DISTANCE_ROLL` is now blocked until `evadeMove.status` is committed.
- Source-closed no-choice evades mutate `game.units` before adjusted charge distance.
- Supported final-overlap slide choices now require an explicit reducer action and mutate `game.units` before adjusted charge distance.
- Reducer tests cover commit gating, roll history, canonical evader movement, caught evader, and secondary-target behavior for the supported subset.

Still open before this card can close:

- Extend reducer action/state coverage from supported final-overlap slide choices to direction wheel, obstacle wheel, table exit, and light-troop end half-turn choices/hooks.
- Store source-locked table-exit/removal hooks before allowing adjusted charge distance for non-board-pose outcomes.
- Confirm replay history for choice-required and source-warning branches.

### [ ] P7A2-06 - Follow-Through From Committed Evader State (partial)

Goal: make adjusted charge follow-through consume the committed board state rather than a ghost override.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/state/p0-state.js
- src/state/p0-state.test.js

Implementation steps:
1. Update follow-through contact-state resolution to use the committed evader pose from `game.units` when present.
2. Keep backward-compatible test coverage for caught evader, not caught, earlier enemy contact, and friendly blocker outcomes.
3. Account for committed wheel/slide/end-half-turn/table-exit outcomes when deciding catch, stop, secondary target, or no-contact continuation.
4. Avoid double-applying `evadePlan.endPose` once the unit has already moved.
5. Keep the follow-through result replayable with declaration snapshot, committed evade snapshot, and adjusted charge roll.

Non-goals:

- no conformation candidate generation
- no combat factor calculation

Validation:

- focused follow-through tests
- reducer tests for caught and secondary-target branches after committed evade

Manual acceptance:

- user verifies that the charger chases the moved evader, not the old target token

Stop condition:

- stop if committed unit state and declaration snapshots disagree in a way that makes replay ambiguous

Expected result: adjusted charge continuation is built on the actual post-evade board.

Progress 2026-05-23:

- Follow-through contact state can use committed `evadeMove`/canonical unit state instead of only `evadePlan.endPose`.
- Existing caught, not-caught, and secondary-target reducer tests pass for the supported subset.

Still open before this card can close:

- Extend follow-through tests to committed slide, direction wheel, obstacle wheel, end-half-turn, and table-exit cases once those outcomes exist.
- Remove or further narrow legacy ghost fallback only after all supported committed outcomes are represented.

### [ ] P7A2-07 - Evade UI And Battlefield Rendering (partial)

Goal: show pending evade choices, committed evade movement, and the actual moved token clearly.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-battlefield.js
- src/ui/p0-battlefield.test.js
- src/styles/p0-battlefield.css or relevant panel stylesheet

Implementation steps:
1. Keep the current reorientation/corridor/end ghost for pending evade previews.
2. Add side-panel controls for slide, direction-wheel, obstacle-wheel, and end-half-turn choices only when reducer state requires them.
3. Show a concise notice for no-choice evades before auto-commit.
4. Add `Ausweichen bestaetigen` or equivalent commit action when a player choice or source warning requires confirmation.
5. After commit, render the real unit token at the new pose or table-exit/loss state and retain a subtle trail/diagnostic instead of relying on a ghost as canonical state.
6. Make blocked/source-open outcomes impossible to confirm as if legal.
7. Keep battlefield text minimal and put explanation in the command panel.

Non-goals:

- no landing/help page
- no conformation preview UI
- no animation requirement for the first pass

Validation:

- render tests for pending ghost, no-choice notice, choice buttons, committed token, table-exit state, and blocked state
- browser smoke for straight evade, slide evade, wheel evade, obstacle-wheel evade, table exit, and light-troop end half-turn

Manual acceptance:

- user performs hotseat checks for straight auto-commit, slide choice, wheel choice, obstacle wheel, table exit, light-troop end half-turn, blocked evade, and adjusted-charge button appearing only after commit

Stop condition:

- stop if the UI cannot distinguish preview from committed state without misleading the player

Expected result: the player can see and confirm the real evade before the charge continues.

Progress 2026-05-23:

- The command panel exposes the remaining initial-branch choices and the stepwise learning path for supported evade cases.
- The adjusted-charge button remains hidden until the chosen evade movement is committed.
- Command-panel render tests cover the slide-choice buttons.
- The battlefield now shows a dedicated hotseat handoff popup before those defender-side buttons become visible.

Progress 2026-05-24:

- After the defender handoff is acknowledged, the battlefield now renders reducer-owned evade candidate ghosts directly on the map instead of relying only on side-panel buttons.
- The battlefield candidate layer is generic over the supported candidate types: the current tests cover acknowledged slide-choice ghosts and wheel-style obstacle-wheel ghosts from the same candidate pipeline.
- Focused browser smoke on the shared page confirmed the real hotseat flow: the slide candidates appeared as battlefield ghosts after `OK`, clicking one committed the evader, and the adjusted-charge roll button appeared only afterwards.
- The all-targets-evade follow-through preview now also renders the mounted/foot minimum continuation as its own battlefield preview while the `Stop` versus `Continue` choice is still open, so the minimum path is no longer hidden behind the maximum-distance ghost.
- Queued next UI polish: strengthen the visual separation between `Continue` and `Stop` follow-through previews, preferably by either a stronger color split or a direct `2 UD` badge on the minimum line/ghost.

Still open before this card can close:

- Add battlefield rendering distinction for pending preview, pending choice, committed trail/token, source-open, and table-exit states.
- The current battlefield choice UX is click-on-ghost, not yet the full movement-style drag/handle interaction the user requested for slide and wheel selection.
- Add UI for direction wheel, obstacle wheel, table exit, and light-troop end half-turn once those reducer states exist.
- Next UI follow-up: separate the `Continue`/`Stop` battlefield preview more strongly, either by stronger color separation or by adding a direct `2 UD` badge on the minimum line/ghost.
- Complete browser smoke and user manual acceptance.

### [ ] P7A2-08 - Phase Flags And Future Hooks (partial)

Goal: store small rule consequences of evading without pulling in P8-P10 systems.

Planned files:

- src/state/p0-state.js
- src/state/p0-state.test.js
- src/engine/charge/model.js
- docs/rules/charge.md

Implementation steps:
1. Add a narrow unit or phase flag for `hasEvadedThisSequence` / cannot shoot after evading.
2. Add a repeat-evade count or event history hook so several evades in one phase can be represented later.
3. Add source-locked table-exit/removal hooks and defer only downstream army-cohesion/victory accounting to P10 if needed.
4. Keep P8 shooting and P10 rout/victory as consumers, not implementation dependencies.

Non-goals:

- no shooting UI changes beyond preserving a future flag
- no rout/victory resolution
- no army cohesion changes

Validation:

- reducer tests for flag persistence and reset boundaries if the reset boundary is already known

Manual acceptance:

- none unless a visible marker is added

Stop condition:

- stop if the phase reset timing is source-open and would risk corrupting later shooting behavior

Expected result: evading leaves the minimum durable state later systems need.

Progress 2026-05-23:

- Core auto-commit currently sets `hasEvadedThisSequence`, `cannotShootThisSequence`, and increments `evadeCountThisPhase` for the committed unit.

Still open before this card can close:

- Source-lock and test reset boundaries for cannot-shoot and repeated-evade flags.
- Add table-exit/removal hook state and defer only downstream P10 accounting.

### [ ] P7A2-09 - Validation, Browser Smoke, And Handoff

Goal: close P7A2 only after code, docs, and player flow agree.

Planned files:

- P7A2_todo.md
- roadmap.md
- P7B_todo.md
- relevant tests and docs touched by previous cards

Implementation steps:
1. Run focused charge/evade tests.
2. Run full `npm run test` and `npm run build`.
3. Run localhost browser smoke for straight no-choice evade, slide-choice evade, wheel evade, obstacle-wheel evade, table exit, light-troop end half-turn, blocked evade, caught evader, not caught, and first secondary target handoff where supported.
4. Update P7A2 completion notes, roadmap status, and P7B prerequisite status.
5. Stop for user manual acceptance with exact steps and expected results.

Non-goals:

- no P7B conformation implementation
- no PR/merge unless explicitly requested

Validation:

- focused tests green
- full tests green
- build green
- browser smoke documented

Manual acceptance:

- user confirms the P7A2 supported evade completion flow before P7B starts

Stop condition:

- stop if any supported flow still allows adjusted charge distance before the evader is committed

Expected result: P7B can start from a real post-evade board state.

## Next PM Brief For P7A2 Split 2

Exact goal: finish `P7A2-00` and then implement the remaining `P7A2-02` / `P7A2-04` slide-and-final-movement resolver slice without claiming wheel, table-exit, or light-troop completion.

Planned files:

- docs/rules/charge.md
- docs/rules/open-verification.md
- P7A2_todo.md
- src/engine/charge/evade.js
- src/engine/charge/evade.test.js
- src/state/p0-state.js
- src/state/p0-state.test.js
- src/ui/battlefield-command-panel.js only if reducer-owned choice controls are needed
- src/ui/p0-battlefield.js only if committed-vs-preview rendering must change for the slide slice

Scope split:

- Split 2A: source-lock the remaining slide-cost, choice-required, table-edge, light-troop, wheel, and cannot-shoot reset details into this board and open-verification notes.
- Split 2B: finish physical slide/block resolver for no blocker, one-side slide, both-side choice-required, and no-supported-slide blocked outcomes.
- Split 2C: commit final single-unit evade movement for the source-closed slide subset and keep all wheel/table-exit/light-troop outcomes explicitly source-open until their cards are implemented.

Validation commands:

- `node --test src/engine/charge/evade.test.js src/state/p0-state.test.js --test-name-pattern "evade|slide|blocked|adjusted charge"`
- `node --test src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js --test-name-pattern "evade|adjusted charge|slide|blocked"`
- `npm test`
- `npm run build`

Manual acceptance for current validated core slice:

1. Run `npm run dev -- --host 127.0.0.1`.
2. Open `http://127.0.0.1:5173/`.
3. Click `Neues Spiel`.
4. Click `Charge Drill`.
5. If the round dialog is visible, click `Beginnen`, then choose `Corps 1`.
6. Select the player-one front charger token near the lower-left lane.
7. Click `Charge`.
8. Select the enemy front target directly above it.
9. Click `Richtung bestaetigen`.
10. In the reaction dialog, click `Ausweichen`.
11. In the evade-distance D6 dialog, click a D6 result such as `6`.
12. Expected in the front-target Charge Drill with D6 `6`: the command panel offers only the remaining initial evade branch choices and does not show `Adjusted Charge wuerfeln` yet.
13. Click one initial evade branch choice.
14. Expected: the evader token/state commits to the chosen side before adjusted charge can proceed.
15. Expected for source-closed no-choice cases: the side panel eventually exposes `Adjusted Charge wuerfeln` only after committed evade state exists.
16. Click `Adjusted Charge wuerfeln` if visible.
17. Choose an adjusted-charge D6 result.
18. Expected: the charger follow-through corridor/ghost uses the moved evader state, not the original target pose.
19. Stop and report any case where `Adjusted Charge wuerfeln` appears before the evade token/state is committed.

Manual acceptance that is intentionally not claimable yet:

- Do not accept P7A2 as complete based on the current core slice.
- Do not treat direct-blocker slide choice, direction wheel, obstacle wheel, table exit, light-troop end half-turn, or browser-confirmed slide choice as done until their cards are implemented and tested.

Non-goals for Split 2:

- no P7B conformation implementation
- no melee, rout, pursuit, or army-cohesion accounting
- no tournament-complete evade claim
