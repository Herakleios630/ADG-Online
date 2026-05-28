# P7A2 TODO - Evade Move Completion Gate

Status: Complete - validated core, slide-choice, debug-trace, edge-clearance fixes, browser/manual acceptance, module-size gate closure, and final source-lock closeout are now complete. P7A2 is accepted and no longer blocks P7B.
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

Near-term follow-up requested 2026-05-24:

- After P7A2 closes, expand the Charge Drill from mostly cavalry/medium-infantry anchors into a deliberate troop-family coverage matrix for charge-reaction and evade testing: light infantry, cavalry, cavalry bow, heavy infantry, medium infantry, pike, elephants, and any other standard or special movement families that materially change charge reaction, evade, or follow-through behavior.
- Keep that fixture pass explicitly scenario-driven, not army-list-legal: the goal is representative rule coverage with stable IDs, readable labels, capability flags, and movement-family hooks, not a legal list builder proxy.
- Treat readable battlefield bases as a separate visual slice from the fixture/data expansion. Prefer a render-descriptor layer that keeps current reducer/geometry ownership intact while allowing later pre-rendered infantry and mounted base sprites from a pooled canvas or offscreen-canvas atlas.
- Preferred timing: do the scenario/data coverage slice immediately after P7A2 acceptance so P7B/P8 browser smokes can use richer anchors; do the base-readability render slice only after the current charge/evade/conformation UI surfaces stop changing every card.
- Detailed execution board: `CHARGE_DRILL_2_todo.md`.

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

Implementation update 2026-05-25 - decision trace and edge-clearance regression slice:

- Charge contact, charge reaction, evade planning, reducer preview state, and browser debug summaries now preserve structured `decisionTrace` / `contactDecisionTrace` data so live logs can explain why a path selected or rejected straight, slide, direction-wheel, obstacle-wheel, source-open, caught-evader, or secondary-target outcomes.
- Later path-avoidance now treats exact edge-clearance as legal clearance instead of interpenetration. The concrete Charge Drill sequence `charge-drill-p1-lane-blocker -> charge-drill-p2-earlier-contact` now commits unit 17 as `slide-left-1.000` around unit 18 instead of leaving the evader `source-open`.
- Adjusted charge follow-through after that committed slide now correctly distinguishes distance from logic: a normal adjusted roll stops short of unit 18, while a maximum adjusted roll exposes unit 18 as the pending secondary target.
- Direct-blocker clearance priority is preserved: when the obstacle is directly ahead after reorientation, supported slide clearance is preferred and the direction-wheel branch is not mixed into that initial direct-blocker branch.
- Selected avoidance candidates now apply an inherited light-troop end-half-turn hook to the selected final pose and regenerated path segments, so the replay hook and canonical unit rotation no longer disagree after a manual slide choice.
- Validation on 2026-05-25 is green: `npm test` passes 429/429, `npm run build` passes, and editor diagnostics are clean for the touched charge, reducer, and debug modules. Browser/manual acceptance remains open.
- Stewardship note: the implementation is not closure-ready on file size. Current worktree counts are `src/engine/charge/evade.js` 2831 lines, `src/state/p0-state.js` 3942 lines, and `src/ui/p0-battlefield.js` 2796 lines, all beyond the project guardrail. P7A2 now has a dedicated module-size refactor gate before acceptance unless the user explicitly approves an exception.

Planning update 2026-05-25 - support boards requested:

- `LOGGING_todo.md` now defines the general selective logging support slice: level filters plus rule-area filters such as `charge`, `reaction`, `evade`, `movement`, and `zoc`. Use it before the next browser investigation of unit 20, unit 21, or wheel snapping.
- `UNIT_CAPABILITIES_todo.md` now defines the profile-first unit capability data spine. New Charge Drill lanes should not add more normal-path per-unit capability hardcoding; they should consume source-shaped unit profiles first.
- `CHARGE_DRILL_2_todo.md` was tightened to depend on the unit profile/capability spine before broad fixture expansion.

LOG-05 manual debug update 2026-05-25:

- `docs/browser-automation.md` now has the exact manual LOG-05 checklist for unit 20 wrong evade path, unit 21 missing evade roll, and wheel snapping.
- Do not treat LOG-05 as a bug-fix card. After the user performs the three manual reproductions, classify each root cause from the filtered trace sequence before touching engine, reducer, UI, or capability data.

LOG-05 execution update 2026-05-25:

- The later live browser/debug session converted the LOG-05 checklist into actual root-cause captures for the active P7A2 defects.
- Unit 20 wrong evade path was classified as an engine-side evade-solver branch issue and was then fixed in the owning P7A2 slice.
- Unit 21 missing evade roll was first classified as a reducer/UI surfacing gap for a pending secondary request, then as a reducer requeue issue where the same secondary defender could be prompted again after recompute; both were fixed in the owning P7A2 slice.
- Wheel snapping did not reappear as a blocking P7A2 defect during the closeout session, but the retained LOG-05 runbook now pins the exact selectors, filtered areas, and trace order to use if the snap returns.

Implementation update 2026-05-26 - PM reconciliation and handoff test regression repair:

