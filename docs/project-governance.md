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
4. Identify logging expectations: relevant rule areas, minimum log level, important decisions/candidates/diagnostics, and how browser live tests can enable the logs.
5. Identify data-source expectations: whether unit behavior comes from shared rule/profile data, current match state, or a labeled scenario/test override.
6. Ask for or confirm user approval to implement that phase.
7. Create or switch to a suitable feature/bug branch if implementation is approved.

## Planning Document Workflow

Use a two-layer planning structure.

- `roadmap.md` is the durable repository master plan and phase register.
- A file such as `P0_todo.md` is the active phase execution checklist.
- The roadmap tracks phase-level status and scope.
- The active phase checklist tracks concrete implementation tasks with `[ ]` and `[x]` markers.
- When the next phase is being prepared, GPT-5.5 is preferred to draft the next checklist file such as `P1_todo.md` or `P2_todo.md` as the execution board for user review, but GPT-5.4 may also draft or revise it when the user explicitly chooses that route.
- After the user approves that phase board, GPT-5.4 should execute the active checklist one card at a time.
- When a phase becomes active, create or update its dedicated checklist instead of overloading the roadmap with operational detail.
- When work advances, update both the roadmap phase status and the active phase checklist.

## Agent Operating Model

AdG Online uses the small role model in `docs/agents/index.md` to keep planning, implementation, and rule review separate without creating a heavy agent network.

Core roles:

- Lead / Phase Steward: preferred model GPT-5.5, but GPT-5.4 may also fill the role when the user explicitly chooses it. Owns large planning, roadmap and phase-board changes, scope decisions, handoffs, and source-risk triage.
- Coding Agent: preferred model GPT-5.4. Implements exactly one approved execution-board card at a time and updates the active board after validation.
- Reviewer / Rules Agent: preferred model GPT-5.4 for normal review, GPT-5.5 for difficult source-lock or errata reconstruction. Independently reviews rule-sensitive changes and returns `Approved`, `Needs Changes`, or `Blocked`.

Optional Data / Validation mode is invoked only for data-heavy work such as OCR source corpus, army lists, unit-profile tables, spreadsheet mapping, schema validation, or P11 army-builder tasks. It is not a standing fourth role for ordinary implementation.

The user switches model and agent manually. The current agent must make any required switch explicit at the end of its task, using a compact handoff with next role, suggested model, exact task, expected output, files, and blockers. The workflow should avoid solving multiple unrelated tickets just to move between roles.

Default routing:

- New phase, roadmap change, large board, or source-risk decision: Lead / Phase Steward, preferably GPT-5.5 but GPT-5.4 is allowed when the user explicitly chooses it.
- Approved card implementation: Coding Agent with GPT-5.4.
- Rule-sensitive card review before closeout: Reviewer / Rules Agent with GPT-5.4 unless the source problem needs GPT-5.5.
- Data-heavy consistency pass: optional Data / Validation mode, routed by Lead.

Do not create a competing root `AGENTS.md` while `.github/copilot-instructions.md` is the active project-wide instruction file. Role details live under `docs/agents/` and are linked from governance and active boards.

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
- logging/instrumentation expectations, or an explicit non-goal for trivial non-rule work;
- role routing: expected implementing role/model, required review role/model, and any Lead or optional Data / Validation gate;
- manual acceptance;
- stop condition;
- expected result.

The logging/instrumentation item must name, at minimum, the expected rule areas, minimum level, key events or decisions that should be visible, the intended filter entry point for browser/live debugging, and the planned browser/manual debug check when UI or live interaction exists.

Before editing implementation files for a card, the agent gives the user a short PM block brief with the exact goal, planned files, new modules, shell/UI versus state/engine scope split, validation commands, manual acceptance steps, and non-goals.

If a card includes manual acceptance, the agent must not imply that the user-facing check already happened. After agent-run validation, stop and give the user exact manual test steps and expected results so the user can perform the check.

Responsibility split:

- GPT-5.5 is the preferred planner for drafting the next phase execution board.
- GPT-5.4 may also draft or revise phase boards when the user explicitly chooses it, but the same execution-board standard and source-check discipline still apply.
- GPT-5.4 is the preferred executor for implementing the currently approved active phase board.
- If GPT-5.5 is not available, or the user explicitly keeps GPT-5.4, another agent may draft the board, but it must still follow this execution-board standard.

A card is complete only when the work is implemented, focused validation has run, the checklist is updated, and the final handoff says what changed, which files were touched, what the agent validated, what the user should test manually, and what remains open. User-side manual acceptance stays pending until the user reports the result.

For rule-sensitive cards, the Coding Agent closeout should normally hand off to Reviewer / Rules Agent before the Lead treats the card as accepted. If review is intentionally skipped for a trivial non-rule card, the active board must say so.

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
- Visual gameplay UI work such as battlefield overlays, guides, ghosts, reach corridors, target highlights, and conformation previews: focused automated render tests plus direct browser smoke verification whenever browser tooling is available in the session.
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

