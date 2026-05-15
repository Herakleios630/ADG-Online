# P0 TODO - Product Shell Feasibility

Status: Complete - accepted by user on 2026-05-14
Active branch: `feature/p0-shell-planning`
Master plan: `roadmap.md`
Architecture source: `docs/architecture.md`
Governance source: `docs/project-governance.md`

## Purpose

P0 proves that AdG Online can boot into a real product shell, move through the first menu flow, render a battlefield, show P0 visual overlays, and advance one rectangular test unit through an action-based state update.

P0 is not the official AdG movement, terrain, setup, deployment, command, ZOC, combat, save/load, AI, or multiplayer implementation. It is a controlled feasibility slice that gives later phases a clean shell and rendering/state foundation.

## How To Use This Board

Work one checklist card at a time. Do not batch cards unless the user explicitly asks.

Before each card:
1. Read this file section for the current card.
2. Re-read `roadmap.md` P0 and the relevant `docs/architecture.md` shell/state sections.
3. Run `git status --short` and protect unrelated user changes.
4. Give the user a short PM block brief before implementation edits.
5. Keep the implementation inside the current P0 scope.

PM block brief must include:
- exact goal;
- planned files;
- new modules, if any;
- what is shell/UI work;
- what is state/action work;
- validation commands;
- manual acceptance steps;
- non-goals.

After each completed card, update this file and report:
- completed card id and title;
- files touched;
- validation run;
- manual user test and expected result;
- still-open next card or blocker.

Context-loss rule: a future AI session should be able to resume from this file without reading the chat transcript.

## Global P0 Scope Guardrails

In scope:
- start menu, new-game flow, options, and load placeholder;
- point selection with `200` preselected;
- one battlefield screen with green/brown deterministic texture;
- one rectangular test unit;
- straight advance preview and confirm only;
- P0 test movement limit of `4 UD`;
- 15 mm presentation assumption with `1 UD = 4 cm`;
- visual overlay cycle on `V`: `Aus -> Aufstellungszonen -> Sektoren -> Beides`;
- subtle grey sector lines and sketch-based deployment guides;
- action-based state update for confirmed advance;
- narrow automated state/action test and browser smoke check.

Out of scope:
- official AdG movement legality;
- command points, corps activation, command range, or official turn phases;
- terrain placement legality or terrain effects;
- ZOC, charge, wheel, slide, rotation, conformation, shooting, melee, rout, pursuit;
- real save/load;
- real multiplayer;
- AI opponent;
- full army builder or official roster validation.

Hard rule: P0 UI may say `P0 test advance`, `visual guide`, or `placeholder`; it must not say that the P0 subset is tournament-complete.

## Shared P0 Constants

- Default points: `200`.
- Optional point buttons: `100`, `200`, `300`.
- Default overlay hotkey: `V`.
- Overlay cycle: `Aus`, `Aufstellungszonen`, `Sektoren`, `Beides`.
- Scale assumption: 15 mm figures, `1 UD = 4 cm`.
- P0 advance limit: `4 UD` = `16 cm`.
- Standard battlefield planning target: `120 cm x 80 cm` = `30 UD x 20 UD`.
- Sector guide: two vertical and one horizontal subtle grey guide lines, creating six sectors.
- Light-troop visual guide: `7 UD` deep full-width band from each long table edge.
- Non-light visual guide: `5 UD` deep band from each long table edge.
- Non-light side inset: `4 UD` from both short table edges.

The deployment and sector guide constants are accepted P0 visual guides from the user's sketch. Exact official setup geometry remains a later source-verification task.

## Phase Status

- [x] P0 approved for implementation
- [x] P0 implementation started
- [x] P0 demonstrated to user
- [x] P0 approved complete by user

## Execution Cards

### [x] P0-00 - Branch, Baseline, And File Ownership Preflight

Goal: start P0 implementation from a known repo state and prevent accidental scope drift.

Planned files:
- `P0_todo.md`
- no implementation files unless a preflight note must be corrected

Implementation steps:
1. Run `git status --short` and confirm the active branch.
2. Confirm whether current docs-only changes should remain on `feature/p0-shell-planning`.
3. Inspect current `src/` file sizes before adding behavior.
4. Identify expected P0 ownership layers: shell UI, state/actions, battlefield rendering, overlay rendering, test path.
5. Do not edit implementation files in this card unless a blocker requires a planning update.

