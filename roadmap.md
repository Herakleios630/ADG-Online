# AdG Online Roadmap

Development is phase-gated. Do not work on the next phase until the current phase has been implemented, tested, demonstrated, and explicitly approved by the user.

## Status Overview

- [x] Repository, planning docs, and rule-governance foundation
- [x] P0 - Product Shell Feasibility
- [x] P1 - Rule Knowledge + Data Foundation
- [x] P2 - Fundamental Geometry
- [x] P3 - Tournament Setup + Terrain + Deployment Foundation
- [x] P4 - Movement Commands
- [x] P5 - ZOC + Movement Validation
- [x] P6 - Corps + Command System
- [ ] P7 - Charge + Conformation
- [ ] P8 - Shooting System
- [ ] P9 - Melee Combat System
- [ ] P10 - Rout, Pursuit, Army Cohesion + Victory
- [ ] P11 - Army Builder
- [ ] P12 - Full Match Flow + Local Singleplayer
- [ ] P13 - Replay, Undo + Review Viewer
- [ ] P14 - Multiplayer Preparation
- [ ] P15 - Visual Asset System + Player Colors
- [ ] P16 - QA, Packaging + Release Candidate

## Release Target Framing

The current P0-P16 roadmap should be treated as the first core playable beta / release-candidate track, not as a promise of tournament-complete AdG V4 coverage.

By P16, the target is a coherent local game loop for the implemented rules subset: setup, core command/movement, ZOC, charge/conformation, shooting, melee, rout/victory, army creation, replay, multiplayer preparation, visual assets, and QA packaging. That milestone can be a beta candidate only if the release notes clearly identify implemented, verified, placeholder, and open rule areas.

After P16, plan a dedicated rules-completeness pass for the remaining details that are too large or source-sensitive for the first beta track. Likely post-P16 work includes full group movement, extension/contraction, difficult maneuvers, special troop exceptions, deeper terrain effects, full deployment legality, hidden reveal edge cases, advanced multiplayer privacy, AI fairness, and tournament polish.

Do not describe the P16 output as tournament-complete unless the rule coverage matrix proves those details are implemented, source-verified, tested, and accepted.

## Global Rules

Before every phase:

- brainstorm the feature with the user when useful;
- re-check concepts, source PDFs, errata, extracted markdown, and open verification notes;
- identify edge cases and test cases;
- confirm the current phase scope;
- use a feature, bugfix, or docs branch for implementation work;
- keep JavaScript modules under 800 lines where possible and never above 1000 lines without refactoring or explicit approval;
- treat `standard-200` as the default target unless the user explicitly approves a different format.
- keep `roadmap.md` as the durable master plan and one active phase checklist such as `P0_todo.md` as the concrete execution list.
- write every active phase checklist as an execution board with per-card goal, planned files, implementation steps, non-goals, validation, manual acceptance, stop condition, and expected result.
- when preparing the next phase, GPT-5.5 should draft the next execution-board checklist such as `P1_todo.md`, `P2_todo.md`, or later phase boards; GPT-5.4 should then execute the approved active checklist card by card.

## P0 - Product Shell Feasibility

Status: [x] Complete - accepted by user on 2026-05-14
Active task list: see `P0_todo.md`.

Goals:
- Render a start menu shell.
- Add an options/settings shell.
- Show Standard 200 points as the default training format.
- Add a battlefield screen.
- Create one rectangular unit.
- Implement basic movement: advance only.

Dependencies:
- Existing Vite project foundation.
- Minimal route or screen-state model.
- Minimal rendering surface.
- Unit pose and base dimensions defined as serializable state.

Success criteria:
- App starts at a menu, not directly inside hidden engine code.
- Options screen can show placeholder player color and explanation settings.
- Standard 200 points is visible as the default format, but no full army/setup validation is claimed yet.
- Battlefield renders in the browser.
- One unit renders at a deterministic position and facing.
- User can preview and confirm a straight advance.
- The advance updates state through an action, not direct UI mutation.
- Deployment overlays can be cycled for P0 visual help without claiming full setup-rule validation.
- No rotation, ZOC, command, terrain, combat, or conformation rules are implemented yet.
- Unit tests or smoke checks exist for the small state/action path.
- Browser smoke test confirms menu, options, and battlefield navigation.
- User approves P0 before P1 begins.

## P1 - Rule Knowledge + Data Foundation

Status: [x] Complete - accepted by user on 2026-05-16

Goals:
- Create AI-readable rule markdown structure.
- Define data separation between unit definitions, unit instances, rosters, and rule tables.
- Define the standard-200 format profile.
- Define the official setup sequence as a state machine plan.
- Define hidden-information state and player-view requirements.
- Establish source-reference and open-verification workflow.
- Select and configure initial test approach.

Dependencies:
- P0 approved.
- `docs/rules-knowledge.md` accepted.
- Source PDFs, OCR working copies, and spreadsheet available.