- `UNIT_CAPABILITIES_todo.md`, `CHARGE_DRILL_2_todo.md`, `roadmap.md`, and `P7B_todo.md` are now reconciled to the current support baseline: UCD0, CD2 fixture/data, and BVR-02 are treated as available support work, while future UCD canonical-definition/table work and BVR-03+ remain deferred.
- The P7A2 command-panel and battlefield handoff tests no longer depend on the live Charge Drill front lane accidentally producing a `choice-required` evade. That lane now resolves as source-open under the stricter final-overlap geometry, so the handoff UI coverage uses an explicit synthetic `choice-required` evade state instead of weakening the engine or distorting normal fixture footprints.
- No runtime engine/UI behavior changed in this repair; the change is test ownership and planning hygiene only.
- Validation on 2026-05-26 is green: focused P7A2/UI/profile regression set passes `315/315`, full `npm test` passes `478/478`, `npm run build` passes, and editor diagnostics are clean for the touched test and planning files.
- Browser/manual acceptance remains open because this repair did not run a fresh live browser smoke and P7A2 still has the module-size refactor gate open.

Implementation update 2026-05-26 - Light-troop drill footprint and visual-fill reconciliation:

- The live Charge Drill light-troop hook target no longer uses the stale hardcoded square footprint from the older fixture. Its drill data now carries a shallow rectangular `0.5 UD` target base instead of `1 UD` square geometry.
- The battlefield token highlight frame now follows the rendered base silhouette rather than the full token box, so selection and charge-target emphasis no longer redraw a misleading `1 UD x 1 UD` frame around the light-troop target.
- The visual resolver now stops applying the old `baseDepthHint: half` shrink pass to units that are already physically shallow (`depthUd <= 0.5`), which prevents the inner green fill from being reduced a second time after the fixture geometry fix.
- Validation on 2026-05-26 is green for the visual/data follow-up: focused data/UI tests pass `68/68`, full `npm test` passes `478/478`, `npm run build` passes, and a live browser DOM check confirmed the light-troop hook target renders at `0.5 UD` token height with the corrected inner fill behavior.
- P7A2 still remains open pending explicit user manual acceptance of the refreshed browser smoke; this visual reconciliation does not unblock P7B by itself.

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

- For the current supported P7A2 subset, all broader timing, wheel-baseline, adjusted-distance, and table-exit source questions now have a working implementation baseline and no longer control this card.
- The only remaining direct closeout item inside `P7A2-00` is `charge.light-troop-end-half-turn-family-boundary`: confirm the exact `light troops` family wording for the free end-of-evade half-turn before collapsing the hook into a broader capability claim.
- Exact reset timing for cannot-shoot and repeated-evade phase flags is still open, but that source-lock question now belongs to `P7A2-08`, not this card.

## Execution Cards

Card status convention after the 2026-05-23 correction:

- `[x]` means every listed implementation step, validation item, manual acceptance item, and stop condition for that card is satisfied.
- `[ ] ... (partial)` means useful code or documentation exists, but the card remains open and must not be treated as accepted.
- P7A2 is not complete until P7A2-09 is complete and user manual acceptance is recorded.

### [x] P7A2-00 - Source Lock And Branch Contract

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

Progress 2026-05-24:

- Re-aligned `docs/rules/charge.md` with the current RV2-05A source-lock baseline instead of leaving it as a generic P7 planning note.
- Tightened `docs/rules/open-verification.md` so the remaining P7A2-00 risk is explicit: exact `light troops` family wording for the free end-half-turn. The separate after-evade reset-timing question is tracked under `P7A2-08`.
- Current implementation and drill validation now match the source-locked baseline for ordered `reaction -> committed evade move -> adjusted charge distance`, inherited wheel baseline, and immediate table-exit removal with deferred P10 accounting.

Progress 2026-05-26:

- The source-lock tail for the current supported P7A2 subset is now narrow and explicit. The only remaining direct errata/source blocker still owned by this card is `charge.light-troop-end-half-turn-family-boundary` in `docs/rules/open-verification.md`.
- Treat that entry as the active P7A2-00 closeout scope. Other broader charge/open-verification items may still matter to later phases, but they are no longer the controlling blocker for the current supported evade-completion subset.

Closeout 2026-05-26:

- Direct 300-DPI scan review now closes the remaining family-boundary question. The evade page states `Light troops can perform an additional free half-turn at the end of their evade move`, with no narrower carve-out, and the maintained troop-category/movement corpus already binds `light troops` to the normal `LI` plus `LH` subset.
- With that source-lock tail closed, this card is complete for the supported P7A2 subset.

Still open before this card can close:

- none for the current supported P7A2 subset.

### [x] P7A2-01 - Evade Commit Model

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

Progress 2026-05-25:

- The model/state spine now carries decision traces for reaction requests, evade move resolutions, and initial charge previews without breaking serialization or existing model tests.
- Choice identifiers now cover the current generic candidate pipeline, including replay-safe slide, direction-wheel, obstacle-wheel, chained path, table-exit, and light-troop hook metadata in the supported subset.

Closeout 2026-05-26:

- The model/state spine now preserves explicit replay-safe choice identifiers and metadata for the supported initial branch, direction wheel, obstacle wheel, table exit, chained paths, and light-troop end-half-turn hook.
- Focused model and downstream state/UI tests are green on the current workspace baseline, so this card is satisfied for the supported P7A2 subset.

### [x] P7A2-02 - Slide And Block Solver

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

Progress 2026-05-25:

- Later path-avoidance now carries the sampled overlap blocker IDs through boundary refinement, so simultaneous blockers are not lost when the legal encounter pose is moved back to the last clear point.
- Exact edge-clear slides now use the same small footprint tolerance as path sampling; a `1 UD` slide that places the evader exactly beside the blocker is legal instead of being rejected as `intermediate-overlap`.
- Focused engine coverage now locks this regression with a one-blocker edge-clear slide test and refreshed direction-wheel/later-slide fixtures that avoid the direct-blocker branch.