Non-goals:
- no UI implementation;
- no game-state implementation;
- no tests beyond baseline inspection.

Validation:
- `git status --short`
- VS Code Problems on changed planning files if any

Manual acceptance:
- user can see the current branch, dirty state, and first implementation target.

Stop condition:
- unrelated dirty changes exist in files required by P0 and cannot be safely worked around.

Expected result: P0 begins with explicit branch, ownership, and scope.

Completed 2026-05-14:
- Active branch confirmed as `feature/p0-shell-planning`.
- Current dirty worktree confirmed as planning-doc changes only: `.github` instruction files, `docs/` planning files, deletion of `todo.md`, and new `roadmap.md` plus `P0_todo.md`.
- Current `src/` implementation surface is minimal: `src/main.js` is the only tracked product entry file and is only about `215` bytes, so there is no oversized-root blocker yet.
- P0 ownership layers for the next card are fixed as: shell UI/navigation in focused shell modules, serializable state/actions in focused state modules, battlefield rendering in a battlefield module, overlay rendering in a separate helper if it grows, and one narrow test path for state/action behavior.
- No implementation files were changed in this card; only planning/governance updates were required.

Agent validated:
- `git status --short --branch`
- `Get-ChildItem -Path src -Recurse -File | Select-Object FullName,Length | Sort-Object Length -Descending | Select-Object -First 20`

Manual acceptance:
- open this card and confirm the branch, dirty-state summary, and ownership split look correct before `P0-01` begins.

Still open:
- next card is `P0-01 - Minimal App State And Screen Router`.

### [x] P0-01 - Minimal App State And Screen Router

Goal: create a small serializable state shape and screen routing model for menu, new-game setup, options, load placeholder, and battlefield.

Planned files:
- `src/main.js`
- possible new focused module under `src/state/` or `src/ui/` if `main.js` would become too large
- optional test file if the state/actions are easier to validate outside the DOM

Implementation steps:
1. Define the P0 screen ids: `main-menu`, `new-game`, `options`, `load-game`, `battlefield`.
2. Define shell settings: player color, overlay hotkey, selected points, selected mode.
3. Define a minimal game state with one test unit and overlay mode.
4. Add action functions for screen navigation and settings changes.
5. Keep state serializable plain data.
6. Render enough UI to prove navigation without final styling.

Non-goals:
- no localStorage persistence yet unless it is trivial and isolated;
- no real save/load state;
- no official setup state machine.

Validation:
- run a syntax/static check available in the project;
- VS Code Problems on touched files.

Manual acceptance:
- app starts at the main menu;
- clicking menu buttons reaches the correct P0 screens;
- returning to the menu works.

Stop condition:
- route/state code starts growing into a broad framework; split into focused modules instead.

Expected result: P0 has a clean shell state backbone before visual polish.

Completed 2026-05-14:
- Added `src/state/p0-state.js` as the focused P0 serializable state and reducer module.
- Added `src/ui/p0-app.js` as the shell renderer and input-translation layer.
- Reduced `src/main.js` to thin app boot and dispatch wiring only.
- Implemented explicit P0 screen ids for `main-menu`, `new-game`, `options`, `load-game`, and `battlefield`.
- Kept shell settings separate from game state: player color and overlay hotkey live under `shell.settings`, while the minimal battlefield/test-unit data lives under `game`.
- Added reducer actions for navigation, option changes, new-game mode selection, point selection, and battlefield start.
- Added a live state snapshot view so the current JSON state can be inspected while the shell is still minimal.

Agent validated:
- `npm run build`
- VS Code Problems on `src/main.js`, `src/state/p0-state.js`, and `src/ui/p0-app.js`

Manual acceptance:
- start the app and confirm it opens on `main-menu`;
- open `Neues Spiel`, `Optionen`, and `Spiel Laden` and return to the menu each time;
- confirm `200` is the default point selection;
- confirm option changes are reflected in the state snapshot and on the battlefield placeholder screen.

Still open:
- next card is `P0-02 - Main Menu And New-Game Flow` for stronger menu presentation and the first proper new-game handoff polish.

### [x] P0-02 - Main Menu And New-Game Flow

Goal: implement the first user-facing flow: `Neues Spiel`, `Spiel Laden`, `Optionen`, then `Singleplayer` and point selection.