Success criteria:
- `docs/rules/` index and first extracted rule summaries exist for the next implementation areas.
- `docs/rules/standard-200.md`, `docs/rules/sequence-of-play.md`, `docs/rules/terrain-and-setup.md`, and `docs/rules/hidden-info.md` are reviewed and expanded enough to guide P2-P4.
- Unit-level state is documented separately from global movement/combat/rule tables.
- Standard-200 data requirements are captured: 200 points, 3 corps, mandatory camp, table profile, commander/camp budget, and initiative inputs.
- Hidden information is represented as a local gameplay concern, not only a multiplayer concern.
- OCR working copies are documented as search aids and cross-check helpers, never as authoritative replacements for the original source PDFs and errata.
- Open verification items are tracked for image-only PDF sections.
- Test command exists and can run at least one placeholder or foundation test.
- File-size guard convention is documented in project governance.
- User approves P1 before P2 begins.

Final handoff state:
- P1 documentation and validation baseline are accepted as complete for phase progression.
- Open rule-source questions remain tracked in `docs/rules/open-verification.md`; these are carried forward honestly instead of guessed away.
- Current open verification does not block P2 fundamental geometry, but it does block later setup, terrain, and hidden-information implementation details.
- P2 may now move into brainstorming and execution-board preparation; implementation still requires an approved P2 board.

## P2 - Fundamental Geometry

Status: [x] Complete - accepted by user on 2026-05-16
Active task list: see `P2_todo.md`.

Goals:
- Rotation.
- Facing.
- Front / flank / rear detection.
- Unit base geometry independent of visual sprite dimensions.

Dependencies:
- P1 approved.
- Unit represented as a rotated rectangle.
- Geometry module created with testable pure functions.

Success criteria:
- Unit corners, edges, center, and facing zones are computed deterministically.
- Front, flank, and rear relationships are detected from geometry.
- Visual debug overlay matches computed geometry.
- Tests cover axis-aligned, rotated, edge, and corner cases.
- User approves P2 before P3 begins.

Final handoff state:
- P2 deterministic geometry and debug tooling are accepted complete.
- P2 established pure rotated-rectangle geometry, unit-base edges, facing boundaries, geometric relationship labels, debug-unit drag and rotation, selected-reference rotation, and browser-validated facing overlays.
- P2 also established that future table-edge, collision, contact, and legality work must reason from full unit footprints rather than center-only assumptions.
- Current open verification does not block completed P2 geometry, but still blocks P3+ setup, terrain, deployment, and hidden-information implementation details until source-checked.
- P3 planning may begin, but implementation requires an approved P3 execution board and explicit user approval.

## P3 - Tournament Setup + Terrain + Deployment Foundation

Status: [x] Complete on `feature/p3-setup-terrain-foundation` - user accepted P3 on 2026-05-16 and PR handoff is ready
Active task list: see `P3_todo.md`.

Goals:
- Battlefield dimensions.
- Standard-200 battlefield profile.
- Initiative, attacker/defender, and region-selection model.
- Terrain piece model.
- Terrain selection, placement order, adjustment, and road-last model.
- Terrain placement preview.
- Camps, fortifications, and obstacles.
- Battle plan and hidden declaration model.
- Ambush marker and flank march placeholders.
- Deployment-zone model.
- Dismounting decision placeholder.

Dependencies:
- P2 approved.
- Verified setup and terrain source notes for standard-200 setup.
- Terrain data model separated from rendering.
- Hidden-information model from P1.
- `Reference_Sheet_V4.pdf` added as a tournament quick-reference cross-check; errata and full rules remain authoritative.

Success criteria:
- Terrain pieces are serializable state objects.
- Terrain selection and placement use engine validation, not freeform UI mutation.
- Compulsory terrain, terrain quotas, placement order, road-last placement, and adjustment are represented as data or explicit open verification items.
- Camps, fortifications, obstacles, battle plans, ambush markers, flank march declarations, deployment zones, and dismounting are modeled as setup state even if not fully interactive yet.
- Player-view handling exists for private setup data.
- Tests cover legal and illegal setup examples for the implemented setup subset.
- User approves P3 before P4 begins.

