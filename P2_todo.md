# P2 TODO - Fundamental Geometry

Status: Complete - accepted by user on 2026-05-16
Date drafted: 2026-05-16
Planner: GPT-5.5 preferred planner
Future executor: GPT-5.4 preferred executor after explicit user approval
Intended branch: `feature/p2-fundamental-geometry`
Master plan: `roadmap.md`
Architecture source: `docs/architecture.md`
Governance source: `docs/project-governance.md`
Rules workspace: `docs/rules/`
Open verification source: `docs/rules/open-verification.md`

## Purpose

P2 establishes the deterministic geometry foundation needed before official movement, contact, ZOC, combat, setup, and terrain work can safely begin.

This phase adds pure geometry primitives for rotated unit bases, facing edges, facing zones, and front/flank/rear relationship classification. It also adds developer-only visual tooling so a selected normal unit can be inspected against a movable debug unit.

P2 is geometry/debug/dev tooling only. It must not claim official AdG charge legality, ZOC legality, conformation legality, combat eligibility, movement legality, setup legality, terrain effects, or phase-order behavior.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Read this file section for the current card.
2. Re-read `roadmap.md` P2 and relevant sections of `docs/architecture.md`, `docs/project-governance.md`, and `docs/rules/open-verification.md`.
3. Confirm whether P2 implementation has been approved by the user. This draft alone is not implementation approval.
4. Run `git status --short` and protect unrelated user changes.
5. Give the user a short PM block brief before edits.
6. Keep implementation inside P2 scope.

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
- geometry assumptions checked;
- validation run;
- manual user review and expected result;
- still-open next card or blocker.

Context-loss rule: a future AI session should be able to resume from this file without reading the chat transcript.

## Global P2 Scope Guardrails

In scope:
- pure geometry primitives for points, vectors, angles, axes, projections, and rotated rectangles;
- unit base geometry from pose and base dimensions;
- deterministic front edge, rear edge, flank edges, corners, center, and facing boundaries;
- geometric front/flank/rear relationship classification;
- explicit boundary, overlap, and ambiguous outcomes;
- debug-mode state for geometry inspection;
- `H` as general debug-mode toggle;
- `F` as facing/front-flank-rear overlay toggle while debug mode is active;
- a debug unit visible only in debug mode;
- free left-drag movement for the debug unit;
- `Ctrl` + mouse wheel rotation of the debug unit around its center;
- a debug label showing the debug unit's geometric relationship to the selected normal unit;
- automated tests for pure geometry and debug state behavior;
- browser/manual smoke for the debug workflow.

Out of scope:
- no official movement legality;
- no charge legality;
- no ZOC;
- no conformation;
- no contact legality;
- no combat or support rules;
- no setup, terrain, deployment, or phase-order implementation;
- no army-builder behavior;
- no hidden-information reveal behavior;
- no claim that P2 relationship labels decide official game outcomes.

Hard rules:
- P2 may implement geometric classification only.
- Debug overlays are development aids and must be visually/semantically distinct from the old P0 deployment/sector overlay.
- Geometry must come from pure engine functions, not duplicated CSS or UI estimates.
- Engine geometry modules must not import UI rendering code.
- State must remain serializable plain data.
- Unit geometry is based on pose and base dimensions, not future sprite dimensions.
- Physical impossibilities and ambiguous positions must be represented explicitly, not silently corrected.
- P3 must not start until P2 is implemented, validated, manually accepted where required, and approved by the user.

## Shared P2 Constants And Assumptions

- P1 is accepted complete by the user on 2026-05-16.
- Default format remains `standard-200`.
- Players: `2`.
- Points: `200` per army.
- Corps: `3` per army.
- Standard 6-15 mm battlefield: `120 cm x 80 cm`.
- Scale: `1 UD = 4 cm`.
- Units are represented as rotated rectangles measured in UD.
- A unit pose has a center point and rotation.
- Base dimensions are geometry data, not sprite dimensions.
- Every unit base always has one front edge, one rear edge, two flank edges, four corners, and one center point.
- Front/flank/rear relationships derive from base geometry.
- Facing zones are debug geometry regions and relationship helpers, not official combat or charge rules.
- Current open rule verification does not block P2 pure geometry work.
- Setup, terrain, disclosure, and phase-order open items remain blockers for P3+ only.

## Phase Status

- [x] P0 accepted complete by user
- [x] P1 accepted complete by user
- [x] P2 brainstorming completed
- [x] P2 execution board drafted
- [x] P2 execution board approved by user
- [x] P2 implementation started
- [x] Geometry assumptions note reviewed
- [x] Pure geometry primitives implemented
- [x] Unit base geometry implemented
- [x] Facing relationship classifier implemented
- [x] Debug state support implemented
- [x] Debug hotkeys implemented
- [x] Debug unit interaction implemented
- [x] Facing overlay renderer implemented
- [x] P2 automated and browser validation completed
- [x] P2 demonstrated to user
- [x] P2 approved complete by user

## Definition Of Done

P2 is done when:

- [x] Geometry modules compute corners, edges, centers, axes, and facing boundaries deterministically.
- [x] Front/flank/rear relationship classification works from rotated rectangle geometry.
- [x] Boundary, overlap, and ambiguous cases are explicit.
- [x] Debug mode can be toggled with `H`.
- [x] In debug mode, the front/flank/rear overlay can be toggled with `F`.
- [x] A debug unit appears only when debug mode is active.
- [x] The debug unit can be freely dragged with left mouse.
- [x] `Ctrl` + mouse wheel rotates the debug unit around its center.
- [x] The debug unit displays its geometric relationship to the selected normal unit.
- [x] The visual overlay is driven by pure geometry output and matches automated tests.
- [x] Automated tests cover axis-aligned, rotated, edge, corner, overlap, and ambiguous cases.
- [x] Browser/manual smoke steps have been provided and user acceptance has been recorded.
- [x] `roadmap.md` and this board reflect final P2 status.
- [x] User explicitly approves readiness to proceed toward P3 planning.

## Execution Cards

### [x] P2-00 - Preflight, Branch, And Scope Check

Goal: confirm P2 may proceed from planning into implementation only after user approval, establish the intended branch, verify current project state, and lock the scope boundary.

Planned files:
- `P2_todo.md`
- `roadmap.md`
- `docs/architecture.md`
- `docs/project-governance.md`
- `docs/rules/open-verification.md`

Implementation steps:
1. Confirm with the user that P2 implementation is approved before making implementation edits.
2. Create or switch to intended branch `feature/p2-fundamental-geometry` only after approval.
3. Check current git status and note unrelated user changes without reverting them.
4. Re-read the P2 section of `roadmap.md`, architecture notes, governance notes, and open verification notes.
5. Confirm P1 is accepted complete.
6. Confirm P2 remains limited to pure geometry and debug tooling.
7. Update `roadmap.md` from board-drafted status to approved in-progress status only after user approval.
8. Mark this card complete only after the branch/scope status is clear.

Non-goals:
- do not implement geometry functions;
- do not add debug UI;
- do not change gameplay rules;
- do not close any P3+ open verification items.

Validation:
- `git status --short`
- branch name confirmed
- P2 scope boundary confirmed against governance
- `roadmap.md` remains the master plan

Manual acceptance:
- user confirms P2 implementation approval;
- user confirms branch/scope approach is acceptable.

Stop condition:
- stop immediately if the user has not approved P2 implementation;
- stop if the working tree contains conflicting changes that make P2 implementation unsafe to start.

Expected result: P2 implementation has an approved branch, confirmed scope, and clean handoff from planning into execution.

Completed 2026-05-16:
- User approved moving from the drafted P2 board into execution by requesting `Weiter mit P2-00`.
- Created and switched to the dedicated feature branch `feature/p2-fundamental-geometry`.
- Confirmed the working tree before edits contained only the in-progress P2 planning files: `roadmap.md` modified and `P2_todo.md` untracked.
- Confirmed P1 is accepted complete and that current open verification does not block pure geometry work.
- Confirmed P2 remains limited to pure geometry and debug tooling only; no movement, ZOC, conformation, combat, setup, or terrain implementation is authorized by this card.
- Updated phase status so P2 is now approved and in progress, with `P2-01 - Source And Architecture Geometry Assumptions Note` as the next open card.

Files touched:
- `P2_todo.md`
- `roadmap.md`

Geometry assumptions checked:
- `engine/geometry` remains the owner of rotated-rectangle and facing-boundary computations.
- Base dimensions, not sprite dimensions, remain authoritative for P2 geometry.
- Current open verification remains a P3+ blocker set, not a blocker for P2 pure geometry.

Agent validated:
- `git branch --show-current`
- `git status --short`
- VS Code Problems on touched files

Manual acceptance:
- user approval for P2 execution is satisfied by starting `P2-00`;
- next manual review is the content and boundary wording of `P2-01` before geometry code begins.

Still open:
- next card is `P2-01 - Source And Architecture Geometry Assumptions Note`.

### [x] P2-01 - Source And Architecture Geometry Assumptions Note

Goal: add a short source-checked geometry assumptions note so future implementation and reviews can distinguish P2 geometry helpers from official movement, charge, ZOC, conformation, combat, setup, and terrain rules.

Planned files:
- `docs/architecture.md`
- `docs/rules/open-verification.md`
- `docs/rules/index.md`
- optional new file if approved by local docs style: `docs/rules/geometry-assumptions.md`

Implementation steps:
1. Re-check existing architecture and rules docs for geometry ownership and open verification wording.
2. Decide whether to add a dedicated geometry assumptions file or a concise section in an existing doc.
3. Document that `engine/geometry` owns points, vectors, rotated rectangles, base edges, intersections, projections, facing zones, nearest-point calculations, swept bounds, table-edge checks, and distance measurement in UD.
4. Document that front/flank/rear relationships in P2 are geometric relationships only.
5. Document that P2 debug overlays are development aids and do not prove official legality.
6. Link the note from the relevant docs index if a new file is added.
7. Update this board and `roadmap.md` status if needed.

Non-goals:
- do not rewrite rules knowledge broadly;
- do not claim tournament-complete facing, charge, ZOC, conformation, or combat behavior;
- do not resolve setup, terrain, disclosure, or phase-order open questions.

Validation:
- docs clearly preserve the rule-discipline boundary;
- docs say geometry uses base data, not sprite dimensions;
- docs say unresolved P3+ rule questions remain open;
- link paths are valid.

Manual acceptance:
- user reviews the source/architecture note and confirms the assumptions are acceptable for P2.

Stop condition:
- stop if source docs conflict with the proposed geometry assumptions;
- stop if user wants the assumptions reviewed against source PDFs before implementation continues.