Planned files:
- `src/main.js` or focused shell/menu module
- stylesheet file if introduced for layout

Implementation steps:
1. Build the main menu with `Neues Spiel`, `Spiel Laden`, and `Optionen`.
2. Build the new-game screen with `Singleplayer` as the active path.
3. Show `Multiplayer` as disabled or clearly marked for later.
4. Add point buttons `100`, `200`, `300`.
5. Preselect `200` by default.
6. Start the battlefield from the selected mode/points.

Non-goals:
- no real multiplayer;
- no army selection;
- no official scenario/setup validation.

Validation:
- browser smoke through main menu -> new game -> battlefield;
- VS Code Problems on touched files.

Manual acceptance:
- user sees the requested German menu labels;
- `200` is visibly selected by default;
- `Multiplayer` is visibly not implemented yet.

Stop condition:
- the flow needs full army/setup data; leave that for later phases and keep P0 as a shell.

Expected result: the app feels like a product shell rather than a raw test page.

Completed 2026-05-14:
- Upgraded the shell presentation so the app reads like a product menu instead of a bare test screen.
- Added `src/styles/p0.css` as the focused shell styling layer for cards, buttons, state snapshot, and the first battlefield handoff presentation.
- Refined `src/ui/p0-app.js` so `Neues Spiel`, `Spiel Laden`, and `Optionen` render as clearer menu choices with stronger visual hierarchy.
- Refined the new-game flow so `Singleplayer` is visibly active, `Multiplayer` is visibly disabled, and the point selection reads as a proper choice set with `200` highlighted as the default.
- Added a clearer P0 handoff explanation on the new-game screen so the user sees that the current transition goes into a battlefield placeholder rather than full setup.
- Improved the battlefield placeholder presentation enough to confirm the selected mode, format, color, and overlay hotkey survive the start flow.

Agent validated:
- `npm run build`
- VS Code Problems on `src/main.js`, `src/ui/p0-app.js`, and `src/styles/p0.css`

Manual acceptance:
- start the app and confirm the main menu now reads as a deliberate product shell;
- open `Neues Spiel` and confirm `Singleplayer` is active, `Multiplayer` is disabled, and `200` is highlighted by default;
- start the battlefield and confirm the chosen shell settings are still visible on the placeholder battlefield screen.

Still open:
- user manual acceptance for this card is still pending;
- next card is `P0-03 - Options And Load Placeholder`.

### [x] P0-03 - Options And Load Placeholder

Goal: add the P0 settings screen and a navigable load-game placeholder.

Planned files:
- `src/main.js` or focused settings/load modules
- stylesheet file if introduced

Implementation steps:
1. Add player-color controls.
2. Add overlay-hotkey display/control with default `V`.
3. Store option changes in shell state for the current session.
4. Add a `Spiel Laden` placeholder screen.
5. Explain that save/load comes in a later phase.
6. Provide a clear way back to the main menu.

Non-goals:
- no real save serialization;
- no file picker;
- no campaign or match resume system.

Validation:
- browser smoke for menu -> options -> change setting -> back;
- browser smoke for menu -> load placeholder -> back.

Manual acceptance:
- user can open the color picker through the player-color section, save the settings, and see the saved color affect later P0 visuals;
- load screen is intentionally placeholder but not a dead button.

Stop condition:
- implementing real save/load becomes tempting; document it as later work and stop at placeholder.

Expected result: core shell screens exist and are navigable.

Completed 2026-05-14:
- Kept the existing P0 settings and load screens, but raised them to the actual P0-03 target instead of leaving them as minimal carry-over from earlier cards.
- Extended `src/ui/p0-app.js` so the options screen now shows the current player color as a circle plus a `Farbe aendern` button that opens the native color picker.
- Reworked shell settings into saved settings plus draft settings, so color and key changes only become active after pressing `Speichern`.
- Changed `Speichern` so it now also leaves the options screen and returns directly to the main menu after applying the draft settings.
- Added one battlefield display toggle so the scale overlay can be shown or hidden from the options screen.
- Replaced the single overlay-hotkey field with a `Tastaturbelegung` table that exposes function, standard key, and alternative key as directly editable cells.
- Threaded the saved player color and saved overlay primary key into later P0 visuals so the shell accent and battlefield placeholder react only after the settings are saved.
- Strengthened the load screen as a true placeholder surface with explicit "no save files in P0" messaging and a non-dead route back to the main menu.
- Extended `src/styles/p0.css` so the shell card accent, color circle, keyboard table, battlefield placeholder token, and placeholder cards support the updated settings/load experience.

