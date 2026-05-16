# P3 TODO - Tournament Setup, Terrain, And Deployment Foundation

Status: Complete - P3 accepted by user on 2026-05-16; handoff prepared on `feature/p3-setup-terrain-foundation`
Date drafted: 2026-05-16
Planner: GPT-5.5 preferred planner
Future executor: GPT-5.4 preferred executor after explicit user approval
Intended branch: `feature/p3-setup-terrain-foundation`
Master plan: `roadmap.md`
Architecture source: `docs/architecture.md`
Governance source: `docs/project-governance.md`
Rules workspace: `docs/rules/`
Open verification source: `docs/rules/open-verification.md`
New source note: `Konzepte/Reference_Sheet_V4.pdf` is available as a tournament quick-reference cross-check, but it does not override `Errata_ADG_V4_English.pdf` or `Rules.pdf`.

## Purpose

P3 creates the first real pre-battle setup foundation for standard-200 tournament training.

P3 should let the app represent the setup sequence, place labelled terrain and setup-object placeholders on the battlefield, model camps and deployment-zone scaffolding, and capture private battle-plan, flank-march, and ambush-marker declarations without leaking hidden information.

P3 is a setup foundation. It must not claim full official terrain effects, movement legality, ZOC, charge, conformation, combat, reveal behavior, army-builder legality, or deployment legality unless the exact rule has been source-checked and tested.

## Brainstorm Summary

Yes: P3 should already place terrain, but only as geometry-first placeholders at first. The placeholder should have a real table footprint and a visible label, for example `Hill`, `Wood`, `Field`, `Road`, `River`, or `Camp`. This keeps the screen useful and testable without pretending that all terrain effects are complete.

The practical tournament battle plan should be a separate private setup board. Its `left`, `center`, and `right` fields are not battlefield sectors. They are corps-assignment buckets for the player's plan. A `flank march` field should also exist, with later source-checked details for which flank or entry behavior is legal.

Ambush markers should have owner-private content fields where the player records which units are inside a marker. The public battlefield can later show marker shells, while the canonical state stores hidden contents and fake marker data when verified.

Design suggestions for P3:

- Add a setup timeline panel so the player always sees the current setup step and which decisions are locked.
- Plan the right-side battlefield panel as the long-term phase tracker: during setup it shows the pre-battle checklist; during battle it switches to command, movement, shooting, melee, rout/pursuit/cleanup, and victory/end-turn steps.
- Use shape placeholders first: rectangle or ellipse area terrain, path placeholders for roads/rivers, and small labelled markers for camps and ambushes.
- Add visible `source status` badges in dev/debug surfaces: `verified`, `needs source check`, or `placeholder`.
- Keep public battlefield objects visually distinct from private setup boards so hidden information is not accidentally exposed in hotseat play.
- Treat full-footprint table bounds as a P3 invariant for terrain, camps, markers, and later deployment, continuing the P2 lesson that center-only placement is not enough.
- Keep drag and drop ergonomic, but route every change through serializable setup actions and reducers.
- For future multiplayer, assume most setup objects are public once placed, but battle plans, flank-march contents, ambush contents, fake-marker truth, and hidden off-table assignments must remain owner-private.
- Treat correct ambush play and corps deployment as future legality constraints from the start: marker shells and corps placements need IDs, ownership, footprints, and relation data so later validators can check reveal behavior, corps relative positions, table bounds, and overlap.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Confirm P3 implementation is explicitly approved by the user. This draft alone is not implementation approval.
2. Re-read this card, `roadmap.md` P3, `docs/architecture.md`, `docs/rules/terrain-and-setup.md`, `docs/rules/hidden-info.md`, and `docs/rules/open-verification.md`.
3. Check `Konzepte/Reference_Sheet_V4.pdf` manually when the card relies on tournament quick-reference facts.
4. Run `git status --short` and protect unrelated user changes.
5. Give the user a short PM block brief before implementation edits.
6. Keep implementation inside P3 scope.

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

## Global P3 Scope Guardrails

In scope:
- standard-200 setup state skeleton;
- source inventory and reference-sheet cross-check notes;
- setup timeline and current setup step state;
- long-term phase tracker surface for pre-battle and later battle phases;
- labelled placeholder terrain objects with real table footprints;
- placeholder terrain placement, selection, move, resize, and lock state;
- physical placement checks such as table bounds using full footprints;
- terrain validation skeleton with explicit `needs-source-check` results where official rules are not verified;
- camps, fortifications, obstacles, and stakes as setup-object placeholders and data hooks;
- tournament battle-plan board with `left`, `center`, `right`, and `flank march` assignment fields;
- private ambush marker content fields and public marker shell planning;
- canonical hidden state versus player-view boundaries for setup declarations;
- multiplayer-oriented privacy boundaries for battle plans, flank marches, ambush contents, and fake-marker truth;
- deployment-zone model and visible deployment placeholders only where source confidence permits;
- placeholder non-overlap and full-footprint checks for visible deployment objects where implemented;
- automated tests for setup reducers, terrain placeholder geometry, placement bounds, battle-plan assignment state, and player-view filtering;
- browser/manual smoke for setup flow, terrain placement, battle-plan board, ambush fields, and privacy boundaries.

Out of scope:
- no official movement commands;
- no movement allowance or terrain movement effects;
- no ZOC;
- no charge legality;
- no contact or conformation legality;
- no shooting, melee, rout, pursuit, cohesion, or victory rules;
- no complete army-builder or roster legality;
- no full official terrain-effect table unless source-checked in this phase;
- no hidden-information reveal triggers unless source-checked and explicitly approved;
- no claim that placeholder terrain placement is tournament-legal before official validators exist.

Hard rules:
- Errata overrides the full rules; the reference sheet is a quick-reference cross-check, not an override.
- Terrain and setup objects must be state objects with geometry, not decorative CSS-only overlays.
- UI can propose placement, but reducers and validators own accepted setup state.
- P0 visual deployment guides must not be reused as official P3 deployment zones.
- Battle-plan `left`, `center`, and `right` fields must not be confused with battlefield sectors.
- Hidden setup data must exist in canonical state and be filtered for player views.
- Battle plans must be designed as secret owner data for future multiplayer; public setup objects must be safe to show to both players unless a verified rule says otherwise.
- Ambush markers must separate public marker shell, private contents, and later reveal state.
- Corps and unit deployment placeholders must keep enough footprint and corps-assignment data for later non-overlap, relative-placement, and command/deployment validators.
- P4 must not start until P3 is implemented, validated, manually accepted where required, and approved by the user.

## Shared P3 Constants And Assumptions

- P2 is accepted complete by the user on 2026-05-16.
- Default format remains `standard-200`.
- Players: `2`.
- Points: `200` per army.
- Corps: `3` per army.
- Standard 6-15 mm battlefield: `120 cm x 80 cm`.
- Scale: `1 UD = 4 cm`.
- Standard battlefield planning target: `30 UD x 20 UD`.
- Terrain and setup placeholders use UD-space footprints.
- Terrain placeholder labels are visible user-facing text because they identify the placeholder object itself, not tutorial/explainer text.
- Exact terrain counts, region tables, placement restrictions, camp costs, deployment-zone math, ambush marker counts, and flank-march rules remain open until source-checked.