Current planning state:
- P3 should place labelled terrain and setup-object placeholders with real UD-space footprints, but not claim complete official terrain legality until source verification is complete.
- The right-side battlefield panel should evolve into a phase tracker: setup/pre-battle steps during P3, later command/movement/shooting/melee/rout-victory steps during battle phases.
- The tournament battle-plan board should be modeled separately from battlefield sectors, with practical `left`, `center`, `right`, and `flank march` assignment fields.
- Battle plans, flank-march details, ambush contents, fake-marker truth, and hidden off-table assignments must be designed as secret owner data for future multiplayer.
- Ambush marker contents should be private canonical setup data, with public marker shells kept separate for player-view filtering and later correct ambush play.
- Deployment placeholders should preserve corps identity, full footprints, and non-overlap hooks for later official deployment validators.
- P3 branch handoff is complete and the dirty accepted-P2/P3 worktree has been carried onto `feature/p3-setup-terrain-foundation` without discard.
- P3-01 source review is complete and P3-02 setup skeleton plus phase tracker are accepted.
- P3-03 standard-200 battlefield profile plumbing is accepted by user review.
- P3-04 established the terrain placeholder data model with serializable state objects, shape/source-status fields, and full-footprint battlefield-bounds checks.
- P3-05 implemented and user-accepted placeholder terrain palette, labelled battlefield rendering, and drag movement that stays inside reducer-enforced full-footprint bounds.
- User explicitly accepted P3-05 only at placeholder level; official river and road constraints such as side-to-side placement remain open for later rule-validation work.
- P3-06 implemented and user-accepted a terrain validation skeleton that separates verified physical errors from explicit `needs-source-check` warnings in reducer state and the battlefield UI.
- P3-07 implemented and user-accepted public setup-object placeholders, including two mandatory standard-200 camps plus camp-step placeholder hooks for fortifications, obstacles, and stakes.
- User explicitly accepted P3-07 only at placeholder level; stakes, fortification, and obstacle legality remain open for later rule-validation work.
- P3-08 implemented and user-accepted a private battle-plan board with owner-only placeholder corps assignments for `left`, `center`, `right`, and `flank march`.
- P3-09 implemented and user-accepted optional public ambush-marker shells and owner-private marker contents as placeholder hidden-setup infrastructure, with explicit add-first placement instead of forced default markers.
- P3-10 implemented and user-accepted a first setup privacy projection with `canonical`, `player-one-view`, `player-two-view`, and `hotseat-handoff` rendering modes.
- P3-11 implemented and user-accepted explicit deployment-zone placeholders and visible deployment placeholder metadata as source-status-driven setup scaffolding, while leaving any light-troop sub-zone source-blocked for later rule-complete work.
- P3-12 consolidated automated validation, and the user then reported the manual/browser review as acceptable for the current placeholder foundation.
- Final pre-close polish aligned the mandatory camps with the owning table edge: player 1 near the lower edge, player 2 near the upper edge.
- P3-13 closed the phase handoff: tests and build are green, planning boards agree, P3 is complete, and P4 remains not started pending a future explicit start decision.

## P4 - Movement Commands

Status: [x] Complete - accepted by user on 2026-05-17
Active task list: see `P4_todo.md`.

Goals:
- Advance.
- Wheel.
- Slide.
- Command selection UI.
- Command context skeleton for movement validation.

Dependencies:
- P3 approved.
- Movement command data model.
- Distance measurement primitives.
- Verified movement ruler and basic movement allowance notes.
- Active player, active corps, commander, in-command status, and CP placeholder available.

Success criteria:
- Movement commands are represented as declarative actions.
- Advance, wheel, and slide preview and apply through the engine.
- Any official movement legality claim uses command context; otherwise the UI labels it as a geometry/dev preview.
- Wheel distance is measured by the moving outer front corner.
- Slide distance is tracked distinctly from advance distance.
- Terrain movement effects are either implemented for the approved subset or explicitly blocked as later work.
- UI offers only current-phase movement command proposals.
- User approves P4 before P5 begins.