Agent validated:
- `npm run build`
- VS Code Problems on `src/ui/p0-app.js` and `src/styles/p0.css`

Manual acceptance:
- open `Optionen` and click `Farbe aendern` in the player-color section to open the native color selector;
- choose a new RGB color in the selector and confirm the selector dialog;
- click `Speichern` and confirm the active color changed only after saving and the app returns to the main menu;
- toggle the scale-overlay checkbox, click `Speichern`, and confirm the battlefield scale overlay appears or disappears only after saving;
- click into the `Standard Taste` or `Alternative` cell in `Tastaturbelegung`, press a new key, then click `Speichern` and confirm the new binding becomes active only after saving;
- start or return to `Schlachtfeld` and confirm the placeholder unit token, shell accent, and overlay hotkey display visibly changed only after the settings were saved;
- open `Spiel Laden` and confirm it clearly says there are no save files in P0 and still provides a working route back to the main menu.

Still open:
- next card is `P0-04 - Battlefield Layout And Deterministic Texture`.

### [x] P0-04 - Battlefield Layout And Deterministic Texture

Goal: render a readable battlefield with a green/brown grass-mud feel and stable dimensions for overlays.

Planned files:
- `src/main.js` or focused battlefield renderer module
- stylesheet file if introduced

Implementation steps:
1. Create a battlefield screen with a clear battlefield viewport.
2. Use a `120 cm x 80 cm` / `30 UD x 20 UD` presentation baseline.
3. Show `1 UD = 4 cm` in the UI.
4. Add a deterministic green/brown texture or CSS background pattern.
5. Keep the texture purely visual with no terrain-rule effects.
6. Add a small HUD for selected points, overlay mode, and movement scale.

Non-goals:
- no terrain pieces;
- no terrain rules;
- no official deployment validation.

Validation:
- browser screenshot or smoke check that the battlefield is visible;
- build once this and prior UI cards are integrated.

Manual acceptance:
- battlefield reads as grass/mud rather than a blank panel;
- scale text is visible;
- layout leaves room for overlays and the test unit.

Stop condition:
- visual texture code becomes random between reloads; keep it deterministic.

Expected result: the battlefield is visually useful before gameplay rules arrive.

Completed 2026-05-14:
- Added `src/ui/p0-battlefield.js` as a focused battlefield renderer module so the battlefield surface no longer grows inside the general shell renderer.
- Replaced the older lightweight battlefield placeholder with a clearer battlefield shell that presents a stable 30 UD x 20 UD / 120 cm x 80 cm area and uses much more of the screen width.
- Moved battlefield support UI out of the viewport frame: the menu button now sits in the left-side lane beside the viewport, and the optional top-right minimap card now carries the scale information.
- Reserved the later working layout around the viewport: a left-side control lane for future command buttons and a right-side support lane for minimap plus later combat-log or dice UI.
- Upgraded the battlefield surface styling in `src/styles/p0.css` so it reads as a deterministic green/brown grass-mud field rather than a generic placeholder panel.
- Removed the unnecessary top HUD/info strip so the battlefield presentation stays closer to the intended final product direction.
- Added a fixed-frame battlefield camera: zoom level `1` shows the full `120 x 80` field, higher zoom levels show an in-frame cropped section, middle-mouse panning is limited to that fixed frame, and the minimap marks the current visible area.
- Corrected the placeholder unit footprint so it now reads as a medium infantry stand at `1 UD x 0.5 UD`, i.e. `4 cm x 2 cm` under the P0 scale assumption.
- Kept the surface intentionally rules-light: no terrain pieces, no deployment legality, and no unit interaction logic yet.
- Preserved enough open space in the battlefield layout for the next P0 cards to add overlays and a test unit without replacing the whole screen again.

Agent validated:
- `npm run build`
- VS Code Problems on `src/ui/p0-battlefield.js`, `src/ui/p0-app.js`, and `src/styles/p0.css`