## Phase Status

- [x] P0 accepted complete by user
- [x] P1 accepted complete by user
- [x] P2 accepted complete by user
- [x] P3 brainstorming requested
- [x] P3 execution board drafted
- [x] P3 execution board approved by user for P3-00 preflight and GPT-5.4 handoff
- [x] P3-00 preflight completed
- [x] P3 implementation started
- [x] Reference sheet and setup sources reviewed for P3
- [x] Setup state skeleton implemented
- [x] Standard-200 battlefield profile implemented
- [x] Labelled terrain placeholders implemented
- [x] Terrain placement interaction implemented
- [x] P3-05 manual acceptance recorded
- [x] Terrain validation skeleton implemented
- [x] P3-06 manual acceptance recorded
- [x] Camps and setup-object placeholders implemented
- [x] P3-07 manual acceptance recorded
- [x] Battle-plan board implemented
- [x] P3-08 manual acceptance recorded
- [x] Ambush marker private-content model implemented
- [x] P3-09 manual acceptance recorded
- [x] Player-view filtering for setup hidden info implemented
- [x] P3-10 manual acceptance recorded
- [x] Deployment-zone foundation implemented
- [x] P3-11 manual acceptance recorded
- [x] P3 automated and browser validation completed
- [x] P3 demonstrated to user
- [x] P3 approved complete by user

## Definition Of Done

P3 is done when:

- [x] A setup state skeleton represents the approved P3 pre-battle steps.
- [x] A right-side phase tracker can show setup steps now and is structured to switch to battle phases later.
- [x] Standard-200 table profile is represented as setup state and battlefield profile data.
- [x] Terrain placeholders can be created or selected, labelled, placed, moved, and locked as setup objects.
- [x] Terrain placeholders have real UD-space footprints and full-footprint table-bound checks.
- [x] Placement validation distinguishes verified physical checks from source-blocked official rules.
- [x] Camps and other setup-object placeholders exist as state objects, not decorative overlays.
- [x] The battle-plan board has `left`, `center`, `right`, and `flank march` assignment fields for corps cards.
- [x] Battle-plan fields are private setup data and are not treated as battlefield sectors.
- [x] Ambush marker fields can record owner-private contents while public marker shells stay separate.
- [x] Canonical setup state can be projected into player-view or hotseat-safe views without leaking hidden data.
- [ ] Battle-plan, flank-march, ambush contents, and fake-marker truth are designed for future multiplayer secrecy.
- [x] Deployment-zone foundation is represented without reusing P0 visual guide claims as official legality.
- [x] Visible deployment placeholders preserve corps identity, full footprints, and non-overlap hooks for later official validators.
- [x] Automated tests cover setup state transitions, placeholder terrain geometry, table-edge bounds, battle-plan assignment, ambush data shape, and player-view filtering.
- [x] Browser smoke covers the setup flow, terrain placeholder placement, battle-plan assignment, ambush content entry, and hotseat privacy behavior.
- [x] `roadmap.md` and this board reflect final P3 status.
- [x] User explicitly approves readiness to proceed toward P4.

## Execution Cards

### [x] P3-00 - Preflight, P2 Handoff, And Branch Scope

Goal: start P3 planning-to-implementation from a known repo state, record user approval for P3-00, and keep feature implementation gated until branch workflow is clean.

Planned files:
- `P3_todo.md`
- `roadmap.md`
- no implementation files unless a planning correction is required

Implementation steps:
1. Confirm user approval before any P3 implementation edits.
2. Confirm P2 is accepted complete and recorded in `P2_todo.md` and `roadmap.md`.
3. Run `git status --short --branch` and identify whether the current P2 branch should be committed or a fresh P3 branch should be created.
4. Confirm the intended branch `feature/p3-setup-terrain-foundation` or ask for a branch workflow decision if P2 changes are still uncommitted.
5. Re-read P3 roadmap, architecture, terrain/setup, hidden-info, and open-verification notes.
6. Reconfirm P3 scope: setup foundation, placeholder terrain, private declarations, player-view boundaries.
7. Do not implement gameplay rules in this card.

Non-goals:
- no terrain UI implementation;
- no setup reducer implementation;
- no official terrain legality claims;
- no P4 movement work.

Validation:
- `git status --short --branch`
- `P3_todo.md` and `roadmap.md` agree on P3 status
- VS Code Problems on touched planning files

Manual acceptance:
- user confirms this P3 execution board is approved for P3-00 preflight;
- user confirms branch workflow for P3.

Stop condition:
- stop if P3 implementation is not approved;
- stop if the worktree state makes branching unsafe without user direction.

Expected result: P3 has an approved implementation start point and clean branch/scope handoff.

Agent preflight completed 2026-05-16:
- User approved the P3 board direction with additional requirements for a right-side phase tracker, multiplayer-secret battle plans, correct future ambush play, and corps deployment/non-overlap hooks.
- P2 is accepted complete and recorded in `P2_todo.md` plus `roadmap.md`.
- Current active branch is still `feature/p2-fundamental-geometry`.
- Current working tree is dirty with accepted P2 source work, P2/P3 planning files, and P3 planning-document updates. This is not a clean point for silent branch switching.
- P3 feature implementation has not started.
- P3 scope is reconfirmed as setup foundation, labelled placeholder terrain, public setup objects, private battle-plan/ambush/flank-march declarations, player-view boundaries, and deployment placeholders with future full-footprint and non-overlap hooks.
- No gameplay rules, movement, ZOC, charge, conformation, combat, reveal triggers, or P4 work were implemented in this card.

Branch handoff for GPT-5.4:
- Before P3 feature implementation, resolve git workflow explicitly: commit/stash accepted P2 work or otherwise confirm carrying the dirty working tree forward.
- Then create or switch to `feature/p3-setup-terrain-foundation` for P3 implementation.
- Do not begin P3-01 implementation while still unsure whether the dirty P2 work should remain on the current branch.

Still open before P3-01 implementation:
- branch workflow decision and clean P3 implementation handoff.

### [x] P3-01 - Source Review, Reference Sheet, And Open Verification Update

Goal: make the minimum source-checked setup and terrain source matrix needed before implementation relies on any official P3 rule.

Planned files:
- `docs/rules/open-verification.md`
- `docs/rules/terrain-and-setup.md`
- `docs/rules/hidden-info.md`
- optional new focused source note if useful: `docs/rules/setup-source-notes.md`

Implementation steps:
1. Inventory `Konzepte/Reference_Sheet_V4.pdf` alongside the existing source PDFs.
2. Manually inspect the reference sheet for setup, terrain, battle-plan, ambush, and flank-march quick-reference facts.
3. Cross-check any engine-relevant fact against `Rules.pdf` and `Errata_ADG_V4_English.pdf` before marking it verified.
4. Update open verification IDs for terrain counts, terrain sizes, region table, camps, deployment zones, battle plan, ambush markers, and flank marches.
5. Mark which P3 implementation facts are allowed as physical placeholder behavior versus which are official-rule-blocked.
6. Preserve source priority: errata, rules, then supporting sources and quick references.