Current planning state:
- P4 should build a movement-command spine, not the entire movement ruleset.
- Command context is mandatory before official movement wording: active player, active corps, commander hook, CP placeholder, in-command facts, and source status.
- P4 should implement advance, wheel, and slide as declarative preview-and-confirm commands.
- Movement must continue the P2/P3 full-footprint invariant rather than checking only unit centers.
- Full group movement is intentionally deferred from the first P4 implementation slice, but P4 command data must preserve hooks so group movement can be added later without redesigning the movement action model.
- Terrain movement, ZOC restrictions, difficult maneuvers, special troop exceptions, extension/contraction, evade, disengage, charge movement, pursuit, and rout movement remain later phases or post-beta detail-pass work unless explicitly pulled forward by user approval.
- P4-00 confirmed that PR #3 is merged and that the implementation branch should be created from updated `main` as `feature/p4-movement-commands` before engine work begins.
- P4-01 added a focused movement source-status note and concrete open-verification IDs for command context, allowances, wheel measurement, slide limits, group movement, turn restrictions, and special troop exceptions.
- P4-02 completed the file-size/refactor preflight: movement-adjacent UI drag/command/card helpers were extracted, setup reducer logic moved into `src/state/p0-setup.js`, and the oversized stylesheet was split into smaller partials.
- After P4-02, the current pre-movement implementation surfaces are back under the guardrails: `src/state/p0-state.js` 559 lines, `src/ui/p0-app.js` 882 lines, `src/ui/p0-battlefield.js` 722 lines, and the former oversized `src/styles/p0.css` is now a 4-line import aggregator.
- P4-03 has agent-side implementation and validation for the command-context skeleton: serializable active player/corps/phase placeholder state exists, a right-panel command-context card is rendered, and focused/full tests plus build are green.
- P4-03 still awaits user manual acceptance before the phase can advance to the movement-command data model.
- P4-04 is complete: a dedicated movement data spine now exists in engine/state code with declarative command ids (`advance`, `wheel`, `slide`), normalized segments, preview results, diagnostics, and confirmation state, all kept serializable and UI-free.
- P4-04 intentionally does not implement geometry or legality yet; it prepares P4-05 to move the existing advance prototype onto the new movement preview/apply pipeline.
- P4-05 now has agent-side implementation and validation: advance preview uses a movement-engine path, respects unit rotation, rejects full-footprint battlefield overflow, and applies only on confirmation through reducer state.
- P4-05 has user manual acceptance and is complete; the preview ghost can also be dragged directly for a more intuitive advance interaction.
- P4-06 is user-accepted: the final wheel UX uses one wheel mode, front-corner drag handles, chained preview segments, shared budget handling, and trail ghosts for earlier committed preview steps before the final confirm.
- P4-07 is user-accepted: slide can begin the chain, remains free laterally under the current user-approved P4 assumption, stays confirm-blocked until the chain contains at least `1 UD` of qualifying non-slide movement, and is limited to one slide per unit per movement phase.
- P4-08 is user-accepted: the battlefield movement card exposes advance, wheel, and slide through the shared preview pipeline, preview cancel is reducer-owned and separate from test reset, and the card-level diagnostics presentation is acceptable for current P4 scope.
- P4-09 is user-accepted: diagnostics are visible and acceptable for current P4 scope, while the user correctly identified that stricter active-player and movement-phase legality still belongs to later rule-conform phases.
- P4-10 delivered the final validation package: full repository tests and build are green, the local Vite app serves successfully, and the remaining practical interaction smoke was completed through user-side manual acceptance for current P4 scope.
- P4-11 closed the phase handoff: P4 is complete, documentation is aligned, residual rule-conformance gaps are documented for later phases, and P5 remains explicitly gated until the user starts it.

Final P4 handoff state:
- P4 established a deterministic movement-command foundation with command-context skeleton state, declarative advance/wheel/slide segments, chained previews, confirmation gating, cancel/reset separation, and serializable diagnostics snapshots.
- P4 remains intentionally short of full rule-conform movement legality. Still-open work for later phases includes ZOC, terrain movement effects, movement allowances by troop type, group movement, difficult maneuvers, special troop exceptions, active-player/ownership enforcement, strict phase legality, charge, and conformation.
- The completed P4 output should be described as a validated movement-command foundation, not as tournament-complete movement rules.

## P5 - ZOC + Movement Validation

Status: [x] Complete - accepted by user on 2026-05-17

Goals:
- ZOC detection.
- Most threatening enemy.
- ZOC restrictions.
- Segment validation.
- Subsegment splitting.
- Error reporting.

Dependencies:
- P4 approved.
- Geometry, terrain, and movement segment data available.
- Source-page verification for ZOC rules, movement restrictions, and errata.
- Validation result format accepted.

Success criteria:
- ZOC is computed from enemy front geometry.
- Unit entry into, presence in, and exit from ZOC are detected.
- Most-threatening enemy is selected by rule priority.
- Movement is split at ZOC, terrain, contact, and table-edge boundaries where applicable.
- Illegal movement produces rule-based explanations and legal alternatives where possible.
- Tests cover mid-segment ZOC entry, blocked movement, invalid end states, and errata-sensitive ZOC cases.
- User approves P5 before P6 begins.

Final P5 handoff state:
- P5 planning has been explicitly requested by the user and the dedicated execution board is drafted in `P5_todo.md`.
- P5 execution board is approved by the user for implementation, and `feature/p5-zoc-movement-validation` is prepared as the active branch.
- P5-01 source review is completed as planning documentation work: `docs/rules/open-verification.md` now includes explicit ZOC/movement legality blocker IDs for the approved P5 subset.
- P5-02 is completed as engine foundation work: `src/engine/zoc/` now contains deterministic geometry primitives and tests for front-band bounds, footprint-aware point sampling, and enemy-contact detection without yet deciding most-threatening priority.
- P5-03 is completed as selector foundation work: `src/engine/zoc/most-threatening.js` adds deterministic subset ranking (front distance, coverage, lateral alignment, deterministic fallback) with explicit `needs-source-check` output when deeper tie-break interpretation remains unresolved.
- P5-04 is completed as movement-path infrastructure work: `src/engine/movement/path-splitting.js` provides deterministic per-segment path sampling and ZOC transition detection for mid-segment checks.
- P5-05 is now user-accepted as a conservative subset foundation: movement validation computes entry/remain/exit ZOC transitions with most-threatening context and keeps source-status honesty for unresolved rule-sensitive exceptions.
- P5-06 is complete and validated: movement actions are now reducer-gated by active player ownership and active movement phase.
- P5-07 is complete and user-validated for the approved current subset:
	- display-only overlays include enemy ZOC bands, near-ZOC cue at `0.5 UD`, and a most-threatening line tied to validation snapshots;
	- baseline enemy fixture now includes a center enemy plus left/right supports for practical most-threatening testing;
	- conservative source-gated legality opening is implemented for ZOC-constrained `advance`/`wheel`: allowed only when the maneuver closes center-distance to the most-threatening enemy and sampled path remains contact-free; blocked otherwise.
