# P7 TODO - Charge Declaration + Target Reaction Gate

Status: Complete - accepted by user on 2026-05-20; P7-00 through P7-12 now form an accepted single-unit charge declaration and target-reaction gate foundation. Basic evade is split to P7A; basic conformation is split to P7B.
Date drafted: 2026-05-18
Planner: AdG-Rules-Engine-Agent per user request; GPT-5.5 remains the preferred future board-drafting specialist
Future executor: GPT-5.4 preferred executor after explicit user approval
Intended branch: feature/p7-charge-conformation
Follow-up boards: P7A_todo.md, P7B_todo.md
Master plan: roadmap.md
Architecture source: docs/architecture.md
Governance source: docs/project-governance.md
Rules workspace: docs/rules/
Open verification source: docs/rules/open-verification.md
Primary source PDFs: Konzepte/Errata_ADG_V4_English.pdf, Konzepte/Rules.pdf, Konzepte/Reglettes.pdf, Konzepte/Reference_Sheet_V4.pdf

## Purpose

P7 implements the first strict charge declaration and target-reaction gate on top of the accepted P6 command/corps system and P5 ZOC movement-validation foundation.

P7 must make charge a first-class command, not a normal movement chain that happens to contact an enemy. A unit must declare charge before moving, choose a target and charge-start path, freeze the declared direction, detect/classify contact from charge-owned state, and open a reducer-owned target-reaction gate.

P7 is not group movement, full evade resolution, conformation, melee combat, shooting, pursuit, rout, or a tournament-complete all-exceptions pass. It is the single-unit charge declaration and target-reaction foundation that P7A and P7B consume.

P7 is no longer treated as a mega-phase after the 2026-05-20 replanning decision. Do not expand this board with basic evade or conformation implementation; use the follow-up boards instead:

- P7 finishes charge command, target declaration, forward path, contact detection/classification, direction confirmation, target reaction modal/decision state, and no-evade handoff.
- P7A handles basic evade and charge movement branches.
- P7B handles basic conformation and shifting foundation.
- P7C handles the later nested `Move` / `Charge` / `Attach` command-menu cleanup before P8 without reopening rules ownership.

Each follow-up subsystem can only consume the previous subsystem's reducer/engine output; it must not infer shortcuts from UI state or target-center geometry.

## Remaining Execution Order For GPT-5.4

The remaining implementation order inside P7 is fixed unless the user explicitly overrides it:

1. Finish `P7-11` first.
2. Finish `P7-10` second.
3. Finish `P7-12` last.

Execution rules for GPT-5.4:

- Do not reopen `P7-05` or `P7-06` unless a focused validation for `P7-10` exposes a regression in charge path clipping or contact classification.
- Treat `P7-07` as the completed pause-skeleton foundation. Only add fields to its state/model if a focused `P7-10` follow-up exposes a true presentation-data gap.
- `P7-10` is presentation-only follow-up work. It must not invent legality, action sequencing, or new reducer state ownership.
- `P7-11` is complete as the reaction-gate state closeout and must not be reopened unless a focused regression requires it.
- `P7-12` must not start until `P7-10` is validated and the manual acceptance notes for `P7-05` through `P7-11` are present in this board.

## Player Flow Contract For P7

This is the exact local hotseat flow that GPT-5.4 must preserve while finishing P7:

1. Active player selects charger and presses `Charge`.
2. Active player selects target.
3. Active player previews `none`, `charge-start slide`, or `charge-start wheel` and sees the current straight-ahead charge tunnel, earliest contact, and contact classification.
4. When the current declaration is legal enough to proceed, the UI exposes `Richtung bestätigen`.
5. Pressing `Richtung bestätigen` freezes a declaration snapshot. That snapshot is the only source for the following reaction step.
6. The defending-side reaction modal opens immediately after the declaration snapshot is frozen.

Reaction modal contract:

- `none` or `cannot-evade`: informational modal with one continue button; result is a no-evade handoff state.
- `blocked-evade`: informational modal with blocked reason and one continue button; result is a no-evade handoff state.
- `may-evade`: modal with two choices, `Ausweichen` and `Nicht ausweichen`.
- `must-evade`: modal with mandatory wording and one confirmation button; result is an evade-required handoff state.
- `needs-source-check`: blocking modal; charge cannot advance beyond this state except cancel/back-out.

Local hotseat UX default for P7:

- Use a simple blocking modal first, not a privacy handoff screen.
- The modal may identify the reacting unit and the current reaction type, but it must not let the active player keep editing target or charge-start state while open.
- After the modal decision, the reducer enters a clear handoff state for later P7A or P7B work; P7 itself does not perform evade movement or conformation.

## Open P7 Questions For User Or Source Check

GPT-5.4 must ask or source-check before changing these defaults:

- User decision 2026-05-20: `none` / `cannot-evade` should still show a small confirmation popup. Do not auto-continue silently.
- User decision 2026-05-20: use the simple local modal flow first, not a privacy handoff screen.
- Open UX wording detail: first hotseat reaction popup should prefer German labels (`Ausweichen`, `Nicht ausweichen`, `Weiter`), but final copy can be polished during implementation.
- Open behavior detail: `blocked-evade` in P7 should be visibly distinct in the modal, then continue to no-evade handoff unless P7A source-lock changes that behavior.
- Source check: confirm whether the target reaction gate opens immediately after direction confirmation in all supported single-unit cases, or whether any source-locked case delays reaction until actual movement/contact.

## Brainstorm Summary

Historical note after replanning: the conformation and shifting bullets below describe downstream engine intent only. GPT-5.4 must not treat them as remaining in-scope implementation work for P7; they now belong to P7B.

The safest P7 path is source-lock first, then a deterministic single-unit charge simulation with explicit pause points.

Core design choice:

- Charge is a dedicated command button beside movement commands.
- Charge can only be started before the selected unit has moved, stayed, or finished its movement for the phase.
- Once charge mode starts, normal movement orders are not confirmed. The engine may reuse existing advance, slide, and wheel geometry/render primitives, but the reducer must store charge-owned state and diagnostics.
- Charge has its own legal start manoeuvre flow: no start manoeuvre, charge-start slide, or charge-start wheel, followed by straight-ahead charge movement. The first P7 subset excludes 1/4 turn and 1/2 turn cases.
- After target selection, the visible charge tunnel starts from the charging unit's current or charge-start pose and points forward from that pose. It must not auto-rotate toward the selected target.
- Charge direction freezes once the legal start manoeuvre is chosen or confirmed as `none`.
- Contact is detected along the charge path, not only at the end pose.
- Reactions and evades are deterministic pause points in the action flow.
- Conformation is a candidate-and-diagnostic engine, not a visual snap.
- Conformation preview is a read-only rendering of engine candidate output. The UI may choose how to display candidates, but it must not solve or mutate conformation.
- Shifting is a conformation constraint mover with source-locked priority/minimality rules, not a normal movement command and not the same thing as a charge-start slide.
- P7 must preserve replay-ready action/context data for charge decisions and pause points. The full replay viewer can wait until P13, but P7 must not create UI-only transitions that cannot be reapplied later.

The first implementation should stay single-unit-only. Group movement, group charges, group conformation, group extension/contraction, and full multi-unit combat support are intentionally deferred to the post-P16 second-pass rules-completeness cycle unless the user explicitly reprioritizes them.

Single-unit-first does not mean group-blind. P7 data shapes should keep a clear future seam for group movement and group conformation, but group legality must not be pulled into the first P7 pass unless explicitly approved.

## Replanning Decisions 2026-05-18

User review found that the provisional P7-04 tunnel and target-facing guide were conceptually wrong. P7-04 is now split into smaller execution cards before P7-05 continues.

Accepted corrections:

- Target selection selects the intended enemy only; it does not define the charge direction by itself.
- The charge tunnel is a forward corridor from the charger, just like an Advance-style lane, starting from the current pose or the charge-start pose.
- `Slide` and `Wheel` should be real charge-start tools in charge state, mutually exclusive, and first in the charge sequence.
- Direct `advance`, `slide + advance`, and `wheel + advance` are the only implemented reachability families for this P7 slice.
- `Wheel` consumes movement allowance before the straight charge advance; `Slide` does not reduce the movement allowance in the current approved subset.
- The raw closest-point range gate and the path-feasibility gate are separate checks and must return separate diagnostics.
- Terrain effects, 1/4 turns, and 1/2 turns are deferred to post-P16 or a later explicitly approved rules-completeness phase. P7 may add hooks or `needs-source-check` diagnostics, but must not invent their behavior.
- A dedicated charge drill scenario is required before expanding P7-04 further so front, flank, rear, blocker, ZOC, and unreachable-target cases can be manually tested without repeatedly dragging units.

## Replanning Decisions 2026-05-20

User requested that basic evade and conformation should be implemented before P16, but that P7 should not be inflated further. The project-management decision is to split the remaining charge-phase work into before-P8 follow-up boards instead of keeping P7 as a mega-phase.

Accepted phase split:

- P7 now closes as Charge Declaration + Target Reaction Gate.
- P7A_todo.md covers basic Evade + Charge Movement Branches.
- P7B_todo.md covers basic Conformation + Shifting Foundation.
- P7C_todo.md covers the later command-menu hierarchy and battlefield command-flow cleanup before P8.
- P8 Shooting remains after P7B approval; P8 is not allowed to start directly after P7 anymore.