Expected result: P2 has a compact, durable architecture note that future cards can cite when implementing geometry and debug tooling.

Completed 2026-05-16:
- Added a compact P2 geometry-boundary note to `docs/architecture.md` clarifying that geometry relationship labels are development-facing outputs, not official AdG legality verdicts.
- Added a matching `P2 Geometry Assumptions` section to `docs/rules/index.md` so the rules workspace explicitly preserves the same scope boundary.
- Recorded the same constraint in `docs/rules/open-verification.md` so later phases do not reinterpret P2 geometry labels as resolved rules questions.
- Kept this card documentation-only and did not create a separate assumptions file because the current architecture and rules index already provide the right durable anchors.

Files touched:
- `docs/architecture.md`
- `docs/rules/index.md`
- `docs/rules/open-verification.md`
- `P2_todo.md`

Geometry assumptions checked:
- `engine/geometry` remains the owner of rotated-rectangle, facing-boundary, and relationship calculations.
- Base dimensions and pose remain authoritative inputs for P2 geometry; sprite dimensions are not.
- Current open verification does not block pure geometry work, but still blocks later P3+ rule implementation areas.

Agent validated:
- VS Code Problems on touched files
- `git status --short`

Manual acceptance:
- user reviews whether the wording `geometric relationship only` is strict enough for P2 before pure geometry code begins.

Still open:
- next card is `P2-02 - Pure Geometry Primitives Module`.

### [x] P2-02 - Pure Geometry Primitives Module

Goal: create testable pure geometry primitives for points, vectors, angles, axes, rectangles, projections, and numeric tolerances.

Planned files:
- `src/engine/geometry/`
- `src/engine/geometry/vector.js`
- `src/engine/geometry/angle.js`
- `src/engine/geometry/rectangle.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/*.test.js`
- `package.json`, only if test script discovery requires it

Implementation steps:
1. Inspect current test style in `src/state/p0-state.test.js`.
2. Create a small `src/engine/geometry/` module set that follows existing JS style.
3. Implement point/vector helpers: add, subtract, scale, dot, cross, length, normalize, perpendicular, and rotate.
4. Implement angle helpers: degree/radian conversion if needed, angle normalization, and rotation-to-axis helpers.
5. Implement rotated rectangle helpers: center, dimensions in UD, rotation, corners, local-to-world conversion, and world-to-local conversion.
6. Keep functions pure and deterministic.
7. Export through a narrow geometry index.
8. Add focused unit tests for axis-aligned and rotated cases.

Non-goals:
- do not implement facing zone classification yet;
- do not render overlays;
- do not store geometry in UI state beyond plain serializable pose data;
- do not add official legality concepts.

Validation:
- unit tests pass for vector, angle, and rotated rectangle helpers;
- tests include deterministic expected values with tolerance where floating point math requires it;
- geometry modules do not import UI code;
- existing tests still pass.

Manual acceptance:
- no manual browser acceptance required for this card.

Stop condition:
- stop if existing test tooling cannot run and the issue is outside P2 scope;
- stop if geometry module structure would push existing files beyond project size targets.

Expected result: `src/engine/geometry/` contains reusable, pure, tested primitives for later P2 cards.

Completed 2026-05-16:
- Added the first pure `src/engine/geometry/` module set with vector, angle, and rotated-rectangle helpers.
- Kept the module surface narrow and UI-free: points/vectors, angle normalization and axis derivation, and rectangle corner plus local/world transform helpers.
- Added focused geometry tests in the existing Node test style for vector math, angle helpers, axis derivation, axis-aligned corners, and rotated local/world round trips.
- Updated the npm test script to `node --test` so the repository can discover both the existing P0 reducer tests and the new geometry tests.

Files touched:
- `src/engine/geometry/vector.js`
- `src/engine/geometry/angle.js`
- `src/engine/geometry/rectangle.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/geometry.test.js`
- `package.json`
- `P2_todo.md`

Geometry assumptions checked:
- pure geometry helpers remain independent from UI and reducer modules;
- geometry inputs remain plain pose and base-dimension data;
- no facing-zone or legality classifier was added in this card.

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- no manual acceptance required for this card.

Still open:
- next card is `P2-03 - Unit Base Geometry, Edges, And Facing Boundaries`.

### [x] P2-03 - Unit Base Geometry, Edges, And Facing Boundaries

Goal: build pure functions that derive unit base corners, front edge, rear edge, flank edges, center, axes, and extended debug boundaries from unit pose and base dimensions.

Planned files:
- `src/engine/geometry/unit-base.js`
- `src/engine/geometry/facing-boundaries.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/*.test.js`

Implementation steps:
1. Define the plain-data input shape for a unit base geometry request: center point in UD, facing rotation, width in UD, and depth in UD.
2. Implement `getUnitBaseGeometry` or equivalent pure function.
3. Return center, corners, front edge, rear edge, left flank edge, right flank edge, forward axis, right axis, and dimensions.
4. Implement extended debug boundary lines derived from the selected unit: front boundary, rear boundary, left flank boundary, right flank boundary, and optional corner rays if useful for inspection.
5. Ensure outputs are serializable plain objects.
6. Add tests for a zero-degree unit, a ninety-degree unit, and a non-cardinal rotation.
7. Add edge/corner ordering tests so later rendering can rely on stable output.

