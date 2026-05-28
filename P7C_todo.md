# P7C TODO - Command Menu Hierarchy + Flow Cleanup

Status: Complete - user accepted P7C closeout on 2026-05-28; P7C-00 through P7C-04 are complete and P8 planning may proceed
Date drafted: 2026-05-20
Planner: AdG-Rules-Engine-Agent
Preferred future executor: GPT-5.4 after user approval
Intended branch: feature/p7c-command-menu-hierarchy
Master plan: roadmap.md
Architecture source: docs/architecture.md
Governance source: docs/project-governance.md
Rules workspace: docs/rules/
Rules-v2 relationship: P7C is UI-only and may not add rule behavior; if it exposes new movement families or rule branches, split that work back to a source-locked phase after RULES_V2_todo.md acceptance

## Purpose

P7C is a small UI-structure phase before P8 shooting. It reorganizes the battlefield command card into a nested command hierarchy so the player does not immediately see the full low-level movement tool list after selecting a unit.

P7C is not a new rules phase. It does not add movement legality, charge legality, attach legality, CP logic, or replay exceptions. It reshapes how the already-existing reducer-owned commands are surfaced.

## Scope Decision

In scope for P7C:

- nested first-level command choices by selected piece type
- second-level command groups for existing move, charge, and attach flows
- keeping `Stay` as a first-level direct action
- preserving commander drag-and-drop movement while moving its entry point under `Move`
- clearer grouping of confirm/cancel actions under the currently active branch
- UI text and structure that leave room for later movement families such as `1/4 turn`, `1/2 turn`, and group extensions

Out of scope for P7C:

- no new movement families yet
- no new charge rules
- no attach rule expansion
- no command-cost recalculation changes
- no legality checks inside rendering code
- no replay/log redesign unless a small serializable command-menu mode is strictly needed
- no Rules-v2 interpretation work except preserving space for later source-locked commands

## Command Hierarchy Contract

Top level after selection:

- Non-commander unit: `Move`, `Charge`, `Stay`
- Commander: `Move`, `Attach`, `Stay`

Second level `Move`:

- Non-commander unit: `Advance`, `Wheel`, `Slide`, `Bestaetigen`, `Abbruch`
- Commander: direct drag-and-drop move stays as today, but the visible branch shows only `Bestaetigen` and `Abbruch` around that move flow

Second level `Charge`:

- Non-commander unit: current charge flow surfaces only the charge-relevant controls and actions, including target selection state, charge-start `Wheel` / `Slide`, `Richtung bestaetigen`, and `Abbruch`

Second level `Attach`:

- Commander: current attach flow surfaces only attach-relevant controls and target choice, plus `Bestaetigen` / `Abbruch` where applicable

Guardrails:

- `Stay` remains a first-level direct action and must not be hidden inside `Move`.
- The second level must not surface commands that are structurally irrelevant for the currently selected branch.
- The UI must never decide whether a command is legal; it only reveals or hides reducer-owned command groups.

## GPT-5.4 Execution Contract

Recommended execution order:

1. `P7C-00`
2. `P7C-00A`
3. `P7C-01`
4. `P7C-02`
5. `P7C-03`
6. `P7C-04`

Execution rules for GPT-5.4:

- Keep P7C as a UI-flow cleanup phase. If a change would alter movement, charge, or attach legality, stop and split that work back to the owning rules phase instead.
- Do not use P7C to expose Rules-v2 discoveries as new gameplay commands. Any newly source-locked command family belongs in its owning rules phase or a separately approved board.
- Prefer a small reducer-owned menu-mode seam only if it materially improves determinism, replay safety, or testability; otherwise reuse current reducer projections.
- Preserve existing button bindings/actions wherever possible so P7C does not turn into a hidden control rewrite.
- Any visual nesting must still keep the current active preview state obvious to the player.
- After each completed card, update this board with files touched, validation run, manual acceptance instructions, and the next exact card.

## Player Flow Contract

P7C must preserve the current gameplay capabilities while cleaning up presentation:

1. Selecting a normal unit first shows `Move`, `Charge`, `Stay`.
2. Selecting `Move` reveals only the movement-family controls.
3. Selecting `Charge` reveals only the charge-family controls.
4. Selecting a commander first shows `Move`, `Attach`, `Stay`.
5. Selecting commander `Move` keeps the existing drag ghost flow, but the card no longer dumps unrelated unit-move buttons immediately.
6. Selecting `Attach` shows only attach-targeting and attach-confirm/cancel controls.
7. Canceling a branch returns to the correct higher-level menu without losing reducer-owned legality or preview state unexpectedly.