P7 residual scope after this decision:

- keep existing contact and classification work because it is already implemented and needed by the reaction gate;
- add explicit direction confirmation before defender reaction;
- make reaction state visible through a modal or equivalent hotseat handoff;
- store defender reaction decisions as reducer-owned data;
- support no-evade handoff without applying conformation or combat;
- close P7 with tests, build, and browser/manual acceptance.

Moved out of P7:

- full evade movement, adjusted charge distance, caught evader handling, blocked-evade expansion, and secondary-target branch work move to P7A;
- conformation candidates, incomplete/blocked conformation, shifting, and final conformation application move to P7B.
- broader battlefield command-menu nesting for `Move`, `Charge`, `Attach`, and later move-family submenu growth moves to P7C.

## User-Requested P7 Rule Anchors

These anchors are accepted planning constraints for this board and must be source-checked in `P7-00` before engine implementation starts.

Single-unit-first scope:

- P7 handles one selected charging unit at a time.
- Group movement and group charges are out of scope for the first P7 pass.
- Post-P16 second-pass work may revisit group movement and group charge/conformation with a cleaner generalized model.

Charge as a pre-movement command:

- A unit may not move normally and then charge.
- Charge is offered as its own command, similar in UI presence to advance/wheel/slide, but with different internal rules.
- If a unit has already confirmed a normal movement order, stayed, or otherwise finished movement this phase, charge is disabled and explained.
- If a normal movement preview is pending, charge cannot be started until that preview is cancelled.
- If a charge preview is pending, the player cannot switch units or start normal movement commands until the charge is cancelled or resolved.

Strict charge sequence:

- Select eligible active-corps unit.
- Press `Charge` before movement.
- Show legal charge targets and why illegal targets are unavailable, using both raw closest-point range and supported path-feasibility checks.
- Select target.
- Render the forward charge tunnel from the charging unit's current pose; target selection does not rotate the tunnel toward the target.
- Resolve source-legal charge-start alignment: no start manoeuvre, charge-start slide, or charge-start wheel as allowed by source and current P7 subset, not both unless the rulebook explicitly permits a combined case.
- Freeze resulting charge direction.
- Compute straight-ahead charge ghost along that direction.
- Detect earliest contact along the path.
- Create reaction/evade requests where source requires them.
- Resolve contact classification.
- Confirm direction and open the target reaction gate.
- Store reaction decisions and hand off unresolved evade/conformation branches to P7A/P7B.

Terminology guardrail:

- `charge-start shift` or `charge-start slide` means the official charge-opening lateral alignment step if source-verified.
- `conformation shifting` means moving blocking units to allow conformation.
- The board must keep those concepts separate in code, UI, tests, and diagnostics.

## Source-Lock Focus For P7/P7A/P7B

P7, P7A, and P7B must not rely on OCR-only or secondary summaries for rule-complete claims. Before each board implements its slice, source-lock the relevant areas against Rules plus Errata:

- charge declaration timing and target eligibility
- charge command cost and CP interaction with P6 command context
- whether and how charge-start shift/slide, wheel, half-turn, and quarter-turn are allowed
- charge direction freezing and straight-ahead movement requirements
- charge range, adjusted range, and contact-stop conditions
- prohibited charges, including same-edge melee/support cases and column/front/rear restrictions
- front, flank, rear, and corner contact classification, including whether classification is based on start state, contact geometry, or both
- target reaction windows for P7
- evade eligibility, mandatory evade, blocked evade, adjusted distance, and caught evader effects for P7A
- most-threatening enemy and ZOC interaction during charge and conformation for P7B where required
- conformation sequence, complete versus incomplete conformation, and optional terrain choices for P7B
- conformation when already in contact or providing support for P7B or later source-locked work
- shifting priority, minimality, unshiftable-unit restrictions, and post-shift movement/rally locks for P7B

## How To Use This Board

Work one checklist card at a time. Do not batch implementation cards unless the user explicitly asks.

Before each implementation card:
1. Re-read this card, roadmap.md P7 section, docs/architecture.md movement/engine sections, and docs/rules/open-verification.md P7-related entries.
2. Re-check relevant source pages and errata notes for the card scope.
3. Run `git status --short --branch` and protect unrelated user changes.
4. Give the user a short PM block brief before implementation edits.
5. Keep implementation inside approved P7 scope.

PM block brief must include:

- exact goal
- planned files
- new modules
- UI versus state/engine scope split
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

## Global P7 Scope Guardrails

In scope:

- single-unit charge declaration and target selection
- charge as a first-class command before movement
- charge-start manoeuvre controls that are separate from normal movement commands
- charge direction freezing
- straight-ahead charge ghost after the legal start manoeuvre
- earliest contact detection along the path
- contact classification for front, flank, rear, and corner cases
- reaction/evade request data model and first reducer pause points
- direction confirmation and frozen declaration snapshot
- visible reaction gate and reducer-owned reaction decision state
- no-evade/evade-required handoff states for P7A/P7B
- visible charge declaration/reaction previews and why explanations
- tests for normal, illegal, boundary, and source-sensitive edge cases

Out of scope:

- no group movement or group charges in the first P7 pass
- no real evade movement; basic evade moves to P7A
- no conformation solver; basic conformation moves to P7B
- no shifting solver; basic shifting moves to P7B
- no full melee combat resolution
- no shooting
- no pursuit or rout movement
- no full all-troop special-exception coverage unless source-locked and explicitly approved
- no tournament-complete claim for charge/conformation until every open item is verified and implemented
- no AI behavior changes
- no multiplayer networking work

Hard rules:

- Errata overrides base rules.
- Charge legality is engine/reducer logic, never UI logic.
- Preview overlays are display-only projections of engine/reducer state. Contact markers, blocked reasons, and reaction decisions must be computed before the UI renders them; later P7B conformation/shifting previews must follow the same rule.
- Charge cannot be implemented as a confirmed normal advance/wheel/slide after the fact. Existing movement geometry and UI primitives may be reused only when they write charge-owned state and diagnostics.
- If the unit has already moved or stayed this phase, charge is disabled.
- Any unresolved charge, reaction, evade, conformation, or shifting rule stays explicit as `needs-source-check`.
- Reaction and evade are defined interrupt points in the charge flow. If source wording is not closed, the reducer must pause or block with diagnostics rather than silently treating the hook as optional.
- P7 must retain enough serializable action, path, contact, reaction, and declaration context for future replay/undo work. P7A/P7B add evade and conformation context later. P13 may implement the viewer and checkpoints, but P7 must not discard the facts needed to replay its decisions.
- P8 must not start until P7, P7A, and P7B are implemented, validated, manually accepted where required, and explicitly approved by the user.

## Proposed P7 State And Engine Surfaces

Potential new engine modules:

- `src/engine/charge/model.js`
- `src/engine/charge/declaration.js`
- `src/engine/charge/path.js`
- `src/engine/charge/contact.js`
- `src/engine/charge/reaction.js`

Moved to P7B:

- `src/engine/conformation/candidates.js`
- `src/engine/conformation/shifting.js`

Potential new state/UI modules:

- `src/state/p7-charge.js` or focused charge helpers under `src/state/`
- `src/ui/p7-charge-controls.js`
- `src/ui/p7-charge-overlays.js`

Initial data concepts:

```js
ChargeIntent = {
  unitId,
  targetUnitId,
  startPose,
  targetSnapshot,
  startManoeuvre,
  frozenDirectionRadians,
  commandSnapshot,
};

ChargePreview = {
  status,
  intent,
  pathSegments,
  contactEvents,
  reactionRequests,
  reactionDecisions,
  declarationSnapshot,
  handoffStatus,
  diagnostics,
};

ContactEvent = {
  chargerId,
  defenderId,
  distanceAlongPathUd,
  contactPose,
  contactType,
  isCornerOnly,
  sourceStatus,
};
```

These names are planning placeholders, not implementation commitments. P7B owns `ConformationPlan` and `shiftingPlan` data.

## Phase Status

- [x] P6 accepted complete by user
- [x] P6 PR handoff prepared
- [x] P7 brainstorming requested by user
- [x] P7 single-unit-first scope requested by user
- [x] P7 charge-before-movement command rule captured
- [x] P7 execution board drafted
- [x] P7 execution board approved by user for implementation
- [x] P7 implementation branch prepared
- [x] P7 source review and verification updates completed
- [x] P7 charge command data model implemented
- [x] P7 charge UI command entry implemented
- [x] P7 single-unit charge path and target preview implemented
- [x] P7 earliest contact and contact classification implemented
- [ ] P7 target reaction gate UX and decision state implemented
- [x] P7A/P7B split requested by user and drafted
- [ ] P7 diagnostics and overlays for declaration/reaction gate implemented
- [ ] P7 automated and browser validation completed
- [ ] P7 demonstrated to user
- [ ] P7 approved complete by user
- [ ] P7A board reviewed and approved before evade implementation
- [ ] P7B board reviewed and approved before conformation implementation

## Definition Of Done

P7 is done when:

- [x] Charge is a dedicated reducer-owned command that must be selected before movement.
- [x] Units that already moved, stayed, or finished movement this phase cannot start charge.
- [x] Charge target eligibility is validated and explained through separate raw closest-point range and supported path-feasibility checks.
- [x] Charge-start manoeuvres are charge-owned, mutually exclusive, source-status annotated, and separate from normal movement confirmation.
- [x] After target selection and charge-start alignment, the forward tunnel starts from the charger/start pose, charge direction is frozen, and only straight-ahead movement is previewed.
- [x] Earliest contact along the charge path is detected deterministically.
- [x] Front, flank, rear, and corner contact cases are classified with source-status diagnostics.
- [x] Reaction requests are represented as deterministic reducer pause points.
- [ ] Direction confirmation freezes the declaration snapshot before defender reaction.
- [ ] Defender reaction decisions are stored as reducer-owned data.
- [ ] No-evade handoff is explicit and does not pretend evade, conformation, or combat are already resolved.
- [ ] UI overlays are display-only and reflect engine previews.
- [ ] Confirmed P7 actions and pause decisions preserve replay-ready serializable context for the later P13 viewer/undo phase.
- [x] Automated tests cover allowed, disabled, blocked, boundary, edge, front, flank, rear, blocker, and ZOC cases for the implemented P7 declaration/contact/reaction-pause subset.
- [ ] Browser/manual smoke confirms the P7 interaction surfaces using the charge drill scenario.
- [ ] roadmap.md, P7_todo.md, P7A_todo.md, P7B_todo.md, and docs/rules/open-verification.md are aligned with the split status.
- [ ] User explicitly approves readiness to proceed toward P7A.

## Later-Card Risk Review 2026-05-18

The P7-04 user review exposed a general planning risk: later charge/conformation cards must consume actual charge-owned path state, not inferred target-facing shortcuts. The following corrections apply before those cards are implemented.

- P7-05 earliest contact must use the selected charge path from P7-04. It must not reconstruct a new line from charger to target center or from closest point to closest point.
- P7-05 must stop at the first legal contact along the chosen path. If another enemy is contacted before the selected target, the card must report that explicitly instead of letting the preview pass through.
- P7-05 terrain blockers stay `needs-source-check` until a shared terrain movement collision validator exists. Do not silently treat terrain as either open or blocking.
- P7-06 contact classification must classify the actual contact pose and defender facing. It must not classify from target declaration, range candidate, or target center alone.
- P7-07 reaction and evade must preserve the charge path snapshot that caused the reaction. If an evade changes distance or target position, later path/contact state must be recomputed or blocked.
- P7-08 conformation candidates must start from the actual contact pose selected by P7-05, not from max-distance end pose or visual ghost end pose.
- P7-09 shifting must remain a conformation micro-operation. It must not reuse normal movement commands or charge-start slide as a shortcut.
- P7-10 overlays must be display-only and must render charge-owned path, contact, reaction, and later handoff state. UI must not decide whether a target or contact is legal.
- P7-11 direction confirmation and reaction-decision state must freeze the actual selected/truncated charge path and declaration snapshot, not the raw target point, full movement allowance, or current visual cursor state.
- P7-12 validation must include the charge drill scenario and explicitly list residual unsupported cases: 1/4 turn, 1/2 turn, terrain effects, group charges, and full special troop exceptions.

## Execution Cards

### [x] P7-00 - Source Lock And Scope Gate

Goal: verify the strict single-unit P7 charge/conformation subset against source PDFs and errata before engine implementation starts.

Planned files:

- P7_todo.md
- roadmap.md
- docs/rules/open-verification.md
- optional docs/rules/charge.md
- optional docs/rules/conformation.md
- optional docs/rules/sequence-of-play.md update

Implementation steps:
1. Re-check charge declaration, target eligibility, charge movement, start manoeuvres, reactions, evade, contact, conformation, and shifting against Rules plus Errata.
2. Separate source-closed facts from OCR helper notes and secondary summaries.
3. Add or refresh explicit P7 open-verification IDs for unresolved charge/conformation details.
4. Confirm that single-unit-only P7 does not accidentally claim group movement coverage.
5. Confirm whether charge CP costs are fully implementable from P6 command context or must start source-gated.

Non-goals:

- no engine code edits
- no UI changes
- no P8 melee/shooting behavior

Validation:

- P7 source questions are explicit in docs
- roadmap and board agree on P7 scope
- no implementation starts before user accepts the source split

Manual acceptance:

- user approves the source-lock split and first implementation slice boundaries

Stop condition:

- stop if core charge-before-movement timing, start manoeuvre options, or conformation requirements remain ambiguous without explicit tracking

Expected result: P7 implementation starts with strict, source-visible rule boundaries.

Completed 2026-05-18:
- Added dedicated P7 rule-workspace notes in `docs/rules/charge.md` and `docs/rules/conformation.md` so source-locked facts and remaining questions are no longer trapped only in the roadmap or execution board.
- Expanded `docs/rules/open-verification.md` with explicit P7 blocker IDs for single-unit charge declaration, charge-start manoeuvre options, charge path stop/contact ordering, contact classification basis, reaction/evade pause modeling, conformation candidate selection, and shifting priority/locks.
- Kept P7 strict to the user-requested single-unit-first scope and recorded that group movement/group charge remains deferred to the post-P16 second-pass rules-completeness cycle.
- Reframed the earlier generic `command.rally-and-charge-cp-gating` note so P7 can now split charge cost/timing from later rally handling instead of leaving one vague combined placeholder.

Files touched:
- `P7_todo.md`
- `docs/rules/charge.md`
- `docs/rules/conformation.md`
- `docs/rules/open-verification.md`

Validation:
- markdown diagnostics pass

Manual acceptance:
- pending user review of the P7 source-lock split before deeper engine work goes beyond the P7-01 state spine

Still open:
- direct PDF/errata page locking still remains the next manual/source-review step inside these explicit open-verification IDs

### [x] P7-01 - Charge Command Data Spine

Goal: add serializable charge intent, preview, diagnostics, and reducer state without applying charge movement yet.

Planned files:

- new src/engine/charge/model.js
- new src/engine/charge/model.test.js
- src/engine/charge/index.js
- src/state/p0-state.js or new src/state/p7-charge.js
- src/state/p0-state.test.js

Implementation steps:
1. Define serializable charge intent, preview, contact event, reaction request, and conformation-plan placeholder structures.
2. Add charge preview state to app state with idle, target-selecting, manoeuvre-selecting, reaction-pending, conformation-preview, ready, rejected, and blocked statuses as needed.
3. Add reset/cancel helpers for charge preview state.
4. Ensure pending charge preview participates in existing atomicity: no unit switch or normal movement command while unresolved.
5. Keep all legality diagnostics data-driven and UI-free.

Non-goals:

- no actual charge path application yet
- no contact solver yet
- no conformation solver yet

Validation:

- focused model/state tests
- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js`

Manual acceptance:

- user reviews that the planned states match the intended charge flow before UI work proceeds

Stop condition:

- stop if the charge state model cannot represent reaction pause points without mutating UI state directly

Expected result: P7 has a deterministic charge-command state spine ready for validators and UI.

Completed 2026-05-18:
- Added a dedicated `src/engine/charge/` model spine with serializable preview statuses, intent data, reaction-request placeholders, and conformation-plan placeholders.
- Wired `chargePreview` into the top-level app state in `src/state/p0-state.js` alongside existing movement and commander preview state.
- Added reducer-owned charge spine actions for `START_CHARGE_PREVIEW`, `SET_CHARGE_TARGET`, and `CANCEL_CHARGE_PREVIEW`.
- The current P7-01 reducer slice is intentionally minimal: it does not move units yet, but it does preserve the intended flow from idle -> target-selecting -> manoeuvre-selecting.
- Pending charge preview now participates in the same no-unit-switch atomicity rule as pending movement and commander previews.
- The reducer already enforces one important user-locked rule early: a unit that already finished movement this phase cannot start a charge preview.
- Focused tests now cover model serialization, initial charge preview state, start-target-cancel flow, charge atomicity, and the `no move then charge` gate.

Files touched:
- `P7_todo.md`
- `src/engine/charge/index.js`
- `src/engine/charge/model.js`
- `src/engine/charge/model.test.js`
- `src/state/p0-movement.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`

Validation:
- `node --test src/engine/charge/model.test.js src/state/p0-state.test.js` -> pass (`119` tests)
- editor diagnostics pass for touched files

Manual acceptance:
- pending user review of the current non-visual charge-state flow before P7-02 exposes the charge button in the command panel

Still open:
- no charge UI button yet
- no target legality computation yet
- no charge-start manoeuvre builder yet
- no path/contact/reaction/conformation solver yet

### [x] P7-02 - Charge Button And Eligibility Gating

Goal: expose charge as a first-class command button and disable it whenever the selected unit is not legally allowed to start a charge.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-battlefield.js
- src/ui/p0-app.js
- src/state/p0-state.js or src/state/p7-charge.js
- src/state/p0-state.test.js

Implementation steps:
1. Add a `Charge` command action to the movement/command panel for eligible selected units.
2. Disable charge with reducer-owned reasons when the unit already moved, stayed, finished movement, belongs to a non-active corps, belongs to the inactive player, is not in movement/charge phase, or has a pending normal movement preview.
3. When charge starts, clear normal movement modes and enter charge target-selection state.
4. Keep normal advance/wheel/slide controls unavailable while charge preview is active.
5. Add visible diagnostics for why charge is disabled without letting UI decide legality.

Non-goals:

- no target path computation yet
- no conformation UI yet
- no group charge command

Validation:

- focused reducer tests for disabled-after-move, disabled-after-stay, wrong-corps, wrong-player, and pending-preview cases
- focused UI test for charge button state and diagnostics

Manual acceptance:

- user verifies charge appears as a side-panel command and greys out after normal movement or stay

Stop condition:

- stop if any path lets a unit move normally and then start charge in the same movement phase

Expected result: charge exists as a command-before-movement UI/reducer entry point.

Completed 2026-05-18:
- Exposed `Charge` as a first-class side-panel command button beside the existing movement commands for normal selected units.
- Moved the UI gating onto reducer-owned rules by exporting charge-eligibility helpers from `src/state/p0-state.js` and reusing them in the command-panel presentation instead of inventing a second legality path in the UI.
- Added reducer-backed disabled reasons for setup, wrong phase, wrong corps/player, already-finished movement, pending movement preview, pending commander preview, and already-open charge preview.
- Kept active charge preview atomic in the panel UX: the charge button now shows as active, the helper text explains the charge-preview state, the selection-lock warning mentions charge explicitly, and the existing cancel button can abort the charge preview.
- Wired the button click in `src/ui/p0-app.js` to `START_CHARGE_PREVIEW`, so P7 now has a complete command-before-movement entry point without yet claiming target legality or manoeuvre solving.
- Focused UI coverage now checks both enabled-before-move and locked/cancelable-while-active charge states.

Files touched:
- `P7_todo.md`
- `src/state/p0-state.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/battlefield-command-panel.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`

Validation:
- `node --test src/ui/battlefield-command-panel.test.js src/state/p0-state.test.js` -> pass (`130` tests)
- editor diagnostics pass for touched files

Manual acceptance:
- pending user review that `Charge` appears in the battlefield side panel, becomes active when pressed before movement, and greys out after normal movement or `Stay`

Still open:
- no legal target overlay yet
- no charge-target legality computation yet
- no charge-start manoeuvre builder yet
- no straight-path/contact/reaction/conformation solver yet

### [x] P7-03 - Target Selection And Charge Target Overlay

Goal: let a selected charger choose a target from reducer-computed legal and illegal target candidates.

Planned files:

- new src/engine/charge/declaration.js
- new src/engine/charge/declaration.test.js
- src/state/p7-charge.js or src/state/p0-state.js
- src/ui/p0-battlefield.js
- src/ui/p0-app.js
- src/styles/p0-battlefield.css
- src/ui/p0-battlefield.test.js

Implementation steps:
1. Compute candidate enemy targets for the selected single charging unit.
2. Include source-status diagnostics for target eligibility, target ownership, command phase, charge range precheck, and prohibited target classes where source-locked.
3. Render eligible target highlights and disabled target explanations.
4. Clicking an eligible target stores `targetUnitId` and a target snapshot in charge intent.
5. Clicking an illegal target leaves state unchanged and surfaces why it is illegal.

Non-goals:

- no group target selection
- no full evade resolution
- no melee support targeting unless source-locked and approved in P7 scope

Validation:

- focused target selector tests
- UI render tests for eligible and disabled target highlights

Manual acceptance:

- user verifies targets are clearly highlighted and illegal targets explain themselves

Stop condition:

- stop if target legality depends on unresolved prohibited-charge wording that is not tracked in open verification

Expected result: charge target selection is deterministic, explainable, and reducer-owned.

Completed 2026-05-18:
- Added `src/engine/charge/declaration.js` as the dedicated target-candidate classifier for the current single-unit charge step, with explicit `eligible` versus `blocked` candidate states and `needs-source-check` diagnostics where the exact rule wording is still open.
- Extended `chargePreview` so the reducer now owns a serializable `targetCandidates` snapshot instead of leaving target highlighting to ad hoc UI checks.
- Starting a charge preview now computes reducer-owned target candidates immediately; legal enemy targets advance into `MANOEUVRE_SELECTING`, while blocked targets leave the preview in `TARGETING`.
- Battlefield tokens now render charge-target overlays from reducer state: provisional enemy targets are highlighted as selectable, blocked targets carry their explanation, and the chosen target remains visibly marked after selection.
- The existing battlefield token click path in `src/ui/p0-app.js` now switches into `SET_CHARGE_TARGET` while charge targeting is active, instead of falling back to normal unit selection.
- This slice stays intentionally conservative: enemy targets are presently provisional and explicitly tagged with `needs-source-check` for exact range and prohibited-charge rules rather than pretending those source-blocked cases are solved.

Files touched:
- `P7_todo.md`
- `src/engine/charge/declaration.js`
- `src/engine/charge/declaration.test.js`
- `src/engine/charge/index.js`
- `src/engine/charge/model.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.test.js`
- `src/styles/p0-battlefield.css`

Validation:
- `node --test src/engine/charge/declaration.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js` -> pass (`144` tests)
- editor diagnostics pass for touched files

Manual acceptance:
- pending user review that pressing `Charge` highlights provisional enemy targets on the battlefield, blocked targets explain themselves, and clicking a highlighted enemy target advances into the next charge step

Still open:
- exact charge range legality remains source-blocked
- prohibited charge target classes remain source-blocked
- no charge-start manoeuvre controls yet
- no straight-path/contact/reaction/conformation solver yet

### [x] P7-04 - Charge-Start And Reachability Rework Umbrella

Goal: correct the P7-04 charge-start model after user review before moving into earliest-contact work.

PM correction:

- The current provisional target-facing tunnel is wrong and must be replaced before P7-05.
- The charge tunnel must be a forward corridor from the charging unit's current pose or selected charge-start pose.
- `Slide` and `Wheel` are charge-start tools in charge state, not normal movement orders and not a second row of bespoke buttons.
- The first implemented reachability families are exactly `advance`, `slide + advance`, and `wheel + advance`.
- 1/4 turns, 1/2 turns, and full terrain effects are explicitly deferred unless the user starts a dedicated source-locked phase.

Execution order:

1. P7-04A - build a charge drill scenario fixture for manual and automated regression coverage.
2. P7-04B - fix the visible tunnel and make charge-start `Slide`/`Wheel` real charge-state tools.
3. P7-04C - rebuild target reachability as a candidate search over supported movement families.
4. P7-04D - browser/manual smoke over the drill scenario before P7-05.

Implementation history already completed on 2026-05-18:

- Added `src/engine/charge/path.js` as an initial charge-start builder surface.
- Added reducer-owned charge preview state, target candidates, start manoeuvre option snapshots, and first path/guide fields.
- Added a first closest-point range gate and an initial reachability precheck over existing movement builders.
- Updated the direct-battle seed with a nearby enemy and a farther enemy for quick charge range testing.
- User review later rejected the target-facing tunnel and requested a richer drill scenario; the remaining P7-04 work below supersedes the earlier provisional guide design.

Validation history:

- `node --test src/engine/charge/path.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js` -> pass (`162` tests)
- `node --test src/engine/charge/declaration.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js` -> pass (`163` tests)

Stop condition for the umbrella:

- do not enter P7-05 until the tunnel, charge-start tools, target reachability, hover reasons, and charge drill scenario are all coherent enough for manual user review.

### [x] P7-04A - Charge Drill Scenario Fixture

Goal: add a deterministic test scenario where charge target, path, flank, rear, blocker, and ZOC cases can be checked without manual dragging.

Planned files:

- new `src/data/charge-drill-scenarios.js` or equivalent fixture module
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.js` or scenario-loading UI if needed
- `src/ui/p0-battlefield.test.js`

Implementation steps:
1. Add a named `Charge Drill` setup or direct-battle fixture that can be loaded deliberately without replacing the default standard-200 fixture for all tests.
2. Include a player-one front charger with one legal front charge target.
3. Include one enemy outside raw closest-point charge range.
4. Include one target inside raw range but unreachable by supported `advance`, `slide + advance`, or `wheel + advance` paths.
5. Include at least one friendly unit blocking a charge lane.
6. Include at least one enemy unit that would be contacted before the selected target.
7. Include flank and rear charge opportunities with defender facings deliberately varied.
8. Include a ZOC-blocking enemy placement for hover diagnostics.
9. Include a visible but inactive terrain/obstacle placeholder labelled as future terrain-blocker coverage; do not make terrain affect legality until a shared terrain movement validator exists.
10. Use stable unit IDs and labels that tests and manual instructions can reference.

Non-goals:

- no official army-list scenario
- no terrain movement effects
- no 1/4 or 1/2 turn cases
- no group charge fixture

Validation:

- tests that the scenario loads all expected units with stable IDs and facings
- tests that the scenario includes front, flank, rear, raw-out-of-range, path-blocked, and ZOC-blocked candidate categories

Manual acceptance:

- user can load the charge drill and visually inspect front, flank, rear, blocker, and ZOC cases without dragging units first