Manual acceptance:
- open `Schlachtfeld` from `Neues Spiel`;
- confirm the battlefield now reads as a proper grass/mud surface instead of a blank placeholder block;
- confirm the battlefield now reads as a broad 120 x 80 style surface that uses most of the available screen width;
- confirm the battlefield viewport now sits high on the screen instead of hanging lower in the page;
- use the mouse wheel and confirm the battlefield zooms in and out;
- at zoom `1`, confirm the full `120 x 80` battlefield is visible inside the fixed frame with no page scrollbars;
- at zoom `1`, confirm the battlefield cannot be shifted away from that frame;
- zoom in, hold the middle mouse button, and confirm the visible section can be dragged live without jumping to the top-left before it reaches the field edges;
- confirm the menu button sits in the left-side lane instead of above the viewport or over the battlefield;
- confirm there is visible reserved UI space on the left for future command buttons and on the right below the minimap for later log/dice UI;
- confirm the top-right minimap is visible when the option is enabled and that its camera rectangle changes with zoom and pan;
- confirm `1 UD = 4 cm`, `30 UD x 20 UD`, and `120 cm x 80 cm` are visible in the minimap card when that option is enabled;
- confirm the placeholder unit looks like a sharp-cornered medium infantry footprint, i.e. `1 UD x 0.5 UD` / `4 cm x 2 cm` rather than an oversized block;
- confirm the battlefield area feels stable and spacious enough for later overlays and a test unit;
- confirm there are still no terrain rules or fake setup claims on this screen.

Still open:
- next card is `P0-05 - Overlay Cycle And Sketch-Based Guides`.

### [x] P0-05 - Overlay Cycle And Sketch-Based Guides

Goal: implement the `V` overlay cycle and visual guides from the user's P0 sketch.

Planned files:
- battlefield renderer module or `src/main.js`
- possible overlay helper module if drawing logic grows
- stylesheet file if introduced

Implementation steps:
1. Add overlay modes: `Aus`, `Aufstellungszonen`, `Sektoren`, `Beides`.
2. Bind the current overlay hotkey, default `V`, to cycle modes in that order.
3. Draw two vertical and one horizontal subtle grey sector guide lines.
4. Draw six sectors as visual divisions only.
5. Draw `7 UD` full-width light-troop guides from both long table edges.
6. Draw `5 UD` non-light guides from both long table edges.
7. Inset non-light guides by `4 UD` from both short table edges.
8. Mirror guides for both armies.
9. Keep labels subtle or hide them unless they help debugging.
10. Mark this as P0 visual guidance, not official setup validation.

Non-goals:
- no terrain-sector placement validation;
- no official deployment legality;
- no hidden setup or army-side logic.

Validation:
- browser smoke: press `V` four times and confirm cycle returns to `Aus`;
- screenshot if browser tools are available;
- VS Code Problems on touched files.

Manual acceptance:
- user can see the cycle `Aus -> Aufstellungszonen -> Sektoren -> Beides`;
- grey sector lines are unobtrusive;
- deployment bands appear on both sides and match the sketch intent.

Stop condition:
- exact official geometry is needed to proceed; keep P0 sketch-based and record the verification need for P3.

Expected result: P0 has the visual battlefield guides needed for later setup work without claiming official rules completeness.

Completed 2026-05-14:
- Added a real overlay cycle action in `src/state/p0-state.js` with the exact order `Aus -> Aufstellungszonen -> Sektoren -> Beides`.
- Bound the battlefield overlay cycle to the currently configured overlay hotkey in `src/ui/p0-app.js`, including support for the alternative key slot when present.
- Extended `src/ui/p0-battlefield.js` so the battlefield now renders separate visual-only deployment and sector guide layers inside the zoomable world area.
- Implemented the accepted P0 sketch geometry for deployment guides: full-width `7 UD` light-troop bands from both long edges plus inset `5 UD` non-light bands with `4 UD` side margins.
- Added two vertical and one horizontal subtle grey sector lines in `src/styles/p0.css`, creating the six intended sectors without claiming official setup legality.
- Kept the guides deliberately understated and marked the current overlay mode in the right-side minimap card as a P0 visual guide only.

Agent validated:
- `npm run build`
- VS Code Problems on `src/state/p0-state.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/styles/p0.css`

