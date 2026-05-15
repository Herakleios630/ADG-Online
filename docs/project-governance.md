# Project Governance

## Purpose

This document defines how AdG Online is planned, implemented, tested, reviewed, and delivered. It is part project-management rulebook and part agent operating contract.

## Phase Gate Rule

Development is strictly phase-gated.

- No implementation starts without explicit user approval for the current phase.
- No next phase starts until the current phase is implemented, tested, demonstrated, and approved.
- A discovered later-phase issue is documented as a dependency or risk, then work returns to the current phase.
- Every feature phase starts with a short brainstorming and rule-verification pass.
- Standard 200-point tournament training is the default target unless the user explicitly changes the format.

## Phase Kickoff Checklist

Before starting any phase or large feature, the agent must:

1. Re-read the relevant parts of `roadmap.md`, `docs/architecture.md`, and any active phase checklist such as `P0_todo.md`.
2. Re-check the source PDFs, errata, extracted markdown, or open verification notes for the rule area.
3. Identify assumptions, hard rule constraints, edge cases, and test cases.
4. Ask for or confirm user approval to implement that phase.
5. Create or switch to a suitable feature/bug branch if implementation is approved.

## Planning Document Workflow

Use a two-layer planning structure.

- `roadmap.md` is the durable repository master plan and phase register.
- A file such as `P0_todo.md` is the active phase execution checklist.
- The roadmap tracks phase-level status and scope.
- The active phase checklist tracks concrete implementation tasks with `[ ]` and `[x]` markers.
- When the next phase is being prepared, GPT-5.5 should draft the next checklist file such as `P1_todo.md` or `P2_todo.md` as the execution board for user review.
- After the user approves that phase board, GPT-5.4 should execute the active checklist one card at a time.
- When a phase becomes active, create or update its dedicated checklist instead of overloading the roadmap with operational detail.
- When work advances, update both the roadmap phase status and the active phase checklist.

## Phase TODO Execution Board Standard

Every active phase checklist must be written as an execution board that can survive context loss.

At the top of the file, include:

- status;
- active branch or intended branch;
- master-plan link;
- architecture/governance source links;
- purpose;
- how to use the board;
- global scope guardrails;
- shared constants or assumptions;
- phase status;
- definition of done.

Each implementation card must include:

- checkbox id and title;
- goal;
- planned files;
- implementation steps;
- non-goals;
- validation;
- manual acceptance;
- stop condition;
- expected result.

Before editing implementation files for a card, the agent gives the user a short PM block brief with the exact goal, planned files, new modules, shell/UI versus state/engine scope split, validation commands, manual acceptance steps, and non-goals.

If a card includes manual acceptance, the agent must not imply that the user-facing check already happened. After agent-run validation, stop and give the user exact manual test steps and expected results so the user can perform the check.

Responsibility split:

- GPT-5.5 is the preferred planner for drafting the next phase execution board.
- GPT-5.4 is the preferred executor for implementing the currently approved active phase board.
- If GPT-5.5 is not available, another agent may draft the board, but it must still follow this execution-board standard.

A card is complete only when the work is implemented, focused validation has run, the checklist is updated, and the final handoff says what changed, which files were touched, what the agent validated, what the user should test manually, and what remains open. User-side manual acceptance stays pending until the user reports the result.

## Git Workflow

Use clean, small branches.

- Feature branches: `feature/pN-short-topic`.
- Bug branches: `bugfix/short-topic`.
- Documentation branches: `docs/short-topic`.
- Check `git status --short` before editing and before final handoff.
- Do not rewrite or discard user changes.
- Commit only focused changes.
- Push and open or prepare PRs when requested.
- Never merge PRs. The user always performs merges manually.

## Testing Workflow

When implementation begins, every phase should define its own verification set.

Current baseline commands:

- `npm run test`: current narrow Node-based foundation test harness for pure P0/P1-safe reducer checks.
- `npm run build`: current build gate for UI and documentation-integrated changes.