Stop condition:

- if adding scenario-loading UI is too broad, implement the fixture and tests first, then expose it through the smallest existing debug/direct-battle path.

Expected result: P7 has a reusable charge proving ground before more path/contact/conformation logic is added.

Progress 2026-05-18/19:

- Added `src/data/charge-drill-scenarios.js` with a dedicated `Charge Drill` direct-battle fixture, stable unit IDs, scenario roles, flank/rear defender facings, and explicit front, out-of-range, path-blocked, earlier-contact, and ZOC drill anchors.
- Added a deliberate future terrain-blocker hook plus obstacle hook as locked placeholders so later terrain collision work has a visible scenario anchor without changing current charge legality.
- Added a dedicated shell start path so the scenario can be loaded directly from the menu without replacing the normal standard direct-battle fixture.
- The reducer now preserves scenario-owned units, initial positions, terrain placeholders, and setup-object placeholders when starting a battle from a named scenario.
- Added focused tests for fixture metadata, state loading, charge targeting entry, and battle rendering of the drill terrain hook.

Files touched:

- `src/data/charge-drill-scenarios.js`
- `src/data/charge-drill-scenarios.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.test.js`

Validation:

- `node --test src/data/charge-drill-scenarios.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js` -> pass (`149` tests)
- editor diagnostics pass for `src/data/charge-drill-scenarios.js`, `src/state/p0-state.js`, and `src/ui/p0-app.js`

Manual acceptance:

- pending user review: from the new-game screen, press `Charge Drill`, then verify the direct battle opens with the dedicated drill units and the `Future Charge Terrain Hook` visible on the battlefield.

Still open before P7-04B:

- the scenario now contains explicit anchors for flank, rear, blocker, earlier-contact, and ZOC cases, but the visible charge tunnel still uses the old provisional target-facing model until P7-04B
- obstacle placeholders remain setup-owned and are not yet rendered during battle; the visible terrain hook is the current manual reference marker for future terrain blocking work

### [x] P7-04B - Forward Tunnel And Charge-Start Tools

Goal: replace the target-facing guide with a forward charge tunnel and make `Slide`/`Wheel` adjust a charge-owned start pose.

Planned files:

- `src/engine/charge/path.js`
- `src/engine/charge/path.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-slide-controls.js`
- `src/ui/p0-wheel-controls.js`
- `src/ui/p0-battlefield.test.js`

Implementation steps:
1. After target selection, keep the selected target highlighted but render the charge tunnel from the charger pose straight forward.
2. Store the charge-start pose and direction in `chargePreview`, separate from `game.movement.preview`.
3. Reuse existing corridor and ghost rendering primitives, but source them from charge state.
4. Make charge `Slide` and charge `Wheel` mutually exclusive first-step choices.
5. Reuse existing drag/handle UI where practical, but dispatch charge-specific actions.
6. For `Wheel`, deduct wheel distance from the remaining charge advance allowance.
7. For `Slide`, keep the lateral movement free in the approved current subset.
8. When the start tool changes, recompute the forward tunnel and target reachability from the charge-start pose.
9. If the selected target is no longer reachable after adjustment, keep the preview visible but blocked with a reason.

Non-goals:

- no 1/4 or 1/2 turn controls
- no terrain effects
- no final contact/conformation application
- no normal movement confirmation from charge-start state

Validation:

- tests for default forward tunnel from current pose after target selection
- tests for slide-start pose and wheel-start pose updating the charge tunnel
- tests for mutual exclusion between charge `Slide` and charge `Wheel`
- tests that normal movement state remains idle while charge-start state changes

Manual acceptance:

- user verifies target click does not rotate the tunnel toward the target
- user verifies `Slide` or `Wheel` can be used to aim the forward tunnel before the charge advance

Stop condition:

- stop if existing drag controls cannot be reused without mixing normal movement confirmation state into charge state.

Expected result: P7 charge-start interaction feels like the existing tools but remains charge-owned and sequence-correct.

Progress 2026-05-18/19:

- `src/engine/charge/path.js` no longer freezes a target-facing bearing for `none`; after target selection the guide stays on the charger's current forward axis until a charge-start tool changes the start pose.
- Charge-start `Shift/Slide` and `Wheel` now use the existing movement geometry builders as charge-owned start tools instead of staying hard-blocked placeholders.
- Reducer-owned charge preview state now accepts charge-specific slide distance, slide side, wheel pivot side, and wheel angle inputs through `SELECT_CHARGE_START_MANOEUVRE` without touching normal movement preview state.
- The battlefield now renders charge-owned slide ghost handles and wheel handles from `chargePreview.intent.startPose`, so the existing drag surfaces can adjust charge start tools without confirming a normal movement order.
- Command-panel helper copy now reflects the correct forward tunnel semantics and no longer claims the tunnel points at the selected target.
- The visible charge tunnel now uses the remaining charge budget for its length instead of extending toward the battlefield edge; the battlefield renderer still anchors that corridor from the charger's front edge.
- The battlefield renderer now maps the corridor axis correctly for `rotationRadians = 0`/north, so the charge tunnel renders straight ahead from the front instead of sideways across the base.
- Selecting `Slide`, `Wheel`, or explicit `none` now reevaluates target reachability from the edited charge-start pose and remaining charge budget instead of leaving the selected target frozen in its old pre-manoeuvre legality state.
- If a chosen start manoeuvre turns the selected target unreachable, the preview stays visible in `MANOEUVRE_SELECTING`, keeps the charge-start ghost/tunnel, and surfaces reducer-owned blocked diagnostics instead of pretending the target is still legal.

Files touched:

- `src/engine/charge/path.js`
- `src/engine/charge/path.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/battlefield-command-panel.js`
- `src/ui/battlefield-command-panel.test.js`
- `src/ui/p0-slide-controls.js`
- `src/ui/p0-wheel-controls.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-battlefield.test.js`

Validation:

- `node --test src/engine/charge/path.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js` -> pass (`172` tests)
- `node --test src/engine/charge/declaration.test.js src/engine/charge/path.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js` -> pass (`163` tests)
- editor diagnostics pass for touched implementation files

Manual acceptance:

- pending user review: select a charger, choose a target that is not exactly straight ahead, verify the tunnel remains forward; then use `Slide` and `Wheel` to move the charge-start pose and verify the tunnel updates from that new start pose.

Still open after this card:

- P7-04D user manual acceptance is still required before P7-05 starts, even though the automated reachability and browser-smoke evidence is already green

### [x] P7-04C - Charge Reachability Candidate Search

Goal: make target eligibility depend on both raw closest-point range and actual supported charge path feasibility.

Planned files:

- `src/engine/charge/declaration.js`
- `src/engine/charge/declaration.test.js`
- `src/engine/charge/path.js`
- `src/engine/charge/path.test.js`
- `src/state/p0-state.js`
- `src/ui/p0-battlefield.test.js`

Implementation steps:
1. Keep the raw range gate: closest-point distance between charger and target must be <= current movement allowance.
2. Build supported candidate families: direct `advance`, `slide + advance`, and `wheel + advance`.
3. For each candidate, use full-footprint path samples and existing movement bounds/ZOC helpers.
4. Reject candidates blocked by friendly units, earlier enemy contact, table edge, or enemy ZOC before legal contact.
5. Return the best blocking reason for hover text when the raw range gate passes but no supported path can contact the target.
6. Mark terrain-blocking as `needs-source-check`/future hook until a shared terrain movement collision validator exists.
7. Do not allow 1/4 turn or 1/2 turn to rescue otherwise unreachable targets in this P7 subset.

Non-goals:

- no exhaustive continuous geometry optimizer beyond deterministic sampled candidates for the current supported subset
- no terrain movement effects
- no group charges

Validation:

- tests for raw out-of-range target
- tests for raw in-range but unreachable target
- tests for direct advance target
- tests for slide + advance target
- tests for wheel + advance target with wheel distance deducted
- tests for friendly blocker, earlier enemy contact, and ZOC blocked hover reasons

Manual acceptance:

- user hovers blocked charge targets and sees why they are blocked, such as raw range, no supported path, friend in path, earlier enemy contact, or ZOC

Stop condition:

- stop if the sampled candidate search produces unstable or non-deterministic target eligibility.

Expected result: target highlights match what the currently supported charge movement families can actually reach.

Progress 2026-05-18:

- `src/engine/charge/declaration.js` now accepts an explicit charge-evaluation context so candidate legality can be recomputed from a current charge-start pose, a remaining charge budget, and a restricted set of allowed path families.
- `src/state/p0-state.js` now uses that context after `SELECT_CHARGE_START_MANOEUVRE`, so the selected target and candidate snapshot are refreshed from the edited charge-start pose instead of staying on pre-manoeuvre reachability assumptions.
- The reachability evaluator now distinguishes friendly path blockers from `earlier enemy contact`, so the blocked reason can name a first-contact enemy instead of flattening every pre-target collision into one generic blocker message.
- Blocked target explanations now prefer stronger concrete reasons such as `earlier enemy contact` or a named blocker over a generic `no-contact` result when different supported path families fail for different reasons.
- Focused tests now cover both the declaration-level reevaluation path and the reducer case where a wheel turns the selected target back into a blocked target while the charge preview remains visible.
- `src/engine/charge/declaration.test.js` now includes a focused side-ZoC blocker case that proves the evaluator can return a concrete `zoc-blocked` reason when the legal lane crosses enemy ZoC without first overlapping the blocking unit.
- The Charge Drill now gives the ZoC case its own right-flank `zoc-charger` lane so the ZoC fixture no longer reuses the rear/slide anchor geometry.
- Foreign ZoC is now evaluated as an earliest path blocker before later physical non-target contact, so a charge path that crosses the ZoC of a non-target enemy cannot be treated as legal for that path.
- Target search and current tunnel legality are intentionally split: target search may mark a target eligible when at least one supported family avoids foreign ZoC, but the selected current start/tunnel is immediately reevaluated with `advance-only` and remains blocked until the player chooses the avoiding `Slide`/`Wheel` start manoeuvre.
- The Charge Drill `zoc-charger` / `zoc-target` case now demonstrates that split: initial target search can find the target via an alternate family, while the default straight tunnel is blocked by `charge-drill-p2-zoc-sentry` until the avoiding start manoeuvre is selected.
- The Charge Drill now also contains a separate screenshot-driven `pure-zoc-charger` / `pure-zoc-target` lane: under full supported-family search the target stays `blocked` with a foreign-ZoC reason, so this anchor no longer depends on the selected-current-tunnel distinction.
- The main drill anchors now also have an explicit blocker-priority regression pass: out-of-range anchors stay range-blocked, the double-blocked lane stays a friendly-blocker case, and both ZoC lanes stay explicitly foreign-ZoC cases instead of drifting into generic no-contact text.
- The battlefield now renders enemy ZoC bands whenever charge preview is active, so the player can see the foreign-ZoC obstacle while selecting targets or start manoeuvres.

Still open in this card:

- no known open implementation defect remains in the supported-family search; the next gate is manual/browser acceptance of the current drill behavior before P7-05 starts

### [x] P7-04D - Charge Drill Browser Smoke

Goal: manually verify P7-04A through P7-04C in the browser before earliest-contact implementation starts.

Planned files:

- `P7_todo.md`
- `roadmap.md`
- no engine files unless smoke exposes defects

Implementation steps:
1. Start the local dev server.
2. Load the charge drill scenario.
3. Validate direct front charge target highlighting.
4. Validate raw out-of-range and path-blocked hover reasons.
5. Validate forward tunnel after target selection.
6. Validate slide-start and wheel-start tunnel adjustment.
7. Capture or describe any visual overlap, stale highlight, or blocked-reason mismatch.

Non-goals:

- no new rules implementation during the smoke step unless a defect blocks acceptance

Validation:

- focused automated tests from P7-04A through P7-04C
- browser smoke notes in this board

Manual acceptance:

- user confirms P7-04 is coherent enough to proceed to earliest-contact work

Stop condition:

- stop if the visual charge tunnel still points toward the target instead of forward from the charge-start pose.

Expected result: P7-04 closes with a usable charge-start and target-feasibility foundation.

Browser smoke 2026-05-19:

- Started local Vite at `http://127.0.0.1:5173/` and loaded `Neues Spiel -> Charge Drill` in the embedded browser.
- Selected Corps I and `charge-drill-p1-zoc-charger`, then started `Charge`.
- Before target selection, `charge-drill-p2-zoc-target` was eligible via an alternate supported path while all enemy ZoC bands rendered during active charge preview.
- After selecting `charge-drill-p2-zoc-target`, the visible current tunnel stayed straight forward from the charger/start pose, not target-facing, and the selected target token surfaced current-tunnel status `blocked` with the reducer reason `Advance: der Charge-Pfad kreuzt feindliche ZoC (charge-drill-p2-zoc-sentry).`
- The diagonal orange line visible in the screenshot is the P6 command-link to the commander, not the charge tunnel; the charge corridor is the vertical white/grey corridor at the right-flank charger.
- Dragging the charge-start `Slide` 1 UD left changed `data-charge-start-type` to `shift-slide`, shifted the corridor left, and restored the selected target's current status to `eligible` via `Advance`.
- P7-04D automated/browser smoke evidence is green for the clarified foreign-ZoC invariant; user manual acceptance is still required before P7-05 starts.

Follow-up stabilization 2026-05-19:

- The screenshot-driven `pure-zoc` lane was adjusted again after user review so the red sentry sits 1 UD further right on the map, the blue blocked target sits 1 UD further left, and the lane still stays fully `blocked` by foreign ZoC under supported-family search.
- Both west-facing drill sentries now use a real `1 UD` width so the battle markers no longer look visually doubled when facing left/right.
- Focused validation is green for the latest drill geometry: `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/declaration.test.js src/state/p0-state.test.js`.
- Broader render/state validation is also green for the latest geometry: `node --test src/data/charge-drill-scenarios.test.js src/engine/charge/declaration.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`.

Manual acceptance 2026-05-19:

- User confirmed the updated Charge Drill behavior as coherent enough to proceed: forward-only tunnel, avoiding start manoeuvre behavior, pure foreign-ZoC lane, and the corrected 1-UD sentry widths all look acceptable in the browser.

### [x] P7-05 - Straight Charge Path And Earliest Contact

Implementation status: implemented and manually accepted; this card is complete.

Goal: compute the straight-ahead charge ghost after the start manoeuvre and find the earliest contact along the path.

Planned files:

- src/engine/charge/path.js
- src/engine/charge/path.test.js
- new src/engine/charge/contact.js
- new src/engine/charge/contact.test.js
- src/engine/movement/path-splitting.js as reused helper if appropriate
- src/state/p7-charge.js or src/state/p0-state.js

Implementation steps:
1. Consume the selected charge-start pose/path family from P7-04; do not reconstruct a target-facing line.
2. Reuse P5 path-sampling infrastructure where appropriate, but keep charge-specific output in charge modules.
3. Compute the straight charge path from the charge-start pose and frozen forward direction.
4. Detect earliest contact along the path using full-footprint geometry, including selected target, other enemies, friends, and blockers.
5. Stop charge preview at first relevant contact according to source-locked priority.
6. Report table-edge, friendly-blocker, earlier-enemy-contact, terrain-blocker, ZOC-blocker, and no-contact cases as diagnostics where source-locked or explicitly `needs-source-check`.
7. Avoid center-only checks.

Non-goals:

- no final movement application yet if reaction/conformation is unresolved
- no full collision engine for all terrain types unless source-locked
- no group contact sequence

Validation:

- tests for contact before max distance, no contact, friendly blocker, earlier enemy contact, battlefield edge, just-in and just-out contact, and deterministic tie cases
- charge drill scenario smoke for direct front, flank setup, rear setup, and blocked selected-target paths

Manual acceptance:

- user verifies the straight ghost stops at the first contact instead of overshooting or using end-only contact

Stop condition:

- stop if deterministic contact time cannot be made stable enough for replay

Expected result: charge path preview identifies where and why contact occurs.

Progress 2026-05-19:

- New `src/engine/charge/contact.js` now derives the first overlap event from the actual current charge path instead of from end-only geometry or target-center shortcuts.
- The contact evaluator consumes the selected charge-start path from P7-04, reconstructs an accepted full charge preview from start manoeuvre plus straight guide, samples that preview deterministically, and returns reducer-owned `contactEvents`.
- The current charge guide is now clipped to the first actual contact on the current eligible path, so the battlefield corridor no longer always extends to full remaining range when the selected target is reached earlier.
- First-touch stopping is now locally refined between the last non-contact sample and the first contact sample, so the ghost no longer waits for the next coarse path sample before clipping at corner contact.
- The reducer now stores `chargePreview.contactEvents` for the current eligible tunnel after target selection and after charge-start manoeuvre changes.
- `contactEvents` now preserve a replay-ready `contactSnapshot` with `chargerOriginPose`, `chargerStartPose`, `chargerContactPose`, `defenderPose`, `selectedTargetPose`, and frozen charge direction, so P7-06 can classify the real charge start/contact state without reconstructing it from UI state or target-center guesses.
- Contact events are intentionally suppressed for currently blocked tunnels, so an illegal straight tunnel that is blocked by foreign ZoC does not pretend to have a legal first contact just because the target footprint lies farther ahead on the same line.
- Charge-start drag performance is now split into `preview while dragging` versus `recompute on release`: during charge `Slide`/`Wheel` drags the reducer updates only the lightweight start-ghost/path state, and the expensive reachability/contact recalculation runs only on mouse release.
- Focused tests now cover direct selected-target contact and earlier-enemy contact in `src/engine/charge/contact.test.js`, plus reducer/render checks for clipped corridors and blocked-ZoC current tunnels.
- The contact selector now resolves simultaneous overlaps deterministically by earliest refined contact distance first, then stable event priority (`friendly blocker` before `earlier enemy` before `selected target`) and finally defender id as a replay-safe tie-breaker.
- Focused P7-05 edge coverage now includes explicit `friendly blocker`, `battlefield edge before contact`, and `deterministic equal-distance tie` tests in `src/engine/charge/contact.test.js`.
- Broad charge regression is green after the first P7-05 slice: `node --test src/engine/charge/path.test.js src/engine/charge/declaration.test.js src/engine/charge/contact.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`.