Manual acceptance:
- open `Schlachtfeld` from `Neues Spiel`;
- press the configured overlay hotkey once and confirm the mode changes from `Aus` to `Aufstellungszonen`;
- confirm only the deployment bands are visible in that mode, including full-width `7 UD` bands and inset `5 UD` bands;
- press the hotkey again and confirm the mode changes to `Sektoren` and only the subtle grey sector lines remain visible;
- press the hotkey a third time and confirm the mode changes to `Beides` and both deployment bands and sector lines are visible together;
- press the hotkey a fourth time and confirm the mode returns to `Aus`;
- confirm the guides behave as visual help only and do not claim official setup validation.

Still open:
- next card is `P0-06 - One Rectangular Test Unit`.

### [x] P0-06 - One Rectangular Test Unit

Goal: place one selectable rectangular unit on the battlefield with a clear front direction.

Planned files:
- battlefield renderer module or `src/main.js`
- state/action module if introduced

Implementation steps:
1. Add one test unit to initial game state.
2. Store unit id, owner, position in UD, facing label/angle placeholder, and base dimensions.
3. Render the unit as a rectangle using the current player color.
4. Add a front-edge marker or arrow so facing is visually obvious.
5. Allow selecting the unit.
6. Show selected-unit information in the HUD.

Non-goals:
- no rotation math beyond whatever is needed for a stable front marker;
- no multiple units;
- no corps, commander, quality, cohesion, or abilities.

Validation:
- browser smoke confirms the unit is visible and selectable;
- state remains serializable.

Manual acceptance:
- user can identify the unit and its front direction at a glance.

Stop condition:
- unit geometry starts becoming full P2 rotated-rectangle work; keep P0 minimal.

Expected result: battlefield has one controllable test object for movement feasibility.

Completed 2026-05-14:
- Kept exactly one test unit in state and used the existing `widthUd`, `depthUd`, and `facing` fields as the P0-06 geometry source rather than inventing a second representation.
- Added a dedicated `SELECT_UNIT` action in `src/state/p0-state.js` so unit selection now flows through the reducer instead of direct UI mutation.
- Changed the battlefield marker in `src/ui/p0-battlefield.js` from a passive block into a selectable button-like unit stand that can be clicked on the battlefield.
- Completed the selection loop by clearing the current selection again when the user clicks empty battlefield space.
- Refined the visual front marker in `src/styles/p0.css` so the front edge now reads as a clear bright strip across the unit's leading edge instead of a small central mark.
- Added explicit selected-state styling so the chosen unit is visibly highlighted without changing its footprint.
- Added a small selected-unit info card in the right-side support lane that shows the selected unit id, test type, front direction, and `UD` footprint.

Agent validated:
- `npm run build`
- VS Code Problems on `src/state/p0-state.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/styles/p0.css`

Manual acceptance:
- open `Schlachtfeld` from `Neues Spiel`;
- click the test unit on the battlefield;
- confirm the unit becomes visibly selected;
- click empty battlefield space and confirm the selection clears again;
- confirm the front side is obvious at a glance because the leading edge is highlighted across the full width;
- confirm the right-side selected-unit card changes from the empty prompt to concrete unit information;
- confirm there is still only one test unit and no fake extra unit logic appears.

Still open:
- next card is `P0-07 - Straight Advance Preview And Confirm`.

### [x] P0-07 - Straight Advance Preview And Confirm

Goal: implement one action-based straight advance for the test unit, capped at `4 UD`.

Planned files:
- state/action module or `src/main.js`
- battlefield renderer module
- narrow test file if introduced

Implementation steps:
1. Add an `Advance` command entry in the left battlefield command area.
2. Allow advance preview only while that command is active and a unit is selected.
3. Clamp advance preview continuously to `0..4 UD`.
4. Display the selected advance distance in `UD` and `cm`.
5. Show a light grey movement-reach overlay plus a visual preview before confirmation.
6. Let the user drag the unit forward with held left mouse inside that legal range.
7. Confirm advance through an action function.
8. Update unit state only through that action.
9. Add a reset action for repeated testing.
10. Label the behavior as P0 straight-advance test behavior.

Non-goals:
- no wheel;
- no slide;
- no terrain cost;
- no ZOC;
- no command context;
- no official movement allowance table.

Validation:
- automated test that advancing beyond `4 UD` clamps or rejects according to chosen behavior;
- automated test that confirm changes state through the action path;
- browser smoke for preview -> confirm -> reset.