Still open before this card can close:

- none for the current supported P7A2 subset.

Closeout 2026-05-26:

- The old board tail here is now stale prose rather than a live implementation gap. The supported no-direction branch already auto-selects the best legal non-wheel candidate inside one initial branch instead of surfacing obsolete left/right micro-choices, and the reducer/UI path only exposes explicit choice UI when the solver still returns a real `choice-required` result.
- Coverage now spans the controlling cases this card claimed as still open: engine tests lock slide-distance deduction and blocked final-overlap outcomes, reducer tests cover committed slide-choice and no-choice auto-commit before adjusted charge distance, and the broader Charge Drill fixture matrix now includes dedicated evade-blocked-by-ZoC and evade-blocked-by-simple-blockers lanes for the current subset.
- Any broader future rendering/UX polish belongs under later cards, not as a remaining blocker for this slide/block solver card.

### [x] P7A2-03 - Direction Wheel And Obstacle Wheel Solver

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

Progress 2026-05-25:

- Direct-blocker priority was re-asserted while preserving the direction-wheel/later-slide branch elsewhere: direct blockers now stay in the direct slide/obstacle-wheel branch, while separate fixtures still prove `direction-wheel -> later slide` and simultaneous later-blocker IDs.
- The direction-wheel/later-slide and refined-slide tests were updated to reflect exact edge-touch clearance and to avoid relying on a stale direct-blocker fixture for wheel behavior.

Still open before this card can close:

- none for the current supported P7A2 subset.

Closeout 2026-05-26:

- The supported P7A2 subset now has source-backed direction-wheel and obstacle-wheel results all the way through engine, reducer, and battlefield rendering. Optional direction-wheel, stable obstacle-wheel, chained `direction-wheel -> later slide`, and later multi-wheel paths all exist with replay-safe candidate IDs, committed final poses, and focused tests.
- The two old open bullets here are broader future-slice language rather than blocking defects in the current approved subset. Wider blocked/source-open breadth and richer battlefield-native gesture UX can remain follow-up polish without keeping this card open.

### [x] P7A2-04 - Evade Movement Resolver

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
- Table-edge evade exits now produce committed removal hooks: the evader is removed from `game.units` before adjusted charge distance and the P10 army-cohesion/victory accounting hook is preserved in serializable state.
- Light-troop end half-turn is now represented as an applied replay hook for explicit light-troop families in the isolated single-unit evade plan.
- `evadePlan` and committed `evadeMove` now also preserve replay-safe `pathSegments` for the resolved evade path itself, including supported avoidance steps, the remaining straight segment, and a zero-distance end-half-turn segment when that hook is applied.
- Source-open final overlap still blocks commit.

Progress 2026-05-25:

- The reported `unit 2 -> unit 17` Charge Drill path now resolves as a committed later slide around unit 18 instead of an unresolved `source-open` result.
- Selecting an avoidance candidate now rebuilds path segments after applying an inherited light-troop end-half-turn hook, so selected slide choices can still end with the correct post-evade facing.
- Decision traces now log the path-avoidance encounter, slide-side evaluation, reject/accept reasons, recursion, and final resolution, making future browser-only path mismatches inspectable from debug logs rather than screenshots alone.

Review delta 2026-05-24:

- The current solver still conflates two different rule timings in some overlap cases. Direct-blocker clearance less than `1 UD` after reorientation is an initial obstacle-clearance case, but a friendly/enemy obstacle encountered only during the actual evade move must be handled later in the move with the minimum necessary slide or wheel geometry and the corresponding distance deduction.
- The current `final-overlap` clearance path still builds that case as `initial slide -> remaining straight move` from the reoriented pose, which does not match the printed `straight evade move -> later obstacle avoidance if encountered` order.
- The current derived `pathSegments` model also assumes avoidance steps happen before the final straight segment, so this bug is not only a rendering issue; it is a chronology/model issue in the supported evade resolver.

Closeout 2026-05-26:

- Focused engine validation now confirms the late-overlap chronology in both replay path segments and generic candidate metadata. The final-overlap slide path remains `evade-straight -> evade-slide -> evade-straight`, and the candidate `intermediatePose` now matches the later slide step instead of incorrectly pointing at the final end pose.
- This retires the old chronology blocker from the current supported subset. Remaining open work for P7A2 now sits in the source-lock tail and adjacent coverage cards, not in a separate final-movement-resolver defect.

### [x] P7A2-05 - Reducer Commit Boundary

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
- Table-exit evades now commit as removal from `game.units` and unlock adjusted charge distance with the deferred P10 accounting hook preserved on `evadeMove.tableExit`.
- Evade move resolutions now preserve the light-troop end-half-turn hook metadata for replay and later UI explanation.

Progress 2026-05-25:

- Choice-required light-troop evades now commit the selected avoidance candidate with the same end-half-turn hook consistency as auto-commit paths.
- Reducer coverage now includes the concrete Charge Drill `unit 17` slide and verifies that adjusted charge remains blocked until the evader is committed, then can expose unit 18 as a secondary target when the adjusted charge distance is sufficient.

Closeout 2026-05-26:

- The reducer-owned commit boundary is now exercised through supported no-choice, slide-choice, table-exit, and light-troop hook paths, and manual/browser acceptance confirmed that adjusted charge does not unlock before the evader is committed.
- Future variants that would make the end-half-turn player-selectable are outside the current supported subset and do not block this card.