Manual acceptance 2026-05-20:

- user confirmed that P7-05 fits the accepted P7 scope and can be marked complete

### [x] P7-06 - Contact Classification

Implementation status: implemented and manually accepted; this card is complete.

Goal: classify contact as front, flank, rear, or corner with source-status explanations.

Planned files:

- src/engine/charge/contact.js
- src/engine/charge/contact.test.js
- src/engine/geometry/relationship.js if reuse/export adjustments are needed
- src/state/p7-charge.js or src/state/p0-state.js

Implementation steps:
1. Determine which source facts classify charge contact: start location, actual contact pose, facing zones, edge contact, or combined rules.
2. Classify front, flank, rear, and corner-only contact for single-unit charges from the P7-05 contact snapshot, not from target declaration alone.
3. Preserve the defender and charger pose snapshots used for classification.
4. Add source-status diagnostics when a case is geometry-known but rule-uncertain.
5. Block or flag corner-only contacts when conformation requirements are not yet satisfied by later cards.

Non-goals:

- no melee factor computation
- no support classification for P9 combat factors
- no group overlap/contact spread

Validation:

- tests for front, flank, rear, corner-only, rotated defender, boundary, and ambiguous geometry cases
- charge drill scenario checks for front, flank, and rear charge opportunities

Manual acceptance:

- user verifies the overlay labels contact side clearly and does not claim combat results

Stop condition:

- stop if contact classification source basis is unresolved and would affect legality

Expected result: contact type is deterministic and ready to feed conformation.

Progress 2026-05-19:

- New `src/engine/charge/classification.js` classifies charge contact from the attacker front edge at `chargerStartPose` against the defender front/rear geometry; it does not infer from target declaration, target center, or ghost end pose.
- The current implemented rule basis matches the page-41 examples reviewed in-session: `front` dominates if any part of the attacker front remains in the defender front area; `flank` requires the whole attacker front behind the defender front line; `rear` requires the whole attacker front behind the defender rear line; and the off-center rear grey zone is preserved as `rear-or-flank` instead of being collapsed too early.
- `contactEvents` now carry reducer-owned `classification` output beside the existing `contactSnapshot`, so later conformation work can consume a preserved contact type without re-solving from UI state.
- The battlefield now renders a reducer-owned target-side overlay from that classification: attacked side green, non-attacked sides red, and unresolved `rear-or-flank` options orange on the actual contacted defender without adding text labels to the board.
- Focused regression now includes a rulebook-style A/B1/B2/C1/C2/D/E matrix in `src/engine/charge/classification.test.js`, plus contact/reducer integration assertions that current front-contact drill paths classify as `front`.
- Focused edge coverage now also includes a rotated-defender regression, exact front-line and rear-line boundary checks, and an explicit rear-corner grey-zone case at the rear boundary so later conformation logic consumes tested geometry rather than assumptions.
- Charge preview state now serializes an explicit `selectedContactSide` for `rear-or-flank`, preserving the user's locked legal side for later conformation without re-deriving intent from UI state.
- Battlefield render tests now verify both states: the color-only side overlay attaches to the real contact defender, preserves the unresolved two-side orange choice state, and flips the chosen legal side to attacked once the reducer locks it.
- Broad charge regression remains green after the side-lock addition: `node --test src/engine/charge/path.test.js src/engine/charge/declaration.test.js src/engine/charge/classification.test.js src/engine/charge/contact.test.js src/state/p0-state.test.js src/ui/p0-battlefield.test.js src/ui/battlefield-command-panel.test.js`.

Implementation status for this card:

- classification geometry and the reducer-owned `rear-or-flank` side lock are implemented and manually accepted for the current P7 scope

Manual acceptance 2026-05-20:

- user confirmed that P7-06 fits the accepted P7 scope and can be marked complete

### [ ] P7-07 - Reaction And Evade Pause Skeleton

Replanning note 2026-05-20: this card now stops at reaction-request generation and reducer pause skeleton behavior. Do not extend P7-07 into direction confirmation, stored defender decisions, or no-evade handoff; those closeout responsibilities now belong to P7-10 and P7-11.

Goal: represent charge reactions and evades as deterministic pause points before final charge resolution.

Planned files:

- new src/engine/charge/reaction.js
- new src/engine/charge/reaction.test.js
- src/state/p7-charge.js or src/state/p0-state.js
- src/ui/battlefield-command-panel.js
- src/ui/p0-battlefield.js

Implementation steps:
1. Add reaction request objects for `none`, `may-evade`, `must-evade`, `blocked-evade`, and `needs-source-check`.
2. Generate reaction requests from source-locked target properties and charge context.
3. Pause the charge reducer flow when a player decision is required or when source-open evade behavior would otherwise be guessed.
4. For the first P7 pass, allow unresolved complex evade movement to block final confirmation rather than inventing movement.
5. Preserve future hooks for adjusted charge distance, caught evaders, and action logging.
6. Keep the path/contact snapshot that produced the reaction so later steps can recompute or block safely after an evade.
7. Stop at `reaction-pending` plus request diagnostics; do not add the actual player-facing decision flow here.

Non-goals:

- no full evade movement implementation unless source-locked and explicitly approved during P7
- no cohesion loss for caught evaders
- no pursuit/rout behavior
- no direction-confirm action
- no stored reaction-decision objects
- no no-evade or evade-required handoff states

Validation:

- tests for no reaction, may-evade request, must-evade request, blocked request, and pause-state serialization

Manual acceptance:

- user verifies that the UI clearly pauses for reaction decisions instead of silently continuing

Progress 2026-05-19:

- Added a dedicated `src/engine/charge/reaction.js` solver that converts explicit defender-side `chargeReactionProfile` hooks into serializable reaction requests instead of inferring evade rights from unfinished troop-type rules.
- Reaction requests now preserve the exact charge path and contact snapshot that triggered the pause, with future fields for adjusted distance, caught evaders, and action logging already kept in the request model.
- `reduceSelectChargeStartManoeuvre` now pauses on `reaction-pending` whenever the selected start path reaches a defender that exposes a non-`none` reaction hook, while normal no-reaction paths still advance to `ready`.
- `reduceSetChargeTarget` explicitly clears stale reaction requests when the target/path context changes, so the pause state stays tied only to the current legal contact snapshot.
- The command panel helper copy now explains that the charge is paused in the reaction step and that the current path/contact state is intentionally frozen until the reaction branch is source-safely resolved or cancelled.
- Focused regression now covers engine request generation for `none`, `may-evade`, `must-evade`, `blocked-evade`, and invalid-profile `needs-source-check`, plus reducer serialization of a `reaction-pending` pause and the command-panel pause message.
- Focused validation is green: `node --test src/engine/charge/reaction.test.js src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js`.

Implementation status for this card:

- explicit reaction request modeling and the first `reaction-pending` pause skeleton are implemented; manual UI acceptance remains before later P7A/P7B work consumes this pause state

Follow-up ownership after replanning:

- P7-10 owns the visible reaction-gate overlays and concise why-card UX.
- P7-11 owns direction confirmation, declaration snapshot freezing, stored defender decisions, and no-evade/evade-required handoff states.

Stop condition:

- stop if mandatory evade or adjusted-distance wording is not source-closed enough to model safely

Expected result: charge can expose reaction/evade requirements without corrupting deterministic flow.

### [moved to P7B] P7-08 - Single-Unit Conformation Candidate Engine

Replanning note 2026-05-20: do not implement this card from P7. Its source-lock, model, candidate-solver, incomplete/blocked, UI, and application work now lives in P7B_todo.md.

Goal: generate and evaluate conformation candidates after contact for the approved single-unit charge scope.

Planned files:

- new src/engine/conformation/candidates.js
- new src/engine/conformation/candidates.test.js
- src/engine/conformation/index.js
- src/state/p7-charge.js or src/state/p0-state.js

Implementation steps:
1. Generate candidate post-contact alignments according to source-locked conformation rules.
2. Keep conformation separate from charge movement distance: no CP and no movement-distance deduction unless source says otherwise.
3. Evaluate candidates against battlefield bounds, current blockers, ZOC/most-threatening constraints, and optional/penalizing terrain constraints where source-locked.
4. Select the best legal candidate deterministically.
5. If no complete candidate exists, return incomplete or blocked status with explicit reasons.
6. Preserve all candidates for UI explanation and tests.
7. Return read-only preview data for UI; no UI path may snap bases or solve conformation directly.

Non-goals:

- no group conformation
- no melee factor/support computation
- no automatic terrain choice if the rule gives the player an option and the choice UI does not exist yet

Validation:

- tests for complete front conform, complete flank/rear conform where legal, blocked conform, incomplete conform, terrain-optional conform, and deterministic tie resolution

Manual acceptance:

- user verifies ghost bases show pre-conform and post-conform positions clearly

Stop condition:

- stop if conformation source diagrams cannot be mapped into deterministic candidate geometry for the approved subset

Expected result: P7 can preview why conformation is complete, incomplete, blocked, or optional.

### [moved to P7B] P7-09 - Conformation Shifting Skeleton