- P5 automated validation package is green on current branch: `npm run test` (142 pass, 0 fail) and `npm run build` (success).
- User manually validated the implemented P5 scope and then explicitly approved P5 completion on 2026-05-17.
- P5 scope includes the two known post-P4 enforcement gaps: active-player ownership gating for movement actions and strict command-vs-movement phase legality gating.
- P5 kept engine-first ZOC legality (detection, most-threatening selection, path splitting, legality diagnostics) with UI as display-only explanation.
- P5 UI explanation layer is implemented as display-only and tied to engine data: toggleable enemy-ZOC overlay, near-ZOC cue at `0.5 UD`, and a most-threatening-enemy line visualization.
- P5 validation fixtures now include practical enemy support units for most-threatening checks while preserving setup-placeholder stability.
- P5 must remain explicit about unresolved source-sensitive areas in `docs/rules/open-verification.md`; no tournament-complete wording is allowed unless those items are verified and implemented.

## P6 - Corps + Command System

Final P6 handoff state:
- `P6-01` deterministic corps fixture is implemented and user-accepted for readability/spacing.
- `P6-02` command data model and corps context are implemented and already support the current round/corps flow scaffolding.
- `P6-03` command-range geometry validator is implemented as pure nearest-point measurement with the user-requested strict `< range` boundary and accepted for the current P6 subset.
- `P6-04` now includes initial reducer wiring at corps activation: selecting an active corps creates a deterministic placeholder CP snapshot and logs the activation roll for replay/audit, while real spending gates remain open.
- `P6-05` initial in-command snapshot wiring is now implemented: active-corps selection resolves the commander, selected-unit changes recompute the snapshot, and the command-context card shows the resulting status.
- Battlefield diagnostics now render a selected-unit command link to the active commander, using green for `in-command` and orange for `out-of-command` as a display-only aid.
- Movement previews now include CP affordability diagnostics for the current frozen order snapshot, and movement confirms spend the approved base/out-of-command order cost from the active corps CP pool.
- Movement validation now hard-blocks confirms when the command snapshot is structurally illegal for the approved subset, specifically `no active corps`, `no resolved commander`, or `wrong corps`, instead of leaving those states as non-blocking placeholders.
- Movement validation now also hard-blocks source-sensitive difficult-manoeuvre cases for the current P6 subset while leaving ordinary current-subset moves confirmable; actual difficult-manoeuvre CP charging still stays deferred until the rule classification is source-closed.
- P6-06 has started with a first enforced movement-budget subset: movement validation now blocks over-budget previews for cavalry, medium infantry, and heavy infantry, heavy infantry operational-zone allowance is measured deterministically from the nearest enemy footprint, and advance/wheel preview clamps now use the same subset budgets.
- The main battlefield command card now mirrors that same P6 movement-budget subset in visible helper copy and summary labels, so the player sees the active `3 UD` medium-infantry budget and the heavy-infantry `2 UD` versus `3 UD` operational-zone state directly in the panel.
- P6-07 has started with a first diagnostics readout slice: the right-side command-context card now shows corps activation progress counts plus per-corps `not-yet-activated` / `active` / `spent` status directly from reducer state.
- The battlefield itself now mirrors part of that P6-07 progression: active-corps units render pending/done status outlines, selected units keep the stronger selected emphasis, and spent corps remain visibly marked even while disabled.
- The right-side command-context card now also surfaces a first practical CP readout from reducer state: available, spent, free, last roll, and recent ledger entries are visible without opening debug tooling.
- The same right-side card now also renders a dedicated activation-roll display block, so the current D6 result plus rolled-CP and free-CP start components are visible as a compact visual snapshot instead of only as summary text.
- The same right-side card now also shows the live current-order CP preview for confirmable movement orders, including total cost, free-CP usage, and component breakdown, so order pricing is visible before the player commits.
- The same right-side card now also mirrors current order-level blocked diagnostics from the movement snapshot, so command-legality, commander-engaged, difficult-manoeuvre, and CP-cost blockers are visible on the persistent diagnostics surface instead of only in the left movement panel.
- The same right-side card now also renders a compact commander profile block with resolved quality and range, so the player can read the active corps command envelope directly from the snapshot instead of only from the longer commander label.
- Non-included commander movement now consumes the corps free CP when the commander starts moving, and a commander-move reset refunds it, so the CP readout matches the actual general-move state instead of showing the free CP as untouched.
- Eligible commander-led unit moves now also have an explicit free-CP choice in the command panel: included commanders can spend the corps free CP on their unit's base order, and the same reducer hook is prepared for later attached non-included commander movement without rebinding the CP model again.
- Setup progression UX is now less fragile during the full setup flow: the left column keeps `Naechster Schritt` / `In die Schlacht` pinned at the top across all setup steps instead of placing it below the terrain/setup helper cards.
- The battlefield reset action is now explicitly selected-unit scoped and refunds that unit's approved P6 CP usage from the ledger, so restoring a moved unit also restores the corresponding corps CP state instead of leaving the command display underfunded.
- P6-08 handoff prep is now concrete instead of vague: the board carries an explicit user smoke checklist for setup progression, setup-baseline reset behavior, CP refund consistency, command-range readability, corps progression, subset budgets, and blocked-order diagnostics.
- The battlefield now also renders the active command envelope more clearly for the approved P6 subset: the active commander gets a persistent visible command-range halo labelled in `UD`, instead of hiding range visualization behind hover-only helper rings.
- The right-side command-context card now adds a compact `CP Bilanz` visualization and a pip-based D6 face for the activation roll, so CP pool state and the current roll snapshot are easier to read without changing reducer ownership of the numbers.
- The activation-roll card now also shows the concrete `(Wurf + Generalwert) / 2` formula behind the rolled CP result, so the user can see the die contribution and commander-value contribution directly in the diagnostics surface.
- The earlier future mandatory-move color hook is now visible on-table as well: active-corps units with unresolved mandatory-move flags render an explicit red badge in addition to the red outline, while the rule path itself remains outside approved P6 scope.
- A real round-flow bug was also fixed during P6-08 smoke feedback: after player 1 finished all corps and stepped through the placeholder post-movement phases, player 2 could land in an empty corps-selection dialog. The turn-start reducer now resets the corps-activation cycle per entering player turn, and automated state coverage now exercises the full player-switch path.
- P6-08 smoke now also has a reproducible blocked-order path instead of relying on luck: the battle command panel can temporarily mark the active commander as engaged, which exercises the already-existing blocked diagnostics and reducer gating without claiming any new P7 combat behavior.
- User smoke feedback on 2026-05-18 also clarified the intended later rule direction for the commander-engaged pricing path: when the commander is in combat and the moved unit is not the commander's own attached or included group, the future source-closed behavior should likely be `+1 CP`; this remains tracked as open pricing closure, not implemented P6 logic.
- P6 rough-functional command/corps work now also includes user-accepted `P6-09` commander attach skeleton behavior: the selected commander enters an attach-targeting mode with visible remaining-radius preview, eligible host highlighting, click-to-place ghost behind the host, and confirm-to-attach. Voluntary same-turn detach is no longer offered; the temporary relation is cleared automatically on player turn end. Remaining pricing/contact details stay explicit source-checked refinement items rather than hidden assumptions.