## Logging Gate

P7C is UI-only, but it still wraps reducer-owned legal flows and must preserve their debug surface.

- Every implementation card should state logging expectations or explicitly say that no new logging is needed.
- Expected areas for this phase are primarily `ui`, with `movement`, `charge`, `command`, and `visibility` included whenever the menu flow could hide, reorder, or suppress reducer-owned rule states.
- Minimum support remains `warn`/`error` for impossible menu-state transitions and `debug` summaries for branch selection, branch reset, and surfaced command groups where those transitions matter to live debugging.
- Browser/manual debug checks should name the filtered URL or runtime filter combination to use and should confirm that nesting the menu does not hide the relevant existing rule logs.

## Planned Cards

### [x] P7C-00 - Scope Lock And IA Contract

Goal: freeze the nested command-menu contract before implementation.

Planned files:

- P7C_todo.md
- roadmap.md
- docs/architecture.md if a small UI-state note is needed

Implementation steps:
1. Confirm first-level command groups for units versus commanders.
2. Confirm second-level branch contents for `Move`, `Charge`, and `Attach`.
3. Decide whether submenu state lives in reducer state or pure derived UI state.
4. Record non-goals clearly so P7C does not absorb new rules work.

Non-goals:

- no command panel rendering changes yet
- no new actions yet

Validation:

- board/doc review only

Manual acceptance:

- user confirms the intended menu tree before UI implementation

Stop condition:

- stop if submenu-state ownership is unclear enough to risk replay or test instability

Expected result: P7C implementation has a fixed IA contract and a narrow scope.

Progress 2026-05-28:

- Re-read the current command-panel surface in `src/ui/battlefield-command-panel.js` and the surrounding reducer/UI seams. The current panel already derives most visibility from reducer-owned preview state, but the new first-level branch selection (`Move`, `Charge`, `Attach`) would add a real interaction step before those previews exist.
- Locked the submenu-state ownership decision for implementation start: the top-level command branch should use a minimal reducer-owned, serializable menu-mode seam in `P7C-01`, while the contents inside each branch continue to derive from existing reducer-owned movement, charge, and commander preview state. This keeps branch entry and cancel/back transitions deterministic and replay-safe without moving legality into rendering code.
- Confirmed that `Stay` remains a first-level direct action, commander drag move remains the existing flow under `Move`, and P7C does not add new movement families or rule interpretation.

Closeout 2026-05-28:

- `P7C-00` is satisfied for the approved P7C start. The IA contract is now fixed: non-commanders open with `Move`, `Charge`, `Stay`; commanders open with `Move`, `Attach`, `Stay`; branch contents remain reducer-owned/derived; only the branch-selection seam itself becomes minimal serializable menu state in `P7C-01`.
- Logging expectation for the next implementation slice is explicit: `ui` is primary, with `movement`, `charge`, and `command` preserved where branch selection or reset could hide existing reducer-owned flow.
- Next exact card: `P7C-00A - Active Corps Front-Stripe Status Cue`.

### [x] P7C-00A - Active Corps Front-Stripe Status Cue

Goal: replace the earlier corps-status frame/outline concept with a clearer active-corps front-stripe color cue.

Planned files:

- src/ui/p0-battlefield.js
- src/styles/p0-battlefield.css
- src/ui/p0-battlefield.test.js
- P7C_todo.md

Implementation steps:
1. Reuse reducer-owned active-player, active-corps, unit movement-finished, and mandatory-move flags; do not compute legality in rendering code.
2. Color only the existing white front strip for units in the active corps.
3. Use yellow when the active-corps unit still has movement open.
4. Use red when the active-corps unit still has a mandatory-move flag open.
5. Use green when the active-corps unit is finished for the current movement round.
6. Keep selection, charge-target, conformation, evade, disabled, and owner styling readable around the front strip.
7. Add selector/class tests for yellow, red, and green states plus a non-active-corps no-color case.

Non-goals:

- no new mandatory-move rule implementation
- no corps lifecycle changes
- no replacement of reducer-owned movement-finished predicates
- no broader BVR atlas or troop-symbol work

Validation:

- focused battlefield render tests
- `npm run build`
- browser smoke on one active corps with open, mandatory-open, and finished units if browser tools are available

Manual acceptance:

- user confirms the active corps can be read from the colored front strip without relying on the older yellow/red/green frame treatment

Stop condition:

- stop if the front-strip colors obscure facing, selection, charge-target, or conformation overlay readability

Expected result: active-corps unit status is visible directly on the unit front edge with yellow/red/green semantic colors.

Progress 2026-05-28:

- Reused the existing active-corps reducer-owned status split instead of adding a new legality path. The battlefield render now projects `pending`, `mandatory`, or `done` only onto the existing front-facing strip when a unit is in the active corps.
- Kept the change scoped to the front strip rather than the broader token shadow/frame treatment. Non-active corps units keep the neutral strip.
- Added focused battlefield render coverage for pending, done, mandatory, and non-active cases using Charge Drill units with the live visual layer.

Closeout 2026-05-28:

- `P7C-00A` is complete for the approved scope. The existing front strip now carries the active-corps status cue: yellow for movement still open, red for unresolved mandatory movement, and green for units finished this round.
- Files touched: `src/ui/battlefield-unit-visuals.js`, `src/ui/p0-battlefield.js`, `src/styles/p0-battlefield.css`, `src/ui/p0-battlefield.test.js`.
- Validation run: focused render slice `node --test --test-name-pattern "active corps tokens render pending and done status classes|active corps token shows a red mandatory hook badge|non-active corps tokens keep the neutral front strip" src/ui/p0-battlefield.test.js`, `npm run build`, and browser smoke on built preview at `http://127.0.0.1:4176/` confirming live DOM status markers/colors for pending and done in Charge Drill. Mandatory-open browser verification has no normal UI setup path in this slice, so that part remains covered by the focused render test.
- Manual acceptance remains: verify in the browser that the colored front strip stays readable with normal battlefield selection/highlight overlays.
- Next exact card: `P7C-01 - Command Panel Menu-State Spine`.

### [x] P7C-01 - Command Panel Menu-State Spine

Goal: add the minimal menu-state seam needed for nested command presentation.

Planned files:

- src/state/p0-state.js or a focused state helper
- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js

Implementation steps:
1. Introduce or project a first-level versus second-level command-menu state.
2. Keep the state serializable if reducer-owned.
3. Ensure resets/cancels return to a deterministic menu level.

Non-goals:

- no new rules or legality checks
- no charge-flow rewrite

Validation:

- focused state and command-panel tests

Manual acceptance:

- user verifies the menu opens at the intended first level for units and commanders

Stop condition:

- stop if menu-state changes destabilize current preview atomicity

Expected result: the command panel can represent nested command levels deterministically.

Progress 2026-05-28:

- Added a minimal reducer-owned `game.commandMenu.activeBranch` seam and kept it serializable.
- Kept branch ownership narrow: live movement, charge, and commander attach/free-move previews still come from their existing reducer-owned state, while the new seam only records first-level branch intent when no preview-owned branch is already active.
- Projected the derived menu level and branch through `getAdvancePreviewPresentation(...)` so later P7C cards can switch the visible hierarchy without reopening legality logic.

Closeout 2026-05-28:

- `P7C-01` is complete for the approved scope. The battlefield command panel now has a minimal reducer-owned menu-state spine: `root` when no branch is active, `branch/move` for pending movement entry, `branch/charge` for live charge entry, and `branch/attach` for commander attach entry. Existing preview state still overrides the seam when a live branch is already in progress.
- Deterministic reset behavior now routes through the existing owning transitions: unit reselection, movement cancel, charge cancel, commander preview cancel/reset/confirm, stay, and test-unit reset all clear the branch back to the root state.
- Files touched: `src/state/p0-state-initializers.js`, `src/state/p0-state-ui-helpers.js`, `src/state/p0-battle-start.js`, `src/state/p0-state.js`, `src/state/p0-charge-preview-reducers.js`, `src/state/p0-commander-reducers.js`, `src/state/p0-movement-stay-reducers.js`, `src/state/p0-reset-reducers.js`, `src/ui/battlefield-command-panel.js`, `src/ui/battlefield-command-panel.test.js`, `src/state/p0-state.test.js`.
- Validation run: `node --test src/state/p0-state.test.js src/ui/battlefield-command-panel.test.js` and `npm run build`.
- Manual acceptance note: this card only lands the reducer-owned seam and panel projection markers; the visible first-level menu grouping still belongs to `P7C-02` and `P7C-03`, so there is no separate user-facing interaction change to approve yet.
- Next exact card: `P7C-02 - Unit Move And Charge Branch Grouping`.

