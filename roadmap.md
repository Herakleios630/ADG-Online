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
- [x] P7 - Charge Declaration + Target Reaction Gate
- [x] P7A - Evade + Charge Movement Branches
- [ ] P7A2 - Evade Move Completion Gate (in progress; core commit gate, defender handoff popup, first direct-blocker clearance slice, initial-branch-only evade choice, and distance-maximizing solver ranking validated)
- [ ] P7B - Conformation + Shifting Foundation
- [ ] P7C - Command Menu Hierarchy + Flow Cleanup
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

By P16, the target is a coherent local game loop for the implemented rules subset: setup, core command/movement, ZOC, charge declaration, basic evade, basic conformation, shooting, melee, rout/victory, army creation, replay, multiplayer preparation, visual assets, and QA packaging. That milestone can be a beta candidate only if the release notes clearly identify implemented, verified, placeholder, and open rule areas.

After P16, plan a dedicated rules-completeness pass for the remaining details that are too large or source-sensitive for the first beta track. Likely post-P16 work includes full group movement, multiple-move and tactical-distance completion, slide straight-advance qualification, strategist-grade command integration, group charges, group conformation, advanced evade chains, extension/contraction, difficult maneuvers, special troop exceptions, deeper terrain effects, full deployment legality, hidden reveal edge cases, advanced multiplayer privacy, AI fairness, and tournament polish.

Post-P16 should be treated as three deliberate passes rather than one vague cleanup bucket:

- Rules-completeness pass: close open verification, add source-backed edge cases, group behavior, terrain depth, and special exceptions.
- Engine hardening/refactor pass: extract solvers that proved themselves during P7-P10, stabilize action/replay boundaries, and reduce prototype coupling.
- UX and tournament-polish pass: improve visuals, review tools, training explanations, accessibility, and user-facing flow without changing legality.

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
- from P7 onward, complex confirmed actions and reducer pause decisions must preserve replay-ready serializable context even if the full replay/undo viewer remains scheduled for P13.
- UI previews must remain read-only presentations of engine/reducer output; solver decisions for contact, reaction, conformation, shifting, combat, and legality do not belong in rendering code.

## Source OCR Corpus Support Task

Status: [ ] In progress - `SOURCE_OCR_todo.md` is active; SOCR-00/01/02 are complete, SOCR-03/04 are in progress, Ancient and Classical color-scan deep passes now live in separate period documents, and the Rules-v2 corpus is now technically clean enough to act as the working default source layer for hardened rule-sensitive planning while RV2-05A/RV2-06 manual acceptance and handoff remain open

Purpose:
- Create durable source corpus files for repeated rule lookup: broad routing files plus period-specific army-list documents and the Rules-v2 image-supported rules corpus.
- Cover the source material comprehensively in original project wording with page/list references, structured tables, errata overlays, spreadsheet cross-checks, and verification status.
- Reduce repeated ad hoc OCR work before P7A2, P7B, P8+, and later army-builder phases.

Current state:
- `docs/source/rules.md` exists and is strong enough for planning/source routing.
- `docs/source/army-lists.md` exists as the broad all-period routing corpus.
- `docs/source/Ancient_Period.md` is the canonical working source for Ancient lists `1-37`, driven by `docs/source/new scan/Ancient_Period.pdf`.
- `docs/source/Classic_Period.md` is the canonical working source for Classical lists `38-82`, driven by `docs/source/new scan/Classical_Period.pdf`.
- `docs/source/new scan/Rules_Color_300DPI.pdf` exists, has `86` pages, has a readable 300-DPI image on every page, and is good enough for the Rules-v2 extraction pass.
- `RULES_V2_todo.md` now has routing, example inventory, completeness QA, a first full digest, source-lock workspace promotion, and the first recalibration slices agent-complete; manual acceptance and final handoff wording remain open.
- `docs/source/Rules_v2.md` now contains a first full `p1-86` digest, and `docs/source/rules-v2-examples/index.md` records explicit page decisions across the whole book.
- For hardened rule areas, `docs/source/Rules_v2.md` plus the matching `docs/rules/` source-lock notes are now the working default lookup layer for P7A2, P7B, P8, P9, P10, and P11 planning. Manual acceptance is still required before describing that source layer as fully accepted project-wide.