Closeout addendum 2026-05-26:

- Canceling a charge after one or more committed evades now restores `game.units` from a reducer-owned pre-evade snapshot carried inside `chargePreview`, instead of leaving evaders and temporary evade flags stranded on the battlefield.
- Focused coverage now proves the rollback on a real committed-evade path: after the evader is moved and flagged, `CANCEL_CHARGE_PREVIEW` restores the original unit pose and clears the temporary evade markers by restoring the pre-charge unit snapshot.

### [x] P7A2-06 - Follow-Through From Committed Evader State

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

Progress 2026-05-25:

- The committed unit-17 slide is now covered through adjusted charge follow-through: the no-contact outcome for a normal adjusted roll and the unit-18 secondary-target outcome for a maximum adjusted roll are both understood as distance-dependent, not queue/index failure.
- Contact-state decision traces now preserve ordered contact-event reasoning, including the cases that return a later earlier-enemy sequence rather than only the terminal first result.

Still open before this card can close:

- none for the current supported P7A2 subset.

Closeout 2026-05-26:

- The supported follow-through slice now consumes committed evade state rather than relying on a ghost-only override. Caught-evader, no-contact continuation, friendly-blocker, secondary-target pause, secondary reaction reanchor, reused adjusted charge distance, and the committed unit-17 slide -> unit-18 exposure path are all covered through the owning engine/state/UI tests.
- The older open bullets are now future hardening ideas, not remaining blockers for the accepted subset. Legacy fallback behavior is already narrow, and the supported committed outcomes that currently exist are represented in follow-through logic and tests.

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
- The follow-through preview now separates `Stop` from `Continue` more explicitly on the battlefield: the minimum path/ghost uses a stronger highlighted style and the stop endpoint carries a direct `Stop 2 UD` badge for the current supported minimum continuation case.
- Focused validation for this narrow UI slice is editor-clean (`src/ui/p0-battlefield.js`, `src/styles/p0-battlefield.css`, `src/ui/p0-battlefield.test.js`), and the focused render test was updated for the new minimum badge; executable Node test replay remains blocked in the current shell because `node` is not on `PATH`.
- A first live `perf=1` browser probe now records reducer and render timings into `window.__ADG_PERF_LOG__`, which already shows the broad post-reaction slowdown leaning render-side rather than solver-side for the observed large-window stall.
- The battlefield now suppresses full enemy-ZOC band rendering once the charge flow has moved from early preview (`targeting`/`manoeuvre-selecting`/`ready`) into the reaction and evade-distance branch states, so the large-window evade dialog no longer stacks `all enemy ZOC + branch overlays` at the same time.
- A proper modular debug channel now exists for future investigations: `?debug=1` / `?perf=1` enables browser action/error/long-task logging, the Vite debug middleware writes JSONL entries into `logs/adg-debug-current.jsonl`, and the browser exposes `window.__ADG_DEBUG__` plus in-memory log mirrors for live inspection.
- Testing the current charge/evade case with that log channel shifted the primary hotspot from overlay paint to reducer/engine work: `game/start-charge-preview` was captured at about 14.2 seconds reducer time for `charge-drill-p1-wheel-charger`, while render was only about 70 ms; `game/set-charge-target` also showed about 1.2 seconds reducer time.
- The next performance fix should target `getChargeTargetCandidates` / charge feasibility evaluation before more CSS work: the current declaration solver eagerly evaluates full path feasibility for all enemy candidates with slide/wheel/advance/ZOC sampling during `START_CHARGE_PREVIEW`.
- OOM stability fix: generated/raw OCR source artefacts under `docs/source/new scan/` and `docs/source/rules-v2-examples/` are now excluded from Git/Vite watcher churn, removing about 1 GB of local PDFs/PNGs from normal status/diff scans; the browser debug logger also caps smaller in-memory rings, throttles long-task logging, avoids synchronous action logging, and keeps full console logging behind explicit `debugConsole=1` opt-in.
- Focused validation for the OOM fix is green: debug-log plugin tests, charge declaration tests, direct charge-preview benchmarks, and `npm run build`; the broader `npm test` run still has two unrelated dirty-worktree assertions open in round-popup and finished-unit UI tests.
- Charge/evade lag fix: broad charge targeting stays range/deferred, target click no longer runs eager all-family feasibility before the player has chosen a start manoeuvre, straight advance feasibility samples the full accepted guide once instead of sweeping 0.1 UD candidate distances, and final-overlap evade slides now start from computed minimum clearance instead of scanning every simple slide step.
- Current focused performance validation: steady reducer timing for the front drill target click is about 8.7 ms average after warmup, and the front drill evade-distance roll is about 4.1 ms average after warmup; live `?perf=1` smoke recorded `game/start-charge-preview` at about 2.2 ms reducer / 8.5 ms render, `game/set-charge-target` at about 22.3 ms reducer / 8.6 ms render on the first browser pass, and `game/resolve-charge-branch-distance` at about 10.7 ms reducer / 8.8 ms render with no console-debug spam and heap around 28-33 MB.
- Focused validation after the lag fix is back to the known dirty-worktree baseline: charge declaration, evade, state, battlefield, and command-panel tests have only the two unrelated pre-existing assertions open; `npm run build` is green.
- Table-exit and light-troop hook slice: isolated evades now convert table-edge exits into committed removal hooks with deferred P10 accounting metadata, and explicit light-troop families receive an applied end-half-turn hook on the final evade pose. Focused tests for evade/model/state pass except the known unrelated round-popup assertion; `npm run build` is green.
- Focused live browser smoke now covers the new committed UI states as rendered states, not only test HTML: the battlefield badge and command-panel helper copy both appeared for `table-exit` (`Exit table`, `Nordkante`, deferred `P10` hook text) and for the applied light-troop end-half-turn (`LT half-turn`, `Light-Troop-End-Half-Turn`, shooting-lock text).
- The battlefield evade preview now consumes the reducer-owned evade `pathSegments` trail instead of rebuilding the preview from one synthetic straight corridor only. Focused battlefield tests now cover an explicit multi-segment preview with separate `evade-slide` and `evade-straight` trail markers, while the focused render run still only hits the known unrelated finished-unit UI baseline failure.