### [x] P7C-02 - Unit Move And Charge Branch Grouping

Goal: make normal units show `Move`, `Charge`, `Stay` first, then reveal only branch-relevant controls.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- optional src/styles/p0-battlefield-panels.css

Implementation steps:
1. Render first-level actions for non-commander units.
2. Reveal `Advance`, `Wheel`, `Slide`, `Bestaetigen`, and `Abbruch` only inside `Move`.
3. Reveal the existing charge subtree only inside `Charge`.
4. Keep `Stay` as a direct first-level action.

Non-goals:

- no new move families
- no charge-legality changes

Validation:

- focused command-panel tests
- browser smoke for unit branch switching

Manual acceptance:

- user verifies the unit menu no longer feels overloaded after selection

Stop condition:

- stop if charge and move branch states become visually ambiguous

Expected result: normal-unit command entry is cleaner without losing current capability.

Progress 2026-05-28:

- Normal units now open on a first-level `Move` / `Charge` / `Stay` entry surface instead of exposing all movement and charge controls immediately on selection.
- Entering `Move` reveals only the move-family controls plus the existing confirm/cancel action row; entering `Charge` reveals the charge branch and keeps charge-start plus later charge-specific controls inside that branch.
- After target selection inside `Charge`, the branch now exposes only the direction-setting options `Wheel` and `Slide`; `Advance` is no longer surfaced there because it does not choose charge direction.
- The existing reducer-owned `commandMenu.activeBranch` seam from `P7C-01` is reused unchanged; this card only adds branch-entry dispatch in the UI and branch-aware render gating for normal-unit controls.

Agent validation 2026-05-28:

- Focused validation passed: `node --test src/ui/battlefield-command-panel.test.js`.
- Build passed: `npm run build`.
- Follow-up UI refinement validation passed: the focused command-panel slice still passes after removing `Advance` from the post-target charge-direction step.
- Preview server restarted successfully on `http://127.0.0.1:4176/` for follow-up smoke and manual acceptance.

Closeout 2026-05-28:

- `P7C-02` is complete for the approved scope. Normal units now open on `Move` / `Charge` / `Stay`, the move branch isolates `Advance` / `Wheel` / `Slide` plus confirm/cancel, and the charge branch now uses the `Ziel waehlen` targeting cue before surfacing only the post-target direction controls `Wheel` / `Slide`.
- Files touched: `src/ui/battlefield-command-panel.js`, `src/ui/battlefield-command-panel.test.js`, `src/styles/p0-battlefield.css`, `src/ui/p0-battlefield.js`, `src/ui/p0-app.js`, `src/state/p0-advance.js`, `src/state/p0-slide.js`, `src/state/p0-wheel.js`, `P7C_todo.md`.
- Validation run: repeated focused `node --test src/ui/battlefield-command-panel.test.js` passes and `npm run build` passes.
- Manual acceptance: user approved the normal-unit menu flow on 2026-05-28 after the charge-targeting and post-target direction refinements.
- Next exact card: `P7C-03 - Commander Move And Attach Branch Grouping`.

### [x] P7C-03 - Commander Move And Attach Branch Grouping

Goal: make commanders show `Move`, `Attach`, `Stay` first, then reveal only commander-relevant controls.

Planned files:

- src/ui/battlefield-command-panel.js
- src/ui/battlefield-command-panel.test.js
- src/ui/p0-app.js if binding changes are required

Implementation steps:
1. Render first-level commander actions.
2. Keep direct drag-and-drop commander movement, but show its confirm/cancel controls only inside `Move`.
3. Reveal attach controls only inside `Attach`.
4. Preserve current attach target-selection flow.

Non-goals:

- no commander-rule expansion
- no attach-cost changes

Validation:

- focused commander command-panel tests
- browser smoke for commander move and attach entry

Manual acceptance:

- user verifies commander flow feels simpler while behaving the same

Stop condition:

- stop if attach and free-move previews can no longer be distinguished clearly

Expected result: commander command flow is grouped cleanly without changing rules.

Progress 2026-05-28:

- Commanders now use the same reducer-owned root/branch seam as normal units, but with commander-specific entry points: `Move`, `Attach`, and `Stay` at the root level.
- The commander `Move` branch no longer dumps normal-unit movement-family buttons; it keeps the existing free-drag preview flow and only surfaces confirm/cancel once a commander preview is actually active.
- `Attach` now appears as a first-level commander entry button and continues to hand off to the existing reducer-owned attach targeting flow without adding new legality or cost logic.