Constraints:
- The corpus is not engine implementation and does not itself advance a gameplay phase.
- The original PDFs and errata remain authoritative.
- The corpus should be complete in coverage but not a raw full-text reproduction of commercial PDFs.

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

## P7 - Charge Declaration + Target Reaction Gate

Status: [x] Complete - accepted by user on 2026-05-20 after automated and browser validation of the implemented single-unit charge declaration and target reaction-gate flow
Active task list: see `P7_todo.md`.

Goals:
- Charge declaration.
- Contact detection.
- Reaction and evade interrupt model where required by charge flow.
- Direction confirmation before the defender reaction gate.
- Reaction decision state and no-evade handoff for the later evade/conformation phases.
- Explanation and validation package for the charge declaration/reaction-gate foundation.

Dependencies:
- P6 approved.
- Source-page verification for charge declaration, contact, target reaction, basic evasion hooks, and errata.
- Movement validation stable enough to support charge paths.

Success criteria:
- Charge target, direction, range, movement, and contact are validated.
- P7 is handled as a charge declaration and reaction-gate phase, not as a full conformation mega-phase.
- Front, flank, rear, and corner contacts are classified.
- Defender reaction requests are visible, decision-owned, and serializable.
- No-evade decisions can hand off cleanly to the next charge movement/conformation phases without resolving combat.
- P7 actions and pause points preserve enough serializable context for later replay/undo work.
- User approves P7 before P7A begins.

