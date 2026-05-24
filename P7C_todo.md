# P7C TODO - Command Menu Hierarchy + Flow Cleanup

Status: Draft - pending user review and explicit approval after P7B closes
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
2. `P7C-01`
3. `P7C-02`
4. `P7C-03`
5. `P7C-04`

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

## Planned Cards

### [ ] P7C-00 - Scope Lock And IA Contract

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

### [ ] P7C-01 - Command Panel Menu-State Spine

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

### [ ] P7C-02 - Unit Move And Charge Branch Grouping

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

### [ ] P7C-03 - Commander Move And Attach Branch Grouping

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

### [ ] P7C-04 - Validation And Flow Polish

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