Non-goals:
- do not classify another unit yet;
- do not add UI overlay rendering yet;
- do not encode official melee/contact legality;
- do not adjust or clamp impossible unit positions.

Validation:
- unit tests prove stable edge labels under rotation;
- invariants are tested: exactly one front edge, one rear edge, two flank edges, and four corners;
- existing tests still pass.

Manual acceptance:
- no manual browser acceptance required for this card.

Stop condition:
- stop if edge naming cannot be made unambiguous from the current pose convention;
- stop if dimensions are unavailable in current unit state and require a broader data-model decision.

Expected result: unit base geometry is independent of sprites and can feed both classifiers and debug rendering.

Completed 2026-05-16:
- Added `getUnitBaseGeometry` to derive stable corners, front/rear/flank edges, axes, and dimensions from plain pose plus base data.
- Added `getFacingBoundaries` to derive extended debug boundary lines and boundary centers from the selected unit geometry.
- Kept both modules pure, serializable, and independent from UI, reducer, and legality logic.
- Added focused tests for axis-aligned geometry, ninety-degree rotation, and non-cardinal boundary derivation.

Files touched:
- `src/engine/geometry/unit-base.js`
- `src/engine/geometry/facing-boundaries.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/geometry.test.js`
- `P2_todo.md`

Geometry assumptions checked:
- corner ordering remains stable as front-left, front-right, rear-right, rear-left;
- front/rear/flank edges are derived from geometry output, not labeled ad hoc in UI code;
- debug boundaries are pure geometry helpers and not official rule lines.

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- no manual acceptance required for this card.

Still open:
- next card is `P2-04 - Facing Zone And Relationship Classifier`.

### [x] P2-04 - Facing Zone And Relationship Classifier

Goal: implement pure geometric classification of a target/debug unit relative to a selected source unit as `front`, `leftFlank`, `rightFlank`, `rear`, `boundary`, or `ambiguous` where appropriate.

Planned files:
- `src/engine/geometry/facing-zones.js`
- `src/engine/geometry/relationship.js`
- `src/engine/geometry/distance.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/*.test.js`

Implementation steps:
1. Define classification inputs as two rotated rectangle poses and base dimensions.
2. Keep classification based on base geometry only.
3. Use source unit local-space coordinates or projection onto source axes to determine relative zone.
4. Decide and document how boundary cases are represented: exactly on a separator, target overlaps multiple zones, target center in one zone but corners cross boundaries, and coincident centers.
5. Return a structured result with primary relationship label, involved boundaries, source geometry summary, target geometry summary, and optional debug explanation strings.
6. Add distance helpers only where needed for classifier/debug display, keeping distance concepts distinct.
7. Add tests for axis-aligned front/flank/rear, rotated source unit, rotated target unit, edge boundary cases, corner boundary cases, and overlapping or ambiguous cases.
8. Avoid official rule language beyond geometric relationship names.

Non-goals:
- do not implement charge target validation;
- do not implement ZOC;
- do not implement contact legality;
- do not implement combat flank/rear bonuses;
- do not make ambiguous geometric cases legal or illegal.

Validation:
- unit tests cover deterministic relationship labels;
- boundary and ambiguous outcomes are explicit;
- classifier functions are pure and do not import state or UI modules;
- existing tests still pass.

Manual acceptance:
- no manual browser acceptance required for this card.

Stop condition:
- stop if the intended classification semantics need user choice, especially for corner-touching or cross-boundary targets;
- stop if official rules are needed to decide a geometric ambiguity.

Expected result: P2 has a tested pure classifier that can drive debug labels and overlays without deciding official game legality.

Completed 2026-05-16:
- Added pure facing-zone helpers and a relationship classifier for rotated source and target rectangles.
- Kept the classifier geometry-only: it returns `front`, `leftFlank`, `rightFlank`, `rear`, `boundary`, and `ambiguous` without implying official legality.
- Added a small distance helper surface only for geometric reporting.
- Added focused tests for local zone classification, rotated-source front detection, boundary handling, and ambiguous multi-zone footprints.

Files touched:
- `src/engine/geometry/distance.js`
- `src/engine/geometry/facing-zones.js`
- `src/engine/geometry/relationship.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/geometry.test.js`
- `P2_todo.md`

Geometry assumptions checked:
- relationship labels remain geometry/debug outputs only;
- ambiguity is explicit when center or footprint spans multiple source-facing regions;
- source-local transforms remain the basis for classification.

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- no manual acceptance required for this card.

Still open:
- next card is `P2-05 - Reducer And State Support For Debug Mode And Debug Unit Pose`.

### [x] P2-05 - Reducer And State Support For Debug Mode And Debug Unit Pose

Goal: add serializable state and reducer/action support for geometry debug mode, overlay visibility, selected normal unit tracking, and debug unit pose.

Planned files:
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- potential new state helper module if file size or clarity requires it

Implementation steps:
1. Inspect current state shape and reducer/action style.
2. Add debug state as plain serializable data, likely including `isDebugMode`, `showFacingGeometryOverlay`, `debugUnitPose`, `debugUnitDimensions`, and selected normal unit id if not already represented.
3. Add actions for toggling debug mode, toggling facing geometry overlay, setting debug unit position, setting debug unit rotation, and resetting or initializing debug unit pose when debug mode opens.
4. Ensure the debug unit appears only when debug mode is active.
5. Preserve normal-mode unit selection behavior.
6. Keep debug state separate from official game state concepts where practical.
7. Add reducer tests for toggles, pose updates, serialization shape, and selection preservation.