Non-goals:
- do not implement any code;
- do not OCR-convert the whole rulebook unless the user explicitly requests it;
- do not treat the reference sheet as overriding the full rules.

Validation:
- source notes identify verified, open, and placeholder-only facts;
- open verification tracker contains all unresolved P3 blockers;
- link paths and source names are valid.

Manual acceptance:
- user reviews whether the P3 source split is strict enough before code begins.

Stop condition:
- stop if terrain/setup quick-reference facts conflict with the rulebook or errata;
- stop if manual source inspection cannot identify enough facts to safely continue even with placeholders.

Expected result: P3 has a source-status map that tells implementers what can be built as a placeholder and what remains blocked.

Completed 2026-05-16:
- Confirmed `Konzepte/Reference_Sheet_V4.pdf` is present in the authoritative source folder and recorded it as a tournament quick-reference cross-check source.
- Confirmed the current environment cannot extract useful text from `Reference_Sheet_V4.pdf` with the available local tools, so P3 must continue to treat it as a manual cross-check source rather than a machine-readable authority.
- Added [docs/rules/setup-source-notes.md](docs/rules/setup-source-notes.md) as the P3 implementation source-status map.
- Marked which facts are stable enough for placeholder infrastructure now: standard battlefield profile, setup-state ownership, geometry-first setup objects, canonical hidden state, player-view filtering, separate tournament battle-plan board, and full-footprint placement checks.
- Marked which P3 items are allowed only as placeholders for now: labelled terrain shapes, public setup-object placeholders, private battle-plan and ambush UI, player-view filtering skeleton, visible deployment placeholders, and the right-side phase tracker.
- Reconfirmed blocked official-rule areas in [docs/rules/open-verification.md](docs/rules/open-verification.md), especially terrain quotas, exact terrain geometry rules, camp legality/costs, deployment-zone math, corps-relative deployment, ambush legality, flank-march timing, and reveal timing.
- Kept source priority intact: errata and full rules remain authoritative over the tournament reference sheet and OCR helpers.

Files touched:
- `docs/rules/setup-source-notes.md`
- `docs/rules/index.md`
- `docs/rules/terrain-and-setup.md`
- `docs/rules/hidden-info.md`
- `P3_todo.md`

Source assumptions checked:
- `Reference_Sheet_V4.pdf` is available but not text-readable with local tools.
- Placeholder implementation may enforce physical/data-shape invariants only.
- Official setup legality remains blocked until direct source verification.

Agent validated:
- VS Code Problems on touched planning files
- `git status --short --branch`

Manual acceptance:
- user reviews whether the source split between `verified enough for placeholder`, `placeholder-only allowed`, and `blocked` is strict enough for GPT-5.4 to begin P3 feature work safely.

Still open:
- next card is `P3-02 - Setup State Skeleton And Phase Tracker`.

### [x] P3-02 - Setup State Skeleton And Phase Tracker

Goal: create serializable setup state and a visible right-side phase tracker without implementing official setup legality yet.

Planned files:
- `src/state/p0-state.js` or a new focused setup state module under `src/state/`
- `src/state/*.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js` or new setup UI module if file size requires it
- `src/styles/p0.css`

Implementation steps:
1. Define P3 setup step ids for the approved subset: format, region, terrain, terrain-adjustment, camps, battle-plan, ambushes, deployment, ready.
2. Add setup state as plain serializable data.
3. Add reducer actions for entering setup, advancing setup step, returning to previous unlocked step where allowed, and locking a draft step.
4. Render a right-side phase tracker that shows pre-battle setup steps now.
5. Design the tracker data so it can later switch to battle steps such as command, movement, shooting, melee, rout/pursuit/cleanup, and victory/end turn without replacing the component.
6. Keep setup state separate from battle turn state.
7. Add tests for initial setup state, step transitions, lock behavior, and reset behavior.

Non-goals:
- no official terrain placement validation;
- no battle-plan contents yet;
- no full army-builder or roster validation;
- no movement phase.

Validation:
- `npm run test`
- `npm run build`
- setup reducer state is JSON-serializable
- VS Code Problems on touched files

Manual acceptance:
- user starts a new game and sees the right-side phase tracker before battle;
- user can move through the placeholder setup steps without entering battle rules.

Stop condition:
- stop if the existing P0 state file would become too large; create focused setup modules instead.

Expected result: P3 has a setup-state backbone and a visible phase tracker ready to serve both pre-battle and future battle phases.

Completed 2026-05-16:
- Added serializable setup step ids and tracker definitions in `src/state/p0-state.js`.
- Added setup reducer state plus step advance, previous-step, and lock-step actions in `src/state/p0-state.js`.
- Routed `START_NEW_GAME` into battlefield setup flow instead of treating a fresh match as battle-ready.
- Added a reusable right-side phase tracker for setup now and battle phases later in `src/ui/p0-battlefield.js`.
- Disabled advance interactions while setup is active and updated the new-game handoff copy in `src/ui/p0-app.js`.
- Added reducer coverage for setup initialization, step transitions, lock behavior, and setup-time movement blocking in `src/state/p0-state.test.js`.
- Added tracker styling in `src/styles/p0.css`.

Post-feedback follow-up on 2026-05-16:
- Fixed a render-path regression in `src/ui/p0-app.js` where setup-side unit interactions referenced the battlefield profile inconsistently.
- Added explicit setup completion so the `Bereit` step can transition from setup mode into battle mode.
- Added deployment-step and ready-step unit dragging through reducer state so units can be repositioned during setup without using `Advance`.
- Added reducer tests for blocked pre-deployment movement, allowed deployment placement, and setup completion.
- Revalidated with `npm run test` and `npm run build`.

Files touched:
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3-01 allows placeholder-only setup flow and right-side phase tracker infrastructure.
- No official terrain, deployment, or battle-plan legality is claimed by this card.
- Setup and battle phase data remain separate so later battle-turn logic does not replace the tracker surface.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance:
- User replied `passt` and approved proceeding to `P3-03`.

Still open:
- Next implementation card after acceptance: `P3-03 - Standard-200 Battlefield Profile And Setup Shell`.

### [x] P3-03 - Standard-200 Battlefield Profile And Setup Shell

Goal: represent the standard-200 battlefield profile and setup shell as data-driven state rather than scattered UI constants.

Planned files:
- `src/state/` setup or format module
- optional `src/data/` format or battlefield profile module
- `src/ui/` setup shell module
- tests for profile data shape

Implementation steps:
1. Define a standard-200 battlefield profile for `30 UD x 20 UD`, `120 cm x 80 cm`, and `1 UD = 4 cm`.
2. Keep profile data separate from UI rendering constants.
3. Wire the setup shell to read table dimensions from the profile.
4. Ensure the P2 geometry and P3 placement helpers use the same table profile dimensions.
5. Add tests that the profile maps centimeters to UD consistently.

Non-goals:
- no army roster validation;
- no official deployment-zone math beyond placeholders;
- no terrain effects.

Validation:
- profile tests pass;
- build passes;
- battlefield renders from profile values.

Manual acceptance:
- user sees the standard-200 setup shell with the expected 30 x 20 UD table profile.

Stop condition:
- stop if profile data requires a broader data-directory architecture decision.