Status: [x] Complete - accepted by user on 2026-05-18; PR handoff in progress

Goals:
- Corps activation.
- CP rolling.
- CP spending.
- In-command and out-of-command state.
- Free commander CP and commander movement rules.

Dependencies:
- P5 approved.
- Game turn and phase model.
- Commander and corps state model.
- Deterministic random module.
- Verified command and CP source notes.

Success criteria:
- Corps activate in legal sequence.
- CP generation is deterministic and auditable.
- CP costs are charged for implemented movement orders and difficult maneuvers.
- Unit state can record current in-command/out-of-command status without duplicating rule tables.
- P4 command skeleton is replaced or completed by verified CP and command-range rules.
- Out-of-command and command-range checks produce explanations.
- User approves P6 before P7 begins.

Current planning state:
- P6 execution board is drafted in P6_todo.md, approved by user, and active for phased implementation.
- P6 fixture target is defined for both players: three corps each, commander qualities (`Brilliant`, `Competent`, `Ordinary`), and practical side-by-side deployment-zone placement for command tests.
- Command range anchor for P6 is fixed by user quote and must be source-locked in P6-00: straight-line distance between nearest points on commander base and selected unit/group base.
- Movement-phase corps activation in P6 is planned as open-order one-by-one activation with no same-phase re-activation after a corps is finished.
- P6 CP planning anchor includes roll-on-activation flow and formula cross-check (`CP = ceil((1D6 + commander value) / 2) + 1 free CP`), with unresolved details kept in open verification until source-confirmed.
- P6 command-cost subset is planned around in-range cost, out-of-range surcharge, and difficult-manoeuvre surcharge for implemented movement actions; charge/rally-dependent costs remain phase-gated hooks until owning phases.
- P6-00 planning/source-lock card is complete: command-system blockers and source-sensitive ambiguities are explicitly tracked in docs/rules/open-verification.md before engine implementation starts.
- P6-01 fixture implementation is agent-side complete and validated (`npm run test` green, build green): deterministic two-player three-corps command fixture units are now seeded with requested compositions, commander-quality/range metadata, and base-profile metadata; manual battlefield acceptance is pending.
- P6-02 command data model and corps context are agent-side complete and validated: the command context now carries serializable corps lifecycle state, CP/commander/in-command skeleton fields, and explicit active-corps completion hooks; manual acceptance is pending.
- P6-03 pure command range is validated in automated tests with the user-requested strict `< range` boundary; manual acceptance of practical behavior is still pending.
- P6-04 has moved past pure engine helpers into first reducer wiring: corps activation now seeds a deterministic placeholder roll plus CP state for the active corps, but spending integration and final source-backed commander-value/random plumbing are still open.
- P6-04 also now debits the approved subset order cost at movement confirm time and blocks previews that would exceed the remaining active-corps CP pool; difficult-manoeuvre and later-phase surcharges remain open.
- A separate difficult-manoeuvre classifier seam now exists for movement previews, and source-sensitive cases now conservatively block confirmation rather than slipping through as advisory-only diagnostics; CP charging still remains unchanged until the open trigger set is source-closed.
- The current P6 subset now also conservatively blocks movement confirmation when the active commander snapshot is marked `engaged in combat`, rather than pretending the open commander-engaged surcharge can already be priced correctly.
- P6-05 initial reducer wiring is in place for command snapshots: the active corps now resolves its commander from the fixture, and selecting a unit updates `in-command` versus `out-of-command` state in the serializable command context and side-panel diagnostics.
- Movement preview state now preserves a frozen order-start command snapshot across chained move commands. The user later source-closed the timing rule from `Rules.pdf` p.26: command range is evaluated when the order is given, so later second or third moves require a fresh check with a new order.
- The user also source-closed P6 movement-order atomicity on 2026-05-18 from the `Rules.pdf` order wording: one CP grants one fully resolved move order to one unit or group, so movement steps cannot be interleaved across units. Existing reducer flow already blocks unit switching during a pending preview and clears the preview if corps context changes.
- The approved P6 subset now also blocks movement confirmation when that frozen/live command snapshot is structurally illegal: no active corps, unresolved active-corps commander, or a selected unit outside the active corps.
- Battlefield rendering now exposes the same command snapshot visually with a commander link line for the selected unit, reducing ambiguity while command gating is still being built out.
- Movement-budget subset work has started in engine/state code: validation now reports and blocks approved subset overages for cavalry, medium infantry, and heavy infantry; heavy infantry can reach `3 UD` only when it starts more than `4 UD` from the nearest enemy footprint in the current conservative subset; reducer preview clamps now match that subset for advance and wheel.
- The remaining move-interleaving question is now better supported by OCR and source-note reads in favor of `one order = one resolved move`, but it is still held open until direct Rules/Errata verification.
- Free movement drag for non-included generals is now staged as a movement-phase commander path with a `5 UD` cap under active-player plus active-corps gating; this is an implementation bridge pending full command-cost validation.
- Commander attach command flow is implemented and accepted as late-P6 work (`P6-09`); voluntary same-turn detach is treated as disallowed in the current slice, while combat-lock constraints and exact attach/end-of-turn pricing-timing remain explicitly deferred to later source-closed work.