Current planning state:
- P7 planning was requested after P6 acceptance and the user has now explicitly started `P7-00` through `P7-04`.
- The first P7 pass is single-unit-first. The user has now reprioritized basic evade and conformation before P16, but they should be split into P7A and P7B rather than kept inside P7.
- Charge must be a dedicated command selected before movement, similar in UI placement to advance and wheel but not implemented as a normal movement chain.
- A unit that has already moved, stayed, or finished movement in the current movement phase must not be allowed to start a charge; charge should be disabled with reducer-owned explanation.
- Once charge is selected, the sequence must follow source-locked charge rules: show targets, select target, resolve legal charge-start shift/slide or wheel controls, freeze direction, preview straight-ahead charge movement, detect contact, classify contact, and open the target-reaction gate.
- P7 must keep charge-start shift/slide separate from conformation shifting so the UI and engine do not confuse a charge-opening alignment step with shifting blockers during conformation.
- The initial design direction is a deterministic charge simulation with explicit pause points and diagnostics, not a visual snap or end-position-only collision check.
- P7-00 is complete as documentation/source-lock scaffolding: dedicated `docs/rules/charge.md` and `docs/rules/conformation.md` now exist and `docs/rules/open-verification.md` carries explicit P7 blocker IDs.
- P7-01 is complete as a non-visual implementation spine: `src/engine/charge/` now provides serializable charge-preview model structures and the app reducer now owns a minimal `chargePreview` state with start/target/cancel transitions plus atomicity against unit switching.
- P7-02 is complete as the first visible charge entry point: the battlefield command panel now renders a dedicated `Charge` button, reuses reducer-owned eligibility rules for disabled reasons, and keeps active charge preview state cancelable and selection-locking without allowing move-then-charge.
- P7-03 is complete as the first battlefield target-selection slice: the reducer now computes `targetCandidates`, battlefield tokens render eligible versus blocked charge-target highlights from that snapshot, and clicking a provisional enemy target advances the preview into the next charge state while source-open range and prohibited-target rules stay explicitly marked as `needs-source-check`.
- P7-04 is now replanned after user review: target selection must not rotate the tunnel toward the target; the visible charge tunnel must start forward from the charger/current charge-start pose and then be adjusted by charge-owned `Slide` or `Wheel` tools.
- P7-04 is split into smaller execution cards before P7-05: charge drill scenario fixture, forward tunnel/start-tool rework, supported reachability candidate search, and browser/manual smoke.
- P7-04A is now implemented: a dedicated `Charge Drill` direct-battle scenario can be loaded from the shell and provides stable unit IDs plus front, flank, rear, blocker, earlier-contact, ZOC, out-of-range, and future-terrain-hook anchors for regression checks.
- P7-04B is now implemented: charge target selection keeps a forward tunnel from the charger/start pose, charge-owned `Slide`/`Wheel` tools reuse the existing drag/button surfaces without writing normal movement preview state, and edited charge-start poses now refresh selected-target legality instead of leaving stale pre-manoeuvre reachability.
- P7-04C now separates full target-search eligibility from selected-current-tunnel legality: supported target search may find a legal avoiding start path, while the current straight tunnel is blocked if it crosses non-target enemy ZoC until the player selects the avoiding charge-start manoeuvre.
- P7-04D browser/manual smoke is now accepted: current straight tunnel blocks through non-target ZoC, visible enemy ZoCs render during charge preview, a left charge-start slide can make the same target legal by avoiding that ZoC, and the dedicated pure-ZoC lane remains fully blocked under supported-family search.
- P7-05 has started with a first reducer-owned contact slice: the current charge corridor is clipped to first contact on the current eligible path, `chargePreview.contactEvents` is now populated from deterministic path sampling, and blocked current tunnels do not surface false contact events through foreign-ZoC lanes.
- P7-06 has now started with its first classification slice: `contactEvents` preserve a charge-owned classification derived from the attacker front edge at the stored charge-start pose against defender front/rear geometry, including a preserved `rear-or-flank` grey-zone result instead of collapsing that choice too early.
- P7-07 has now started with an explicit reaction request model and `reaction-pending` pause skeleton; the remaining P7 closeout is direction confirmation, visible reaction modal/decision state, no-evade handoff, and validation.
- P7-11 is now implemented and validated: `Richtung bestaetigen` freezes a declaration snapshot, opens the blocking reaction modal, stores reducer-owned reaction decisions, and enters explicit no-evade versus evade-required handoff states for P7A and P7B.
- P7-12 validation is now complete on the agent side: the repository test suite and build are green, and browser smoke has exercised direct front-charge confirmation, reaction pause, both reaction decisions, reachable wheel/slide start-manoeuvre toggles, out-of-range targets, blocked path cases, and the dedicated ZoC-blocked lane.
- The user then accepted P7 on 2026-05-20. P7 should now be described as an accepted single-unit charge declaration and reaction-gate foundation, not as full evade or conformation resolution.
- P7A is the new before-P8 phase for basic evade and charge movement branches.
- P7A2 is the new before-P7B gate for committing the actual evade move before adjusted charge distance and conformation.
- P7B is the new before-P8 phase for basic conformation and shifting foundation after P7A2 closes.
- P7C is the new small before-P8 UI-ordering phase for nested command menus and cleaner local hotseat flow once the P7/P7A/P7A2/P7B rule foundation is stable.
- 1/4 turns, 1/2 turns, and full terrain effects are deferred to post-P16 or a later explicitly approved source-locked phase; P7 may keep hooks and `needs-source-check` diagnostics but must not invent their behavior.
- Group movement is not pulled forward into the first P7 pass, but P7 data shapes must preserve a future seam for group charges/conformation so single-unit prototypes do not hardcode UI-only assumptions.
- The full replay/undo feature remains P13, but P7 through P10 must avoid unreplayable side effects by storing action, random, contact, reaction, and conformation context at confirmation/pause boundaries.

## P7A - Evade + Charge Movement Branches

Status: [x] Complete for the accepted supported subset - user accepted P7A on 2026-05-21; `P7A_todo.md` is closed and P7B remains pending its own explicit start decision
Active task list: see `P7A_todo.md`.

Goals:
- Basic target reaction decision consumption.
- Source-shaped evade eligibility data for the supported unit subset.
- Deterministic evade and adjusted-charge dice plumbing.
- Isolated single-unit evade movement.
- Adjusted charge follow-through after all initial targets evade.
- Caught-evader hooks and blocked-evade diagnostics for the first supported cases.
- Secondary-target event hook without full recursive chain completeness.

Dependencies:
- P7 approved.
- Source-page verification for evade p.47-49 and charge procedure p.43 plus errata.
- Dice/random action context accepted for replay-safe branch resolution.

Success criteria:
- A supported target can choose or be forced to evade through reducer-owned state.
- Evade movement handles front/flank/rear initial reorientation for the supported single-unit subset.
- Adjusted evade and charge distances are deterministic and replayable.
- The charger can follow through after an evaded target and detect caught/not-caught outcomes.
- Blocked-evade cases do not silently evade; they explain the blocked reason and continue through the supported branch.
- Secondary target encounters create explicit pause/events instead of hidden contacts.
- Browser/manual smoke demonstrates no-evade, may-evade, caught, not-caught, and blocked-evade supported cases.
- User approves P7A before P7B begins.