Expected result: table dimensions become setup/profile data and can be reused by terrain and deployment systems.

Completed 2026-05-16:
- Added `src/data/battlefield-profiles.js` as the shared data source for the standard-200 battlefield profile.
- Added profile conversion tests in `src/data/battlefield-profiles.test.js`.
- Replaced the previous inline battlefield profile id in `src/state/p0-state.js` with the shared profile constant.
- Added state coverage that the default app state points at the standard-200 battlefield profile in `src/state/p0-state.test.js`.
- Updated battlefield coordinate/clamp helpers in `src/ui/p0-app.js` so input math reads width and height from the active battlefield profile.
- Updated battlefield rendering and setup-shell scale text in `src/ui/p0-battlefield.js` so table dimensions and UD/cm labels come from the same profile data.

Files touched:
- `src/data/battlefield-profiles.js`
- `src/data/battlefield-profiles.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`

Source assumptions checked:
- P1 and architecture docs already define the standard planning target as `30 UD x 20 UD`, `120 cm x 80 cm`, and `1 UD = 4 cm` for the standard 6-15 mm battlefield.
- This card centralizes profile data only and does not introduce new terrain, deployment, or setup-legality claims.
- Battlefield profile selection remains state-driven through `battlefieldProfileId` so later formats can reuse the same path.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance:
- User replied `Passt` after reviewing the P3-03 battlefield profile wiring and follow-up UI adjustments.

Still open:
- Next implementation card after acceptance: `P3-04 - Terrain Placeholder Data Model`.

### [x] P3-04 - Terrain Placeholder Data Model

Goal: add labelled terrain-placeholder state objects with real UD-space footprints and source-verification status.

Planned files:
- `src/engine/setup/` or `src/engine/terrain/` placeholder helpers
- `src/state/` setup reducer module
- tests for terrain placeholder state and footprint bounds

Implementation steps:
1. Define a terrain placeholder instance shape with id, terrainType, label, shapeModel, footprint, pose, ownerRole, placementStep, lockState, sourceStatus, and sourceRefs.
2. Support simple area shapes first: rectangle and ellipse placeholders.
3. Add path placeholders for roads/rivers only if they can be represented without official placement claims.
4. Add pure helper functions for placeholder footprint bounds and table-edge checks.
5. Add reducer actions for adding, updating, selecting, locking, and removing draft placeholders.
6. Add tests for full-footprint table-bound checks.

Non-goals:
- no terrain movement effects;
- no combat, shooting, or visibility effects;
- no official quota or overlap validation unless verified in P3-01.

Validation:
- `npm run test`
- geometry/table-edge tests prove full footprint handling;
- no UI imports inside engine helpers.

Manual acceptance:
- no browser acceptance required if this card is state/engine only.

Stop condition:
- stop if shape representation needs user choice beyond rectangle/ellipse/path placeholders.

Expected result: P3 has terrain placeholders as real state objects ready for UI rendering.

Completed 2026-05-16:
- Added `src/engine/setup/terrain-placeholders.js` as the pure terrain-placeholder model for P3.
- Defined placeholder ids, terrain types, shape models, source statuses, default factory values, and full-footprint bounds helpers.
- Added `src/engine/setup/terrain-placeholders.test.js` to cover default shape, rotated footprint bounds, and battlefield-edge checks.
- Extended `src/state/p0-state.js` with a serializable `setup.terrain` slice plus reducer actions for add, update, select, lock, and remove.
- Wired reducer-side full-footprint battlefield bounds checks through the active battlefield profile.
- Added reducer coverage in `src/state/p0-state.test.js` for terrain add/select/update/lock/remove and rejection of out-of-bounds placeholders.

Files touched:
- `src/engine/setup/terrain-placeholders.js`
- `src/engine/setup/terrain-placeholders.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`

Source assumptions checked:
- P3-01 and `docs/rules/setup-source-notes.md` allow labelled terrain shapes as placeholder-only infrastructure.
- P3 may enforce physical/data-shape invariants such as positive geometry and full-footprint table bounds.
- Official terrain quotas, overlap rules, region legality, road/rivers, and adjustment rules remain blocked for later validation cards.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance:
- No browser/manual acceptance required for this state/engine-only card.

Still open:
- Next implementation card: `P3-05 - Terrain Palette, Placement, Labels, And Footprint Rendering`.

### [x] P3-05 - Terrain Palette, Placement, Labels, And Footprint Rendering

Goal: let the user place labelled placeholder terrain on the battlefield through the setup UI.

Planned files:
- `src/ui/` setup or battlefield rendering modules
- `src/styles/p0.css` or a new P3 stylesheet if preferred
- `src/state/` setup reducer module

Implementation steps:
1. Add a terrain palette with placeholder entries such as `Hill`, `Wood`, `Field`, `Road`, `River`, and `Village` only as source-status-aware placeholders.
2. Render placed terrain placeholders as simple labelled shapes on the battlefield.
3. Allow drag placement and movement inside the table using full-footprint bounds.
4. Allow simple resize or size presets if it stays small and testable.
5. Route all placement changes through setup actions and reducer state.
6. Show label text inside the placeholder shape.
7. Keep terrain placeholders visually distinct from units, deployment guides, and P2 debug overlays.

Non-goals:
- no terrain effects;
- no official overlap/quota/region legality unless verified;
- no decorative art assets.

Validation:
- build passes;
- browser smoke places and moves at least two terrain placeholders;
- no console errors;
- normal unit/debug interactions are not broken.

Manual acceptance:
- user enters terrain setup step;
- user places labelled terrain placeholders;
- user drags them around;
- user confirms they stay inside the table and remain readable.

Stop condition:
- stop if drag/resize behavior starts conflicting with unit/debug interaction architecture and needs an input refactor.

Expected result: P3 provides practical terrain placement using labelled geometry placeholders.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added a terrain palette to the battlefield setup UI in `src/ui/p0-battlefield.js` with placeholder entries for `Hill`, `Wood`, `Field`, `Road`, `River`, and `Village`.
- Rendered placed terrain placeholders directly on the battlefield surface with visible labels, distinct placeholder styling, and shape-specific visuals for rectangle versus ellipse placeholders.
- Added terrain-placeholder selection and drag movement in `src/ui/p0-app.js`, routed through existing reducer actions instead of direct DOM mutation.
- Reused the reducer-side full-footprint battlefield-bounds checks from P3-04 so dragged placeholders stay inside the active battlefield profile.
- Added terrain palette and placeholder styling in `src/styles/p0.css`, keeping them visually distinct from units and debug overlays.

Files touched:
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 allows geometry-first placeholder terrain objects with visible labels and full-footprint table bounds.
- This card still does not claim official terrain quotas, overlap legality, region legality, or terrain effects.
- Road and river entries are still placeholder geometry entries, not verified path-rule implementations.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed that the pure placeholder placement flow is working for now.
- User explicitly noted that rivers and roads still need later official-rule handling such as spanning from one side to another; this remains outside the accepted placeholder scope for P3-05.
- Accepted outcome for this card: basic labelled placement and movement is good enough until official terrain-rule validation follows.

Still open:
- Next implementation card: `P3-06 - Terrain Placement Validation Skeleton`.