Replanning note 2026-05-20: do not implement this card from P7. Shifting is now part of P7B_todo.md so it can be planned and tested as its own conformation foundation phase.

Goal: add a source-locked shifting plan for conformation blockers without introducing group movement.

Planned files:

- new src/engine/conformation/shifting.js
- new src/engine/conformation/shifting.test.js
- src/engine/conformation/candidates.js
- src/state/p7-charge.js or src/state/p0-state.js
- src/state/p0-state.test.js

Implementation steps:
1. Source-lock which units can be shifted, which cannot, and what priority/minimality rules apply.
2. Model shifting as a conformation micro-operation, not a player movement command.
3. Prefer minimal number of shifted units and minimal shift distance according to source priority.
4. Add shifted-unit phase locks where source-locked, with explicit exceptions such as LI only if verified.
5. If shifting cannot be resolved safely, return blocked or incomplete conformation diagnostics.
6. Keep shifting outputs separate from charge-start slide outputs so diagnostics cannot mix opening alignment with conformation blocker movement.

Non-goals:

- no group movement implementation
- no full chain-push solver beyond approved single-unit conformation needs
- no rally system integration beyond future lock flags

Validation:

- tests for no-shift-needed, one minimal shift, two-candidate minimal-distance selection, unshiftable blocker, and shifted-unit lock flag

Manual acceptance:

- user verifies shifting preview is readable and does not look like normal movement

Stop condition:

- stop if shifting minimality or priority is not source-closed enough for deterministic implementation

Expected result: P7 can explain when conformation requires shifting and what the minimal approved plan is.

### [x] P7-10 - Charge Declaration And Reaction UI Overlays

Replanning note 2026-05-20: this card is presentation-only closeout work on top of P7-05 through P7-07. It must consume existing reducer/engine state and the later P7-11 decision state; it must not add legality or action ownership itself.

Goal: render the charge declaration path, contact point, contact classification, reaction state, and why-card from engine state.

Planned files:

- src/ui/p0-battlefield.js
- src/ui/p0-battlefield.test.js
- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- optional src/ui/p7-charge-overlays.js
- src/styles/p0-battlefield.css

Implementation steps:
1. Render eligible target highlights in charge target-selection mode.
2. Render the charge-start manoeuvre ghost and forward tunnel from charge-owned state; never draw a target-facing shortcut line.
3. Render the selected straight charge path and earliest-contact marker.
4. Render reaction-pending state without applying final movement.
5. Add a concise why-card covering target, start manoeuvre, path, contact type, current reaction request, and later no-evade handoff state once P7-11 provides it.
6. Ensure UI reads only reducer/engine data and never decides legality.

Non-goals:

- no decorative landing-page style UI
- no UI-owned contact or conformation calculations
- no combat result panels

Validation:

- focused render tests for target highlights, charge ghost, contact marker, contact side selection, and reaction state
- browser smoke after implementation
- charge drill browser smoke for front, flank, rear, blocker, reaction, and unreachable-target overlays

Manual acceptance:

- user verifies charge declaration and reaction overlays are understandable at normal play zoom

Stop condition:

- stop if the overlay cannot show the difference between normal movement preview and charge preview clearly

Expected result: P7 charge declaration and reaction-gate decisions are visible and explainable to the player.

Completion note 2026-05-20:

- Agent-side presentation closeout is complete without adding new legality or reducer ownership.
- The command panel now renders a reducer-read `Charge-Status` why-card that summarizes status, target, start manoeuvre, path, contact, reaction type, and handoff where present.
- Focused validation passed: `node --test src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js`.
- Browser/manual visual review is still required for normal play zoom readability; do not treat it as already performed.

### [x] P7-11 - Direction Confirmation, Reaction Decision, And No-Evade Handoff

Replanning note 2026-05-20: this is the actual P7 closeout card for reaction-gate behavior. It consumes the P7-07 pause skeleton and provides the state transitions that P7-10 only renders.

Goal: freeze the charge declaration before reaction, store the defender reaction decision, and hand off no-evade outcomes without resolving evade movement, conformation, or combat.

Planned files:

- src/state/p7-charge.js or src/state/p0-state.js
- src/state/p0-state.test.js
- src/engine/charge/model.js
- src/engine/charge/reaction.js
- src/ui/battlefield-command-panel.js
- docs/rules/open-verification.md

Implementation steps:
1. Add an explicit direction-confirm action that freezes target, start manoeuvre, path, contact, classification, selected contact side, and command-context snapshot.
2. Open the reaction gate from that frozen declaration snapshot.
3. Add reducer-owned reaction decisions for `no-evade`, `evade`, `forced-evade`, and `blocked-no-evade` where supported by current source data.
4. For `no-evade` and `blocked-no-evade`, enter a handoff state for P7A/P7B rather than applying conformation.
5. For `evade` and `forced-evade`, enter an explicit P7A-required state that blocks completion until P7A is implemented.
6. Ensure reset/cancel restores the pre-charge setup or order-start baseline consistently.

Non-goals:

- no real evade movement
- no adjusted charge distance
- no conformation application
- no melee dice
- no pursuit/rout
- no unit finished-state application beyond source-safe preview/handoff status

Validation:

- reducer tests for direction snapshot freezing, reaction decisions, no-evade handoff, evade-required block, stale-reaction reset, and cancel/reset behavior

Manual acceptance:

- user verifies direction confirmation opens the reaction modal and that `Do not evade` moves to a clear no-evade handoff state while `Evade` clearly waits for P7A

Stop condition:

- stop if the direction snapshot cannot freeze all facts needed by P7A and P7B

Expected result: P7 has a replay-ready charge declaration and reaction decision gate without pretending evade or conformation is complete.

Completion note 2026-05-20:

- Agent-side implementation is complete in engine/state/UI code.
- The reducer now freezes an explicit declaration snapshot behind `Richtung bestaetigen`, opens a blocking reaction modal, stores reducer-owned reaction decisions, and enters explicit `no-evade` / `evade-required` handoff states for P7A and P7B.
- Focused validation passed: `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js`.
- Browser/manual reaction-flow review is now completed and accepted as part of the broader P7 closeout in `P7-12`.

Carry-forward note:

- P7C is now planned as a later UI-ordering cleanup phase before P8. P7-10 should improve the current charge overlays and why surfaces, but it must not pre-implement the broader nested command-menu restructuring reserved for P7C.

### [x] P7-12 - Validation Package And Handoff

Goal: run the full validation package and close P7 docs consistently.

Planned files:

- P7_todo.md
- roadmap.md
- docs/rules/open-verification.md

Implementation steps:
1. Run full automated test suite.
2. Run build.
3. Run browser smoke for approved P7 charge declaration and reaction-gate interactions.
4. Record P7A/P7B carry-forward items honestly.
5. Align roadmap and board status for handoff.

Non-goals:

- no P8 shooting implementation
- no P7A evade implementation
- no P7B conformation implementation
- no undocumented manual acceptance claims

Validation:

- `npm run test`
- `npm run build`
- local browser smoke

Manual acceptance:

- user validates single-unit charge button availability and disable rules
- user validates the charge drill scenario includes front, flank, rear, blocker, ZOC, raw-out-of-range, and path-unreachable cases
- user validates target highlighting and charge-start controls
- user validates the tunnel starts forward from the charger/start pose and updates with charge `Slide` or `Wheel`
- user validates reaction pause behavior for implemented subset
- user validates direction confirmation and reaction decision behavior
- user validates contact classification display
- user validates no-evade and evade-required handoff states
- user validates reset/cancel behavior after reaction-gate states

Stop condition:

- stop if any P7 success criterion is unmet or unverifiable

Expected result: P7 closes as an honest, tested single-unit charge declaration and target reaction-gate foundation, with P7A and P7B ready for user review.

Progress note 2026-05-20:

- Full automated validation is complete: `npm run test` passed with 323 tests green, and `npm run build` completed successfully.
- Focused P7 validation is also green, including reducer, command-panel, and battlefield charge tests.
- Browser smoke is now executed in-session with integrated browser tools. Verified flows include direct front charge, explicit direction confirmation, reaction modal, `Nicht ausweichen` -> `No-Evade-Handoff`, `Ausweichen` -> `Evade-Handoff`, reachable `Wheel` and `Slide` start-manoeuvre toggles, out-of-range targets, blocked current-path targets, and the dedicated ZoC-blocked lane.
- Final P7 closeout is now complete: the user accepted the validated charge declaration and reaction-gate flow on 2026-05-20.

Manual handoff note:

- P7 is now marked complete. P7A may move from draft-review into the next approval decision, but not into implementation without a separate explicit phase start.

## Post-P7 And Post-P16 Carry-Forward

These items should not block the first P7 pass unless the user explicitly pulls them forward:

- group movement
- group charges
- group conformation
- basic evade and adjusted charge movement now move to P7A before P8
- basic conformation and shifting now move to P7B before P8
- multi-unit support networks
- full extension/contraction
- full all-troop special exceptions
- complete terrain movement and combat terrain interaction
- advanced evade chains, full secondary-target recursion, and full terrain/table-edge/interpenetration details beyond P7A
- melee combat factors, support factors, cohesion loss, rout, pursuit, and victory
- AI charge planning
- multiplayer reaction privacy and clock/timing model