Current planning state:
- P7A exists because the user wants basic evade before P16, but P7 should not be bloated further.
- P7A remains single-unit-first. Group evade splitting, point 7 group partial-evade behavior, point 8 group continuation, recursive secondary-target chains, table-exit loss integration, and full terrain/interpenetration are deferred until explicitly source-locked and approved.
- P7A must preserve all rolls, choices, caught status, and follow-through facts for P13 replay/undo and future multiplayer fairness.
- P7 is now accepted, so P7A has moved from draft status into active execution under `P7A-03`, after the earlier source-lock, capability, and deterministic-roll cards were completed.
- P7A-00 is now complete as documentation/source-lock work: the first supported evade subset, blocked-evade boundary, and adjusted-distance die mapping are aligned across planning docs.
- P7A-01 is now complete and validated: charge reaction evaluation can derive first-pass evade categories from source-shaped capability data while preserving explicit drill/test overrides.
- P7A-02 is now complete and validated: the charge preview carries replay-ready branch roll state for both evade distance and adjusted charge distance, preserves prior roll history across the second claim, and supports the heavy-infantry-style `neverReduce` adjusted-charge exception through reducer-owned deterministic resolution.
- P7A-03 has now started with the first supported isolated evade-plan slice: front/flank/rear reorientation and straight end-pose calculation live in the charge engine, the reducer stores that plan into `chargePreview.evadePlan`, and simple table-edge plus overlap/interpenetration failures now escalate to explicit `needs-source-check` diagnostics.
- P7A-03 now has the first actual manual hotseat test surface: after the reaction chooses `Ausweichen`, a deterministic D6 dialog resolves the pending evade-distance claim, and the current evade corridor plus end ghost then render directly from reducer-owned state without moving legality into the UI.
- That same thin UI slice now also renders the intermediate evade reorientation pose, so the currently supported quarter-turn and half-turn cases are visible instead of being hidden inside engine state.
- The first `P7A-06` blocked-evade slice is also in place: the reaction gate now suppresses a false evade choice when the initial reorientation would already finish inside enemy ZoC.
- A dedicated Charge Drill lane now exists for that first blocked-evade slice, so the enemy-ZoC case can be smoke-tested manually instead of only through focused tests.
- `P7A-04` and the current `P7A-07` secondary-target slice have both moved further beyond placeholder state: the adjusted charge follow-through now preserves reducer-owned distinctions between caught evader, earlier enemy contact, and friendly blocker, and the first supported secondary `evade` and `no-evade` answers both resolve through explicit local branch state instead of dead-end summaries.
- The same secondary-target slice now keeps its active target anchor honest for the supported subset: when the first target has evaded and a second defender becomes the real contact anchor, `intent`, declaration snapshot, follow-through summary, side-panel target label, and battlefield selected-target highlight all move to that secondary defender instead of silently staying on the original declared target.
- Current agent-side P7A closeout validation is green: `npm run test`, `npm run build`, and a focused localhost browser smoke all pass for the supported evade/follow-through subset, including the reanchored secondary-target `no-evade` handoff and the absence of a false second primary adjusted-charge action.
- User manual acceptance for that supported subset is also complete as of 2026-05-21, so P7A now stands as an accepted single-unit evade and adjusted-charge foundation.
- P7A closes intentionally short of full rule completeness: full obstacle/terrain handling, clearer blocked-versus-source-open continuation policy, recursive secondary-target chains, and later conformation/combat application remain deferred to later approved phases.

## P7A2 - Evade Move Completion Gate

Status: [ ] In progress - core commit gate, defender handoff popup, direction-wheel plus obstacle-wheel candidate slices, chained `direction wheel -> later slide/wheel` candidate support, supported later multi-wheel paths, first battlefield evade-choice ghosts/path trails/initial branch handles/node-by-node choice-tree progression, and the initial-branch-only distance-maximizing solver contract are validated; P7A2 is not accepted/closed until remaining fuller movement-style evade gestures, table-exit/end-half-turn, and manual-acceptance items are complete
Active task list: see `P7A2_todo.md`.