### [x] P3-06 - Terrain Placement Validation Skeleton

Goal: add a validation result surface that distinguishes physical placeholder checks from official rules that still need source verification.

Planned files:
- `src/engine/setup/` or `src/engine/terrain/` validation module
- `src/state/` setup reducer module
- tests for validation result shape
- UI status panel for placement diagnostics

Implementation steps:
1. Define placement validation results with ok, severity, ruleArea, message, facts, ruleRefs, and sourceStatus.
2. Implement verified physical checks first: table bounds, positive size, valid shape model, unique id.
3. Return explicit `needs-source-check` diagnostics for unverified official rules such as quotas, exact region table, overlap restrictions, road/rivers, and adjustment.
4. Render diagnostics in the setup UI without claiming official legality.
5. Add tests for valid placeholder placement, table-edge failure, invalid size, and source-blocked official checks.

Non-goals:
- no official terrain quota enforcement unless P3-01 verifies it;
- no movement or combat effects;
- no hidden information behavior.

Validation:
- unit tests pass;
- build passes;
- UI diagnostics show source status accurately.

Manual acceptance:
- user attempts a physically invalid placeholder placement and sees a clear diagnostic;
- user sees source-check warnings where official terrain rules are not yet verified.

Stop condition:
- stop if source status cannot be communicated without confusing the UI as tournament-complete.

Expected result: terrain placement can be validated honestly without inventing unverified official rules.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/setup/terrain-validation.js` as a pure validation module for terrain placeholders.
- Validation results now carry `ok`, `severity`, `ruleArea`, `message`, `facts`, `ruleRefs`, and `sourceStatus`.
- Implemented verified physical checks for shape model, positive size, unique id, and full-footprint battlefield bounds.
- Added explicit `needs-source-check` warnings for blocked official terrain areas such as region/quotas, overlap or adjustment rules, and road or river-specific constraints.
- Extended `src/state/p0-state.js` so terrain validation snapshots are stored in serializable reducer state and updated after add, update, select, lock, and remove actions.
- Invalid terrain add or move attempts now keep the last valid state while exposing the rejected candidate as the active validation focus.
- Added a terrain validation status card in `src/ui/p0-battlefield.js` and styling in `src/styles/p0.css`.
- Adjusted terrain dragging in `src/ui/p0-app.js` so out-of-bounds attempts can be detected by the reducer and surfaced as diagnostics instead of being silently clamped away.
- Added engine and reducer coverage in `src/engine/setup/terrain-validation.test.js` and `src/state/p0-state.test.js`.

Files touched:
- `src/engine/setup/terrain-validation.js`
- `src/engine/setup/terrain-validation.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 may enforce only verified physical and data-shape invariants while blocked official terrain rules remain explicit warnings.
- Road and river placement legality still remains source-blocked beyond placeholder diagnostics.
- P3-06 does not claim official terrain legality; it only distinguishes physical errors from source-blocked rule areas.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed the warning surfaces are present and useful, including later potential value for rule-conform placement guidance in the full game.
- User explicitly confirmed the specific road or river warning is now visible after the UI ordering and scrollability fixes.
- Accepted outcome for this card: P3 now cleanly separates physical placement errors from source-blocked terrain-rule warnings.

Still open:
- Next implementation card: `P3-07 - Camps, Fortifications, Obstacles, And Setup Objects`.

### [x] P3-07 - Camps, Fortifications, Obstacles, And Setup Objects

Goal: model mandatory camps and related setup objects as labelled placeholders and state objects.

Planned files:
- `src/state/` setup reducer module
- `src/engine/setup/` setup-object helpers
- `src/ui/` setup rendering modules
- tests for setup object shape

Implementation steps:
1. Define setup object families: camp, fortified camp, sacred camp, fortification, obstacle, stakes, and marker shells where appropriate.
2. Add a mandatory camp placeholder for each player in standard-200 setup state.
3. Keep point/budget hooks as data fields, but do not enforce exact costs until source-checked.
4. Render setup objects as labelled battlefield placeholders.
5. Add placement actions and table-bound checks.
6. Add tests for setup object creation, ownership, and placeholder placement.

Non-goals:
- no official camp cost validation unless verified;
- no combat effects;
- no camp attack rules;
- no obstacle movement effects.

Validation:
- tests pass;
- build passes;
- browser smoke can show and move camp placeholders.

Manual acceptance:
- user sees player camp placeholders during setup;
- user confirms they are labelled and physically placed as setup objects.

Stop condition:
- stop if camp/fortification source rules are too uncertain to even model placeholders safely.

Expected result: P3 setup has public setup-object placeholders with future rule hooks.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/setup/setup-objects.js` as the pure setup-object placeholder module for camps and related public setup objects.
- Defined setup-object families for camp, fortification, obstacle, stakes, and marker-shell-adjacent placeholder categories, plus placeholder type ids for camp variants and field obstacles.
- Added two mandatory standard-200 camp placeholders to initial setup state so each player starts with a visible public camp object.
- Extended `src/state/p0-state.js` with a serializable `setup.setupObjects` slice and reducer actions for add, update, select, and remove during the camps step.
- Added optional public placeholder buttons for `Fortification`, `Obstacle`, and `Stakes` in the camps-step UI.
- Rendered setup objects directly on the battlefield with distinct public-object styling and owner differentiation for the two mandatory camps.
- Added drag movement for setup objects during the camps step, reusing reducer-owned full-footprint battlefield bounds rather than direct DOM placement.
- Added engine and reducer coverage in `src/engine/setup/setup-objects.test.js` and `src/state/p0-state.test.js`.

Files touched:
- `src/engine/setup/setup-objects.js`
- `src/engine/setup/setup-objects.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 allows camps, fortifications, obstacles, and stakes as public placeholder setup objects before official legality is source-checked.
- Standard-200 mandatory camp existence is modeled now, but exact budget or legality rules remain source-blocked.
- This card still does not claim official camp costs, sacred or fortified camp legality, or obstacle effects.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed the camp and related setup-object functions are present and useful in placeholder form.
- User explicitly noted that stakes, fortification, and obstacle rules still need later rule-conform implementation, which remains outside the accepted placeholder scope of this card.
- Accepted outcome for this card: the setup-object path is in place and suitable as a future rules-complete seam.

Still open:
- Next implementation card: `P3-08 - Tournament Battle Plan Board`.

### [x] P3-08 - Tournament Battle Plan Board

Goal: implement a private tournament-style battle-plan board with left, center, right, and flank-march assignment areas.

Planned files:
- `src/state/` setup reducer module
- `src/ui/` battle-plan setup module
- `src/styles/p0.css` or P3 stylesheet
- tests for battle-plan state

Implementation steps:
1. Define battle-plan state with owner player, left corps slots, center corps slots, right corps slots, flank-march slot, lock state, visibility scope, and sourceStatus.
2. Render a private setup board with four assignment areas: `left`, `center`, `right`, and `flank march`.
3. Render three corps cards per player for standard-200 placeholder play.
4. Support drag and drop or click-to-assign for corps cards.
5. Store assignments in canonical setup state with owner-only visibility for future multiplayer.
6. Ensure the opponent and public setup view do not expose battle-plan assignments.
7. Make clear in state naming that these are battle-plan fields, not battlefield sectors.
8. Add tests for assigning corps to fields, moving a corps between fields, and filtering the board out of the opponent view.