Agent validation 2026-05-28:

- Focused commander/command-panel validation passed: `node --test src/ui/battlefield-command-panel.test.js`.
- Build passed: `npm run build`.
- Browser smoke passed on fresh preview `http://127.0.0.1:4177/` for commander root `Move` / `Attach` / `Stay`, commander `Move` branch entry/back behavior, attach entry with reducer-owned confirm/cancel visibility, and cancel return to commander root.

Closeout 2026-05-28:

- `P7C-03` is complete for the approved scope. Commanders now open on `Move` / `Attach` / `Stay`, the `Move` branch no longer exposes irrelevant normal-unit movement-family buttons, and `Attach` stays on the existing reducer-owned attach preview/targeting path.
- Files touched: `src/ui/battlefield-command-panel.js`, `src/ui/battlefield-command-panel.test.js`, `P7C_todo.md`, `roadmap.md`.
- Validation run: `node --test src/ui/battlefield-command-panel.test.js`, `npm run build`, focused browser smoke on fresh preview `http://127.0.0.1:4177/`.
- Manual acceptance: user confirmed the commander flow in-session on 2026-05-28, and browser smoke matched the expected root/branch structure.
- Reviewer / Rules Agent review returned `Approved` for UI-only scope, preview-owned confirm/cancel visibility, and unchanged commander/attach legality ownership.
- Next exact card: `P7C-04 - Validation And Flow Polish`.

### [x] P7C-04 - Validation And Flow Polish

Goal: validate the nested menu flow and close P7C cleanly before P8.

Planned files:

- P7C_todo.md
- roadmap.md
- focused UI test files as needed

Implementation steps:
1. Run focused command-panel and affected UI tests.
2. Run browser smoke for unit move, unit charge, commander move, commander attach, stay, confirm, and cancel flows.
3. Record residual follow-up hooks for later move families honestly.
4. Align board and roadmap status.

Non-goals:

- no P8 shooting work
- no hidden rule additions

Validation:

- focused UI tests
- `npm run build`
- browser/manual smoke

Manual acceptance:

- user verifies the nested command hierarchy is clearer and does not regress current actions

Stop condition:

- stop if the nested UI still feels overloaded or hides important active-state feedback

Expected result: battlefield command flow is cleaner and ready for later pre-P8 gameplay phases.

Progress 2026-05-28:

- Re-ran the focused P7C validation slice after the commander branch grouping landed and tightened one finished-unit root-menu gate so completed units now expose reset without reopening root movement actions.
- Browser smoke on fresh preview `http://127.0.0.1:4177/` covered the nested unit and commander menu flow: unit root `Move` / `Charge` / `Stay`, unit `Move` branch with confirm/cancel, unit `Charge` targeting cue and post-target `Wheel` / `Slide` plus confirm/cancel, `Stay` collapsing back to reset-only, commander root `Move` / `Attach` / `Stay`, commander `Move` branch entry/back behavior, and commander `Attach` preview with reducer-owned confirm/cancel and cancel return to root.
- Honest residual hook: later movement families such as `1/4 turn`, `1/2 turn`, and group extensions remain intentionally deferred; P7C only prepares the cleaner entry seams for those future source-locked additions.

Agent validation 2026-05-28:

- Focused UI validation passed: `node --test src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js`.
- Build passed: `npm run build`.
- Browser smoke passed on fresh preview `http://127.0.0.1:4177/` for the supported P7C unit and commander menu flows listed above.

Closeout 2026-05-28:

- `P7C-04` is complete for the approved scope. The nested command hierarchy is now validated across focused UI tests, build, and fresh browser smoke, including the finished-unit reset-only root state and the commander root/branch flow.
- Files touched in the final closeout slice: `src/ui/battlefield-command-panel.js`, `src/ui/p0-battlefield.test.js`, `P7C_todo.md`, `roadmap.md`.
- Validation run: `node --test src/ui/battlefield-command-panel.test.js src/ui/p0-battlefield.test.js`, `npm run build`, and browser smoke on fresh preview `http://127.0.0.1:4177/`.
- Manual acceptance: user accepted P7C phase closeout on 2026-05-28 and asked to move on to P8 planning.
- Phase result: `P7C` is now closed as a UI-only command-flow cleanup phase and no longer blocks pre-P8 planning.
- Next exact card/board: review and approve `P8_todo.md` before any P8 implementation starts.