P1 testing policy:

- Preserve the existing minimal Node test runner unless a later phase proves it insufficient.
- Prefer adding small pure-function or data-shape tests over framework churn.
- Do not write tests that overstate unverified rule extracts as authoritative behavior.
- When a rule area is still `needs-source-check`, `ocr-assisted`, or blocked by `open-verification.md`, tests may only validate planning shapes, not final legality claims.

Minimum checks by work type:

- Pure engine logic: unit tests, edge-case fixtures, deterministic replay checks where applicable.
- Rule tables and data: schema validation, source-reference checks, golden examples from the rulebook or spreadsheet.
- UI work: build, local browser smoke test, screenshot or Playwright interaction when useful.
- Multiplayer work: action-log and state-hash tests before any transport behavior is trusted.
- Hidden-information work: player-view tests, reveal-trigger tests, replay visibility tests, and AI fairness tests where applicable.

Preferred commands will be documented as scripts once the relevant tools are introduced. Until then, run the available `npm` scripts and report any missing validation surface.

Validation layers should grow in this order:

1. runnable baseline scripts (`npm run test`, `npm run build`)
2. pure reducer and geometry tests
3. data-shape and schema validation
4. source-reference and open-verification consistency checks
5. golden examples from verified rulebook or spreadsheet cases
6. visibility and replay-view tests
7. browser and interaction smoke tests where UI exists

Every later phase should state which of these layers it actually covers, instead of implying full validation by default.

## Browser Verification

For UI phases, the agent should be able to:

- start the local Vite dev server;
- open the app in the VS Code/browser test surface;
- interact with menus, options, setup screens, and the battlefield;
- capture screenshots for visual regressions;
- verify that text, controls, overlays, and canvas content render correctly.

Browser checks do not replace engine tests. They prove the user-facing flow can exercise the engine safely.

## Memory Protocol

The agent should learn durable practices without bloating memory.

Store in user memory:

- stable collaboration preferences;
- recurring workflow expectations;
- project-independent lessons.

Store in repository memory:

- AdG Online architecture conventions;
- approved phase-gate practices;
- source extraction decisions;
- repeated project-specific gotchas.

Do not store:

- transient guesses;
- unverified rule interpretations;
- private data unrelated to the project.

## Modularity Rules

- Target JavaScript files under 800 lines.
- A JavaScript file over 1000 lines requires immediate modularization or explicit user approval.
- Split by responsibility: geometry, movement, ZOC, command, combat, conformation, terrain, replay, UI, assets, and data import stay separate.
- UI modules may request previews and explanations from the engine but must not decide rule legality.
- Rule modules may not import UI rendering code.

## Tournament Training Rules

- Tournament Training mode must preserve official legality, official setup sequence, standard 200-point assumptions, and hidden information.
- Study Mode may add explanations, overlays, and broader undo, but it cannot legalize illegal actions.
- Sandbox/Dev Mode may contain incomplete or artificial fixtures, but the UI and docs must label them as incomplete.

## AI Rules

- AI opponent work is future work and must be approved as its own phase or subphase.
- AI may only propose normal engine actions.
- AI may only inspect the player-visible state for its side.
- AI heuristics may rank actions, but validators decide legality.
- AI must not use hidden battle plans, unrevealed ambushes, or unrevealed flank marches.

## Definition Of Ready

A phase is ready for implementation only when:

- goals, dependencies, and success criteria are clear;
- source rules and errata have been checked or open verification is listed;
- data model impact is understood;
- tests and browser checks are planned;
- user approval is explicit.

## Definition Of Done

A phase is done only when:

- implementation matches the approved scope;
- tests, build, and browser checks for that phase pass or gaps are clearly reported;
- docs are updated for new decisions;
- no unrelated changes are mixed in;
- user has seen enough to approve the phase.