## Rulebook Example Workflow

Worked examples from accepted scans are first-class planning and validation assets.

The product goal is not just regression coverage. AdG Online should eventually include a tutorial and example database where players can load rulebook-derived situations, learn why the rules behave that way, and prepare for tournament play.

- When a rule-sensitive phase or support board is planned, identify the relevant `Rules_v2` example IDs and capture them in the roadmap or active board.
- For future implementations, if the rule area has a relevant book example, the active board must classify that example as an in-game scenario, tutorial/drill entry, golden validation fixture, deferred reference case, or out-of-scope optional/variant example.
- Prefer recreating readable rulebook examples as drill scenarios, stable smoke lanes, tutorial entries, or golden validation fixtures instead of relying only on synthetic layouts when the source example is strong enough.
- If an example cannot yet be reproduced because a prerequisite system is missing, such as terrain, multi-unit conformation, support-network solving, or hidden-information flow, keep it on the board as a named deferred reference case with its exact blocker.
- Synthetic fixtures such as Charge Drill remain useful, but they do not replace source-backed example drills when the rulebook already supplies a better canonical case.
- Example-driven drills must stay honest: do not silently simplify a book example into a different legal case without recording the difference in the board and validation notes.
- Examples missed by earlier phases before this workflow was adopted should be collected in `RULEBOOK_EXAMPLES_todo.md` and scheduled for a post-P16 catch-up pass, especially movement, ZOC, charge, evade, group movement, group conformation, terrain, setup, and other broad systems where the first beta track intentionally stayed narrow.

## Browser Verification

For UI phases, the agent should be able to:

- start the local Vite dev server;
- open the app in the VS Code/browser test surface;
- interact with menus, options, setup screens, and the battlefield;
- capture screenshots for visual regressions;
- verify that text, controls, overlays, and canvas content render correctly.

For visual battlefield changes, browser verification is not optional when the session supports browser tools. The agent should compare the rendered result against the intended geometry, not only against data-model assumptions or unit tests.

If browser tooling is unavailable in the current session, the agent must say so explicitly in the handoff, rely on the strongest available render tests and screenshots, and avoid implying that direct browser validation already happened.

Browser checks do not replace engine tests. They prove the user-facing flow can exercise the engine safely.

## Logging And Instrumentation Workflow

Logging is a first-class debugging and validation tool for AdG Online.

- Every complex rule feature must be loggable from its first implementation slice.
- Planning cards must state which logging areas and levels are expected, or explicitly say why logging is not needed for that card.
- Use area filters such as `movement`, `zoc`, `charge`, `reaction`, `evade`, `contact`, `conformation`, `shooting`, `melee`, `rout`, `setup`, `visibility`, `army-builder`, `replay`, `ui`, and `perf`.
- Use detail levels such as `error`, `warn`, `info`, `debug`, and `trace` so broad browser runs can stay small while hard bugs can expose candidate-level evidence.
- Logs must be structured JSON/JSONL where practical, not prose-only console output.
- Logs must include enough decision evidence to distinguish engine choice, reducer transition, UI stale state, click/hitbox issue, missing data, and source-open rule boundary.
- Logs must be bounded and filterable; unbounded trace spam is a performance bug.
- Logging is observational. It must not decide legality, mutate game state, or replace reducer/engine diagnostics.
- Future multiplayer/replay work must respect hidden-information boundaries. Full-state dev logs are only for explicitly enabled local/debug contexts.

See `LOGGING_todo.md` for the current support board and taxonomy.

Missing logging expectations for a complex rule or reducer/UI coordination feature should be treated as a planning/review finding, not as optional polish.

## Fixture And Capability Data Workflow

Fixtures should test real rule behavior, not private shortcuts.

- Unit instances store current match state and selected ability IDs. Reusable facts belong in unit definitions, unit profiles, rule tables, or army-list data.
- Charge Drill and other artificial scenarios may place units in artificial positions, but normal unit behavior should come from the same profile/capability path as real units.
- Direct per-unit fixture overrides are allowed only for labeled scenario controls or fault-injection tests.
- New feature cards must not add `if unit.id === ...` legality behavior unless the card is explicitly a temporary diagnostic and records the follow-up removal path.
- If a needed capability such as `can evade`, `light-troop end half-turn`, `cavalry bow`, or `pike` behavior does not exist yet, prefer adding the minimal shared capability/profile support before adding hardcoded fixture behavior.
- Missing profile/capability data should produce explicit diagnostics or `needs-source-check`, not silent guesses.

See `UNIT_CAPABILITIES_todo.md` and `CHARGE_DRILL_2_todo.md` for the current profile-first fixture plan.

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