Manual acceptance:
- user can preview an advance;
- user can confirm the advance;
- advance never exceeds `4 UD` / `16 cm`.

Stop condition:
- movement requires official allowance or command context; defer to P4/P6 and keep this as P0 feasibility only.

Expected result: P0 proves action-based state updates for one simple move.

Completed 2026-05-14:
- Added explicit P0 advance command state in `src/state/p0-state.js`: command activation, continuous preview distance, confirm action, and reset action all flow through the reducer.
- Kept the P0 advance limit hard-clamped to `4 UD` and also clamped the preview against the current north-facing distance to the table edge, but removed the old `0.5 UD` step restriction.
- Added a simple per-unit remaining-movement test budget for repeated P0 advances, so confirmed partial movement reduces the next available `Advance` distance until the test unit is reset.
- Replaced the slider-centric control path with a real `Advance` command button in the left battlefield command area plus a dedicated P0 status card in `src/ui/p0-battlefield.js`.
- Rendered a light grey forward movement-reach overlay on the battlefield while `Advance` is active, together with the straight-ahead ghost preview stand.
- Wired `src/ui/p0-app.js` so the selected unit can be preview-moved by holding left click and dragging freely forward inside the legal range.
- Kept `Bestaetigen` as the action commit path and `Zuruecksetzen` as the repeat-test reset path.
- Kept the implementation intentionally narrow: no wheel, no slide, no terrain cost, no ZOC, and no command context.

Agent validated:
- `npm run build`
- VS Code Problems on `src/state/p0-state.js`, `src/ui/p0-app.js`, `src/ui/p0-battlefield.js`, and `src/styles/p0.css`

Manual acceptance:
- open `Schlachtfeld` from `Neues Spiel`;
- select the test unit;
- click `Advance` in the left command area and confirm a light grey forward movement corridor appears ahead of the unit;
- hold left click on the selected unit and drag it forward, then confirm the preview marker follows continuously without `0.5 UD` stepping;
- drag toward the end of the legal range and confirm the effective preview never exceeds `4 UD` / `16 cm`;
- click `Bestaetigen` and confirm the real unit moves to the previewed position;
- activate `Advance` again and confirm the displayed rest budget is reduced by the already confirmed movement, rather than resetting to the full `4 UD`;
- click `Zuruecksetzen` and confirm the test unit returns to its original starting position;
- confirm the behavior is still clearly labelled as a P0 straight-advance test, not official AdG movement.

Still open:
- next card is `P0-08 - P0 Automated Test Harness`.

### [x] P0-08 - P0 Automated Test Harness

Goal: add the smallest useful automated validation for P0 state/actions without overbuilding the test stack.

Planned files:
- `package.json`
- focused test file under an agreed test folder
- possible state/action module if tests need importable pure functions

Implementation steps:
1. Choose a minimal test runner or use a simple Node-based script.
2. Add a test command to `package.json`.
3. Test default points are `200`.
4. Test overlay cycle order.
5. Test `4 UD` advance limit.
6. Test confirmed advance changes serializable state.

Non-goals:
- no broad test framework migration;
- no official rules fixture suite;
- no browser automation in this card unless already available and cheap.

Validation:
- `npm run test`
- `npm run build`

Manual acceptance:
- user can see the test command and what it covers.

Stop condition:
- test harness setup becomes larger than P0 behavior; keep it small and documented.

Expected result: P0 has a reliable automated guard for the first state/action path.

Completed 2026-05-14:
- Added `npm run test` in `package.json` using the built-in Node test runner, avoiding any broader framework setup for this P0 card.
- Added `src/state/p0-state.test.js` as a focused reducer test file for the pure P0 state/action path.
- Covered the accepted P0 invariants: default points remain `200`, overlay cycle order stays deterministic, advance preview clamps to the P0 cap, confirm advance changes serializable state, and repeated advance previews respect the new remaining-budget behavior.
- Kept the harness intentionally narrow: no browser automation, no UI snapshot tests, and no migration away from the existing simple Vite setup.

Agent validated:
- `npm run test`
- `npm run build`

Manual acceptance:
- run `npm run test` locally and confirm the five reducer tests pass;
- review `src/state/p0-state.test.js` and confirm the covered cases match the intended P0 guard rails.