## P7 - Charge + Conformation

Status: [ ] Not started

Goals:
- Charge declaration.
- Contact detection.
- Conformation preview.
- Shifting.
- Evade/reaction hooks where required by charge flow.

Dependencies:
- P6 approved.
- Source-page verification for charge, contact, conformation, shifting, evasion, and errata.
- Movement validation stable enough to support charge paths.

Success criteria:
- Charge target, direction, range, movement, and contact are validated.
- Front, flank, rear, and corner contacts are classified.
- Conformation preview shows alignment and blocked/incomplete cases.
- Shifting follows priority and unshiftable-unit restrictions.
- Explanations identify why conformation is complete, incomplete, blocked, or optional.
- User approves P7 before P8 begins.

## P8 - Shooting System

Status: [ ] Not started

Goals:
- Shooting ranges.
- Line of sight.
- Target eligibility and priority.
- Shooting modifiers and results.

Dependencies:
- P7 approved.
- Verified shooting rules, terrain cover rules, and errata.
- Deterministic dice/random module.

Success criteria:
- Shooting actions are declared, validated, and logged.
- Range, visibility, terrain, cover, target restrictions, and modifiers are explained.
- Dice results are deterministic and replayable.
- Cohesion effects from shooting are applied through engine state transitions.
- Tests cover range boundaries, blocked line of sight, cover, and illegal targets.
- User approves P8 before P9 begins.

## P9 - Melee Combat System

Status: [ ] Not started

Goals:
- Dice system.
- Combat factor tables.
- Support and multiple attack classification.
- Combat resolution.
- UI breakdown.

Dependencies:
- P8 approved.
- Verified combat factor and modifier tables.
- Contact and support classification from conformation.
- Rule table data model for combat factors.