Progress 2026-05-25:

- Browser debug summaries now include `evadeDecisionTrace`, `contactDecisionTrace`, summarized ordered contact events, and per-reaction decision traces. This gives the next live reproduction of unit 20 or unit 19/21 enough solver evidence to tell stale UI from an actual engine branch.
- Render tests have been updated to the current generic candidate IDs and exact edge-clearance distances, and the full battlefield UI render file is green again.

Still open before this card can close:

- The current battlefield choice UX is click-on-ghost, not yet the full movement-style drag/handle interaction the user requested for slide and wheel selection.
- The supported renderer/UI subset is implemented and manually accepted, but richer explanation polish for wheel-specific and source-open cases is still open if this card is kept broader than the current accepted subset.

Review 2026-05-24:

- No additional P7A2 card can be marked `[x]` honestly yet. The remaining blockers are not missing implementation for table-exit/P10-hook state anymore; they are manual acceptance, broader source-open rendering polish, and direct source-lock confirmation boundaries.
- Pending preview, acknowledged choice ghosts, committed trail rendering, table-exit badge state, and light-troop end-half-turn badge/helper copy are all now implemented and test-backed; the open rendering work is narrower than the older generic bullets suggest.

### [x] P7A2-08 - Phase Flags And Future Hooks

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

Progress 2026-05-24:

- `ROUND_BEGIN` now clears `hasEvadedThisSequence`, `cannotShootThisSequence`, and `evadeCountThisPhase` for the active player's units only, giving P7A2 a conservative reducer boundary instead of leaving the flags sticky across later turns.
- Focused reducer coverage now proves both sides of that boundary: a committed evader keeps the flags until its own next round start, and the non-active player's units are not cleared at the same time.

Progress 2026-05-25:

- The after-evade flag tests now follow the explicit choice-required light-troop path before checking reset behavior, so the hook coverage remains valid after the solver stopped auto-committing that branch.

Closeout 2026-05-26:

- The implementation side of this card is now effectively complete for the supported P7A2 subset: hook fields, reducer persistence, repeated-evade counters, and deferred P10 table-exit accounting all exist and are covered.
- Collaborative rule review on 2026-05-26 now closes the remaining reset-timing question for the current project baseline: `same sequence` means the evader misses only the immediately following shooting phase in that player sequence, and the existing reset at that player's next `ROUND_BEGIN` is therefore the correct boundary for the next own sequence.

Still open before this card can close:

- none for the current supported P7A2 subset.

### [x] P7A2-09 - Validation, Browser Smoke, And Handoff

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

Progress 2026-05-24:

- Focused UI tests for the committed evade helper/badge slice are green; only the known unrelated finished-unit battlefield assertion remains in the targeted UI run.
- `npm run build` remains green after the committed `table-exit` / `LT half-turn` rendering changes.
- Localhost browser smoke now directly verifies the user-facing committed render states for `table-exit` and applied light-troop end half-turn in the real app renderer, including both battlefield badges and command-panel helper copy.
- Additional localhost browser smoke now covers live blocked-evade and follow-through states in the real app renderer: the blocked-evade reaction overlay exposes `Ausweichen blockiert` with only the `blocked-no-evade` handoff, the secondary-target pause shows the `Sekundaerziel-Reaktion` overlay plus the paused next-reaction helper copy, the caught-evader state shows the `Rear-Attack` / `1 Cohesion Loss` helper path with the `Evader caught` follow-through status, and the non-caught adjusted-charge continuation renders both the maximum and minimum follow-through corridors with the visible `Stop 2 UD` marker.
- Additional localhost browser renderer smoke now covers the generic wheel-choice UI states that were already test-backed in P7A2-07: `obstacle-wheel` candidates render as live evade ghosts with selectable command-panel actions, and chained `direction-wheel-slide` candidates render with their trail/handle nodes plus the corresponding panel labels. This is still renderer-level smoke for the supported reducer-owned choice states, not a claim that every wheel path is already exercised through one full manual Charge Drill click-through.
- Additional localhost browser smoke now covers the secondary-target-evades branch in the real app renderer: after the first follow-through pause, choosing `Sekundaerziel Test 4` to evade opens the `Ausweichdistanz bestimmen` D6 overlay with the expected six deterministic die buttons.
- Reducer scan plus localhost browser smoke now identify and verify at least one real Charge Drill no-choice/auto-commit evade path in the existing fixture: `charge-drill-p1-double-blocker` into `charge-drill-p2-double-blocker` reaches `evadeMove.status = committed` with `autoCommit = true`, shows no defender choice buttons, and exposes `Adjusted Charge wuerfeln` immediately after the committed evade notice.
- The Charge Drill now also contains two explicit manual anchors for the previously renderer-only special cases: `charge-drill-p1-table-exit-charger` into `charge-drill-p2-table-exit-target` reproduces a front-charge evade that turns north and exits over the north edge, and `charge-drill-p1-light-troop-hook-charger` into `charge-drill-p2-light-troop-hook-target` reproduces a committed light-troop evade with the end-half-turn hook applied after the move.
- Validation status on 2026-05-24 is now explicit: focused P7A2 UI tests remain at the known single unrelated finished-unit assertion, and full `npm test` remains at the known dirty-worktree baseline of 413 passing / 2 failing (`round begin opens corps selection...` in reducer state tests and `a finished selected unit remains selectable...` in battlefield UI tests).
- This narrows the browser-validation gap for P7A2-07/P7A2-09, but it does not close P7A2-09 yet because broad supported-flow smoke and user manual acceptance remain open.