Still open:
- next card is `P0-09 - Browser Smoke And Final P0 Handoff`.

### [x] P0-09 - Browser Smoke And Final P0 Handoff

Goal: verify the complete P0 user path and prepare the user acceptance handoff.

Planned files:
- `P0_todo.md`
- implementation files only for fixes found during smoke

Implementation steps:
1. Run `npm run build`.
2. Run the P0 automated test command.
3. Start the local dev server.
4. Browser-smoke: main menu -> new game -> battlefield.
5. Browser-smoke: options -> change color/hotkey -> battlefield.
6. Browser-smoke: press `V` through the overlay cycle.
7. Browser-smoke: select unit -> preview advance -> confirm -> reset.
8. Capture or describe any browser-rendering evidence available.
9. Update completed checklist items in this file.
10. Provide the user with exact manual acceptance steps.

Non-goals:
- no P1 rule extraction;
- no P2 geometry expansion;
- no P3 setup validation.

Validation:
- `npm run test`
- `npm run build`
- browser smoke with local dev server
- VS Code Problems on touched files

Manual acceptance:
- user opens the app and follows the P0 path;
- user confirms whether P0 is accepted complete.

Stop condition:
- browser cannot be launched with available tools; report the limitation and provide exact local test URL and manual steps.

Expected result: P0 is demonstrable and ready for user approval or a focused fix pass.

Progress 2026-05-14:
- Re-ran the narrow automated gates for the handoff slice: `npm run test` and `npm run build` both pass.
- Started the local Vite dev server successfully on `http://127.0.0.1:4173/`.
- Verified over HTTP that the app loads to the expected `main-menu` shell and renders the P0 root page content.
- Interactive browser-smoke automation could not be completed in this session because the required browser control tools were not available to launch and click through the running app.

Agent validated:
- `npm run test`
- `npm run build`
- local dev server on `http://127.0.0.1:4173/`
- HTTP page-load check for the root app shell

Manual acceptance:
- open `http://127.0.0.1:4173/` in the browser while the dev server is running;
- main menu smoke: confirm `Neues Spiel`, `Spiel Laden`, and `Optionen` are visible and navigable;
- new-game smoke: open `Neues Spiel`, confirm `Singleplayer` and `200` as default, then enter `Schlachtfeld`;
- options smoke: open `Optionen`, change player color or overlay key draft, save, and confirm the updated shell setting is visible afterward;
- overlay smoke: on `Schlachtfeld`, press `V` repeatedly and confirm the cycle `Aus -> Aufstellungszonen -> Sektoren -> Beides -> Aus`;
- battlefield smoke: select the test unit, activate `Advance`, drag a partial move, confirm it, activate `Advance` again, and confirm the remaining budget is reduced;
- reset smoke: click the reset `X` and confirm the test unit returns to its start position and the P0 budget resets;
- handoff decision: confirm whether P0 is accepted complete or whether a focused final fix pass is needed.

Still open:
- P0 accepted complete by user on 2026-05-14.

## P0 Definition Of Done

- [x] Start menu works with `Neues Spiel`, `Spiel Laden`, and `Optionen`.
- [x] `Neues Spiel` supports active `Singleplayer`, disabled/placeholder `Multiplayer`, and point selection.
- [x] `200` points is the default new-game selection.
- [x] Options screen can change player color and overlay hotkey.
- [x] `Spiel Laden` has a working placeholder screen.
- [x] Battlefield renders with deterministic green/brown visual texture.
- [x] Battlefield clearly shows `1 UD = 4 cm`.
- [x] Overlay cycle works on `V` in the order `Aus -> Aufstellungszonen -> Sektoren -> Beides`.
- [x] Deployment overlays reflect the current agreed P0 sketch with `7 UD`, `5 UD`, and `4 UD` guides on both sides of the battlefield.
- [x] Sector lines are subtle grey and visually understated.
- [x] One rectangular test unit is visible, selectable, and has a clear front direction.
- [x] One rectangular test unit can preview and confirm a straight advance up to `4 UD` / `16 cm`.
- [x] Confirmed advance updates happen through actions rather than direct UI mutation.
- [x] Reset path exists for repeated movement testing.
- [x] P0 automated tests pass.
- [x] `npm run build` passes.
- [x] Browser smoke path passes or any blocker is documented.
- [x] User has received manual acceptance steps.