Goals:
- Resolve and commit the evading unit's actual movement before adjusted charge distance.
- Preserve free reorientation, adjusted evade distance, slide/block decisions, direction wheel, obstacle wheel, table exit, light-troop end half-turn, final pose, and diagnostics in replay-ready reducer state.
- Apply supported slide, wheel, obstacle, and blocked-evade outcomes without UI-owned legality.
- Move the canonical evader token or store a source-locked table-exit/loss hook before the charger continues.
- Gate adjusted charge D6 on committed evade status.
- Preserve cannot-shoot/repeated-evade hooks for later shooting and phase flow.

Dependencies:
- P7A accepted for the supported preview/follow-through subset.
- Relevant charge/evade source-lock baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/charge.md` and the narrowed charge/evade items in `docs/rules/open-verification.md`.
- Source-page verification for charge procedure p.43 and evade p.47-49 plus errata.
- Current P7A charge preview, reaction, D6, and secondary-target state.

Success criteria:
- A supported evader cannot remain ghost-only once the branch is ready for adjusted charge distance.
- The player chooses only the initial evade branch. Within that branch, the solver should maximize legal distance from the charger automatically and use deterministic tie-breaks only when the branch remains exactly equal.
- If an evade has no player choice and no source warning, the UI shows a notice and then auto-commits.
- Direction wheel, obstacle wheel, table exit, light-troop end half-turn, cannot-shoot hooks, and repeated-evade hooks are part of the P7A2 source-lock and implementation plan.
- If an evade is blocked or source-open, the UI and reducer do not allow it to be confirmed as a legal committed evade.
- `START_ADJUSTED_CHARGE_DISTANCE_ROLL` is impossible until the evade move is committed or explicitly resolved by a source-locked non-board-pose outcome.
- Follow-through contact detection uses the committed post-evade board state.
- Browser/manual smoke demonstrates straight evade commit, slide/block behavior, and adjusted-charge button timing.
- User approves P7A2 before P7B begins.

Current planning state:
- P7A2 exists because P7A's accepted subset stores and renders an `evadePlan` but does not yet update `game.units` before adjusted charge distance.
- P7A2 remains single-unit-first and intentionally defers interpenetration, group evade, full terrain, full secondary recursion, conformation, melee, pursuit, downstream army-cohesion/victory accounting, and tournament-complete evade coverage unless explicitly expanded.
- 2026-05-23 implementation slice: `evadeMove` now records committed evade movement, source-closed no-choice evades mutate canonical `game.units`, a single legal final-overlap slide can auto-commit with slide distance deducted, adjusted charge D6 is gated on committed evade status, and follow-through uses committed post-evade state. Full tests and build are green; browser tooling reached the live Charge Drill reaction flow but did not complete a stable D6 end-to-end smoke, so manual acceptance remains open.

## P7B - Conformation + Shifting Foundation

Status: [ ] Not started - draft board exists in `P7B_todo.md`, gated on P7A2 user approval and completion
Active task list: see `P7B_todo.md`.

Goals:
- Basic single-unit conformation candidate model.
- Front, flank, rear, and selected `rear-or-flank` conformation candidates.
- Complete, incomplete, blocked, optional, and `needs-source-check` conformation diagnostics.
- Source-locked simple shifting skeleton for conformation blockers.
- Conformation preview UI and final charge-completion state for later melee.

Dependencies:
- P7A approved.
- P7A2 approved and accepted, so evading targets are committed to canonical board state before adjusted charge distance and conformation.
- Relevant conformation source-lock baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/conformation.md`, `docs/rules/zoc.md`, and the narrowed conformation/ZOC items in `docs/rules/open-verification.md`.
- Source-page verification for conformation p.50-54 and errata.
- Contact/classification snapshots from P7 and reaction/evade branch state from P7A.

Success criteria:
- Conformation candidates are generated by engine code and rendered read-only by UI.
- Front, flank, rear, and selected `rear-or-flank` contacts can produce complete or explicit incomplete/blocked outcomes for the supported subset.
- Shifting is modeled as a conformation micro-operation, not normal movement or charge-start slide.
- Shifted-unit lock hooks are stored where source-locked.
- Confirmed charge state preserves contact/conformation metadata for P9 melee and P13 replay.
- Browser/manual smoke demonstrates front, flank, rear, `rear-or-flank`, incomplete, blocked, and simple-shift supported cases.
- User approves P7B before P8 begins.

