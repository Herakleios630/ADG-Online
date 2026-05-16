# AdG Online Roadmap

Development is phase-gated. Do not work on the next phase until the current phase has been implemented, tested, demonstrated, and explicitly approved by the user.

## Status Overview

- [x] Repository, planning docs, and rule-governance foundation
- [x] P0 - Product Shell Feasibility
- [x] P1 - Rule Knowledge + Data Foundation
- [x] P2 - Fundamental Geometry
- [ ] P3 - Tournament Setup + Terrain + Deployment Foundation
- [ ] P4 - Movement Commands
- [ ] P5 - ZOC + Movement Validation
- [ ] P6 - Corps + Command System
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

Status: [ ] Not started

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

## P5 - ZOC + Movement Validation

Status: [ ] Not started

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

## P6 - Corps + Command System

Status: [ ] Not started

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