Non-goals:
- do not render the debug unit yet;
- do not implement pointer drag yet;
- do not add official rules state;
- do not make debug mode affect legal game actions.

Validation:
- state tests pass;
- existing P0 state tests still pass;
- debug state remains plain JSON-serializable data;
- normal game state behavior is not changed except for explicit debug actions.

Manual acceptance:
- no manual browser acceptance required for this card.

Stop condition:
- stop if selected unit state is missing or incompatible and requires a broader selection architecture decision;
- stop if debug unit dimensions require official unit-type data not yet modeled.

Expected result: the app state can represent debug mode, facing overlay visibility, and a freely movable/rotatable debug unit without mixing debug tooling into official rule state.

Completed 2026-05-16:
- Added serializable debug state to the reducer with `isActive`, `showFacingGeometryOverlay`, `unitPose`, and `unitDimensions`.
- Added reducer actions for toggling debug mode, toggling the facing overlay, and updating debug unit position and rotation.
- Kept debug state separate from official gameplay state and reset paths.
- Added focused reducer tests for debug-mode activation, overlay toggling rules, and pose mutation.

Files touched:
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `P2_todo.md`

Geometry assumptions checked:
- debug state stores plain pose and dimensions only;
- selected normal unit remains authoritative for activating debug mode;
- no UI or legality logic was added in this card.

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- no manual acceptance required for this card.

Still open:
- next card is `P2-06 - Debug Hotkeys H And F`.

### [x] P2-06 - Debug Hotkeys H And F

Goal: wire keyboard shortcuts so `H` opens/toggles general debug mode and `F` toggles the front/flank/rear geometry overlay only while debug mode is active.

Planned files:
- `src/ui/p0-app.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- potential UI event helper module if needed for file size or clarity

Implementation steps:
1. Inspect current keyboard/event handling.
2. Add `H` key behavior: toggles general debug mode, causes debug unit to appear when active after the render card, and preserves selected normal unit when possible.
3. Add `F` key behavior: toggles facing overlay only when debug mode is active, and does nothing or safely hides overlay when debug mode is inactive.
4. Avoid interfering with text inputs or browser/system shortcuts.
5. Ensure debug mode can be exited cleanly.
6. Add or update tests where current test structure supports action behavior.
7. Prepare manual test steps for hotkey behavior.

Non-goals:
- do not add the overlay renderer in this card;
- do not implement debug unit dragging in this card;
- do not add a visible tutorial or feature-description panel;
- do not bind official gameplay commands to these keys.

Validation:
- automated tests cover reducer/action effects where possible;
- app builds or test suite passes;
- existing interactions still work.

Manual acceptance:
- user selects a normal unit in normal mode;
- user presses `H` and confirms the debug-status card switches `Debug-Modus` from `aus` to `an`;
- user presses `F` in debug mode and confirms the debug-status card switches `Facing-Overlay` from `aus` to `an`;
- user presses `F` again and confirms the debug-status card switches `Facing-Overlay` back to `aus`;
- user presses `H` again and confirms debug mode turns off cleanly and the overlay status is reset.

Stop condition:
- stop if current UI event architecture cannot safely support global hotkeys without a small event-handler refactor;
- stop if hotkeys conflict with an existing project-defined shortcut.

Expected result: debug mode and facing overlay visibility can be controlled from the keyboard in a predictable developer workflow.

Agent implementation and validation completed 2026-05-16:
- Wired global battlefield hotkeys so `H` toggles debug mode and `F` toggles facing-overlay state while preserving the existing overlay-cycle hotkey path.
- Added a small visible debug-status card on the battlefield so this card has meaningful manual acceptance before debug-unit rendering exists.
- Kept `P2-06` focused on hotkeys and status only; debug-unit rendering and overlay visuals remain in `P2-07` and `P2-08`.

Files touched:
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `P2_todo.md`

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- user reported the `H` / `F` workflow as acceptable on 2026-05-16.

Still open after manual acceptance:
- next card is `P2-07 - Debug Unit Rendering, Drag, And Ctrl-Wheel Rotation`.

### [x] P2-07 - Debug Unit Rendering, Drag, And Ctrl-Wheel Rotation

Goal: render a debug unit in debug mode and support free left-click dragging plus `Ctrl` + mouse wheel rotation around its center.

Planned files:
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`

Implementation steps:
1. Inspect current battlefield coordinate conversion and unit rendering.
2. Render the debug unit only when debug mode is active.
3. Draw the debug unit as a rotated rectangle based on geometry/state dimensions, not sprite size.
4. Add pointer handling for left-click drag: begin drag on debug unit, update debug unit center in UD/table coordinates, and end drag cleanly.
5. Add `Ctrl` + mouse wheel handling: rotate debug unit around its center, prevent page scroll only for the intended debug interaction, and preserve center point while rotating.
6. Keep debug movement free and non-legalized.
7. Ensure debug unit pose updates through state actions rather than local-only UI mutation.
8. Add debug unit label placeholder if relationship classifier wiring is not yet rendered.
9. Keep browser interaction smooth without changing normal unit movement behavior.

Non-goals:
- do not implement official movement;
- do not snap the debug unit to legal positions;
- do not prevent overlaps unless rendering needs a visual safeguard;
- do not allow debug interactions outside debug mode.