Non-goals:
- no official battle-plan effects unless source-checked;
- no flank-march arrival rules;
- no deployment-zone mutation from battle plan yet;
- no opponent visibility beyond an explicit redacted/public-safe surface.

Validation:
- state tests pass;
- browser smoke assigns corps cards to left, center, right, and flank march;
- no console errors.

Manual acceptance:
- user assigns corps cards to the four battle-plan fields;
- user confirms the fields feel like the real tournament battle-plan sheet and not battlefield sectors.
- user confirms the battle plan is treated as private data, not public battlefield setup information.

Stop condition:
- stop if official battle-plan timing/source wording contradicts the proposed setup state boundary.

Expected result: the practical tournament battle plan is represented as private setup data.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/setup/battle-plan.js` as the pure battle-plan helper module with field ids for `left`, `center`, `right`, and `flank march`.
- Added placeholder corps-card state and assignment helpers that keep battle-plan data owner-private via `visibilityScope: owner-only`.
- Extended `src/state/p0-state.js` with a serializable `setup.battlePlan` slice plus actions for selecting a corps card and assigning it to a battle-plan field.
- Corps assignment automatically removes the card from any previous field before placing it into the new field.
- Added a dedicated Battle-Plan board card in `src/ui/p0-battlefield.js` that appears only during the battle-plan step and explicitly labels the fields as private battle-plan assignments rather than battlefield sectors.
- Added click-to-select and click-to-assign interactions in `src/ui/p0-app.js` for the placeholder corps cards.
- Added engine and reducer coverage in `src/engine/setup/battle-plan.test.js` and `src/state/p0-state.test.js`.

Files touched:
- `src/engine/setup/battle-plan.js`
- `src/engine/setup/battle-plan.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 may implement a private battle-plan board as placeholder-only owner data without claiming official timing or effects.
- Battle-plan fields are explicitly separate from battlefield sectors.
- Multiplayer-safe secrecy still remains incomplete until player-view filtering arrives in later cards.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed the battle-plan board works in principle and matches the intended next UI direction, while noting that the overlay presentation may change later.
- User explicitly described the current board shell as a good intermediate step before later drag-and-drop and richer hidden-info flows.
- Accepted outcome for this card: the private corps-assignment board is in place as a correct placeholder seam separate from battlefield sectors.

Still open:
- Next implementation card: `P3-09 - Ambush Marker Content Fields And Public Marker Shells`.

### [ ] P3-09 - Ambush Marker Content Fields And Public Marker Shells

Goal: add private ambush marker fields where the owning player can record hidden contents while keeping public marker shells separate and ready for later correct ambush play.

Planned files:
- `src/state/` setup reducer module
- `src/engine/setup/` hidden setup helpers
- `src/ui/` ambush setup module
- tests for hidden marker data and player views

Implementation steps:
1. Define ambush marker canonical state with marker id, owner, public shell data, private contents, fake/real status if verified or placeholder, visibility scope, placement footprint, reveal state placeholder, and sourceStatus.
2. Add private content fields for the owning player to list or select units hidden in each marker.
3. Keep freeform text as a P3 placeholder only if unit roster selection is not available yet; prefer structured unit references once roster data exists.
4. Render public marker shells on the battlefield separately from private contents.
5. Preserve enough marker data for later validators to check correct marker placement, reveal triggers, and whether hidden units emerge legally.
6. Add player-view projection tests so the opponent sees marker shells but not contents or fake/real truth.
7. Add hotseat-safe view behavior if the UI has a player-switch surface by this card.

Non-goals:
- no reveal triggers;
- no exact marker count unless source-checked;
- no ambush legality or terrain requirement unless verified;
- no roster legality.

Validation:
- hidden-state tests pass;
- player-view tests prove contents are filtered;
- browser smoke enters private marker contents and confirms public shell separation.

Manual acceptance:
- user creates or edits ambush marker contents;
- user confirms marker contents are private and not shown in opponent/public view.

Stop condition:
- stop if hidden-info source timing conflicts with where the marker data is stored in setup.

Expected result: P3 can capture ambush planning without leaking private contents.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/setup/ambush-markers.js` as the pure ambush-marker helper module with explicit separation between public shell data and owner-private contents.
- Added a placeholder ambush-marker state slice with three editable marker shells for P3 workflow, explicitly marked as source-blocked regarding exact legal count and reveal behavior.
- Added an optional ambush-marker state slice so no marker is present by default; the user adds markers only when needed during the placeholder flow.
- Extended `src/state/p0-state.js` with serializable `setup.ambushMarkers` state plus actions for selecting a marker, moving its public shell, and editing owner-private notes.
- Rendered an `Ambush Markers` owner panel in `src/ui/p0-battlefield.js` for private contents and rendered separate public marker shells on the battlefield surface.
- Rendered an `Ambush Markers` owner panel in `src/ui/p0-battlefield.js` with `Marker hinzufuegen`, immediate auto-selection for note entry, and separate public marker shells on the battlefield surface.
- Added marker selection, drag movement, and private-notes input handling in `src/ui/p0-app.js`.
- Added engine and reducer coverage in `src/engine/setup/ambush-markers.test.js` and `src/state/p0-state.test.js`.

Files touched:
- `src/engine/setup/ambush-markers.js`
- `src/engine/setup/ambush-markers.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-app.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 may store public ambush shells separately from owner-private contents without claiming official placement legality or reveal timing.
- Exact marker count, fake-marker truth, terrain restrictions, and reveal triggers remain source-blocked and are not implemented as official rules here.
- Structured unit assignment remains deferred until army-designer and roster/unit identity exist.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User accepted the ambush-marker slice explicitly as a feasibility study and placeholder seam, with full rule-complete behavior deferred to later phases.
- User specifically accepted the current optional-marker, add-first workflow as sufficient for now.
- Accepted outcome for this card: ambush shells and private contents are separated cleanly enough to support later rule-complete and roster-driven work.

Still open:
- Next implementation card: `P3-10 - Player-View And Hotseat Privacy Boundary`.

### [x] P3-10 - Player-View And Hotseat Privacy Boundary

Goal: add the first P3 player-view projection for setup hidden information with future multiplayer privacy in mind.

Planned files:
- `src/engine/visibility/` or `src/state/` visibility helper module
- `src/state/` setup reducer tests
- `src/ui/` player-view or hotseat surface

Implementation steps:
1. Define canonical setup state versus player-view setup state for P3 data classes.
2. Filter battle-plan assignments, flank-march assignment details, ambush contents, fake-marker truth, and hidden off-table assignments from the opponent view.
3. Keep public terrain, camps, and public marker shells visible.
4. Add hotseat-safe handoff state or placeholder screen if practical.
5. Add tests for player-one view, player-two view, and canonical view.
6. Ensure explanation/status text does not reveal hidden contents.

Non-goals:
- no multiplayer transport;
- no AI view beyond planning-compatible state shape;
- no reveal triggers.