Progress 2026-05-25:

- The previous dirty-worktree validation baseline is resolved for the current workspace state: `npm test` now passes 429/429 and `npm run build` passes after the decision-trace, edge-clearance, unit-17/18, and selected light-troop hook fixes.
- Editor diagnostics are clean for the touched charge engine, reducer, model, reaction/contact, and browser debug logger files.
- P7A2-09 remains open because broad supported browser smoke, user manual acceptance, and the new module-size refactor gate are still required before P7A2 can be accepted or used to unblock P7B.

Progress 2026-05-26:

- The module-size gate prerequisite is now satisfied for the main reducer split: `src/state/p0-state.js` is down to 986 lines after the validated helper extractions and shared corps-slot cleanup.
- Current full validation is green on the refactored workspace state: `npm test` passes 478/478, focused `node --test src/state/p0-state.test.js` remains green at 156/156, and `npm run build` passes.
- Current localhost browser smoke on the refactored workspace state confirms the live app still mounts and the key supported evade surfaces still render in the real UI: the front lane reaches the may-evade pause with `Ausweichen` / `Nicht ausweichen`, the blocked blocker lane shows `Ausweichen blockiert`, the table-exit lane shows the committed `EXIT TABLE` state before adjusted charge, and the light-troop hook lane shows the committed `LT HALF-TURN` state before adjusted charge.
- P7A2-09 still remains open because user manual acceptance is still pending; do not start P7B until that acceptance is recorded.

Progress 2026-05-26 - manual acceptance recorded:

- The user confirmed the refreshed browser smoke with `visual smoke ok` after the light-troop drill footprint and visual-fill reconciliation.
- The supported live browser anchors for the current P7A2 subset are now manually accepted: the light-troop hook lane renders with the corrected shallow base fill, and the earlier live smoke already covered may-evade pause, blocked evade, committed table exit, and committed light-troop end half-turn states.
- Full validation remains green at `npm test` `478/478` plus `npm run build` green.
- `P7A2-09` is now satisfied. P7A2 as a whole still remains blocked by `P7A2-10` and any explicitly open source-lock follow-up, so this acceptance does not start P7B yet.

Manual acceptance:

- user confirmed the refreshed supported browser smoke on 2026-05-26 with `visual smoke ok`

Stop condition:

- stop if any supported flow still allows adjusted charge distance before the evader is committed

Expected result: P7B can start from a real post-evade board state.

### [x] P7A2-10 - Module Size Refactor Gate

Goal: bring the oversized P7A2 charge/evade modules back under the project size guardrail, or stop for an explicit user-approved exception with a written refactor plan.

Planned files:

- src/engine/charge/evade.js
- src/engine/charge/evade-path.js or equivalent extracted path/avoidance helper module
- src/engine/charge/evade-hooks.js or equivalent extracted table-exit/light-troop hook module
- src/state/p0-state.js
- src/state/p0-charge-reducer.js or equivalent extracted charge reducer helper module
- src/ui/p0-battlefield.js
- src/ui/p0-battlefield-evade-overlays.js or equivalent extracted render helper module
- relevant tests already covering behavior

Implementation steps:
1. Split `src/engine/charge/evade.js` by rule responsibility: data/model constants, path segments, later path-avoidance solver, table-exit/light-troop hooks, and public resolver entrypoints.
2. Split `src/state/p0-state.js` by reducer responsibility so charge/evade preview, evade commit, adjusted charge follow-through, and secondary reaction queue helpers are not buried in the monolithic root reducer.
3. Split `src/ui/p0-battlefield.js` by render surface so evade preview/choice/committed overlays and follow-through overlays live outside the main battlefield renderer.
4. Preserve public imports and serializable state shape; this card should be behavior-neutral.
5. Run focused charge/evade engine, reducer, and UI tests after each split, then full `npm test` and `npm run build`.
6. Recheck line counts and record the final counts here.

Non-goals:

- no new charge/evade rules
- no UI behavior changes
- no conformation or P7B work
- no broad cleanup of unrelated movement/setup modules

Validation:

- extracted modules stay under the project 800-line target where practical and under 1000 lines unless explicitly approved
- `node --test src/engine/charge/evade.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js`
- `npm test`
- `npm run build`
- editor diagnostics on touched files

Manual acceptance:

- none unless browser behavior changes unexpectedly during the neutral split

Stop condition:

- stop if the split requires changing legal behavior or replay/state contracts; fix the extraction plan before proceeding

Expected result: P7A2 can close without violating the repository module-size discipline.

Progress 2026-05-25:

- Guardrail check after the validated debug/edge-clearance slice: `src/engine/charge/evade.js` is 2831 lines (`HEAD` 1991, delta +840), `src/state/p0-state.js` is 3942 lines (`HEAD` 3784, delta +158), `src/ui/p0-battlefield.js` is 2796 lines (`HEAD` 2512, delta +284), and `src/data/charge-drill-scenarios.js` is 650 lines.
- P7A2 should not be marked accepted while those oversized files remain over 1000 lines without explicit user approval and a refactor plan.

Progress 2026-05-26:

- Behavior-neutral UI refactor slice completed for `src/ui/p0-battlefield.js`: evade overlays, shared render helpers, setup side panels, setup world renderers, command/ZOC overlays, dialog rendering, debug surface overlays, and unit visual rendering now live in focused helper modules under `src/ui/`.
- Current measured guardrail counts after the validated UI split: `src/engine/charge/evade.js` is 2605 lines, `src/state/p0-state.js` is 3520 lines, and `src/ui/p0-battlefield.js` is 996 lines. This closes the battlefield renderer sub-gate, but `P7A2-10` remains open until `evade.js` and `p0-state.js` are also brought under the repository limit or an explicit exception is approved.
- Focused validation after the UI split is green: `node --test src/ui/p0-battlefield.test.js` and the broader P7A2 slice (`src/engine/charge/classification.test.js src/engine/charge/contact.test.js src/engine/charge/declaration.test.js src/engine/charge/evade.test.js src/engine/charge/model.test.js src/engine/charge/path.test.js src/engine/charge/reaction.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js src/data/charge-drill-scenarios.test.js src/data/unit-profiles.test.js src/data/battlefield-profiles.test.js`) pass at `360/360`, and `npm run build` is green.
- Behavior-neutral engine refactor slice completed for `src/engine/charge/evade.js`: model/state factories, geometry/diagnostic helpers, and solver/path-avoidance helpers now live in `src/engine/charge/evade-model.js`, `src/engine/charge/evade-geometry.js`, and `src/engine/charge/evade-solver.js`, while `evade.js` remains the public facade at 619 lines.
- First behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: evade plan resolution and evade-choice frontier helpers now live in `src/state/p0-charge-evade-helpers.js`, reducing `src/state/p0-state.js` to 3766 lines. The reducer file remains a blocker for this card, but the extracted slice is validated and preserves reducer-owned behavior.
- Second behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: adjusted-charge follow-through planning, latest adjusted-roll lookup, and secondary-target reaction queue helpers now live in `src/state/p0-charge-follow-through-helpers.js`, reducing `src/state/p0-state.js` to 3570 lines. The reducer file remains far above the guardrail, but the extracted follow-through slice is validated and preserves reducer-owned behavior.
- Third behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: branch-distance claim/result helpers, secondary-target reanchor helpers, evade-choice handoff helpers, and the pure charge-preview/contact-side helpers now live in `src/state/p0-charge-branch-helpers.js` and `src/state/p0-charge-preview-helpers.js`, reducing `src/state/p0-state.js` to 3301 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.
- Fourth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: evade move commit/choice-path state helpers and the adjusted-charge / evade-choice / continuation reducer block now live in `src/state/p0-evade-move-state-helpers.js` and `src/state/p0-charge-choice-reducers.js`, reducing `src/state/p0-state.js` to 3084 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.
- Fifth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the full charge preview reducer cluster and the charge reaction / branch-distance reducer cluster now live in `src/state/p0-charge-preview-reducers.js` and `src/state/p0-charge-reaction-reducers.js`, reducing `src/state/p0-state.js` to 2484 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.
- Sixth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the commander attachment/free-move helper layer and the commander preview/attach/confirm reducer block now live in `src/state/p0-commander-helpers.js` and `src/state/p0-commander-reducers.js`, reducing `src/state/p0-state.js` to 1915 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.

Progress 2026-05-26 - gate closure:

- Current measured guardrail counts in the workspace now satisfy the repository limit: `src/engine/charge/evade.js` is 573 lines, `src/state/p0-state.js` is 876 lines, and `src/ui/p0-battlefield.js` is 996 lines.
- Focused validation remains green after the final reducer splits and later light-troop render/data reconciliation: `node --test src/data/unit-profiles.test.js src/ui/p0-battlefield.test.js` passes `68/68`, full `npm test` passes `478/478`, and `npm run build` passes.
- `P7A2-10` is now satisfied. The phase is no longer blocked on module size.
- Closeout audit 2026-05-26: refreshed browser/manual acceptance, module-size closure, and the final two source-lock confirmations are now recorded. P7A2 is formally closable and accepted for the supported subset.
- Seventh behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the commander free-move reset path and the unit stay reducer block are now split out into `src/state/p0-commander-helpers.js`, `src/state/p0-commander-reducers.js`, and `src/state/p0-movement-stay-reducers.js`, reducing `src/state/p0-state.js` to 1791 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.
- Eighth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the reset-test-units reducer path, direct-battle fixture builders, initial-state/settings helpers, and movement-ui helper block now live in `src/state/p0-reset-reducers.js`, `src/state/p0-fixtures.js`, `src/state/p0-state-initializers.js`, and `src/state/p0-state-ui-helpers.js`, reducing `src/state/p0-state.js` to 1367 lines. The reducer file still remains a blocker for this card, but the extracted slices are validated and preserve reducer-owned behavior.
- Ninth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the remaining charge intent, charge target snapshot, and charge-preview availability helpers now live in `src/state/p0-charge-state-helpers.js`, reducing `src/state/p0-state.js` further while preserving the reducer wiring through the existing dependency injection points.
- Tenth behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: the scenario setup builder, battle-start game-state builder, and initial app-state builder now live in `src/state/p0-battle-start.js`, further reducing `src/state/p0-state.js` while preserving the public `createInitialAppState` export through `src/state/p0-state.js`.
- Eleventh behavior-neutral reducer refactor slice completed for `src/state/p0-state.js`: shell/settings reducers, battlefield viewport sanitization, overlay cycling, and active-corps selection cleanup now live in `src/state/p0-shell-reducers.js`, reducing `src/state/p0-state.js` to 986 lines and bringing the file back under the 1000-line refactor gate for this card.
- Focused post-split validation is green: `node --test src/engine/charge/evade.test.js` passes at `39/39`, and `node --test src/state/p0-state.test.js` passes at `156/156` after the first `p0-state.js` extraction.
- Focused post-split validation remains green after the second reducer slice: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-charge-evade-helpers.js`, and `src/state/p0-charge-follow-through-helpers.js`.
- Focused post-split validation remains green after the branch and preview slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-charge-branch-helpers.js`, `src/state/p0-charge-preview-helpers.js`, `src/state/p0-charge-evade-helpers.js`, and `src/state/p0-charge-follow-through-helpers.js`.
- Focused post-split validation remains green after the evade-move and choice-reducer slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-charge-choice-reducers.js`, `src/state/p0-evade-move-state-helpers.js`, `src/state/p0-charge-branch-helpers.js`, `src/state/p0-charge-preview-helpers.js`, `src/state/p0-charge-evade-helpers.js`, and `src/state/p0-charge-follow-through-helpers.js`.
- Focused post-split validation remains green after the charge preview and charge reaction reducer slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-charge-preview-reducers.js`, `src/state/p0-charge-reaction-reducers.js`, `src/state/p0-charge-choice-reducers.js`, `src/state/p0-evade-move-state-helpers.js`, `src/state/p0-charge-branch-helpers.js`, `src/state/p0-charge-preview-helpers.js`, `src/state/p0-charge-evade-helpers.js`, and `src/state/p0-charge-follow-through-helpers.js`.
- Focused post-split validation remains green after the commander helper and commander reducer slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-commander-helpers.js`, and `src/state/p0-commander-reducers.js`.
- Focused post-split validation remains green after the commander reset and stay slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-commander-helpers.js`, `src/state/p0-commander-reducers.js`, and `src/state/p0-movement-stay-reducers.js`.
- Focused post-split validation remains green after the reset, fixture, initializer, and state-ui helper slices: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js`, `src/state/p0-reset-reducers.js`, `src/state/p0-fixtures.js`, `src/state/p0-state-initializers.js`, and `src/state/p0-state-ui-helpers.js`.
- Focused post-split validation remains green after the charge state helper slice: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js` and `src/state/p0-charge-state-helpers.js`.
- Focused post-split validation remains green after the battle-start extraction: `node --test src/state/p0-state.test.js` passes at `156/156`, and editor diagnostics are clean for `src/state/p0-state.js` and `src/state/p0-battle-start.js`.
- Focused post-split validation remains green after the shell reducer extraction: `node --test src/state/p0-state.test.js` passes at `156/156`, editor diagnostics are clean for `src/state/p0-state.js` and `src/state/p0-shell-reducers.js`, and the current measured sizes are `p0-state.js = 986` and `p0-shell-reducers.js = 233`.
- Follow-up cleanup remained behavior-neutral after the size-gate work: duplicated `toCorpsSlotId` logic across the state slice now routes through `src/state/p0-corps-slot.js`, and `node --test src/state/p0-state.test.js` remains green at `156/156`.

## Archived PM Brief For Earlier Split 2

Status note 2026-05-26: this brief is now historical only. The implementation, browser smoke, and module-size work it described have already been completed. Do not use this section as the current execution target; use the closeout audit above and the still-open card bullets in `P7A2-00` through `P7A2-08` instead.

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
17. Manual table-exit anchor: select `P1 Table Exit Charger`, start `Charge`, target `P2 Table Exit Target`, confirm direction, choose `Ausweichen`, then choose D6 `6`.
18. Expected: because the defender starts with its rear toward the north edge, the free evade half-turn points it north, the evade auto-commits without a player path choice, the unit leaves the table over the north edge, and `Adjusted Charge wuerfeln` becomes visible afterwards.
19. Manual light-troop half-turn anchor: select `P1 Light Troop Hook Charger`, start `Charge`, target `P2 Light Troop Half-Turn Target`, confirm direction, choose `Ausweichen`, then choose D6 `4`.
20. Expected: the evade auto-commits without a player path choice, the target remains on table, finishes the evade facing back south because the light-troop end-half-turn hook is applied, and `Adjusted Charge wuerfeln` becomes visible afterwards.
21. Choose an adjusted-charge D6 result.
22. Expected: the charger follow-through corridor/ghost uses the moved evader state, not the original target pose.
23. Stop and report any case where `Adjusted Charge wuerfeln` appears before the evade token/state is committed.

Manual acceptance that is intentionally not claimable yet:

- Do not accept P7A2 as complete based on the current core slice.
- Do not treat direct-blocker slide choice, direction wheel, obstacle wheel, table exit, light-troop end half-turn, or browser-confirmed slide choice as manually accepted until browser smoke and user acceptance are recorded.

Non-goals for Split 2:

- no P7B conformation implementation
- no melee, rout, pursuit, or army-cohesion accounting
- no tournament-complete evade claim