Validation:
- state/action tests cover debug unit pose update behavior;
- browser smoke confirms debug unit can be dragged and rotated;
- normal unit selection and existing P0 interactions still work;
- no console errors during basic interaction.

Manual acceptance:
- user selects a normal unit;
- user presses `H`;
- user confirms a debug unit appears;
- user drags the debug unit with left mouse and confirms it follows freely;
- user holds `Ctrl` and uses the mouse wheel over the battlefield/debug unit;
- user confirms the debug unit rotates around its center without changing position unexpectedly;
- user exits debug mode and confirms the debug unit disappears.

Stop condition:
- stop if current battlefield coordinate mapping is too coupled to sprite layout and needs a separate geometry-to-screen mapping refactor;
- stop if drag behavior conflicts with existing normal unit drag behavior and requires user choice.

Expected result: debug mode provides a movable, rotatable second unit for inspecting geometry relationships.

Agent implementation and validation completed 2026-05-16:
- Rendered the debug unit only while debug mode is active, using debug pose and dimensions from reducer state rather than sprite-driven UI guesses.
- Added left-click drag on the debug unit with pose updates routed through reducer actions.
- Added `Ctrl` + mouse wheel rotation on the battlefield while debug mode is active, preserving the debug unit center and normalizing the stored angle.
- Added visible debug position and rotation readouts to the debug-status card so the manual test has immediate feedback before relationship labels exist.
- Follow-up validation in `P2-09` tightened debug drag and rotation so the full rotated debug-unit footprint stays inside the battlefield instead of only clamping the unit center to the table bounds.

Files touched:
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`
- `P2_todo.md`

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance:
- user reported the debug-unit render, drag, and rotation workflow as acceptable on 2026-05-16.

Still open after manual acceptance:
- next card is `P2-08 - Facing Geometry Overlay Renderer And Debug Relationship Label`.

### [x] P2-08 - Facing Geometry Overlay Renderer And Debug Relationship Label

Goal: render the selected normal unit's extended front/flank/rear geometry boundaries and show the debug unit's relative geometric classification.

Planned files:
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`
- `src/engine/geometry/`
- potential new UI debug overlay helper module if needed for file size or clarity

Implementation steps:
1. Read selected normal unit pose and dimensions.
2. Read debug unit pose and dimensions.
3. Call pure geometry functions to compute selected unit base geometry, extended front boundary, extended rear boundary, extended flank boundaries, and relationship classification.
4. Render a dedicated debug overlay that is separate from the old deployment/sector overlay.
5. Show visual distinctions for front, rear, left flank, right flank, and boundary/ambiguous if returned.
6. Render extended lines from the selected normal unit.
7. Render text on or near the debug unit indicating its relative position, such as `front`, `left flank`, `right flank`, `rear`, `boundary`, or `ambiguous`.
8. Ensure overlay appears only when debug mode is active and `F` overlay toggle is on.
9. Ensure text fits and does not interfere with normal UI.
10. Keep overlay rendering driven by pure geometry output, not duplicated UI calculations.

Non-goals:
- do not make the overlay decide legality;
- do not reuse the old deployment/sector overlay as the facing overlay;
- do not add official combat or charge annotations;
- do not add an in-app explainer panel.

Validation:
- automated geometry tests remain the source of truth for line/classification math;
- browser smoke confirms overlay lines move/rotate consistently with selected unit geometry;
- browser smoke confirms debug unit label updates as the debug unit is moved around the selected unit;
- no console errors.

Manual acceptance:
- user selects a normal unit in normal mode;
- user presses `H` to enter debug mode;
- user presses `F` to show the facing geometry overlay;
- user confirms extended front/flank/rear boundaries render from the selected normal unit;
- user drags the debug unit into front, flank, rear, and boundary areas;
- user confirms the debug unit label changes to match the expected geometric relationship;
- user rotates the debug unit with `Ctrl` + mouse wheel and confirms classification remains geometry-driven.

Stop condition:
- stop if selected normal unit dimensions are unavailable or inconsistent;
- stop if overlay output disagrees with pure geometry tests and the discrepancy cannot be explained as a screen-coordinate transform issue.

Expected result: developers can visually inspect front/flank/rear geometry against a movable debug unit without confusing the overlay with official game legality.

Agent implementation and validation completed 2026-05-16:
- Rendered a dedicated facing-geometry overlay from pure geometry output instead of reusing the old deployment or sector overlay.
- The overlay now draws the selected unit's full front, rear, left-flank, and right-flank separator lines from pure geometry output using `getFacingBoundaries`.
- The debug unit label now shows the current geometric relationship when the facing overlay is enabled.
- The debug-status card also shows the current relationship label so the geometry classification is visible even while moving the debug unit.
- Refined the overlay after manual visual feedback so it now uses only the selected unit's edge extensions; diagonal corner rays were removed.
- Refined the relationship classifier after manual visual feedback so `Front` now requires the full target footprint to remain beyond the front line, any footprint crossing behind the front line downgrades to `Flanke`, `Ruecken` applies once the footprint is fully beyond the rear line, and `Mehrdeutig` is reserved for true flank/rear overlap cases.
- Added debug-only selected-unit rotation via `Ctrl` + `Shift` + mouse wheel so the selected unit and all four separator lines can be tested for correct rotation together.