Validation:
- player-view tests pass;
- browser smoke confirms private battle-plan/ambush data is not visible in the other player's view;
- build passes.

Manual acceptance:
- user switches or inspects player views and confirms private data stays hidden.

Stop condition:
- stop if UI lacks a safe way to demonstrate hidden-view filtering without risking confusing the setup flow.

Expected result: P3 establishes hidden-information boundaries before multiplayer or AI exists, with battle plans kept genuinely secret by data design.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/visibility/setup-view.js` as the pure setup visibility projection module for `canonical`, `player-one-view`, `player-two-view`, and `hotseat-handoff`.
- Added player-view projection tests in `src/engine/visibility/setup-view.test.js` for canonical visibility, opponent redaction, and hotseat handoff redaction.
- Extended `src/state/p0-state.js` with `setupViewMode` plus reducer support for switching the active setup privacy view.
- Added reducer coverage in `src/state/p0-state.test.js` for the active setup view mode.
- Updated `src/ui/p0-battlefield.js` so Battle Plan and Ambush panels render from projected setup state rather than raw canonical hidden data.
- Added a `Privacy View` switch card in the battlefield UI so the user can inspect `canonical`, `player-one-view`, `player-two-view`, and `hotseat-handoff` directly.
- In redacted views, private battle-plan assignments and ambush contents are hidden while public ambush marker shells remain visible on the battlefield.
- Updated `src/ui/p0-app.js` so the privacy-view buttons dispatch through reducer state and hotseat/opponent views do not continue private ambush editing interactions.

Files touched:
- `src/engine/visibility/setup-view.js`
- `src/engine/visibility/setup-view.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/ui/p0-app.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 may project canonical hidden setup data into player-specific and hotseat-safe views without claiming official reveal timing.
- Public setup objects and public ambush marker shells remain visible across views unless a verified rule later says otherwise.
- This card establishes filtering boundaries only; it does not implement multiplayer transport, AI-side data feeds, or reveal triggers.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed that player two does not see player one's battle plan, which is the core secrecy boundary for this card.
- User also accepted the follow-up UI persistence behavior across setup-step changes, so the privacy-view surface is usable enough for continued P3 work.
- Accepted outcome for this card: player-view and hotseat filtering now hide private setup data while leaving public shells and public setup objects visible.

Still open:
- Next implementation card: `P3-11 - Deployment-Zone Foundation And Visible Deployment Placeholders`.

### [ ] P3-11 - Deployment-Zone Foundation And Visible Deployment Placeholders

Goal: represent deployment zones and visible deployment placeholders without claiming full official deployment legality until source-checked, while preserving data needed for later corps-relative and non-overlap validators.

Planned files:
- `src/engine/setup/` deployment helper module
- `src/state/` setup reducer module
- `src/ui/` battlefield setup rendering
- tests for deployment placeholder data

Implementation steps:
1. Define deployment-zone placeholder data with owner, zone shape, sourceStatus, and sourceRefs.
2. Avoid reusing P0 visual guide wording as official deployment-zone legality.
3. Render tentative deployment zones only when source status is explicit.
4. Add visible deployment placeholder state for units or corps if roster/unit placeholder data exists.
5. Preserve corps id, owning player, footprint, pose, and deployment group data for each visible deployment placeholder.
6. Apply full-footprint table-bound checks and placeholder non-overlap checks for visible deployment placeholders.
7. Record later official checks as `needs-source-check`: corps relative setup, commander placement, legal zone membership, ambush/off-table exceptions, and deployment order.
8. Add tests for deployment-zone state shape, placeholder bounds, and placeholder overlap detection.

Non-goals:
- no official deployment legality unless verified;
- no command range or commander placement legality;
- no movement from deployment positions;
- no dismounting implementation unless source-checked and approved.

Validation:
- tests pass;
- build passes;
- browser smoke shows deployment-zone placeholders without official-claim wording.

Manual acceptance:
- user confirms deployment-zone foundation is visually distinct from old P0 guide overlays and correctly marked as placeholder/source-status-driven.

Stop condition:
- stop if exact deployment-zone math must be verified before even showing placeholders.

Expected result: P3 has a deployment foundation ready for later official setup validation, including non-overlap and corps-identity hooks.

Agent implementation completed 2026-05-16, pending manual acceptance:
- Added `src/engine/setup/deployment-placeholders.js` as the pure deployment placeholder helper module.
- Defined explicit deployment-zone placeholders with owner, label, zone role, shape model, source status, and source refs.
- Added visible deployment placeholder data for units with `unitId`, `owner`, `corpsId`, `deploymentGroupId`, pose, footprint, and source refs.
- Added pure bounds and overlap hooks so later official deployment validators can reason on full footprints instead of center-only placement.
- Extended `src/state/p0-state.js` with serializable `setup.deployment` state and synchronized visible deployment placeholders with reducer-owned unit placement during deployment.
- Replaced the old generic P0 deployment-band rendering in `src/ui/p0-battlefield.js` with explicit deployment-zone placeholders read from setup state.
- Added a deployment foundation card that shows zone count, visible placeholder count, source status, overlap placeholder feedback, and selected deployment metadata.
- Updated battlefield copy so this surface is no longer described as the old `P0 Visual Guide`.

Files touched:
- `src/engine/setup/deployment-placeholders.js`
- `src/engine/setup/deployment-placeholders.test.js`
- `src/state/p0-state.js`
- `src/state/p0-state.test.js`
- `src/ui/p0-battlefield.js`
- `src/styles/p0.css`

Source assumptions checked:
- P3 may show explicit deployment-zone placeholders as source-status-driven scaffolding without claiming official deployment legality.
- Visible deployment placeholders may preserve corps/deployment-group hooks even before real army roster data exists.
- Official corps-relative deployment, commander placement, legal zone membership, and ambush or off-table exceptions remain source-blocked for later validators.

Agent validated:
- `npm run test -- src/engine/setup/deployment-placeholders.test.js`
- `npm run test -- src/state/p0-state.test.js src/engine/setup/deployment-placeholders.test.js`
- `npm run test`
- `npm run build`

Manual acceptance recorded 2026-05-16:
- User confirmed the deployment-zone foundation is acceptable as a general placeholder-only setup seam.
- User explicitly chose not to add a separate light-troop sub-zone yet and accepted leaving that source-blocked until later rule-complete work.
- Accepted outcome for this card: explicit general deployment zones plus visible deployment placeholder metadata are good enough for the current P3 foundation.

Still open:
- Next implementation card: `P3-12 - Automated Tests, Browser Smoke, And Manual Acceptance Package`.

### [x] P3-12 - Automated Tests, Browser Smoke, And Manual Acceptance Package

Goal: consolidate P3 automated coverage and provide exact manual/browser smoke instructions for user acceptance.

Planned files:
- relevant P3 test files
- `P3_todo.md`
- `roadmap.md`
- optional test helpers if consistent with existing style