Current planning state:
- P7B exists because conformation is foundational for later melee and should not wait until a vague post-P16 cleanup.
- P7B remains single-unit-first. Group conformation, full support networks, special-base cases, full terrain optional-choice UI, and advanced shifting chains remain deferred unless explicitly approved.

## P7C - Command Menu Hierarchy + Flow Cleanup

Status: [ ] Not started - draft board exists in `P7C_todo.md`, pending user review after P7B closes
Active task list: see `P7C_todo.md`.

Goals:
- Reorganize battlefield command actions into a nested command hierarchy.
- Separate top-level intent selection from second-level action controls.
- Keep the existing reducer-owned movement, charge, commander-move, and attach logic while making the UI flow clearer.
- Prepare clean command-group seams for later `1/4 turn`, `1/2 turn`, extend, and other move-family additions.

Dependencies:
- P7B approved.
- Existing movement, charge, and attach flows stable enough that P7C can remain a UI-structure phase instead of reopening legality.
- Command panel state ownership boundaries preserved: legality remains reducer/engine-owned.
- If P7C exposes any newly discovered movement family or rule branch, that work is split back to a Rules-v2 source-locked rules phase instead of being implemented as UI cleanup.

Success criteria:
- For non-commander units, the first command layer offers `Move`, `Charge`, and `Stay`.
- For commanders, the first command layer offers `Move`, `Attach`, and `Stay`.
- Entering `Move` reveals the second-level controls instead of showing all detailed movement controls immediately after selection.
- Entering `Charge` or `Attach` reveals only the controls relevant to that branch.
- Existing confirm/cancel behavior still routes through the current reducer actions.
- Browser/manual smoke confirms the nested flow is clearer without changing movement, charge, or attach legality.
- User approves P7C before P8 begins.

Current planning state:
- P7C is a UI information-architecture and interaction-flow cleanup phase, not a rule-expansion phase.
- P7C must not move legality, CP, contact, reaction, conformation, or attach validation into rendering code.
- P7C should introduce a reducer-owned or reducer-projected command-menu mode only if needed to keep the nested command state serializable and replay-safe.
- P7C should preserve the current direct-manipulation commander drag flow; only the visible command entry structure changes.
- P7C is the right place to prepare clean submenu seams for later movement families such as `1/4 turn`, `1/2 turn`, group extensions, or other source-locked additions, without exposing them early.

## P8 - Shooting System

Status: [ ] Not started

Goals:
- Shooting ranges.
- Line of sight.
- Target eligibility and priority.
- Shooting modifiers and results.

Dependencies:
- P7C approved.
- Relevant shooting source-lock baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/shooting.md`, `docs/rules/terrain-and-setup.md`, and the narrowed shooting items in `docs/rules/open-verification.md`.
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
- Relevant melee source-lock baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/melee.md`, `docs/rules/conformation.md`, and the narrowed melee items in `docs/rules/open-verification.md`.
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
- Relevant rout/pursuit/victory baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/rout-and-pursuit.md`, `docs/rules/standard-200.md`, `docs/rules/terrain-and-setup.md`, and the narrowed end-of-sequence items in `docs/rules/open-verification.md`.
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
- Relevant format/setup budget baseline accepted from the Rules-v2 pass: `docs/source/Rules_v2.md` plus `docs/rules/standard-200.md`, `docs/rules/terrain-and-setup.md`, `docs/rules/command.md`, and the narrowed setup/budget items in `docs/rules/open-verification.md`.

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
- Full action-log productization.
- Undo.
- Replay viewer.
- Post-game review.

Dependencies:
- P12 approved.
- P7-P12 have preserved replay-ready serializable context for complex confirmed actions and pause decisions.
- All implemented systems use actions and deterministic random claims.
- State hash and snapshot strategy defined.

Success criteria:
- Every confirmed action is appended to the action log.
- Replaying from initial state reproduces the same state hash.
- Undo works to approved checkpoints.
- Replay viewer can step through setup, movement, command, shooting, combat, rout, and victory actions implemented so far.
- Any prototype-era action-context gaps from P7-P12 are either migrated or listed as release blockers before multiplayer preparation begins.
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