Files touched:
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/engine/geometry/facing-boundaries.js`
- `src/engine/geometry/facing-zones.js`
- `src/engine/geometry/relationship.js`
- `src/engine/geometry/geometry.test.js`
- `P2_todo.md`

Agent validated:
- `npm run test`
- `npm run build`
- VS Code Problems on touched files

Manual acceptance pending:
- user selects a normal unit in normal mode;
- user presses `H` to enter debug mode;
- user presses `F` to show the facing geometry overlay;
- user confirms extended front/flank/rear boundaries render from the selected normal unit;
- user drags the debug unit so it is fully in front, then partly behind the front line, then fully behind the rear line;
- user confirms the debug unit label changes to match the expected geometric relationship;
- user confirms a footprint that crosses the front line becomes `Flanke`, while `Mehrdeutig` appears only for a true flank/rear overlap case;
- user confirms the `Debug Status` card updates `Beziehung` consistently with the debug-unit label;
- user rotates the debug unit with `Ctrl` + mouse wheel and confirms classification remains geometry-driven;
- user rotates the selected reference unit with `Ctrl` + `Shift` + mouse wheel and confirms the blue unit plus front, rear, left-flank, and right-flank separator lines rotate together.

Follow-up browser fix completed 2026-05-16:
- Fixed the selected-reference `Ctrl` + `Shift` + mouse wheel path after live browser smoke exposed an undefined selected-unit reference in the wheel handler.
- Increased facing-line SVG stroke visibility from subpixel rendering to a stable non-scaling `3px` stroke and raised the debug overlay stacking layer so front/flank/rear separator lines remain visible over the battlefield and selected unit.
- Live VS Code browser smoke confirmed: `H` and `F` activate debug and facing overlay, four separator lines render with visible strokes, debug-unit drag updates position and labels, `Ctrl` + mouse wheel rotates the debug unit, `Ctrl` + `Shift` + mouse wheel rotates the selected reference unit, and no page or console errors were observed during these checks.
- Manual acceptance remains pending with the user; agent browser smoke is not treated as user acceptance.

Still open after manual acceptance:
- next card is `P2-09 - Automated Tests, Browser Smoke, And Manual Acceptance Package`.

### [ ] P2-09 - Automated Tests, Browser Smoke, And Manual Acceptance Package

Goal: consolidate automated coverage and prepare exact manual/browser smoke instructions for the user to accept P2 behavior.

Planned files:
- `src/engine/geometry/*.test.js`
- `src/state/p0-state.test.js`
- `P2_todo.md`
- `roadmap.md`
- optional test helper files if consistent with existing project style

Implementation steps:
1. Review all P2 test coverage.
2. Ensure tests cover axis-aligned geometry, rotated geometry, edge cases, corner cases, boundary classification, ambiguous/overlap classification, debug state toggles, and debug unit pose updates.
3. Run the relevant test suite.
4. Run build or syntax validation if the project provides it.
5. Start the local app if required for browser smoke.
6. Perform agent browser smoke where tooling is available: debug mode toggles, overlay toggles, debug unit appears, drag works, `Ctrl` + wheel rotation works, and relationship label updates.
7. Record exact commands run and results.
8. Provide the user exact manual acceptance steps and expected results.
9. Do not mark manual acceptance complete until user reports success.

Non-goals:
- do not broaden tests into P3+ official rules;
- do not add end-to-end infrastructure unless already present or clearly lightweight;
- do not treat agent smoke as a substitute for required user manual acceptance.

Validation:
- relevant automated tests pass;
- build/syntax validation passes if available;
- browser smoke has no console errors for P2 workflow;
- manual acceptance instructions are complete and reproducible.

Manual acceptance:
- user opens the app;
- user selects a normal unit;
- user presses `H`; debug mode activates and a debug unit appears;
- user presses `F`; front/flank/rear overlay appears;
- user drags the debug unit freely around the selected normal unit;
- user uses `Ctrl` + mouse wheel to rotate the debug unit around its center;
- user confirms the debug unit label updates through front, flank, rear, and boundary/ambiguous positions;
- user presses `F`; overlay hides while debug mode remains active;
- user presses `H`; debug mode exits and the debug unit disappears;
- user reports whether the workflow is accepted.

Stop condition:
- stop if any automated geometry or state test fails;
- stop if browser smoke shows incorrect geometry, broken drag, broken rotation, or console errors;
- stop after providing manual acceptance steps until the user reports the result.

Expected result: P2 has automated proof for pure geometry and a clear user-facing manual acceptance package for the debug workflow.

Agent implementation and validation completed 2026-05-16:
- Reviewed the current P2 coverage and confirmed the automated suite now covers vector/angle primitives, rotated rectangles, unit-base geometry, facing boundaries, facing relationships, debug state toggles, debug pose mutation, and the new rotated-footprint bounds helper.
- Added a focused rotated-rectangle bounds test so footprint extents are explicit in pure geometry, not inferred in UI code.
- Tightened the debug interaction so dragging clamps against the full rotated debug-unit footprint and debug-unit rotation near a table edge reclamps the center to keep the full footprint inside the battlefield.
- Ran automated validation with `npm run test` and `npm run build`; both passed after the footprint clamp follow-up.
- Performed live browser smoke in the VS Code embedded browser against `http://127.0.0.1:5173/` and confirmed: unit selection works, `H` enables debug mode, `F` enables the facing overlay, four separator lines render visibly, dragging updates the relationship label through `Front`, flank, and `Ruecken`, `Ctrl` + mouse wheel rotates the debug unit, `Ctrl` + `Shift` + mouse wheel rotates the selected reference unit, `F` hides the overlay while debug remains active, and `H` exits debug mode and removes the debug unit.
- Confirmed the table-edge follow-up from user feedback: after dragging the debug unit to the left edge and rotating it, the rendered debug-unit box remains fully inside the battlefield instead of hanging half outside from center-only clamping.

Files touched:
- `src/engine/geometry/rectangle.js`
- `src/engine/geometry/index.js`
- `src/engine/geometry/geometry.test.js`
- `src/ui/p0-app.js`
- `P2_todo.md`

Agent validated:
- `npm run test`
- `npm run build`
- VS Code browser smoke on `http://127.0.0.1:5173/`
- VS Code Problems on touched files

Manual acceptance pending:
- user opens the app at `http://127.0.0.1:5173/`;
- user clicks `Neues Spiel` then `Zum Schlachtfeld`;
- user selects the blue test unit;
- user presses `H` and confirms the debug unit appears and `Debug-Modus` changes to `an`;
- user presses `F` and confirms the facing overlay appears with four visible separator lines;
- user drags the debug unit into front, flank, and rear positions and confirms the label and `Beziehung` field update accordingly;
- user drags the debug unit hard against the left table edge and confirms the full unit footprint stays inside the battlefield instead of hanging half outside;
- user uses `Ctrl` + mouse wheel and confirms the debug unit rotates around its center while staying inside the battlefield near the edge;
- user uses `Ctrl` + `Shift` + mouse wheel and confirms the selected reference unit plus separator lines rotate together;
- user presses `F` and confirms the facing overlay hides while debug mode remains active;
- user presses `H` and confirms debug mode exits and the debug unit disappears.

Still open after manual acceptance:
- next card is `P2-10 - Final P2 Handoff And Readiness Gate`.

### [x] P2-10 - Final P2 Handoff And Readiness Gate

Goal: close P2 only after implementation, validation, manual acceptance, documentation status, and roadmap status are all aligned.

Planned files:
- `P2_todo.md`
- `roadmap.md`
- `docs/architecture.md`
- `docs/rules/open-verification.md`
- any P2 files added under `src/engine/geometry/`, `src/state/p0-state.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/styles/p0.css`

Implementation steps:
1. Confirm all previous P2 cards are complete.
2. Confirm user manual acceptance has been reported for cards that require it.
3. Confirm docs still state that P2 is geometry/debug/dev tooling only.
4. Confirm `roadmap.md` reflects P2 completion status only after acceptance.
5. Confirm no P3 work has begun.
6. Summarize implemented files and validation results.
7. Note any residual risks or deferred questions for P3+.
8. Ask the user for explicit approval before P3 begins.

Non-goals:
- do not start P3;
- do not implement official movement, contact, ZOC, conformation, combat, setup, terrain, disclosure, or phase-order rules;
- do not merge branches unless the user explicitly asks for git/PR work.

Validation:
- relevant tests pass;
- browser smoke completed;
- user manual acceptance recorded;
- `P2_todo.md` and `roadmap.md` agree;
- open verification items for P3+ remain visible.

Manual acceptance:
- user confirms P2 is accepted complete;
- user confirms whether the branch should be committed, pushed, or prepared as a PR if that workflow is requested.

Stop condition:
- stop if manual acceptance has not been reported;
- stop if tests or browser smoke are failing;
- stop if the user wants additional review before closing P2.

Expected result: P2 is safely handed off as complete and P3 remains gated until explicit user approval.

Agent readiness review completed 2026-05-16:
- Confirmed all prior implementation cards through `P2-09` are complete on the active branch from the agent side, with automated validation and embedded-browser smoke already recorded in this board.
- Confirmed the current docs and roadmap still describe P2 strictly as geometry/debug/dev tooling only; no official movement, ZOC, conformation, combat, setup, terrain, disclosure, or phase-order rules were added under the P2 label.
- Confirmed `roadmap.md` still keeps P3 gated behind P2 approval and does not claim P2 is complete yet.
- Confirmed no P3 work has begun in the current implementation slice.
- Residual follow-up risk noted for later phases: table-edge, collision, contact, and legality work must continue to use full unit footprints rather than center-only assumptions; the late P2 debug clamp fix established that direction for future validators.
- Current blocker for closing `P2-10`: explicit user manual acceptance of P2 and user confirmation that P2 is approved complete.

If the user accepts P2:
- mark `P2 demonstrated to user` and `P2 approved complete by user` in the phase status;
- mark `Browser/manual smoke steps have been provided and user acceptance has been recorded` and `User explicitly approves readiness to proceed toward P3` in the definition of done;
- update `roadmap.md` P2 from in-progress to complete;
- keep P3 gated until the user explicitly asks to begin P3 implementation.

Completed 2026-05-16:
- User explicitly stated `P2 ist damit fertig`, accepting P2 after the P2-09 validation and browser/manual smoke package.
- P2 remains scoped to deterministic geometry and debug tooling only; it does not implement official movement, ZOC, contact, conformation, combat, setup, terrain effects, or hidden-information reveal rules.
- P3 planning may begin, but P3 implementation remains gated behind an approved `P3_todo.md` execution board and explicit user approval for implementation.