Implementation steps:
1. Review all P3 automated test coverage.
2. Ensure tests cover setup state transitions, phase tracker state, terrain placeholders, full-footprint bounds, validation result shape, setup objects, battle-plan privacy, ambush marker privacy, deployment placeholder non-overlap hooks, and player-view filtering.
3. Run `npm run test`.
4. Run `npm run build`.
5. Start or reuse the local Vite server.
6. Perform embedded-browser smoke: phase tracker, terrain placement, terrain labels, table-edge bounds, camp placeholder, private battle-plan board, ambush content fields, player-view privacy, deployment placeholder overlap feedback if implemented, and no console errors.
7. Record exact commands and results.
8. Provide manual acceptance steps and expected results.
9. Do not mark manual acceptance complete until user reports success.

Non-goals:
- no broad end-to-end framework migration unless the current tools are insufficient;
- no P4 movement tests;
- no treating agent smoke as a substitute for user acceptance.

Validation:
- relevant automated tests pass;
- build passes;
- browser smoke has no console errors;
- manual acceptance instructions are complete.

Manual acceptance:
- user opens the app;
- user starts standard-200 setup;
- user places and moves labelled terrain placeholders;
- user confirms placeholder objects stay inside the battlefield;
- user places or reviews camp/setup-object placeholders;
- user assigns corps cards in the battle-plan board;
- user records ambush marker contents;
- user confirms private data is hidden from the opponent/hotseat-safe view;
- user reports whether P3 behavior is accepted.

Stop condition:
- stop if tests fail;
- stop if browser smoke shows broken setup flow, broken placement, or hidden-data leakage;
- stop after providing manual acceptance steps until the user reports the result.

Expected result: P3 has automated proof for the setup foundation and a clear user-facing acceptance package.

Agent validation package prepared 2026-05-16, then user-accepted after final browser/manual review:
- Reviewed the current P3 automated coverage and confirmed dedicated tests exist for battlefield profile data, setup state transitions, terrain placeholder geometry and bounds, terrain validation, setup objects, battle-plan assignment state, ambush marker data shape, deployment placeholder state, and setup player-view filtering.
- Re-ran the full project validation suite with `npm run test` and confirmed all 72 tests pass.
- Re-ran `npm run build` and confirmed the Vite production build passes.
- Confirmed the current implementation still keeps placeholder-only boundaries explicit for terrain legality, deployment legality, ambush legality, and reveal behavior.
- Could not perform embedded browser smoke inside this turn because browser interaction tools are not available in the current tool surface; manual smoke remains the honest next gate.
- After the final manual review, the user confirmed the remaining flow is acceptable and requested that P3 be closed.
- Final small follow-up before closure: mandatory camps now start on the correct owner edge, with player 1 near the bottom edge and player 2 near the top edge.

Files touched:
- `P3_todo.md`
- `roadmap.md`

Source assumptions checked:
- Automated coverage may be recorded as complete for the currently implemented P3 subset without claiming official rules completeness.
- Browser/manual smoke must remain separate from automated validation and cannot be silently implied by passing tests or build.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance package for user:
- Start a new standard-200 game and step through `Gelaende`, `Camps`, `Battle Plan`, `Ambushes`, `Aufstellung`, and `Bereit`.
- In `Gelaende`, place at least two terrain placeholders and confirm they remain inside the battlefield.
- In `Camps`, verify both mandatory camps exist and optional placeholder setup objects can be reviewed or moved.
- In `Battle Plan`, assign corps to fields and then switch to `Player 2` to confirm the assignments are hidden.
- In `Ambushes`, add a marker, enter private notes, and confirm the marker shell stays public while the notes disappear in opponent or hotseat view.
- In `Aufstellung`, confirm the general deployment zones are visible automatically and the selected unit can be dragged while deployment metadata updates in the side card.
- Report whether the full current P3 setup flow is accepted as a placeholder foundation.

Manual acceptance recorded 2026-05-16:
- User confirmed the overall P3 setup flow is acceptable and explicitly asked to close P3.
- User requested one last camp-placement polish item so mandatory camps start on the correct owner side; that follow-up was implemented and revalidated before closure.
- Accepted outcome for this card: automated validation, user browser/manual smoke, and the P3 placeholder foundation are sufficient for phase closure.

Still open:
- Next implementation card after acceptance: `P3-13 - Final P3 Handoff And P4 Readiness Gate`.

### [x] P3-13 - Final P3 Handoff And P4 Readiness Gate

Goal: close P3 only after implementation, validation, manual acceptance, documentation status, and roadmap status are aligned.

Planned files:
- `P3_todo.md`
- `roadmap.md`
- `docs/rules/open-verification.md`
- `docs/rules/terrain-and-setup.md`
- `docs/rules/hidden-info.md`
- all P3 implementation files touched under `src/`

Implementation steps:
1. Confirm all previous P3 cards are complete.
2. Confirm user manual acceptance has been reported.
3. Confirm docs still separate verified official rules from placeholders.
4. Confirm `roadmap.md` reflects P3 completion only after user acceptance.
5. Confirm no P4 work has begun.
6. Summarize implemented files and validation results.
7. Note residual P4+ blockers, especially terrain effects, movement, command context, ZOC, reveal triggers, and deployment legality.
8. Ask the user for explicit approval before P4 begins.

Non-goals:
- do not start P4;
- do not implement movement commands;
- do not merge branches unless explicitly requested.

Validation:
- tests pass;
- build passes;
- browser smoke completed;
- user manual acceptance recorded;
- `P3_todo.md` and `roadmap.md` agree;
- open verification items for P4+ remain visible.

Manual acceptance:
- user confirms P3 is accepted complete;
- user confirms whether the branch should be committed, pushed, or prepared as a PR if that workflow is requested.

Stop condition:
- stop if manual acceptance has not been reported;
- stop if tests or browser smoke are failing;
- stop if the user wants additional review before closing P3.

Expected result: P3 is safely handed off as complete and P4 remains gated until explicit user approval.

Completed 2026-05-16:
- Confirmed all prior P3 cards are complete and manual acceptance has now been reported by the user.
- Revalidated after the final camp-edge placement fix with focused camp tests, then reran the full suite and production build.
- Updated `P3_todo.md` and `roadmap.md` so both planning surfaces agree that P3 is complete.
- Confirmed the docs still separate verified physical/setup invariants from placeholder-only or source-blocked official-rule areas.
- Confirmed no P4 implementation has started.
- Recorded the remaining P4+ blockers as source-checked follow-up areas rather than silently resolved rules.

Files touched:
- `src/engine/setup/setup-objects.js`
- `src/engine/setup/setup-objects.test.js`
- `src/state/p0-state.test.js`
- `P3_todo.md`
- `roadmap.md`

Source assumptions checked:
- Mandatory camp placeholders may be oriented to the owning table edge as a setup-positioning default without claiming further official camp legality beyond the existing P3 placeholder scope.
- P3 closure does not resolve blocked terrain effects, exact deployment legality, hidden-information reveal timing, or later movement/command rules.

Agent validated:
- `npm run test -- src/engine/setup/setup-objects.test.js src/state/p0-state.test.js`
- `npm run test`
- `npm run build`

Manual acceptance recorded:
- User confirmed that, with the camp-edge adjustment, the remaining P3 behavior now passes and P3 can be closed.
- User requested commit, push, and PR preparation; merge remains user-owned.

Still open:
- Commit, push, and PR preparation on `feature/p3-setup-terrain-foundation`.