Success criteria:
- Dice rolls are deterministic from seed and logged actions.
- Melee calculations show full factor/modifier breakdown.
- Cohesion loss is applied from the rule table.
- Errata-sensitive abilities are tested.
- UI presents combat resolution without owning combat logic.
- User approves P9 before P10 begins.

## P10 - Rout, Pursuit, Army Cohesion + Victory

Status: [ ] Not started

Goals:
- Rout checks.
- Pursuit movement.
- Army cohesion.
- Victory/end-of-game state.
- Rally hooks if required by sequence.

Dependencies:
- P9 approved.
- Verified rout, pursuit, army cohesion, rally, and victory rules.
- Replayable action and random model.

Success criteria:
- Routed units, pursuits, and follow-up contacts are resolved through actions.
- Army cohesion is computed from rule data and current state.
- Victory/end-of-game state is deterministic and explained.
- Tests cover light troop destruction, pursuit choices, and army cohesion thresholds.
- User approves P10 before P11 begins.

## P11 - Army Builder

Status: [ ] Not started

Goals:
- Army selection.
- List validation.
- Unit creation.
- JSON army data and errata overlays.

Dependencies:
- P10 approved.
- Army builder schema accepted.
- At least one source army list manually verified.
- Unit catalog and points data model available.

Success criteria:
- Armies are loaded from JSON, not hardcoded.
- At least one army list supports min/max, upgrades, replacements, points, dates, and notes.
- Roster validation catches illegal lists and explains every violation.
- Valid roster exports units into game setup format.
- Errata overlay can modify list data without changing engine code.
- User approves P11 before P12 begins.

## P12 - Full Match Flow + Local Singleplayer

Status: [ ] Not started

Goals:
- Complete menu-to-result game flow.
- Local singleplayer/hotseat match mode.
- Full phase navigation.
- Save/load draft match state.

Dependencies:
- P11 approved.
- All core gameplay phases implemented for the supported rules subset.
- Setup, deployment, movement, command, shooting, melee, rout, pursuit, and victory states connected.

Success criteria:
- A user can start at the menu, configure options, select armies, set up battlefield, deploy, play phases, and reach a result.
- Phase transitions block illegal skips and explain missing decisions.
- Local single-device play can control both sides under strict engine validation.
- Settings such as player colors and explanation depth persist across the session.
- Browser test covers the full happy path for a tiny scenario.
- User approves P12 before P13 begins.

## P13 - Replay, Undo + Review Viewer

Status: [ ] Not started

Goals:
- Action logging.
- Undo.
- Replay viewer.
- Post-game review.

Dependencies:
- P12 approved.
- All implemented systems use actions and deterministic random claims.
- State hash and snapshot strategy defined.

Success criteria:
- Every confirmed action is appended to the action log.
- Replaying from initial state reproduces the same state hash.
- Undo works to approved checkpoints.
- Replay viewer can step through setup, movement, command, shooting, combat, rout, and victory actions implemented so far.
- User approves P13 before P14 begins.

## P14 - Multiplayer Preparation

Status: [ ] Not started

Goals:
- Action-based sync.
- Server model.
- Lobby/session concept.
- Networked hidden-information enforcement using the existing local hidden-state model.

Dependencies:
- P13 approved.
- Replay system proves deterministic local reapplication.
- Local visibility rules for private information are already implemented or documented from setup phases.

Success criteria:
- Server-authoritative action submission model is documented and prototyped.
- Client/server state hash verification exists.
- Randomness is server-controlled or committed through logged claims.
- Existing hidden-information model is enforced over the network without leaking private setup data.
- No client can bypass engine validation.
- User approves any multiplayer implementation beyond preparation.

## P15 - Visual Asset System + Player Colors

Status: [ ] Not started

Goals:
- Replace rectangle units with asset-backed visuals.
- Support PNG or atlas sprites.
- Support player color channels.
- Keep rule geometry independent from art.

Dependencies:
- P14 approved or explicitly reprioritized by the user.
- Visual profile model accepted.
- Reference art or generated asset direction approved.

Success criteria:
- Every unit can still render as a rectangle fallback.
- Units can use PNG/atlas visuals without changing rule behavior.
- Player color selection affects approved visual channels such as tunics, shields, banners, or accents.
- Battlefield readability remains high at gameplay zoom levels.
- Browser screenshots verify colors and assets render correctly.
- User approves P15 before P16 begins.

## P16 - QA, Packaging + Release Candidate

Status: [ ] Not started

Goals:
- Regression suite.
- Browser compatibility pass.
- Performance pass.
- Documentation pass.
- Release candidate checklist.

Dependencies:
- P15 approved.
- Core game loop stable.
- Known rule gaps listed and triaged.

Success criteria:
- Unit tests, integration tests, build, and browser smoke tests pass.
- Rule coverage matrix identifies implemented, verified, and open areas.
- Large-file/module-size scan passes.
- Documentation explains setup, gameplay, rules knowledge, and contribution workflow.
- User accepts the release candidate scope.